import { Notice } from '../ui/page'
import { useState, useEffect, useRef } from 'react'
import { User, Mail, Phone, MapPin, Save, Loader2, ShieldCheck, Hash, BadgeCheck, Lock, KeyRound, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { guruProfileAPI } from '../../services/api'

function GuruAkun({ user }) {
  const profileSave = useRef(false)
  const passwordSave = useRef(false)
  const [loadError, setLoadError] = useState(false)
  const [revision, setRevision] = useState(0)
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState<any>({ email: '', noHP: '', alamat: '' })
  const [original, setOriginal] = useState<any>({ email: '', noHP: '', alamat: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // State untuk ganti password
  const [pwForm, setPwForm] = useState<any>({ passwordLama: '', passwordBaru: '', konfirmasiBaru: '' })
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({})
  const [showPw, setShowPw] = useState({ lama: false, baru: false, konfirmasi: false })
  const [savingPw, setSavingPw] = useState(false)
  const [pwMessage, setPwMessage] = useState({ type: '', text: '' })

  // Muat profil guru saat komponen pertama kali dirender
  useEffect(() => {
    let cancelled = false
    const loadProfile = async () => {
      setLoading(true)
      setLoadError(false)
      try {
        const res = await guruProfileAPI.getProfile()
        if (cancelled) return
        const data = res.data || {}
        const filled = {
          email: data.email || '',
          noHP: data.noHP || data.no_hp || '',
          alamat: data.alamat || '',
        }
        setProfile(data)
        setForm(filled)
        setOriginal(filled)
      } catch (err) {
        if (!cancelled) {
          setLoadError(true)
          // Fallback: gunakan data dari props user bila API gagal
          const filled = {
            email: user?.email || '',
            noHP: user?.noHP || user?.no_hp || '',
            alamat: user?.alamat || '',
          }
          setProfile({
            id: user?.id,
            idGuru: user?.idGuru || user?.id_guru,
            username: user?.username,
            nama: user?.nama,
            googleLinked: !!user?.googleId,
            ...filled,
          })
          setForm(filled)
          setOriginal(filled)
          setMessage({ type: 'error', text: 'Gagal memuat data profil: ' + err.message })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadProfile()
    return () => { cancelled = true }
  }, [revision])

  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
    setMessage({ type: '', text: '' })
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    const email = form.email.trim()
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Format email tidak valid.'
    }
    if (form.noHP && form.noHP.length > 20) {
      errs.noHP = 'Nomor HP maksimal 20 karakter.'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const hasChanges = () => {
    return (
      form.email.trim() !== original.email ||
      form.noHP.trim() !== original.noHP ||
      form.alamat.trim() !== original.alamat
    )
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (profileSave.current || loadError) return
    setMessage({ type: '', text: '' })

    if (!validate()) return

    profileSave.current = true
    setSaving(true)
    try {
      const res = await guruProfileAPI.updateProfile({
        email: form.email.trim(),
        noHP: form.noHP.trim(),
        alamat: form.alamat.trim(),
      })
      const data = res.data || {}
      const filled = {
        email: data.email || '',
        noHP: data.noHP || data.no_hp || '',
        alamat: data.alamat || '',
      }
      setProfile(prev => ({ ...prev, ...data }))
      setForm(filled)
      setOriginal(filled)
      setMessage({ type: 'success', text: res.message || 'Profil berhasil diperbarui.' })
    } catch (err) {
      setMessage({ type: 'error', text: 'Gagal memperbarui profil: ' + err.message })
    } finally {
      profileSave.current = false
      setSaving(false)
    }
  }

  // --- Ganti password ---
  const handlePwChange = (field) => (e) => {
    setPwForm(prev => ({ ...prev, [field]: e.target.value }))
    setPwErrors(prev => ({ ...prev, [field]: '' }))
    setPwMessage({ type: '', text: '' })
  }

  const validatePassword = () => {
    const errs: Record<string, string> = {}
    if (!pwForm.passwordLama) errs.passwordLama = 'Password lama harus diisi.'
    if (!pwForm.passwordBaru) {
      errs.passwordBaru = 'Password baru harus diisi.'
    } else if (pwForm.passwordBaru.length < 6) {
      errs.passwordBaru = 'Password baru minimal 6 karakter.'
    }
    if (!pwForm.konfirmasiBaru) {
      errs.konfirmasiBaru = 'Konfirmasi password harus diisi.'
    } else if (pwForm.passwordBaru !== pwForm.konfirmasiBaru) {
      errs.konfirmasiBaru = 'Konfirmasi password tidak cocok.'
    } else if (pwForm.passwordBaru && pwForm.passwordBaru === pwForm.passwordLama) {
      errs.passwordBaru = 'Password baru tidak boleh sama dengan password lama.'
    }
    setPwErrors(errs)
    return Object.keys(errs).length === 0
  }

  const hasPwChanges = () =>
    !!pwForm.passwordLama || !!pwForm.passwordBaru || !!pwForm.konfirmasiBaru

  const handleSavePassword = async (e) => {
    e.preventDefault()
    if (passwordSave.current) return
    setPwMessage({ type: '', text: '' })

    if (!validatePassword()) return

    passwordSave.current = true
    setSavingPw(true)
    try {
      const res = await guruProfileAPI.changePassword({
        passwordLama: pwForm.passwordLama,
        passwordBaru: pwForm.passwordBaru,
        konfirmasiBaru: pwForm.konfirmasiBaru,
      })
      setPwMessage({ type: 'success', text: res.message || 'Password berhasil diubah.' })
      setPwForm({ passwordLama: '', passwordBaru: '', konfirmasiBaru: '' })
    } catch (err) {
      setPwMessage({ type: 'error', text: 'Gagal mengubah password: ' + err.message })
    } finally {
      passwordSave.current = false
      setSavingPw(false)
    }
  }

  const togglePw = (field) => () => {
    setShowPw(prev => ({ ...prev, [field]: !prev[field] }))
  }

  if (loading) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center gap-3">
        <div className="relative h-10 w-10">
          <div className="absolute inset-0 rounded-full border-4 border-blue-100 dark:border-slate-800" />
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-blue-600 dark:border-t-blue-400" />
        </div>
        <p className="text-xs font-medium text-slate-400 dark:text-slate-500">Memuat profil...</p>
      </div>
    )
  }

  if (loadError) return <Notice onRetry={() => setRevision(value => value + 1)}>{message.text}</Notice>

  return (
    <div className="grid gap-4 pb-4 lg:grid-cols-[minmax(16rem,0.8fr)_minmax(0,1.4fr)]">
      {/* Header kartu identitas (read-only) */}
      <div className="guru-surface p-5 lg:row-span-2 lg:self-start sm:p-6">
        <div className="relative flex items-center gap-3.5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-2xl font-black text-white dark:bg-slate-800">
            {(profile?.nama || user?.nama || 'G').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-normal text-blue-600 dark:text-blue-400">Akun Guru</p>
            <h2 className="truncate text-lg font-bold leading-tight text-slate-800 dark:text-slate-100">
              {profile?.nama || user?.nama || 'Guru'}
            </h2>
          </div>
        </div>

        <div className="relative mt-4 space-y-2.5">
          <InfoRow icon={Hash} label="ID Guru" value={profile?.idGuru || profile?.id_guru || '-'} />
          <InfoRow icon={User} label="Username" value={profile?.username || user?.username || '-'} />
          <InfoRow icon={BadgeCheck} label="Role" value="Guru" />
          {/* Indikator login Google */}
          <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
            <span className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 font-medium">
              <GoogleG className="w-3.5 h-3.5" /> Login Google
            </span>
            {profile?.googleLinked ? (
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> Terhubung
              </span>
            ) : (
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Belum terhubung</span>
            )}
          </div>
        </div>
      </div>

      {/* Form edit profil */}
      <form onSubmit={handleSave} className="guru-surface space-y-5 p-5 sm:p-6">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Informasi Akun</h3>
          <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
            Data berikut akan otomatis tersimpan ke database utama Guru.
          </p>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Mail className="h-3.5 w-3.5" /> Email
          </label>
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange('email')}
            placeholder="contoh@email.com"
            className={`w-full rounded-xl border bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition-colors focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:bg-slate-800/60 dark:text-slate-200 dark:placeholder:text-slate-600 placeholder:text-slate-300 ${
              errors.email ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'
            }`}
          />
          {errors.email && <p className="mt-1 text-xs text-rose-500">{errors.email}</p>}
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            Email yang sama dipakai untuk login Google. Pastikan email valid.
          </p>
        </div>

        {/* No HP */}
        <div>
          <label htmlFor="noHP" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Phone className="h-3.5 w-3.5" /> No. HP
          </label>
          <input
            id="noHP"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={form.noHP}
            onChange={handleChange('noHP')}
            placeholder="08xxxxxxxxxx"
            className={`w-full rounded-xl border bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition-colors focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:bg-slate-800/60 dark:text-slate-200 dark:placeholder:text-slate-600 placeholder:text-slate-300 ${
              errors.noHP ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'
            }`}
          />
          {errors.noHP && <p className="mt-1 text-xs text-rose-500">{errors.noHP}</p>}
        </div>

        {/* Alamat */}
        <div>
          <label htmlFor="alamat" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <MapPin className="h-3.5 w-3.5" /> Alamat
          </label>
          <textarea
            id="alamat"
            value={form.alamat}
            onChange={handleChange('alamat')}
            placeholder="Jl. Contoh No. 123, Kota..."
            rows={3}
            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition-colors focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 dark:placeholder:text-slate-600 placeholder:text-slate-300"
          />
        </div>

        {/* Message */}
        {message.text && (
          <div role={message.type === 'error' ? 'alert' : 'status'} aria-live={message.type === 'error' ? 'assertive' : 'polite'} className={`flex items-start gap-2 rounded-xl p-3 text-sm font-medium ${
            message.type === 'success'
              ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300'
              : 'border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300'
          }`}>
            {message.type === 'success' ? <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /> : null}
            <span className="whitespace-pre-line">{message.text}</span>
          </div>
        )}

        {/* Tombol simpan */}
        <button
          type="submit"
          disabled={saving || !hasChanges()}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700 active:bg-blue-800 active:scale-[0.99] disabled:bg-slate-300 disabled:cursor-not-allowed disabled:text-slate-500 disabled:shadow-none dark:bg-blue-500 dark:hover:bg-blue-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
        >
          {saving ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...</>
          ) : (
            <><Save className="h-4 w-4" /> Simpan Perubahan</>
          )}
        </button>
        {!hasChanges() && !saving && (
          <p className="text-center text-xs text-slate-400 dark:text-slate-500">
            Belum ada perubahan yang perlu disimpan.
          </p>
        )}
      </form>

      {/* Form ganti password */}
      <form onSubmit={handleSavePassword} className="guru-surface space-y-5 p-5 sm:p-6">
        <div>
          <h3 className="flex items-center gap-1.5 text-sm font-bold text-slate-800 dark:text-slate-100">
            <KeyRound className="h-4 w-4 text-blue-500" /> Keamanan Akun
          </h3>
          <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
            Ubah password Anda untuk menjaga keamanan akun.
          </p>
        </div>

        {/* Password lama */}
        <div>
          <label htmlFor="passwordLama" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Lock className="h-3.5 w-3.5" /> Password Lama
          </label>
          <div className="relative">
            <input
              id="passwordLama"
              type={showPw.lama ? 'text' : 'password'}
              value={pwForm.passwordLama}
              onChange={handlePwChange('passwordLama')}
              autoComplete="current-password"
              placeholder="Masukkan password lama"
              className={`w-full rounded-xl border bg-slate-50 px-4 py-3 pr-11 text-sm text-slate-700 outline-none transition-colors focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:bg-slate-800/60 dark:text-slate-200 dark:placeholder:text-slate-600 placeholder:text-slate-300 ${
                pwErrors.passwordLama ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'
              }`}
            />
            <button type="button" onClick={togglePw('lama')} aria-label={showPw.lama ? 'Sembunyikan password lama' : 'Tampilkan password lama'} aria-pressed={showPw.lama} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:text-slate-300">
              {showPw.lama ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {pwErrors.passwordLama && <p className="mt-1 text-xs text-rose-500">{pwErrors.passwordLama}</p>}
        </div>

        {/* Password baru */}
        <div>
          <label htmlFor="passwordBaru" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <KeyRound className="h-3.5 w-3.5" /> Password Baru
          </label>
          <div className="relative">
            <input
              id="passwordBaru"
              type={showPw.baru ? 'text' : 'password'}
              value={pwForm.passwordBaru}
              onChange={handlePwChange('passwordBaru')}
              autoComplete="new-password"
              placeholder="Minimal 6 karakter"
              className={`w-full rounded-xl border bg-slate-50 px-4 py-3 pr-11 text-sm text-slate-700 outline-none transition-colors focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:bg-slate-800/60 dark:text-slate-200 dark:placeholder:text-slate-600 placeholder:text-slate-300 ${
                pwErrors.passwordBaru ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'
              }`}
            />
            <button type="button" onClick={togglePw('baru')} aria-label={showPw.baru ? 'Sembunyikan password baru' : 'Tampilkan password baru'} aria-pressed={showPw.baru} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:text-slate-300">
              {showPw.baru ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {pwErrors.passwordBaru && <p className="mt-1 text-xs text-rose-500">{pwErrors.passwordBaru}</p>}
        </div>

        {/* Konfirmasi password baru */}
        <div>
          <label htmlFor="konfirmasiBaru" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <CheckCircle2 className="h-3.5 w-3.5" /> Ulangi Password Baru
          </label>
          <div className="relative">
            <input
              id="konfirmasiBaru"
              type={showPw.konfirmasi ? 'text' : 'password'}
              value={pwForm.konfirmasiBaru}
              onChange={handlePwChange('konfirmasiBaru')}
              autoComplete="new-password"
              placeholder="Ketik ulang password baru"
              className={`w-full rounded-xl border bg-slate-50 px-4 py-3 pr-11 text-sm text-slate-700 outline-none transition-colors focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:bg-slate-800/60 dark:text-slate-200 dark:placeholder:text-slate-600 placeholder:text-slate-300 ${
                pwErrors.konfirmasiBaru ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'
              }`}
            />
            <button type="button" onClick={togglePw('konfirmasi')} aria-label={showPw.konfirmasi ? 'Sembunyikan konfirmasi password' : 'Tampilkan konfirmasi password'} aria-pressed={showPw.konfirmasi} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:text-slate-300">
              {showPw.konfirmasi ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {pwErrors.konfirmasiBaru && <p className="mt-1 text-xs text-rose-500">{pwErrors.konfirmasiBaru}</p>}
        </div>

        {/* Message password */}
        {pwMessage.text && (
          <div role={pwMessage.type === 'error' ? 'alert' : 'status'} aria-live={pwMessage.type === 'error' ? 'assertive' : 'polite'} className={`flex items-start gap-2 rounded-xl p-3 text-sm font-medium ${
            pwMessage.type === 'success'
              ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300'
              : 'border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300'
          }`}>
            {pwMessage.type === 'success' ? <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /> : null}
            <span className="whitespace-pre-line">{pwMessage.text}</span>
          </div>
        )}

        {/* Tombol simpan password */}
        <button
          type="submit"
          disabled={savingPw || !hasPwChanges()}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-slate-800 active:bg-slate-950 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none dark:bg-blue-500 dark:hover:bg-blue-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
        >
          {savingPw ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Mengubah...</>
          ) : (
            <><KeyRound className="h-4 w-4" /> Ubah Password</>
          )}
        </button>
      </form>
    </div>
  )
}

// Ikon "G" Google sederhana (inline SVG agar tidak butuh dependency tambahan)
function GoogleG({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
    </svg>
  )
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <span className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 font-medium">
        <Icon className="w-3.5 h-3.5" /> {label}
      </span>
      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 text-right ml-2 break-all">{value}</span>
    </div>
  )
}

export default GuruAkun
