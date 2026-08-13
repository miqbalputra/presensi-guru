# Implementation Plan Migrasi Stack

## 1. Tujuan

Memigrasikan aplikasi Presensi Guru secara bertahap ke stack berikut tanpa kehilangan data, fitur, atau kontrol keamanan:

- **UI/template:** TailAdmin React v2.3 style/theme
- **Frontend:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS v4
- **Komponen UI:** Radix UI dan komponen bergaya shadcn/custom
- **Ikon/chart:** Lucide React dan Recharts
- **Backend:** Go 1.25 + Fiber
- **ORM:** GORM
- **Database:** MySQL untuk staging dan production; SQLite opsional untuk local development sementara
- **Auth:** JWT, bcrypt, Google OAuth, Cloudflare Turnstile
- **Export:** XLSX dan PDF
- **API:** REST API
- **Deployment:** Docker multi-stage; Node untuk build frontend, Go untuk build backend, Alpine Linux sebagai runtime

Prinsip utama migrasi:

1. Aplikasi production yang sedang berjalan tidak diubah langsung.
2. Database production tidak dipakai untuk eksperimen atau pengujian.
3. Migrasi dilakukan per lapisan dan per modul, bukan rewrite besar sekaligus.
4. Kontrak API dibuat eksplisit agar frontend lama dan baru dapat diverifikasi.
5. Setiap tahap memiliki checkpoint, bukti hasil, dan prosedur rollback.
6. Fitur presensi hanya dianggap selesai setelah diuji dari sisi browser dan server.

## 2. Baseline Saat Ini

Hasil inventarisasi awal repository:

- Frontend saat ini menggunakan React + JavaScript/JSX + Vite.
- Styling saat ini menggunakan Tailwind CSS versi 3.
- Backend saat ini berupa PHP custom REST API.
- Database saat ini menggunakan MySQL melalui PDO.
- Auth saat ini menggunakan PHP session, password hashing, remember token, dan Google login.
- Fitur utama meliputi dashboard admin/guru, presensi GPS, QR Code, presensi pulang, hari libur, jadwal piket, lokasi, laporan, export XLSX/PDF, log aktivitas, n8n, dan Hermes API.
- Deployment saat ini memakai Docker dengan frontend build dan runtime FrankenPHP.

Dokumen baseline yang harus dikumpulkan sebelum coding:

- Daftar endpoint PHP beserta method, parameter, response, role, dan status code.
- Daftar tabel MySQL, kolom, index, foreign key, enum, dan data count.
- Daftar halaman, komponen, dan alur pengguna.
- Daftar environment variable dan secret.
- Daftar cron, webhook, workflow n8n, serta integrasi eksternal.
- Screenshot atau video alur kritis sebagai pembanding regresi.

## 3. Arsitektur Target

```text
Browser
  -> TailAdmin React / TypeScript / Vite
  -> REST API Go Fiber
  -> Service layer
  -> Repository layer GORM
  -> MySQL

Integrasi eksternal:
  Google OAuth
  Cloudflare Turnstile
  n8n / Hermes / webhook WhatsApp
```

Struktur backend yang disarankan:

```text
backend/
  cmd/server/              # entrypoint aplikasi
  internal/config/         # environment dan konfigurasi
  internal/database/       # koneksi, migrasi, transaction helper
  internal/models/         # model GORM
  internal/repositories/   # akses data
  internal/services/       # aturan bisnis
  internal/handlers/       # handler Fiber
  internal/middleware/     # JWT, role, CORS, rate limit, request ID
  internal/validators/     # validasi request
  internal/integrations/   # Google, Turnstile, n8n, Hermes
  migrations/              # migrasi SQL/GORM yang versioned
  tests/
```

Struktur frontend yang disarankan:

```text
frontend/
  src/
    app/                   # router, provider, bootstrap
    components/            # komponen reusable
    components/ui/         # Radix/shadcn/custom
    features/auth/
    features/attendance/
    features/dashboard/
    features/teachers/
    features/reports/
    features/settings/
    lib/api/               # REST client dan typed response
    lib/validation/        # schema validation
    types/
```

## 4. Strategi Branch dan Environment

Gunakan environment terpisah:

| Environment | Tujuan | Database | Akses |
|---|---|---|---|
| `development` | Coding dan unit test | MySQL lokal/Docker atau SQLite local-only | Developer |
| `test` | Integration/contract test | MySQL disposable | CI |
| `staging` | UAT dan verifikasi migrasi | Salinan database tersanitasi | Tim terbatas |
| `production` | Operasional resmi | MySQL production | Pengguna |

Branch yang disarankan:

