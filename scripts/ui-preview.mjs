// Isolated UI fixture server. No database, production proxy, or outbound requests.
// Start: node scripts/ui-preview.mjs [--port=8089] [--dist=dist]
// Open /__ui for scenarios, then sign in with admin / guru / kepsek and any password.
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { resolve, extname, sep } from 'node:path'

const option = (name, fallback) => process.argv.find((value) => value.startsWith('--' + name + '='))?.split('=').slice(1).join('=') || fallback
const port = Number(option('port', '8089'))
const directory = resolve(option('dist', 'dist'))
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date())
const dateAgo = (days) => { const date = new Date(today + 'T12:00:00+07:00'); date.setDate(date.getDate() - days); return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(date) }
const names = ['Ahmad Fauzi', 'Siti Aminah', 'Muhammad Ridwan', 'Nur Aisyah', 'Abdullah Hasan', 'Fatimah Zahra']
const teachers = Array.from({ length: 32 }, (_, index) => ({ id: index + 3, idGuru: 'UJI' + (index + 1), nama: names[index % names.length] + (index > 5 ? ' ' + (index + 1) : ''), username: 'guru' + (index + 1), role: 'guru', jenisKelamin: index % 2 ? 'Perempuan' : 'Laki-laki', jabatan: ['Guru Al-Quran'], tanggalBertugas: '2020-01-02', tipeGuru: 'full_time', email: '', noHP: '', alamat: '' }))
const admin = { id: 1, role: 'admin', nama: 'Admin Uji', username: 'admin' }
const statuses = ['hadir', 'hadir_terlambat', 'izin', 'sakit', 'hadir_izin_terlambat']
const baseLogs = teachers.slice(0, 29).map((teacher, index) => ({ id: 100 + index, userId: teacher.id, nama: teacher.nama, tanggal: today, status: statuses[index % statuses.length], jamMasuk: '07:15', jamHadir: '07:15', jamIzin: '07:00', jamSakit: '06:50', jamPulang: null, keterangan: index === 0 ? 'Catatan uji panjang untuk memeriksa detail presensi. '.repeat(12) : '', latitude: -5.1477, longitude: 119.4327 }))
const history = Array.from({ length: 5 }, (_, i) => ({ ...baseLogs[0], id: 200 + i, tanggal: dateAgo(i + 1), jamPulang: '14:30', keterangan: '' }))
const scenarios = ['normal', 'terlambat', 'masuk', 'menunggu', 'selesai', 'izin', 'sakit', 'libur', 'piket', 'gps', 'tombol-nonaktif', 'gagal-muat', 'gagal-simpan', 'lambat', 'kosong', 'balapan-filter', 'sesi-berakhir']
let scenario = 'normal'
let saved = null
const requests = []
const settings = () => ({ jam_masuk_normal: '07:20', toleransi_terlambat: '15', radius_gps: '500', sekolah_latitude: '-5.1477', sekolah_longitude: '119.4327', mode_testing: scenario === 'gps' ? '0' : '1', button_enabled: scenario === 'tombol-nonaktif' ? '0' : '1', jam_min_pulang: scenario === 'menunggu' ? '23:59' : '00:00', location_tracking_enabled: '0', apel_senin_enabled: '0', weekend_workday_enabled: '1' })
const attendance = () => saved || (['masuk', 'menunggu', 'piket', 'selesai', 'izin', 'sakit'].includes(scenario) ? { ...baseLogs[0], jamPulang: scenario === 'selesai' ? '14:30' : null, status: ['izin', 'sakit'].includes(scenario) ? scenario : 'hadir' } : null)
const holiday = () => ({ isWorkday: scenario !== 'libur', isHoliday: scenario === 'libur', isWeekend: false, holidayName: 'Libur sekolah', dayName: 'Minggu' })
const mime = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://127.0.0.1:' + port)
    let raw = ''
    for await (const chunk of req) { raw += chunk; if (raw.length > 100000) throw new Error('Payload too large') }
    const payload = raw ? (req.headers['content-type']?.includes('application/json') ? JSON.parse(raw) : Object.fromEntries(new URLSearchParams(raw))) : {}
    const send = (data, status = 200) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(data)) }
    const ok = (data, message = '') => send({ success: true, data, message })
    const failure = (message, status = 503) => send({ success: false, message }, status)
    if (url.pathname === '/__ui/requests') return ok(requests)
    if (url.pathname === '/__ui/scenario' && req.method === 'POST') {
      if (!scenarios.includes(payload.scenario)) return failure('Unknown scenario', 400)
      scenario = payload.scenario; saved = null; requests.length = 0
      res.writeHead(303, { Location: '/__ui' }); return res.end()
    }
    if (url.pathname === '/__ui') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' })
      return res.end('<html lang="id"><title>Preview UI lokal</title><style>body{font:16px system-ui;padding:40px;max-width:700px}select,button,a{padding:12px;margin:8px}label{display:block}</style><h1>Preview UI lokal</h1><p>Data tiruan di memori. Tidak terhubung ke database.</p><form method="POST" action="/__ui/scenario"><label>Skenario<select name="scenario">' + scenarios.map((value) => '<option ' + (scenario === value ? 'selected' : '') + '>' + value + '</option>').join('') + '</select></label><button>Terapkan skenario</button></form><p>Login: admin, guru, atau kepsek. Password bebas untuk fixture ini.</p><a href="/login">Buka aplikasi</a><a href="/__ui/requests">Catatan permintaan</a></html>')
    }
    if (url.pathname.startsWith('/api/')) {
      requests.push({ method: req.method, path: url.pathname, query: Object.fromEntries(url.searchParams), payload })
      if (requests.length > 300) requests.shift()
      const path = url.pathname.slice(4)
      const role = /ui-role=(guru|kepala_sekolah|admin)/.exec(req.headers.cookie || '')?.[1] || 'admin'
      const user = role === 'guru' ? teachers[0] : { ...admin, role }
      if (path === '/v1/config') return ok({ googleClientId: '', clientId: '', turnstileSiteKey: '', googleEnabled: false })
      if (path === '/v1/auth/login') {
        const selectedRole = payload.username === 'guru' ? 'guru' : payload.username === 'kepsek' ? 'kepala_sekolah' : 'admin'
        const selected = selectedRole === 'guru' ? teachers[0] : { ...admin, role: selectedRole }
        res.setHeader('Set-Cookie', 'ui-role=' + selectedRole + '; Path=/; HttpOnly; SameSite=Lax')
        return ok({ accessToken: 'local-fixture-token', user: selected })
      }
      if (path === '/v1/auth/logout') return ok({})
      if (scenario === 'sesi-berakhir' && path !== '/v1/config') return failure('Sesi berakhir. Silakan masuk kembali.', 401)
      if (path === '/v1/auth/refresh') return ok({ accessToken: 'local-fixture-token', user })
      if (path === '/v1/auth/me') return ok(user)
      if (role === 'guru' && ['/v1/operations/optional-workdays', '/v1/operations/weekend-overrides'].includes(path)) return failure('Forbidden', 403)
      if (path === '/v1/activities' && req.method === 'POST') return ok({})
      if (scenario === 'gagal-muat') return failure('Simulasi server tidak dapat dihubungi.')
      if (scenario === 'lambat') await new Promise((done) => setTimeout(done, 1800))
      if (path === '/v1/attendance' && req.method !== 'GET') {
        if (scenario === 'gagal-simpan') return failure('Simulasi penyimpanan gagal. Isian Anda tetap tersedia.')
        if (scenario === 'piket' && req.method === 'PUT' && !payload.izin_pulang_awal) return failure('PIKET_RESTRICTION|16:00', 400)
        await new Promise((done) => setTimeout(done, 800))
        const status = scenario === 'terlambat' && req.method === 'POST' && payload.status === 'hadir' ? 'hadir_terlambat' : payload.status || attendance()?.status || 'hadir'
        saved = { ...baseLogs[0], ...payload, id: 100, userId: 3, status, jamPulang: req.method === 'PUT' ? '14:30' : null }
        return ok({ attendance: saved }, 'Presensi berhasil disimpan!')
      }
      if (req.method !== 'GET') return failure('Penulisan fixture ini tidak tersedia; tidak ada data yang diubah.', 400)
      const list = scenario === 'kosong' ? [] : [...baseLogs, ...history]
      if (path === '/v1/users') return ok(url.searchParams.has('archived') ? [] : scenario === 'kosong' ? [] : teachers)
      if (path === '/v1/profile') return ok(user)
      if (path === '/v1/settings') return ok(settings())
      if (path === '/v1/guru/home') return ok({ settings: settings(), holiday: holiday(), attendance: attendance(), piket: { isPiketToday: scenario === 'piket', mine: scenario === 'piket' ? { user_id: 3, jam_piket: '07:00' } : null }, pulangThreshold: settings().jam_min_pulang, piketPulangTarget: scenario === 'piket' ? '16:00' : '' })
      if (path === '/v1/attendance') return ok(url.searchParams.has('tanggal') ? (attendance() ? [attendance()] : []) : url.searchParams.has('user_id') ? (scenario === 'kosong' ? [] : [...(attendance() ? [attendance()] : []), ...history]) : list)
      if (path === '/v1/attendance/manual') return ok(teachers)
      if (path === '/v1/holidays') return ok(url.searchParams.has('check') ? holiday() : [])
      if (path === '/v1/schedules/piket') return ok(url.searchParams.has('today') ? { jadwal: [] } : [])
      if (path === '/v1/reports/admin-summary') {
        const selected = url.searchParams.get('period') || 'today'
        if (scenario === 'balapan-filter') await new Promise((done) => setTimeout(done, selected === '7days' ? 2500 : 150))
        return ok({ totalGuru: scenario === 'kosong' ? 0 : teachers.length, stats: { hadir: list.filter((x) => x.status.startsWith('hadir')).length, izin: list.filter((x) => x.status === 'izin').length, sakit: list.filter((x) => x.status === 'sakit').length, alfa: 0 }, belumPresensiHariIni: scenario === 'kosong' ? [] : teachers.slice(29), logs: list.map((x) => selected === 'yesterday' ? { ...x, tanggal: dateAgo(1) } : x) })
      }
      if (path === '/v1/guru/peers') return ok({ items: teachers.map((teacher, index) => ({ ...teacher, statusFinal: statuses[index % 5], jamMasuk: '07:15', jamPulang: null })) })
      if (path === '/v1/reports/my-attendance') return ok({ teacher: teachers[0], period: { start_date: url.searchParams.get('start_date'), end_date: url.searchParams.get('end_date') }, summary: { total_hari: history.length, hadir: history.length, izin: 0, sakit: 0, alfa: 0, persentase: '100.0' }, rows: history.map((x) => ({ ...x, jam_masuk: x.jamMasuk, jam_pulang: x.jamPulang })) })
      if (path === '/v1/reports/teacher-workdays') return ok({ workday_dates: history.map((x) => x.tanggal), breakdown: [], optional_dates: [] })
      if (path === '/v1/reports/teachers-workdays') return ok({ teachers: Object.fromEntries(teachers.map((x) => [x.id, { user_id: x.id, workday_dates: history.map((row) => row.tanggal) }])), optional_dates: [] })
      if (path === '/v1/reports/charts') return ok({ trend7Days: history.map((x) => ({ tanggal: x.tanggal, name: x.tanggal.slice(5), hadir: 24, tidakHadir: 5 })), todayStats: { hadir: 24, izin: 3, sakit: 2, alfa: 0, belumAbsen: 3, total: 32, persentase: 75 }, guru: teachers, items: [], periodA: { rows: [], reasons: [] }, periodB: { rows: [] } })
      if (path === '/v1/location-tracking') return ok({ items: [], points: [], settings: settings() })
      if (path.startsWith('/v1/operations/') || path === '/v1/activities' || path === '/v1/admin/backups' || path === '/v1/admin/restores') return ok([])
      return failure('Fixture belum tersedia: ' + path, 404)
    }
    // Prevent a service worker from obscuring fixture scenario changes.
    if (url.pathname === '/sw.js') { res.writeHead(404); return res.end() }
    let file = resolve(directory, '.' + decodeURIComponent(url.pathname))
    if (file !== directory && !file.startsWith(directory + sep)) { res.writeHead(403); return res.end() }
    try { if (!(await stat(file)).isFile()) file = resolve(directory, 'index.html') } catch { if (extname(file)) { res.writeHead(404); return res.end() } file = resolve(directory, 'index.html') }
    res.writeHead(200, { 'Content-Type': (mime[extname(file)] || 'application/octet-stream') + (extname(file) === '.html' ? '; charset=utf-8' : ''), 'Cache-Control': 'no-store' })
    res.end(await readFile(file))
  } catch (error) { res.writeHead(500); res.end('Fixture error: ' + error.message) }
})
server.listen(port, '127.0.0.1', () => console.log('Isolated UI preview: http://127.0.0.1:' + port + '/__ui (' + directory + ')'))
