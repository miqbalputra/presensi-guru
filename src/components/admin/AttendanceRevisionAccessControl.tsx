import { useCallback, useEffect, useRef, useState } from 'react'
import { Eye, EyeOff, RefreshCw } from 'lucide-react'
import { adminAttendanceRevisionAPI, type AttendanceRevisionAccess } from '../../services/api'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Notice } from '../ui/page'
import { notify } from '../ui/toast'

export default function AttendanceRevisionAccessControl({ canManage = true, refreshKey = 0 }) {
  const [access, setAccess] = useState<AttendanceRevisionAccess | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)
  const sequence = useRef(0)

  const loadAccess = useCallback(async () => {
    if (busyRef.current) return
    const request = ++sequence.current
    try {
      const response = await adminAttendanceRevisionAPI.getAccess()
      if (request !== sequence.current) return
      setAccess(response.data)
      setError('')
    } catch (failure) {
      if (request === sequence.current) setError(failure.message || 'Akses revisi belum dapat dimuat.')
    }
  }, [])

  useEffect(() => {
    void loadAccess()
    const refresh = () => { if (document.visibilityState === 'visible') void loadAccess() }
    const timer = window.setInterval(refresh, 15000)
    window.addEventListener('focus', refresh)
    return () => {
      sequence.current++
      window.clearInterval(timer)
      window.removeEventListener('focus', refresh)
    }
  }, [loadAccess, refreshKey])

  const toggleAccess = async () => {
    if (!access || busyRef.current || !canManage || !access.canChangeVisibility) return
    busyRef.current = true
    setBusy(true)
    setError('')
    const request = ++sequence.current
    try {
      const response = await adminAttendanceRevisionAPI.setAccess(access.periodStart, access.previousMonthOpen)
      if (request !== sequence.current) return
      setAccess(response.data)
      notify(response.message || 'Akses revisi berhasil diperbarui.', 'success')
    } catch (failure) {
      if (request === sequence.current) setError(failure.message || 'Akses revisi belum berhasil disimpan.')
    } finally {
      busyRef.current = false
      setBusy(false)
    }
  }

  const label = access?.previousMonthOpen ? 'Ditampilkan untuk guru' : access?.closedByAdmin ? 'Disembunyikan admin' : 'Ditutup otomatis'
  return <Card className="gap-3 p-4 sm:p-5" aria-label="Pengaturan akses revisi bulan kemarin">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold">Akses revisi bulan kemarin</h2>
        <p className="mt-1 text-sm text-muted-foreground">{access ? `Periode ${access.periodLabel}` : 'Memuat akses revisi...'}</p>
      </div>
      {access && <span role="status" className={`rounded-full px-3 py-1 text-xs font-semibold ${access.previousMonthOpen ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>{label}</span>}
    </div>
    <p className="text-xs leading-relaxed text-muted-foreground">Tutup lebih awal setelah rekap selesai. Tab bulan kemarin beserta pengajuan baru dan editnya akan disembunyikan dari guru. Jika dibiarkan, akses otomatis ditutup setelah tanggal 5 pukul 23.59 WIB. Bulan berikutnya mengikuti jadwal tanggal 1–5 kembali.</p>
    {access?.closedByAdmin && access.closedAt && <p className="text-xs text-muted-foreground">Ditutup admin pada {new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta', timeZoneName: 'short' }).format(new Date(access.closedAt))}.</p>}
    {error && <Notice tone="error" onRetry={loadAccess}>{error}</Notice>}
    <div className="flex flex-wrap items-center gap-2">
      {canManage && access?.canChangeVisibility && <Button type="button" variant={access.previousMonthOpen ? 'default' : 'outline'} disabled={busy || Boolean(error)} onClick={toggleAccess}>
        {access.previousMonthOpen ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        {busy ? 'Menyimpan...' : access.previousMonthOpen ? 'Tutup & sembunyikan bulan kemarin' : 'Tampilkan kembali sampai tanggal 5'}
      </Button>}
      <Button type="button" variant="ghost" size="sm" onClick={loadAccess} disabled={busy}><RefreshCw aria-hidden="true" />Perbarui akses</Button>
    </div>
    <p className="text-xs text-muted-foreground">Pengajuan yang sudah masuk tetap dapat diproses melalui dashboard atau Telegram. Presensi bulan berjalan tetap tersedia.</p>
  </Card>
}