- `main`: versi production yang stabil.
- `migration/stack-go-tailadmin`: pekerjaan migrasi.
- `staging`: kandidat release yang sudah melewati test.
- Feature branch kecil untuk setiap modul.

Aturan wajib:

- Tidak ada force-push atau reset destruktif pada branch production.
- Tidak ada secret production di repository.
- Pull request harus menyertakan hasil test dan catatan perubahan database.
- Satu PR sebaiknya hanya mengubah satu lapisan atau satu modul yang dapat diverifikasi.

## 5. Tahap 0 — Freeze, Backup, dan Baseline

### Tujuan

Mendapatkan titik pembanding yang dapat dikembalikan sebelum migrasi dimulai.

### Pekerjaan

1. Tag commit production saat ini, misalnya `pre-migration-baseline`.
2. Export database MySQL lengkap, termasuk schema, data, index, trigger, dan event bila ada.
3. Uji restore backup ke database baru, bukan hanya memastikan file dump berhasil dibuat.
4. Catat jumlah record per tabel utama: users, attendance, activity logs, holidays, jadwal, settings, dan tabel integrasi.
5. Jalankan smoke test aplikasi lama:
   - login admin;
   - login guru;
   - login Google;
   - presensi masuk;
   - presensi pulang;
   - QR Code;
   - izin/sakit;
   - dashboard;
   - export PDF/XLSX;
   - pengaturan;
   - webhook/n8n.
6. Simpan hasil smoke test sebagai baseline.
7. Catat versi MySQL production dan samakan versi tersebut di development/staging.

### Exit criteria

- Backup dapat direstore dan jumlah record cocok.
- Commit baseline diberi tag.
- Smoke test aplikasi lama berhasil atau semua kegagalannya terdokumentasi.
- Tidak ada coding migrasi yang dimulai sebelum baseline disimpan.

## 6. Tahap 1 — API Contract dan Data Dictionary

### Tujuan

Menetapkan perilaku API sebelum PHP diganti Go sehingga perubahan backend tidak mengubah perilaku aplikasi secara diam-diam.

### Pekerjaan

1. Inventarisasi seluruh endpoint PHP.
2. Untuk setiap endpoint, dokumentasikan:
   - method dan path;
   - autentikasi dan role;
   - request schema;
   - response schema;
   - status code;
   - validasi;
   - efek samping database;
   - audit log yang dihasilkan.
3. Buat OpenAPI sebagai sumber kontrak.
4. Tandai endpoint yang sudah legacy, endpoint internal n8n, dan endpoint yang digunakan frontend.
5. Buat typed API client untuk frontend baru berdasarkan kontrak tersebut.
6. Tetapkan format error yang konsisten, misalnya:

```json
{
  "success": false,
  "message": "Pesan untuk pengguna",
  "code": "VALIDATION_ERROR",
  "requestId": "...",
  "errors": {}
}
```

### Strategi kompatibilitas

- Pertahankan path dan payload lama jika tidak ada alasan kuat untuk mengubahnya.
- Jika perlu perubahan, buat `/api/v2` atau adapter kompatibilitas.
- Jangan mengubah nama status presensi, role, timezone, atau format tanggal tanpa migration mapping.
- Endpoint Hermes dan n8n harus dipertahankan sampai integrasi baru tervalidasi.

### Exit criteria

- Semua endpoint terpetakan.
- OpenAPI tersedia.
- Request/response kritis memiliki contract test.
- Mapping role, status, waktu, dan error disepakati.

## 7. Tahap 2 — Fondasi Go, Fiber, GORM, dan MySQL

### Tujuan

Membuat backend Go yang dapat dibangun, dijalankan, dites, dan terhubung ke MySQL tanpa membawa fitur bisnis terlebih dahulu.

### Pekerjaan

1. Buat `go.mod` dengan Go 1.25.
2. Pin dependency dan aktifkan dependency vulnerability scan di CI.
3. Tambahkan konfigurasi environment yang tervalidasi saat startup.
4. Buat koneksi MySQL dengan connection pool, timeout, dan health check.
5. Buat GORM models berdasarkan schema yang sudah ada.
6. Gunakan migration versioning; hindari `AutoMigrate` sebagai satu-satunya mekanisme production migration.
7. Tambahkan endpoint:
   - `GET /health/live`;
   - `GET /health/ready`;
   - `GET /version`.
8. Tambahkan middleware dasar:
   - request ID;
   - structured logging;
   - panic recovery;
   - body size limit;
   - timeout;
   - CORS allowlist;
   - security headers;
   - rate limiting.
9. Pastikan query menggunakan parameter binding dan tidak menyusun SQL dari input pengguna.
10. Gunakan transaction untuk operasi presensi yang mengubah lebih dari satu tabel.

### Exit criteria

