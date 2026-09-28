import { useEffect, useState } from 'react'
import { CheckCircle2, ClipboardCheck, MessageCircle, RefreshCw } from 'lucide-react'
import { monthlyAttendanceConfirmationAPI } from '../../services/api'
import { AppDialog } from '../ui/dialog'
import { Button } from '../ui/button'
import { Notice } from '../ui/page'

const statusLabels: Record<string, string> = {
  hadir: 'Hadir',
  hadir_terlambat: 'Hadir terlambat',
  hadir_izin_terlambat: 'Hadir terlambat',
  izin: 'Izin',
  sakit: 'Sakit',
  alfa: 'Alfa',
  libur: 'Libur',
  libur_override: 'Libur khusus',
}

const statusTone: Record<string, string> = {
  hadir: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  hadir_terlambat: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  hadir_izin_terlambat: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  izin: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  sakit: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  alfa: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  libur: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  libur_override: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
}

function formatDate(value?: string) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`))
}

function formatTime(value?: string) {
  return value && value !== '-' ? String(value).slice(0, 5) : '-'
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${statusTone[status] || statusTone.libur}`}>{statusLabels[status] || status || '-'}</span>
}

export default function GuruMonthlyConfirmation() {
  const [confirmation, setConfirmation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [action, setAction] = useState('')
  const [actionError, setActionError] = useState('')

  const loadConfirmation = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await monthlyAttendanceConfirmationAPI.getMine()
      setConfirmation(response.data || { required: false })
    } catch (failure) {
      setConfirmation(null)
      setError(failure.message || 'Status konfirmasi rekap belum dapat dimuat.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let ignore = false
    setLoading(true)
    setError('')
    monthlyAttendanceConfirmationAPI.getMine()
      .then((response) => { if (!ignore) setConfirmation(response.data || { required: false }) })
      .catch((failure) => { if (!ignore) setError(failure.message || 'Status konfirmasi rekap belum dapat dimuat.') })
      .finally(() => { if (!ignore) setLoading(false) })
    return () => { ignore = true }
  }, [])

  const handleConfirm = async () => {
    setAction('confirm')
    setActionError('')
    try {
      const response = await monthlyAttendanceConfirmationAPI.confirm()
      setConfirmation(response.data || { required: false })
    } catch (failure) {
      setActionError(failure.message || 'Rekap presensi belum dapat disetujui.')
    } finally {
      setAction('')
    }
  }

  const handleCorrection = async () => {
    const correctionUrl = confirmation?.correctionWhatsAppUrl
    if (!correctionUrl) {
      setActionError('Nomor WhatsApp admin belum diatur. Hubungi administrator untuk melengkapinya.')
      return
    }
    // Reserve the popup while this remains a user-initiated action, then only
    // navigate it after the application has recorded the correction request.
    const popup = window.open('', '_blank')
    setAction('correction')
    setActionError('')
    try {
      const response = await monthlyAttendanceConfirmationAPI.requestCorrection()
      setConfirmation((current) => ({ ...current, ...(response.data || {}), required: true }))
      const destination = response.data?.correctionWhatsAppUrl || correctionUrl
      if (popup) {
        popup.opener = null
        popup.location.assign(destination)
      } else {
        window.location.assign(destination)
      }
    } catch (failure) {
      popup?.close()
      setActionError(failure.message || 'Pengajuan koreksi belum dapat dicatat.')
    } finally {
      setAction('')
    }
  }

  if (!loading && !error && !confirmation?.required) return null

  const busy = Boolean(action)
  const summary = confirmation?.summary || {}
  const rows = Array.isArray(confirmation?.rows) ? confirmation.rows : []
  const correctionUnavailable = !confirmation?.correctionWhatsAppUrl

  return (
    <AppDialog open onOpenChange={() => {}} busy={busy} dismissible={false} title="Konfirmasi Rekap Presensi" description={loading ? 'Memuat rekap presensi bulan lalu...' : `Tinjau data ${confirmation?.period?.label || 'bulan sebelumnya'} sebelum mengisi presensi bulan berjalan.`} className="max-w-4xl">
      {loading ? <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-muted-foreground"><RefreshCw className="h-5 w-5 animate-spin" />Memuat rekap...</div> : error ? <Notice onRetry={loadConfirmation}>{error}</Notice> : <div className="space-y-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
          Rekap mencakup {formatDate(confirmation?.period?.startDate)} – {formatDate(confirmation?.period?.endDate)}. Persetujuan Anda dicatat sebagai bukti konfirmasi penggajian.
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {[
            ['Hari kerja', summary.total_hari], ['Hadir', summary.hadir], ['Izin', summary.izin], ['Sakit', summary.sakit], ['Alfa', summary.alfa],
          ].map(([label, value]) => <div key={String(label)} className="rounded-lg bg-muted/60 p-2.5 text-center"><p className="text-lg font-bold tabular-nums">{Number(value) || 0}</p><p className="text-[10px] text-muted-foreground">{label}</p></div>)}
        </div>

        <div className="overflow-hidden rounded-xl border border-border">
          <div className="border-b border-border bg-muted/40 px-3 py-2"><p className="text-xs font-semibold text-foreground">Daftar presensi bulan lalu · {rows.length} tanggal</p></div>
          <div className="max-h-[38vh] overflow-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-background text-muted-foreground"><tr><th className="px-3 py-2 font-semibold">Tanggal</th><th className="px-3 py-2 font-semibold">Masuk</th><th className="px-3 py-2 font-semibold">Pulang</th><th className="px-3 py-2 font-semibold">Status</th><th className="hidden px-3 py-2 font-semibold sm:table-cell">Keterangan</th></tr></thead>
              <tbody className="divide-y divide-border">{rows.map((row) => <tr key={row.tanggal}><td className="whitespace-nowrap px-3 py-2 font-medium">{formatDate(row.tanggal)}</td><td className="px-3 py-2 tabular-nums">{formatTime(row.jam_masuk)}</td><td className="px-3 py-2 tabular-nums">{formatTime(row.jam_pulang)}</td><td className="px-3 py-2"><StatusBadge status={row.status} /></td><td className="hidden max-w-56 truncate px-3 py-2 text-muted-foreground sm:table-cell">{row.keterangan || '-'}</td></tr>)}</tbody>
            </table>
          </div>
        </div>

        {actionError && <Notice tone="error" onDismiss={() => setActionError('')}>{actionError}</Notice>}
        {confirmation?.status === 'correction_requested' && <Notice tone="warning">Pengajuan koreksi sudah dicatat. Setelah masalah selesai, tekan Setuju untuk membuka presensi bulan ini.</Notice>}
        {correctionUnavailable && <Notice tone="warning">Nomor WhatsApp admin belum diatur. Tombol Pengajuan Koreksi akan tersedia setelah admin melengkapinya di Pengaturan.</Notice>}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={handleCorrection} disabled={busy || correctionUnavailable}><MessageCircle aria-hidden="true" />{action === 'correction' ? 'Mencatat...' : 'Pengajuan Koreksi'}</Button>
          <Button type="button" onClick={handleConfirm} disabled={busy}><CheckCircle2 aria-hidden="true" />{action === 'confirm' ? 'Menyimpan...' : 'Setuju'}</Button>
        </div>
        <p className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground"><ClipboardCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />Setelah disetujui, rekap tetap tercatat sebagai konfirmasi meskipun admin kemudian melakukan koreksi data.</p>
      </div>}
    </AppDialog>
  )
}
