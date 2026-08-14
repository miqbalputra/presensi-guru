# Staging Migration Runbook

Dokumen ini adalah runbook operasional untuk menguji stack Go/MySQL + React/Vite sebelum cutover.

## Prasyarat

- Docker Engine dan Docker Compose tersedia.
- File environment staging disalin dari `deploy/staging.env.example` dan diisi secret baru.
- Database staging terpisah dari production.
- OAuth, Turnstile, n8n, Hermes, dan bila dipakai GOWA staging memakai credential/domain staging.

## Jalankan staging

```powershell
docker compose --env-file deploy/staging.env.example -f docker-compose.migration.yml up -d --build
docker compose -f docker-compose.migration.yml ps
```

Validasi readiness:

```powershell
Invoke-WebRequest http://localhost:8080/health/live
Invoke-WebRequest http://localhost:8080/health/ready
Invoke-WebRequest http://localhost:8080/version
```

Smoke gate otomatis:

```powershell
$env:STAGING_URL = "http://localhost:8080"
npm.cmd run verify:staging
```

Untuk staging HTTPS, set `STAGING_URL` ke URL HTTPS agar gate juga mewajibkan HSTS.

## Load test read-only

Jalankan setelah smoke test, hanya terhadap staging:

```powershell
$env:LOAD_URL = "https://staging.example.invalid"
$env:LOAD_PATH = "/health/ready"
$env:LOAD_CONCURRENCY = "20"
$env:LOAD_DURATION_SECONDS = "30"
npm.cmd run test:load:staging
```

Default gate: error rate maksimal 1% dan p95 maksimal 500 ms. Ulangi dengan concurrency bertahap, misalnya 20, 50, dan 100, lalu catat hasil CPU, memory, connection pool, dan MySQL slow query.

## Verifikasi minimum

1. Jalankan `npm.cmd run typecheck`, `npm.cmd run build`, `npm.cmd run verify:security`, dan `npm.cmd run verify:deployment`.
2. Jalankan `go test ./...`, `go vet ./...`, dan build backend Linux di Docker.
3. Uji login password, refresh, logout, role admin/guru, dan akun archived.
4. Uji presensi GPS di dalam dan luar geofence, QR valid/expired/replay, pulang, dan duplicate request.
5. Uji dashboard, laporan, export PDF/XLSX, profile, settings, dan activity log.
6. Uji endpoint n8n/Hermes/GOWA memakai API key staging; pastikan tanpa key mendapat 401 dan GOWA tidak menunjuk nomor production.
7. Periksa browser console, response security headers, rate limit, dan error log.
8. Bandingkan row count serta agregasi laporan dengan fixture PHP lama.

Untuk membandingkan snapshot JSON presensi secara deterministik:

```powershell
node scripts/reconcile-attendance.mjs --legacy .\evidence\php-attendance.json --go .\evidence\go-attendance.json
```

Command keluar dengan status gagal bila ada record hilang/ekstra, duplikat, atau field inti berbeda.

## Backup dan restore drill

1. Isi `BACKUP_N8N_API_KEY` dengan key khusus yang berbeda dari `N8N_API_KEY`.
2. Dari menu Admin → Backup & Pemulihan, buat SQL backup dan full backup.
3. Verifikasi checksum lalu unduh artifact; pastikan file tidak tersedia melalui static asset route.
4. Import `n8n/backup-geopresensi.json`, isi URL aplikasi, API key backup, dan credential Google Drive atau S3.
5. Jalankan workflow secara manual, lalu pastikan artifact tersimpan private dan ukuran/checksum cocok.
6. Restore artifact ke database staging terpisah dan bandingkan row count tabel utama.
7. Aktifkan `BACKUP_RESTORE_ENABLED=true` hanya di staging untuk menguji pre-restore backup, maintenance mode, phrase konfirmasi, dan verifikasi pasca-restore.
8. Kembalikan flag menjadi `false` setelah drill selesai. Production restore memerlukan persetujuan operasional terpisah.

## Security gate

Staging tidak boleh dipromosikan bila ada temuan Critical/High, perbedaan data presensi, kegagalan login/role, atau credential staging keluar ke bundle frontend.

## Rollback staging

```powershell
docker compose -f docker-compose.migration.yml down
```

Jangan menghapus volume database staging sebelum backup/fixture hasil test disimpan.