- Backend dapat start terhadap MySQL kosong dan MySQL hasil restore.
- Health check membedakan service hidup dan database siap.
- Migration up/down teruji di database disposable.
- Tidak ada secret atau credential yang di-hardcode.

## 8. Tahap 3 — Migrasi Auth dan Security Foundation

Tahap ini harus selesai dan diuji sebelum endpoint bisnis dibuka ke pengguna.

### Desain token

- Access token JWT berumur pendek, misalnya 10–15 menit.
- Refresh token berumur terbatas, disimpan sebagai hash di MySQL.
- Refresh token dikirim melalui cookie `HttpOnly`, `Secure`, dan `SameSite` yang sesuai deployment.
- Refresh token dirotasi setiap dipakai dan token lama direvoke.
- Logout merevoke refresh token aktif.
- JWT memvalidasi issuer, audience, subject, expiry, dan key ID bila digunakan.
- Algoritma JWT di-allowlist; jangan menerima algoritma dari header token secara bebas.
- Jangan menyimpan access token permanen di `localStorage`.

### Auth password

- Gunakan bcrypt dengan cost yang dikonfigurasi dan ditinjau secara berkala.
- Jangan pernah mengembalikan password hash ke frontend.
- Terapkan panjang password minimum yang wajar, misalnya minimal 8 karakter.
- Gunakan pesan login yang tidak membocorkan apakah username atau password yang salah.
- Terapkan rate limit berbasis IP dan identitas akun.
- Catat login berhasil, gagal, logout, refresh gagal, revoke token, dan perubahan password.

### Google OAuth

- Verifikasi token di backend.
- Validasi signature, issuer, audience, expiry, nonce, dan `email_verified`.
- Linking akun berdasarkan aturan yang jelas; jangan menghubungkan akun hanya karena nama sama.
- Role admin tidak otomatis diberikan melalui Google login.
- Sediakan proses unlink/revoke yang membutuhkan autentikasi memadai.

### Cloudflare Turnstile

- Token selalu diverifikasi server-to-server.
- Validasi hostname/action bila digunakan.
- Token tidak boleh dipakai ulang.
- Login dan endpoint sensitif tetap memiliki rate limit walaupun Turnstile aktif.
- Secret Turnstile hanya berada di backend.

### Exit criteria

- Login password, refresh, logout, revoke, reset password, dan role check lulus test.
- Google OAuth menolak token dengan audience, issuer, atau expiry yang salah.
- Turnstile tidak dapat dilewati hanya dengan memanipulasi frontend.
- Semua endpoint bisnis menolak request tanpa token atau role yang sesuai.

## 9. Tahap 4 — Migrasi Modul Backend Secara Berurutan

Migrasikan modul berdasarkan risiko dan ketergantungan, bukan berdasarkan jumlah file.

### Urutan modul

1. **Users dan role**
   - data guru/admin/kepala sekolah;
   - profile;
   - archive/restore;
   - password dan role permission.
2. **Settings dan konfigurasi**
   - lokasi sekolah;
   - radius geofence;
   - jam kerja;
   - aturan presensi pulang.
3. **Attendance**
   - hadir;
   - izin/sakit;
   - pulang;
   - manual entry;
   - duplicate prevention;
   - activity log.
4. **GPS dan QR Code**
   - validasi koordinat server-side;
   - QR expiry/nonce;
   - replay protection;
   - timezone Asia/Jakarta.
5. **Dashboard dan rekap**
   - summary;
   - chart;
   - guru belum presensi;
   - lupa presensi pulang;
   - statistik per periode.
6. **Hari libur, jadwal piket, override, dan workday**
7. **Laporan dan export**
8. **Location tracking dan activity log**
9. **n8n, Hermes, dan webhook**

### Aturan bisnis yang harus dipertahankan

- Radius geofence dan cara menghitung jarak.
- Validasi hari libur dan weekend override.
- Status presensi dan aturan jam masuk/pulang.
- Idempotensi presensi: retry request tidak membuat record ganda.
- Timezone database dan aplikasi.
- Hak admin, kepala sekolah, dan guru.
- Jejak audit untuk perubahan manual.

### Exit criteria per modul

- Unit test service lulus.
- Integration test terhadap MySQL lulus.
- Contract test response sesuai OpenAPI.
- Data comparison dengan PHP untuk kasus yang sama sesuai.
- Tidak ada query raw yang menerima input tanpa parameter binding.

## 10. Tahap 5 — Migrasi Frontend ke TailAdmin

### Urutan pekerjaan

