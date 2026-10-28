import { useEffect, useRef, useState } from 'react'
import { CalendarCheck, Clock, Edit2, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { activityAPI, holidaysAPI } from '../../services/api'
import { AppDialog } from '../ui/dialog'
import { Button } from '../ui/button'
import { EmptyState, Notice, PageHeader } from '../ui/page'

type Agenda = { id: number; tanggal: string; nama: string; keterangan?: string; jam_masuk_khusus?: string; is_workday?: boolean | number | string }
type AgendaForm = { id: number | null; tanggal: string; nama: string; jamMasukKhusus: string; keterangan: string }
const todayInJakarta = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date())
const emptyForm = (): AgendaForm => ({ id: null, tanggal: '', nama: 'Rapat Asatidz dan Karyawan', jamMasukKhusus: '07:00', keterangan: '' })
const displayDate = (date: string) => new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(new Date(date + 'T12:00:00+07:00'))

export default function AgendaRapat({ user }) {
  const [year, setYear] = useState(() => Number(todayInJakarta().slice(0, 4)))
  const [agendas, setAgendas] = useState<Agenda[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [message, setMessage] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<AgendaForm>(emptyForm)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [cancelAgenda, setCancelAgenda] = useState<Agenda | null>(null)
  const [cancelError, setCancelError] = useState('')
  const loadRequest = useRef(0)
  const mutationInFlight = useRef(false)
  const today = todayInJakarta()

  const loadAgendas = async () => {
    const request = ++loadRequest.current
    setLoading(true)
    setLoadError('')
    try {
      const response = await holidaysAPI.getAll({ year })
      if (request === loadRequest.current) setAgendas((response.data || []).filter((row: Agenda) => Number(row.is_workday) === 1))
    } catch (error) {
      if (request === loadRequest.current) setLoadError(error.message || 'Agenda rapat belum dapat dimuat.')
    } finally {
      if (request === loadRequest.current) setLoading(false)
    }
  }

  useEffect(() => {
    void loadAgendas()
    return () => { loadRequest.current += 1 }
  }, [year])

  const showForm = (agenda?: Agenda) => {
    setForm(agenda ? { id: agenda.id, tanggal: agenda.tanggal, nama: agenda.nama, jamMasukKhusus: (agenda.jam_masuk_khusus || '07:00').slice(0, 5), keterangan: agenda.keterangan || '' } : emptyForm())
    setFormError('')
    setOpen(true)
  }

  const writeAudit = (action: string, agenda: { nama: string; tanggal: string }) => {
    void activityAPI.create({ user: user?.nama || 'Admin', aktivitas: action, status: `${agenda.nama} · ${agenda.tanggal}` }).catch(() => {})
  }

  const saveAgenda = async (event) => {
    event.preventDefault()
    if (mutationInFlight.current) return
    if (!form.tanggal || !form.nama.trim() || !/^([01]\d|2[0-3]):[0-5]\d$/.test(form.jamMasukKhusus)) {
      setFormError('Tanggal, nama agenda, dan jam masuk yang valid wajib diisi.')
      return
    }
    mutationInFlight.current = true
    setSaving(true)
    setFormError('')
    try {
      const payload = { ...form, nama: form.nama.trim(), jenis: 'sekolah', isWorkday: 1 }
      if (form.id) await holidaysAPI.update(payload)
      else await holidaysAPI.create(payload)
      writeAudit(form.id ? 'Edit Agenda Rapat' : 'Tambah Agenda Rapat', payload)
      setMessage(`Agenda ${displayDate(form.tanggal)} tersimpan. Jam masuk ${form.jamMasukKhusus} WIB berlaku otomatis untuk semua guru pada tanggal tersebut.`)
      setOpen(false)
      const savedYear = Number(form.tanggal.slice(0, 4))
      if (savedYear !== year) setYear(savedYear)
      else await loadAgendas()
    } catch (error) {
      setFormError(error.message || 'Agenda belum berhasil disimpan. Silakan coba lagi.')
    } finally {
      mutationInFlight.current = false
      setSaving(false)
    }
  }

  const removeAgenda = async () => {
    if (!cancelAgenda || mutationInFlight.current) return
    mutationInFlight.current = true
    setSaving(true)
    setCancelError('')
    try {
      await holidaysAPI.delete(cancelAgenda.id)
      writeAudit('Batalkan Agenda Rapat', cancelAgenda)
      setMessage(`Agenda ${displayDate(cancelAgenda.tanggal)} dibatalkan. Data presensi yang sudah tersimpan tetap utuh.`)
      setCancelAgenda(null)
      await loadAgendas()
    } catch (error) {
      setCancelError(error.message || 'Agenda belum berhasil dibatalkan.')
    } finally {
      mutationInFlight.current = false
      setSaving(false)
    }
  }

  const years = Array.from({ length: Math.max(Number(today.slice(0, 4)) + 5, year) - Math.min(2024, year) + 1 }, (_, index) => Math.min(2024, year) + index)

  return <div className="space-y-5">
    <PageHeader title="Agenda Rapat" description="Atur tanggal Rapat Asatidz dan Karyawan setiap bulan sesuai agenda sekolah." actions={<Button id="tambah-agenda-rapat" type="button" onClick={() => showForm()}><Plus aria-hidden="true" />Jadwalkan Rapat</Button>} />
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-900">
      <div className="flex items-start gap-3"><CalendarCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" /><div>
        <p className="font-semibold">Satu tanggal, satu jam masuk untuk semua guru</p>
        <p className="mt-1 leading-6">Biasanya rapat diadakan hari Rabu. Pilih tanggalnya setiap bulan dan tentukan jam masuk, dengan jam bawaan 07:00 WIB. Pada tanggal rapat, jam ini berlaku untuk semua guru, termasuk partime dan petugas piket.</p>
        <p className="mt-2 text-xs leading-5">Aturan aktif otomatis hanya pada tanggal yang dipilih. Hari lainnya kembali mengikuti jam normal, apel Senin, atau jadwal piket. Agenda kerja khusus yang sudah dibuat melalui Hari Libur juga tampil di sini.</p>
      </div></div>
    </div>
    {message && <Notice tone="success" onDismiss={() => setMessage('')}>{message}</Notice>}
    <div className="flex flex-wrap items-end justify-between gap-3 rounded-xl border border-border bg-white p-4">
      <label className="flex flex-col gap-1 text-sm font-medium">Tahun agenda<select aria-label="Tahun agenda" value={year} onChange={(event) => setYear(Number(event.target.value))} disabled={saving} className="min-h-11 rounded-lg border border-input bg-white px-3">{years.map((value) => <option key={value}>{value}</option>)}</select></label>
      <Button type="button" variant="outline" onClick={() => loadAgendas()} disabled={loading || saving}><RefreshCw aria-hidden="true" />Perbarui agenda</Button>
    </div>
    {loadError && <Notice onRetry={() => loadAgendas()}>{loadError}</Notice>}
    <div className="overflow-hidden rounded-xl border border-border bg-white">
      {loading ? <p className="p-8 text-center text-sm text-muted-foreground" role="status">Memuat agenda...</p> : agendas.length === 0 ? <EmptyState title={`Belum ada agenda pada tahun ${year}`} description="Klik Jadwalkan Rapat untuk memilih tanggal dan jam masuk semua guru." /> : <div className="overflow-x-auto"><table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-4 py-3">Tanggal</th><th className="px-4 py-3">Agenda</th><th className="px-4 py-3">Jam masuk</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Aksi</th></tr></thead>
        <tbody>{agendas.map((agenda) => <tr key={agenda.id} className="border-t border-slate-100">
          <td className="whitespace-nowrap px-4 py-4">{displayDate(agenda.tanggal)}</td>
          <td className="min-w-48 px-4 py-4"><p className="font-semibold">{agenda.nama}</p>{agenda.keterangan && <p className="mt-1 text-xs text-muted-foreground">{agenda.keterangan}</p>}</td>
          <td className="whitespace-nowrap px-4 py-4"><span className="inline-flex items-center gap-1.5 font-semibold"><Clock className="h-4 w-4" aria-hidden="true" />{agenda.jam_masuk_khusus?.slice(0, 5) || 'Belum diisi'} WIB</span><p className="mt-1 text-xs text-muted-foreground">Semua guru</p></td>
          <td className="whitespace-nowrap px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${agenda.tanggal === today ? 'bg-emerald-100 text-emerald-800' : agenda.tanggal > today ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'}`}>{agenda.tanggal === today ? 'Berlaku hari ini' : agenda.tanggal > today ? 'Terjadwal' : 'Tanggal lampau'}</span></td>
          <td className="px-4 py-4"><div className="flex gap-1"><Button type="button" size="icon" variant="ghost" aria-label={`Edit agenda ${agenda.nama} ${agenda.tanggal}`} onClick={() => showForm(agenda)} disabled={saving}><Edit2 aria-hidden="true" /></Button><Button type="button" size="icon" variant="ghost" aria-label={`Batalkan agenda ${agenda.nama} ${agenda.tanggal}`} onClick={() => { setCancelError(''); setCancelAgenda(agenda) }} disabled={saving}><Trash2 aria-hidden="true" /></Button></div></td>
        </tr>)}</tbody>
      </table></div>}
    </div>
    <AppDialog open={open} onOpenChange={setOpen} title={form.id ? 'Edit Agenda Rapat' : 'Jadwalkan Rapat'} description="Tentukan tanggal dan jam masuk yang berlaku untuk semua guru." busy={saving} fallbackFocusId="tambah-agenda-rapat">
      <form onSubmit={saveAgenda} className="space-y-4">
        {formError && <Notice>{formError}</Notice>}
        <fieldset disabled={saving} className="space-y-4">
          <label className="block text-sm font-medium">Nama agenda<input aria-label="Nama agenda" required maxLength={255} value={form.nama} onChange={(event) => setForm({ ...form, nama: event.target.value })} className="mt-1 min-h-11 w-full rounded-lg border border-input bg-white px-3" /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium">Tanggal rapat<input aria-label="Tanggal rapat" required type="date" value={form.tanggal} onChange={(event) => setForm({ ...form, tanggal: event.target.value })} className="mt-1 min-h-11 w-full rounded-lg border border-input bg-white px-3" /></label>
            <label className="block text-sm font-medium">Jam masuk semua guru (WIB)<input aria-label="Jam masuk semua guru (WIB)" required type="time" value={form.jamMasukKhusus} onChange={(event) => setForm({ ...form, jamMasukKhusus: event.target.value })} className="mt-1 min-h-11 w-full rounded-lg border border-input bg-white px-3" /></label>
          </div>
          {form.tanggal && <p className="text-sm text-blue-700">{displayDate(form.tanggal)} · Jam masuk {form.jamMasukKhusus || '--:--'} WIB untuk semua guru.</p>}
          <label className="block text-sm font-medium">Keterangan (opsional)<textarea aria-label="Keterangan agenda" rows={3} value={form.keterangan} onChange={(event) => setForm({ ...form, keterangan: event.target.value })} className="mt-1 w-full rounded-lg border border-input bg-white p-3" /></label>
          <p className="rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600">Pada tanggal rapat, guru yang presensi setelah jam ini tercatat terlambat dengan keterangan jumlah menit dan nama agenda. Jam piket dan jam masuk normal kembali digunakan pada hari lainnya.</p>
          {form.tanggal && form.tanggal < today && <Notice tone="warning">Agenda ini untuk tanggal lampau. Gunakan Perbaiki status masuk di Pengaturan untuk menghitung ulang presensi pada tanggal tersebut.</Notice>}
        </fieldset>
        <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={saving} onClick={() => setOpen(false)}>Batal</Button><Button type="submit" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan agenda'}</Button></div>
      </form>
    </AppDialog>
    <AppDialog open={!!cancelAgenda} onOpenChange={(next) => { if (!next) setCancelAgenda(null) }} title="Batalkan agenda rapat?" description={cancelAgenda ? `${cancelAgenda.nama} · ${displayDate(cancelAgenda.tanggal)}` : ''} busy={saving}>
      {cancelError && <Notice>{cancelError}</Notice>}
      <p className="text-sm leading-6">Setelah agenda dibatalkan, aturan jam normal atau piket kembali berlaku untuk tanggal tersebut. Catatan presensi yang sudah tersimpan tetap utuh.</p>
      <div className="mt-5 flex justify-end gap-2"><Button type="button" variant="outline" disabled={saving} onClick={() => setCancelAgenda(null)}>Kembali</Button><Button type="button" variant="danger" disabled={saving} onClick={removeAgenda}>{saving ? 'Membatalkan...' : 'Batalkan agenda'}</Button></div>
    </AppDialog>
  </div>
}
