import { useEffect, useRef, useState } from 'react'
import { AppDialog } from '../ui/dialog'
import { Button } from '../ui/button'
import { guruProfileAPI } from '../../services/api'
import { isGmailAddress } from '../../utils/email'

const ONE_HOUR_MS = 60 * 60 * 1000

function readDismissedUntil(key: string): number {
  if (!key) return 0
  try {
    const value = Number(window.localStorage.getItem(key))
    return Number.isFinite(value) ? value : 0
  } catch {
    return 0
  }
}

function removeDismissedUntil(key: string) {
  if (!key) return
  try { window.localStorage.removeItem(key) } catch { /* local storage may be unavailable */ }
}

export default function GuruGmailReminder({ user, activeTab, blocked = false }: { user: any; activeTab: string; blocked?: boolean }) {
  const accountId = user?.id ?? user?.user_id ?? user?.username
  const storageKey = accountId ? `guru-gmail-reminder-dismissed-until:${accountId}` : ''
  const [profile, setProfile] = useState<any>(null)
  const [email, setEmail] = useState('')
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [refreshVersion, setRefreshVersion] = useState(0)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    let active = true
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)

    const checkProfile = async () => {
      try {
        const response = await guruProfileAPI.getProfile()
        if (!active) return
        const data = response.data || {}
        const currentEmail = String(data.email || '').trim()
        setProfile(data)
        setEmail(currentEmail)

        if (isGmailAddress(currentEmail)) {
          removeDismissedUntil(storageKey)
          setOpen(false)
          return
        }

        const dismissedUntil = readDismissedUntil(storageKey)
        if (dismissedUntil > Date.now()) {
          setOpen(false)
          timerRef.current = window.setTimeout(
            () => setRefreshVersion((version) => version + 1),
            dismissedUntil - Date.now(),
          )
          return
        }

        removeDismissedUntil(storageKey)
        setOpen(true)
      } catch {
        // Keep the dashboard available; the next tab change or page load retries.
      }
    }

    void checkProfile()
    return () => {
      active = false
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    }
  }, [storageKey, activeTab, refreshVersion])

  const dismiss = () => {
    const dismissedUntil = Date.now() + ONE_HOUR_MS
    if (storageKey) {
      try { window.localStorage.setItem(storageKey, String(dismissedUntil)) } catch { /* local storage may be unavailable */ }
    }
    setOpen(false)
    setError('')
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(
      () => setRefreshVersion((version) => version + 1),
      ONE_HOUR_MS,
    )
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (saving) return

    const normalizedEmail = email.trim()
    if (!isGmailAddress(normalizedEmail)) {
      setError('Mohon gunakan alamat Gmail yang valid dan berakhiran @gmail.com.')
      return
    }

    setSaving(true)
    setError('')
    try {
      await guruProfileAPI.updateProfile({
        email: normalizedEmail,
        noHP: profile?.noHP ?? profile?.no_hp ?? '',
        alamat: profile?.alamat ?? '',
      })
      removeDismissedUntil(storageKey)
      setProfile((current) => ({ ...current, email: normalizedEmail }))
      setEmail(normalizedEmail)
      setOpen(false)
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    } catch (failure) {
      setError(failure?.message || 'Gmail belum berhasil disimpan. Silakan coba kembali.')
    } finally {
      setSaving(false)
    }
  }

  const name = String(user?.nama || '').trim() || 'Bapak/Ibu Guru'

  return (
    <AppDialog
      open={open && !blocked}
      onOpenChange={(nextOpen) => { if (!nextOpen && !saving) dismiss() }}
      title="Mohon Lengkapi Gmail"
      description={`Assalamu’alaikum warahmatullahi wabarakatuh, Ustadz/Ustadzah ${name}. Mohon berkenan melengkapi alamat Gmail yang aktif pada akun GeoPresensi. Gmail ini digunakan untuk mendukung akses akun melalui Google. Silakan gunakan alamat yang berakhiran @gmail.com. Jika belum sempat, silakan pilih “Nanti”; pengingat akan muncul kembali dalam satu jam. Terima kasih.`}
      busy={saving}
      className="sm:max-w-lg"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="guru-reminder-gmail" className="mb-1.5 block text-sm font-medium text-foreground">Alamat Gmail</label>
          <input
            id="guru-reminder-gmail"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(event) => { setEmail(event.target.value); setError('') }}
            placeholder="nama@gmail.com"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'guru-reminder-gmail-error' : 'guru-reminder-gmail-hint'}
            className="academy-input w-full rounded-lg border px-3 py-2 text-sm"
            disabled={saving}
          />
          {error
            ? <p id="guru-reminder-gmail-error" role="alert" className="mt-1.5 text-xs text-rose-600">{error}</p>
            : <p id="guru-reminder-gmail-hint" className="mt-1.5 text-xs text-muted-foreground">Gunakan Gmail aktif dengan akhiran @gmail.com.</p>}
        </div>
        <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
          <Button type="button" variant="ghost" onClick={dismiss} disabled={saving}>Nanti</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Menyimpan…' : 'Simpan Gmail'}</Button>
        </div>
      </form>
    </AppDialog>
  )
}