1. Buat aplikasi React 19 + TypeScript + Vite.
2. Integrasikan style/theme TailAdmin React v2.3.
3. Migrasikan Tailwind ke v4 dan pastikan token warna, typography, spacing, dark mode, serta responsive behavior stabil.
4. Tambahkan Radix UI dan komponen bergaya shadcn/custom secara selektif.
5. Buat layout dan navigation berdasarkan role.
6. Buat typed API client dan typed domain model.
7. Migrasikan halaman berikut secara bertahap:
   - login;
   - dashboard admin;
   - dashboard guru;
   - presensi GPS dan pulang;
   - QR scanner/generator;
   - data guru;
   - manual entry/edit;
   - hari libur dan jadwal;
   - lokasi tracking;
   - laporan/export;
   - profile dan pengaturan;
   - Hermes/n8n panel.
8. Pastikan browser permission GPS/camera memiliki state loading, denied, unavailable, dan timeout yang jelas.
9. Pertahankan export XLSX/PDF dan uji hasil file secara visual serta isi data.
10. Hapus dummy credential dan fallback localStorage yang tidak diperlukan untuk production.

### Exit criteria

- `tsc --noEmit`, lint, build, dan test frontend lulus.
- Tidak ada error console pada alur kritis.
- Semua route terlindungi berdasarkan auth dan role.
- Tampilan mobile dan desktop diverifikasi.
- Tidak ada API key privat atau secret yang masuk ke bundle Vite.

## 11. Tahap 6 — Security Test Plan

Security test harus dijalankan setiap ada perubahan auth, permission, endpoint, atau database.

### Authentication

- Login password benar berhasil.
- Password salah tidak membocorkan detail akun.
- Brute force login terkena rate limit.
- Access token expired ditolak.
- Token dengan signature invalid ditolak.
- Token dengan issuer/audience salah ditolak.
- Token dengan role yang dimanipulasi ditolak.
- Refresh token dapat dirotasi.
- Refresh token lama tidak dapat dipakai ulang setelah rotasi.
- Logout merevoke token.
- Akun archived tidak dapat login atau refresh.
- Perubahan password merevoke sesi/token sesuai kebijakan.

### Authorization dan IDOR

- Guru hanya dapat melihat dan mengubah data miliknya.
- Guru tidak dapat mengakses endpoint admin dengan mengganti URL atau ID.
- Kepala sekolah hanya mendapat permission yang ditetapkan.
- Admin tidak dapat mengakses fungsi internal tanpa izin yang sesuai.
- Semua object ID diuji dengan ID milik user lain.

### Google OAuth dan Turnstile

- Token Google kosong, expired, invalid signature, issuer salah, audience salah, dan email belum verified ditolak.
- Akun Google yang belum terdaftar tidak otomatis membuat role berprivilege tinggi.
- Token Turnstile kosong, expired, salah hostname/action, dan sudah digunakan ulang ditolak.
- Menghapus validasi Turnstile dari browser tidak dapat melewati validasi backend.

### Input dan API

- SQL injection pada seluruh parameter query, filter, sort, dan search.
- XSS pada nama, keterangan, jabatan, alamat, dan field export.
- JSON terlalu besar ditolak.
- Tipe data salah dan field tambahan ditangani secara aman.
- Path traversal dan filename berbahaya pada export/upload ditolak.
- CORS hanya mengizinkan origin yang terdaftar.
- Method yang tidak diizinkan ditolak.
- Error production tidak membocorkan stack trace, query, path, atau secret.
- Endpoint internal memakai API key terpisah, rotatable, dan tidak muncul di frontend.

### Presensi GPS dan QR

- Latitude/longitude di luar rentang ditolak.
- Jarak geofence dihitung server-side.
- Payload `isWithinRadius` dari frontend tidak dipercaya.
- Timestamp manipulatif dan timezone salah ditolak atau dinormalisasi.
- QR expired ditolak.
- QR yang sama tidak dapat direplay di luar aturan yang ditentukan.
- Presensi ganda akibat double click atau retry tidak membuat data ganda.
- User tidak dapat membuat presensi untuk user lain melalui manipulasi `user_id`.
- Manual entry selalu menghasilkan audit log.

### Infrastruktur dan container

- Container production tidak menjalankan debug mode.
- Container berjalan sebagai non-root bila kompatibel.
- Secret tidak masuk image layer, source bundle, log, atau health response.
- Image dependency dipindai dan versinya dipin.
- Hanya port yang diperlukan yang diekspos.
- HTTPS aktif di staging dan production.
- Security headers diuji.
- Health endpoint tidak menampilkan credential atau detail database.

### Kriteria security gate

- Tidak ada test severity critical/high yang terbuka.
- Temuan medium memiliki owner, mitigasi, dan due date.
- Semua test auth, authorization, presensi, dan secret handling lulus.
- Hasil security test tersimpan sebagai artifact release.

