import { useState, useEffect } from 'react'
import { User, Mail, Phone, MapPin, Save, Loader2, ShieldCheck, Hash, BadgeCheck } from 'lucide-react'
import { guruProfileAPI } from '../../services/api'

function GuruAkun({ user }) {
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({ email: '', noHP: '', alamat: '' })
  const [original, setOriginal] = useState({ email: '', noHP: '', alamat: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [errors, setErrors] = useState({})

  // Muat profil guru saat komponen pertama kali dirender
  useEffect(() => {
    let cancelled = false
    const loadProfile = async () => {
      setLoading(true)
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
  }, [])

  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
    setMessage({ type: '', text: '' })
  }

  const validate = () => {
    const errs = {}
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
    setMessage({ type: '', text: '' })

    if (!validate()) return

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
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[260px]">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Header kartu identitas (read-only) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-none border border-slate-100 dark:border-slate-800 p-5 relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-l-2xl" />
        <div className="flex items-center gap-3 pl-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-md shrink-0">
            {(profile?.nama || user?.nama || 'G').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-widest">Akun Guru</p>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight truncate">
              {profile?.nama || user?.nama || 'Guru'}
            </h2>
          </div>
        </div>

        <div className="mt-4 pl-2 space-y-2.5">
          <InfoRow icon={Hash} label="ID Guru" value={profile?.idGuru || profile?.id_guru || '-'} />
          <InfoRow icon={User} label="Username" value={profile?.username || user?.username || '-'} />
          <InfoRow icon={BadgeCheck} label="Role" value="Guru" />
        </div>
      </div>

      {/* Form edit */}
      <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-none border border-slate-100 dark:border-slate-800 p-5 space-y-5">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Informasi Akun</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Data berikut akan otomatis tersimpan ke database utama Guru.
          </p>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
            <Mail className="w-3.5 h-3.5" /> Email
          </label>
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange('email')}
            placeholder="contoh@email.com"
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-slate-700 dark:text-slate-200 dark:bg-slate-800/60 placeholder:text-slate-300 dark:placeholder:text-slate-600 transition-colors ${
              errors.email ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'
            }`}
          />
          {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email}</p>}
        </div>

        {/* No HP */}
        <div>
          <label htmlFor="noHP" className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
            <Phone className="w-3.5 h-3.5" /> No. HP
          </label>
          <input
            id="noHP"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={form.noHP}
            onChange={handleChange('noHP')}
            placeholder="08xxxxxxxxxx"
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-slate-700 dark:text-slate-200 dark:bg-slate-800/60 placeholder:text-slate-300 dark:placeholder:text-slate-600 transition-colors ${
              errors.noHP ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'
            }`}
          />
          {errors.noHP && <p className="text-xs text-rose-500 mt-1">{errors.noHP}</p>}
        </div>

        {/* Alamat */}
        <div>
          <label htmlFor="alamat" className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
            <MapPin className="w-3.5 h-3.5" /> Alamat
          </label>
          <textarea
            id="alamat"
            value={form.alamat}
            onChange={handleChange('alamat')}
            placeholder="Jl. Contoh No. 123, Kota..."
            rows={3}
            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-slate-700 dark:text-slate-200 dark:bg-slate-800/60 placeholder:text-slate-300 dark:placeholder:text-slate-600 resize-none transition-colors"
          />
        </div>

        {/* Message */}
        {message.text && (
          <div className={`flex items-start gap-2 p-3 rounded-xl text-sm font-medium ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20'
              : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20'
          }`}>
            {message.type === 'success' ? <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" /> : null}
            <span className="whitespace-pre-line">{message.text}</span>
          </div>
        )}

        {/* Tombol simpan */}
        <button
          type="submit"
          disabled={saving || !hasChanges()}
          className="w-full bg-indigo-600 dark:bg-indigo-500 text-white py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm hover:bg-indigo-700 dark:hover:bg-indigo-400 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 dark:disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
          ) : (
            <><Save className="w-4 h-4" /> Simpan Perubahan</>
          )}
        </button>
        {!hasChanges() && !saving && (
          <p className="text-center text-xs text-slate-400 dark:text-slate-500">
            Belum ada perubahan yang perlu disimpan.
          </p>
        )}
      </form>
    </div>
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