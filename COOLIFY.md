# Deployment GeoPresensi di Coolify

Gunakan image migrasi Go/MySQL melalui `Dockerfile.migration`. Dokumentasi staging utama ada di [STAGING_MIGRATION.md](STAGING_MIGRATION.md); file ini merangkum pengaturan Coolify.

## Application

1. Buat service MySQL 8.4 terpisah.
2. Buat application dari repository ini.
3. Set Dockerfile ke `Dockerfile.migration` dan port internal `8080`.
4. Gunakan domain HTTPS staging terlebih dahulu.
5. Isi secret melalui Coolify Environment/Secret, bukan file yang di-commit.

## Environment minimum

```env
APP_ENV=production
APP_PORT=8080
APP_URL=https://domain-presensi-anda.com
FRONTEND_ORIGINS=https://domain-presensi-anda.com
APP_TIMEZONE=Asia/Jakarta
DB_HOST=nama-service-mysql
DB_PORT=3306
DB_NAME=geopresensi
DB_USER=geopresensi
DB_PASS=<random-database-password>
JWT_ISSUER=geopresensi
JWT_AUDIENCE=geopresensi-web
JWT_SECRET=<minimum-32-random-characters>
COOKIE_SECURE=true
TURNSTILE_REQUIRED=true
TURNSTILE_SECRET_KEY=<staging-or-production-turnstile-secret>
GOOGLE_CLIENT_ID=<oauth-client-id>
N8N_API_KEY=<random-integration-key>
HERMES_API_KEY=<random-integration-key>
GOWA_WEBHOOK_URL=<optional-https-gowa-endpoint>
GOWA_USERNAME=<optional-gowa-basic-auth-user>
GOWA_PASSWORD=<optional-gowa-basic-auth-password>
ALLOW_PRIVATE_WEBHOOK_TARGETS=false
```

## Verification

Validasi endpoint berikut setelah deploy:

```bash
curl -fsS https://domain-presensi-anda.com/health/live
curl -fsS https://domain-presensi-anda.com/health/ready
curl -fsS https://domain-presensi-anda.com/version
```

Jalankan UAT, security gate, backup/restore drill, dan reconciliation sesuai runbook. Jangan mematikan volume MySQL sebelum backup dan bukti verifikasi disimpan.

## Legacy rollback

`Dockerfile`, `api/`, dan dump PHP lama hanya dipertahankan sementara sebagai fallback/komparasi. Jangan memilih image legacy untuk cutover migrasi tanpa persetujuan rollback.