## 12. Tahap 7 — Test Otomatis dan Regresi

### Unit test

Backend:

- geofence distance;
- workday dan holiday rule;
- status presensi;
- jam minimal pulang;
- role permission;
- JWT claims;
- refresh token rotation;
- input validation;
- report aggregation.

Frontend:

- auth state;
- protected route;
- form validation;
- GPS permission state;
- QR scanner state;
- date/period filter;
- export action;
- error/loading/empty state.

### Integration test

- Go Fiber + MySQL test database.
- Login hingga akses endpoint terproteksi.
- Create/update attendance dalam transaction.
- Duplicate request/idempotency.
- Archive user dan revoke token.
- Report query dengan data besar.
- Webhook dengan timeout dan retry.

### Contract test

- Frontend typed client melawan OpenAPI.
- Response Go dibandingkan response PHP untuk fixture yang sama.
- Error status dan field wajib harus konsisten.

### End-to-end test

Minimal alur:

1. Admin login.
2. Admin membuat atau memperbarui guru.
3. Guru login password.
4. Guru login Google.
5. Guru presensi masuk di dalam geofence.
6. Presensi di luar geofence ditolak.
7. Guru scan QR yang valid.
8. QR expired/replay ditolak.
9. Guru presensi pulang.
10. Admin melihat dashboard dan log.
11. Admin melakukan manual edit.
12. Admin export PDF/XLSX.
13. n8n/Hermes menerima response yang sesuai.

### Regression comparison

Untuk dataset dan input yang sama, bandingkan PHP versus Go untuk:

- jumlah record presensi;
- status presensi;
- jam masuk/pulang;
- total hadir/izin/sakit/alpa;
- dashboard summary;
- laporan per guru/periode;
- response permission;
- audit log.

Perbedaan hanya boleh terjadi jika sudah didokumentasikan sebagai perubahan yang disengaja.

## 13. Tahap 8 — Staging

### Persiapan staging

1. Buat server atau service staging terpisah.
2. Gunakan domain/subdomain staging dengan HTTPS.
3. Gunakan MySQL staging dengan versi yang sama seperti production.
4. Restore backup production yang sudah disanitasi.
5. Ganti atau hapus data sensitif yang tidak diperlukan untuk UAT.
6. Gunakan OAuth client dan Turnstile site key khusus staging.
7. Gunakan API key n8n/Hermes staging yang berbeda dari production.
8. Batasi akses staging dengan login tambahan, VPN, allowlist, atau Cloudflare Access.
9. Pastikan `APP_ENV=staging` dan debug production dimatikan.
10. Simpan secret di secret store/environment, bukan file yang di-commit.

### Deployment staging

Docker multi-stage:

1. Stage frontend: install dependency dengan lockfile, jalankan typecheck/test, build Vite.
2. Stage backend: compile Go 1.25 untuk target runtime.
3. Stage runtime: image Alpine minimal, copy binary Go dan asset frontend.
4. Jalankan migration database sebagai job/release step yang terkontrol.
5. Jalankan health check dan smoke test setelah container ready.

### Staging verification

- Health/live dan health/ready berhasil.
- Login semua role berhasil.
- Tidak ada error pada browser console.
- Semua alur E2E kritis berhasil.
- Security test staging berhasil.
- Data count dan report comparison sesuai.
- Export file dapat dibuka dan isinya benar.
- Webhook staging tidak mengirim pesan ke nomor production.
- Log dan metrics dapat ditelusuri menggunakan request ID.

### UAT

UAT minimal dilakukan oleh:

- satu admin;
- satu kepala sekolah;
- dua guru dengan perangkat/browser berbeda;
- pemilik proses yang memahami aturan presensi.

Semua temuan UAT diberi severity:

- **Blocker:** menghalangi login, presensi, keamanan, atau integritas data.
- **High:** fitur utama salah atau data laporan tidak dapat dipercaya.
- **Medium:** alur masih dapat digunakan dengan workaround.
- **Low:** tampilan, copywriting, atau perbaikan minor.

Cutover tidak boleh dilakukan bila ada Blocker atau High yang belum disetujui secara eksplisit.

## 14. Tahap 9 — Data Verification dan Reconciliation

Sebelum cutover:

1. Ambil backup production terbaru.
2. Restore ke staging dan jalankan seluruh migration.
3. Bandingkan schema, index, foreign key, dan constraint.
4. Bandingkan row count setiap tabel.
5. Bandingkan checksum atau aggregate untuk tabel besar.
6. Ambil sampel data historis per bulan, role, status, dan user.
7. Bandingkan hasil laporan PHP dan Go.
8. Verifikasi timezone, tanggal, jam masuk, jam pulang, dan DST/format bila relevan.
9. Pastikan ID lama tetap stabil bila dipakai oleh integrasi eksternal.
10. Dokumentasikan setiap perbedaan yang disengaja.

