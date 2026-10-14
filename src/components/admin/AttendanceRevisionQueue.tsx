import { useCallback, useEffect, useState } from 'react'
import { Check, Clock3, RefreshCw, X } from 'lucide-react'
import { adminAttendanceRevisionAPI } from '../../services/api'
import { formatDisplayDate } from '../../utils/dateUtils'
import { AppDialog } from '../ui/dialog'
import { Button } from '../ui/button'
import { notify } from '../ui/toast'

const filters = [
  { value: 'pending', label: 'Menunggu' },
  { value: 'all', label: 'Semua' },
  { value: 'approved', label: 'Disetujui' },
  { value: 'rejected', label: 'Ditolak' },
]

export default function AttendanceRevisionQueue() {
  const [filter, setFilter] = useState('pending')
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [activeId, setActiveId] = useState<string | number | null>(null)
  const [rejectTarget, setRejectTarget] = useState<any>(null)
  const [rejectNote, setRejectNote] = useState('')

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true)
      setLoadError('')
      const response = await adminAttendanceRevisionAPI.getAll(filter)
      setRequests(response.data || [])
    } catch (error) {
      setLoadError(error.message || 'Pengajuan revisi belum dapat dimuat.')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { loadRequests() }, [loadRequests])

  const decide = async (request, decision, note = '') => {
    if (activeId !== null) return
    setActiveId(request.id)
    try {
      await adminAttendanceRevisionAPI.decide(request.id, decision, note)
      notify(decision === 'approved' ? 'Pengajuan disetujui dan presensi diperbarui.' : 'Pengajuan ditolak dan catatan dikirim kepada guru.', 'success')
      setRejectTarget(null)
      setRejectNote('')
      window.dispatchEvent(new Event('attendance-revisions-updated'))
      await loadRequests()
    } catch (error) {
      notify(error.message || 'Keputusan belum berhasil disimpan.', 'error')
    } finally {
      setActiveId(null)
    }
  }

  const requestStatus = (status) => {
    if (status === 'pending') return 'bg-amber-100 text-amber-800'
    if (status === 'approved') return 'bg-green-100 text-green-800'
    return 'bg-red-100 text-red-800'
  }

  return <section className="space-y-5" aria-labelledby="attendance-revision-queue-title">
    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 id="attendance-revision-queue-title" className="text-lg font-bold text-slate-900">Pengajuan Guru</h2>
        <p className="mt-1 text-sm text-slate-500">Tinjau jam yang diajukan dan jam pada catatan presensi saat ini.</p>
      </div>
      <Button type="button" variant="outline" onClick={loadRequests} disabled={loading}><RefreshCw className={loading ? 'animate-spin' : ''} /> Muat Ulang</Button>
    </div>

    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter status pengajuan">
      {filters.map((item) => <button key={item.value} type="button" role="tab" aria-selected={filter === item.value} onClick={() => setFilter(item.value)} className={`min-h-10 rounded-lg px-4 text-sm font-semibold transition ${filter === item.value ? 'bg-blue-600 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
        {item.label}{item.value === 'pending' && <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">{requests.filter((request) => request.status === 'pending').length}</span>}
      </button>)}
    </div>

    {loadError && <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><span>{loadError}</span><Button type="button" variant="outline" onClick={loadRequests}>Coba Lagi</Button></div>}

    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {loading ? <div className="p-12 text-center text-sm text-slate-500"><Clock3 className="mx-auto mb-3 h-6 w-6 animate-pulse" />Memuat pengajuan...</div> : requests.length === 0 ? <div className="p-12 text-center text-sm text-slate-500">Belum ada pengajuan pada filter ini.</div> : <div className="overflow-x-auto">
        <table className="w-full min-w-[850px] text-left">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>
            <th className="px-5 py-3">Guru & tanggal</th><th className="px-5 py-3">Alasan</th><th className="px-5 py-3">Jam masuk</th><th className="px-5 py-3">Jam pulang</th><th className="px-5 py-3">Status / catatan</th><th className="px-5 py-3">Keputusan</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {requests.map((request) => <tr key={request.id} className="align-top hover:bg-slate-50/70">
              <td className="px-5 py-4"><p className="font-semibold text-slate-900">{request.namaGuru}</p><p className="mt-1 text-xs text-slate-500">{request.idGuru || `ID ${request.userId}`} · {formatDisplayDate(request.tanggal)}</p></td>
              <td className="px-5 py-4"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{request.alasan === 'lupa' ? 'Lupa' : 'Kendala Teknis'}</span></td>
              <td className="px-5 py-4 text-sm"><p className="text-xs text-slate-500">Saat ini: <strong className="text-slate-700">{request.currentJamMasuk || '-'}</strong></p><p className="mt-1 text-xs text-slate-500">Diajukan: <strong className="text-blue-700">{request.jamMasuk || 'Tidak diubah'}</strong></p></td>
              <td className="px-5 py-4 text-sm"><p className="text-xs text-slate-500">Saat ini: <strong className="text-slate-700">{request.currentJamPulang || '-'}</strong></p><p className="mt-1 text-xs text-slate-500">Diajukan: <strong className="text-blue-700">{request.jamPulang || 'Tidak diubah'}</strong></p></td>
              <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${requestStatus(request.status)}`}>{request.status === 'pending' ? 'Menunggu' : request.status === 'approved' ? 'Disetujui' : 'Ditolak'}</span>{request.catatanAdmin && <p className="mt-2 max-w-48 text-xs text-slate-500">{request.catatanAdmin}</p>}</td>
              <td className="px-5 py-4">{request.status === 'pending' ? <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" onClick={() => decide(request, 'approved')} disabled={activeId !== null}><Check /> Setujui</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => { setRejectTarget(request); setRejectNote('') }} disabled={activeId !== null}><X /> Tolak</Button>
              </div> : <span className="text-xs text-slate-400">Telah diproses</span>}</td>
            </tr>)}
          </tbody>
        </table>
      </div>}
    </div>

    <AppDialog open={Boolean(rejectTarget)} onOpenChange={(open) => { if (!open) { setRejectTarget(null); setRejectNote('') } }} title="Tolak Pengajuan Revisi" description={rejectTarget ? `Pengajuan ${rejectTarget.namaGuru} untuk ${formatDisplayDate(rejectTarget.tanggal)} akan ditolak. Mohon sampaikan catatan agar guru memahami alasannya.` : undefined} className="max-w-lg">
      {rejectTarget && <form onSubmit={(event) => { event.preventDefault(); if (rejectNote.trim()) decide(rejectTarget, 'rejected', rejectNote.trim()) }} className="space-y-4">
        <label className="block space-y-2"><span className="text-sm font-semibold text-slate-800">Catatan untuk guru <span className="text-red-600">*</span></span><textarea value={rejectNote} onChange={(event) => setRejectNote(event.target.value)} required maxLength={1000} rows={4} className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" placeholder="Jelaskan alasan penolakan dengan singkat dan santun." /><span className="block text-right text-xs text-slate-400">{rejectNote.length}/1000</span></label>
        <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setRejectTarget(null)}><X /> Batal</Button><Button type="submit" variant="danger" disabled={!rejectNote.trim() || activeId !== null}>Tolak Pengajuan</Button></div>
      </form>}
    </AppDialog>
  </section>
}