Target reconciliation:

- Tidak ada kehilangan record.
- Tidak ada duplicate record.
- Tidak ada perubahan status tanpa alasan yang terdokumentasi.
- Total laporan periode sama.
- Semua foreign key valid.
- Semua record presensi tetap terkait user yang benar.

## 15. Tahap 10 — Cutover Production

### Prasyarat

- Staging UAT selesai.
- Security gate lulus.
- Backup dan restore drill berhasil.
- Runbook cutover dan rollback sudah diuji.
- Environment variable production sudah diverifikasi.
- Monitoring dan alert aktif.
- PIC teknis dan pemilik proses tersedia selama cutover.

### Urutan cutover

1. Umumkan maintenance window.
2. Hentikan perubahan schema/manual entry sementara.
3. Ambil backup MySQL terakhir dan verifikasi file.
4. Aktifkan mode maintenance atau read-only untuk write sensitif.
5. Jalankan migration database yang sudah direview.
6. Deploy image Go + frontend baru.
7. Jalankan health check.
8. Jalankan smoke test production dengan akun dan data aman.
9. Uji login, presensi, laporan, dan satu integrasi penting.
10. Buka akses pengguna secara bertahap bila memungkinkan.
11. Pantau error rate, latency, login failure, presensi gagal, dan database.
12. Simpan hasil cutover dan keputusan final.

### Canary/limited rollout

Bila platform memungkinkan, mulai dari:

- admin internal;
- kepala sekolah;
- beberapa guru perwakilan.

Perluas akses hanya setelah tidak ada error kritis selama periode observasi yang disepakati.

## 16. Rollback Plan

Rollback wajib diuji sebelum cutover.

### Rollback aplikasi

1. Aktifkan maintenance/read-only.
2. Kembalikan image aplikasi ke versi PHP/React terakhir.
3. Kembalikan konfigurasi routing/API ke versi lama.
4. Jangan langsung menjalankan migration down yang destruktif.
5. Jika schema baru tidak kompatibel, restore backup ke database recovery terpisah dan ikuti keputusan pemulihan data.
6. Verifikasi login, presensi, laporan, dan integrasi.
7. Buka kembali akses setelah smoke test lulus.

### Aturan migration database

- Migration harus backward-compatible selama masa transisi bila memungkinkan.
- Kolom baru ditambahkan nullable/default terlebih dahulu.
- Backfill dilakukan terpisah dan dapat dilanjutkan.
- Penghapusan kolom/tabel dilakukan hanya setelah masa observasi.
- Migration destruktif memerlukan backup, review, dan persetujuan eksplisit.

## 17. Monitoring Setelah Cutover

Pantau minimal selama 7–14 hari:

- HTTP 4xx/5xx per endpoint.
- Login success/failure dan refresh failure.
- JWT revoke/rotation anomaly.
- Presensi berhasil/gagal dan alasan penolakan.
- Duplicate attendance attempt.
- Geofence rejection rate.
- QR expired/replay rejection.
- Query latency dan slow query MySQL.
- Connection pool exhaustion.
- CPU, memory, disk, dan restart container.
- Webhook/n8n/Hermes failure.
- Export failure.
- Error log tanpa secret atau token.

Tindakan wajib:

- Alert untuk error critical/high.
- Daily reconciliation jumlah presensi selama masa observasi.
- Review security log dan unusual login.
- Catat semua hotfix dan keputusan rollback/lanjut.

## 18. Definition of Done

Migrasi dinyatakan selesai apabila:

- Frontend menggunakan React 19, TypeScript, Vite, TailAdmin, Tailwind v4, Radix/shadcn, Lucide, dan Recharts.
- Backend seluruh endpoint produksi berjalan di Go 1.25 + Fiber.
- Akses database menggunakan GORM dan MySQL.
- Auth password, JWT, bcrypt, Google OAuth, dan Turnstile lulus security test.
- Semua role dan permission lulus authorization test.
- GPS dan QR divalidasi server-side serta memiliki replay/duplicate protection.
- Data reconciliation production lulus.
- Unit, integration, contract, E2E, security, dan smoke test lulus.
- Docker build multi-stage berhasil dan runtime production tidak debug.
- Staging UAT selesai tanpa Blocker/High terbuka.
- Monitoring dan rollback tersedia serta pernah diuji.
- Dokumentasi deployment, environment, backup, restore, dan incident response diperbarui.

## 19. Urutan Implementasi Praktis

Urutan kerja yang disarankan:

1. Baseline dan backup.
2. API inventory dan OpenAPI.
3. Repository Go + CI + MySQL test environment.
4. Go health check dan middleware.
5. Auth JWT/bcrypt/Google/Turnstile.
6. Users, role, profile, dan settings.
7. Attendance, GPS, QR, dan audit log.
8. Dashboard, reports, export, holidays, jadwal, location tracking.
9. n8n/Hermes/webhook.
10. Frontend TailAdmin dan TypeScript per feature.
11. Contract/regression/E2E/security test lengkap.
12. Docker staging.
13. Data reconciliation.
14. UAT dan security gate.
15. Canary cutover.
16. Observasi dan decommission PHP setelah periode stabil.

## 20. Catatan Keputusan

- Staging dan production tetap **MySQL**; SQLite hanya mode local development sementara.
- Mode SQLite memakai GORM AutoMigrate, WAL/single-writer, dan seed akun admin development; tidak boleh dipakai sebagai sumber data production.
- PHP lama tetap dipertahankan sampai Go backend terbukti stabil.
- Production tidak boleh menjadi tempat eksperimen migration.
- Fitur tidak boleh dianggap selesai hanya karena build berhasil; harus lulus test API, security, data, dan UI.
- Prioritas pertama adalah integritas data presensi dan keamanan auth, baru kemudian penyempurnaan visual.

## 21. Status Implementasi Saat Ini

Implementasi bertahap sudah dimulai pada branch `codex/migrasi-stack`.

### Sudah diimplementasikan

- Backend Go dengan Fiber, GORM, MySQL DSN yang aman untuk staging/production, SQLite pure-Go untuk local development, connection pool, health/live-readiness, request ID, timeout, CORS allowlist, rate limit, security headers, dan recovery.
- Versioned SQL migrations untuk schema dasar, refresh token/security events, optional workday, weekend override, daily settings, location tracking, webhook, dan QR hardening.
- Schema dasar MySQL sudah memuat kolom runtime auth/OAuth, arsip guru, metode/lokasi pulang, dan QR; compatibility pass idempoten juga melengkapi kolom/index yang belum ada pada dump legacy tanpa mereset migration ledger.
- Compatibility API untuk users, attendance, settings, holidays, schedules, reports, QR, GPS, profile, activity, teacher workdays, n8n, Hermes, webhook n8n, dan webhook GOWA direct sehingga frontend/integrasi lama dapat dipindahkan bertahap.
- REST v1 aliases untuk modul bisnis dan integrasi Hermes/n8n; frontend tidak lagi menyimpan referensi endpoint `.php`.
- JWT access token memory-only di frontend, refresh token HttpOnly rotation di backend, bcrypt PHP `$2y$` compatibility, Google token verification, Turnstile server verification, archive protection, role authorization, dan security audit events.
- Refresh rotation memakai row lock/transaksi pada database aktif sehingga satu refresh token hanya dapat dipakai sekali pada request simultan.
- Route terproteksi melakukan validasi akun aktif ke database aktif; access token lama langsung ditolak setelah archive atau perubahan role.
- Jalur Bearer JWT pada integrasi admin juga memvalidasi akun aktif; API key n8n/Hermes tetap menjadi credential terpisah.
- Hardening performa: MySQL connect/read/write timeout, connection idle-timeout, pool validation, SQLite WAL/busy-timeout untuk local, response compression, immutable cache untuk asset Vite, indeks query operasional, dan prefetch kalender/attendance untuk menghilangkan N+1 query pada laporan.
- Endpoint report dengan rentang tanggal membatasi input maksimal 366 hari untuk mencegah query/memory abuse.
- React 19, Vite, Tailwind CSS v4, Radix UI, shadcn/custom primitives, Lucide terbaru, Recharts, TailAdmin-style admin shell, responsive sidebar/header, TypeScript entrypoint, typed router/app/login/dashboard shell, dan typed API client.
- Frontend API client sudah menggunakan endpoint REST `/api/v1`; route `.php` hanya dipertahankan sebagai compatibility layer untuk klien/integrasi lama.
- Export XLSX menggunakan ExcelJS tanpa dependency `xlsx` yang memiliki advisory aktif; PDF memakai jsPDF patched + autotable patched.
- Docker multi-stage Node build + Go build + Alpine runtime, MySQL Compose, staging env template, staging runbook, dan CI disposable MySQL/container smoke gate.
- Deployment configuration verifier memastikan stage Node/Go/Alpine, runtime non-root, healthcheck, MySQL 8.4, dan readiness dependency.
- Staging smoke gate otomatis untuk live/ready/version, protected endpoint anonymous rejection, security headers, dan HSTS saat memakai HTTPS.
- Security regression tests untuk JWT signature/issuer/audience/algorithm, bcrypt, integration API key, geofence, migrations, security headers, dan GOWA Basic Auth/phone contract.
- QR security tests untuk expiry, active nonce, constant-time secret comparison, dan duplicate/completed-attendance protection; production configuration tests untuk JWT, cookie, DB password, dan Turnstile gate.
- Environment `staging` diperlakukan sebagai secure environment: JWT minimal 32 karakter, cookie secure, DB password wajib, dan webhook wajib HTTPS/SSRF-safe.
- Bila Turnstile diwajibkan, konfigurasi staging memvalidasi site key dan secret key sekaligus agar widget frontend dan verifikasi backend tidak timpang.
- Recovery stack trace hanya aktif di development; staging dan production diperlakukan sebagai secure environment.
- Staging/production menolak `APP_URL` dan CORS origin HTTP atau wildcard agar cookie secure dan boundary browser tidak salah konfigurasi.
- Tool rekonsiliasi snapshot presensi PHP-versus-Go beserta unit test untuk alias field, missing/extra record, mismatch, dan duplicate identity.

### Bukti verifikasi lokal

- `npm.cmd run typecheck` berhasil.
- `npm.cmd run verify:source` berhasil; 50 file source TypeScript, 0 marker `@ts-nocheck`, dan `allowJs=false`.
- `verify:source` juga memverifikasi API client tidak kembali ke path `.php` dan memiliki endpoint REST inti.
- `npm.cmd run build` berhasil.
- `npm.cmd run verify:security` berhasil; tidak ada secret privat pada bundle.
- `npm.cmd audit --audit-level=high` berhasil dengan `0 vulnerabilities`.
- `go test ./...` dan `go test ./... -count=1` berhasil.
- Integration test MySQL disposable mencakup rerun migration dan simulasi kolom legacy yang hilang; CI menjalankannya dengan MySQL 8.4.
- `go vet ./...` berhasil.
- `go build ./cmd/server`, Windows release build, dan Linux `CGO_ENABLED=0 GOOS=linux GOARCH=amd64` release build berhasil.
- `node --check scripts/verify-staging.mjs` berhasil; smoke gate runtime dijalankan oleh workflow CI disposable MySQL/container.
- `npm.cmd run verify:deployment` berhasil; konfigurasi Docker/Compose memenuhi deployment gate.
- `npm.cmd run test:reconciliation` berhasil; 3 test rekonsiliasi lulus.
- Regression test kalender kerja dan batas rentang laporan berhasil; deployment verifier juga memeriksa konfigurasi timeout database.
- `scripts/load-test-staging.mjs` lolos syntax check dan synthetic local server test; load gate sebenarnya tetap harus dijalankan terhadap staging MySQL/container.
- Load test lokal terhadap Vite preview (`20` concurrent, `10` detik, `/`) menghasilkan `21.419` request, `0%` error, p95 `13,15 ms`, sekitar `2.141,9 req/s`; angka ini hanya mengukur static frontend serving.
- Dashboard admin/guru dibuat lazy-loaded; bundle awal login turun dan dependency export/chart tidak ikut dimuat sebelum diperlukan.
- Smoke test browser terhadap hasil build lokal berhasil; route login, form, pergantian tema, dan penanganan error API tampil tanpa white screen.
- `go test -race ./...` belum dapat dijalankan di host ini karena toolchain Windows tidak menyediakan CGo compiler; jalankan ulang pada CI/Linux staging.
- Local SQLite pure-Go berhasil dijalankan di `http://localhost:8080`; readiness `200`, frontend build `200`, dan login `admin` / `admin123` berhasil. Akun ini hanya seed development dan harus segera diganti bila dipakai lebih lanjut.

> Catatan: seluruh source frontend sekarang sudah berekstensi `.ts`/`.tsx`, `allowJs` sudah dimatikan, dan tidak ada marker `@ts-nocheck`. Sebagian state/komponen legacy masih memakai tipe boundary `any` agar kontrak API lama tetap kompatibel; ini menjadi area penguatan strict typing lanjutan, bukan pengecualian compile.

### Yang masih harus dijalankan di environment staging

- Build image dan `docker compose` karena Docker tidak tersedia pada mesin implementasi ini.
- Migration dan integration test terhadap MySQL 8.4 disposable/staging.
- UAT login Google/Turnstile dengan credential staging nyata.
- E2E GPS/camera/QR dan reconciliation dataset PHP versus Go.
- Penguatan strict typing feature legacy yang masih memakai boundary `any`.
- Canary/cutover production setelah security gate dan UAT disetujui.

Detail command dan acceptance gate ada di [STAGING_MIGRATION.md](STAGING_MIGRATION.md).
