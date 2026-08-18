# Deployment GeoPresensi di Coolify

Gunakan image migrasi Go/MySQL melalui `Dockerfile.migration`. Dokumentasi staging utama ada di [STAGING_MIGRATION.md](STAGING_MIGRATION.md); file ini merangkum pengaturan Coolify.

## Application

1. Buat service MySQL 8.4 terpisah.
2. Buat application dari repository ini.
3. Gunakan build pack Dockerfile. Root `Dockerfile` sekarang menjadi image migrasi Go/MySQL; `Dockerfile.migration` tetap tersedia sebagai path eksplisit yang setara. Set port internal ke `8080`.
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
JOURNAL_API_KEY=<dedicated-read-only-journal-key>
GOWA_WEBHOOK_URL=<optional-https-gowa-endpoint>
GOWA_USERNAME=<optional-gowa-basic-auth-user>
GOWA_PASSWORD=<optional-gowa-basic-auth-password>
ALLOW_PRIVATE_WEBHOOK_TARGETS=false
BACKUP_JOB_TIMEOUT=30m
BACKUP_ARTIFACT_TTL=24h
BACKUP_MAX_SIZE_MB=2048
BACKUP_N8N_API_KEY=<dedicated-32-character-backup-key>
BACKUP_RESTORE_ENABLED=false
BACKUP_RETENTION_DAYS=30
BACKUP_DUMP_BINARY=mysqldump
BACKUP_RESTORE_BINARY=mysql
```

Direktori backup harus memakai volume persistent private pada `/var/lib/geopresensi/backups`. Credential Google Drive dan S3 hanya disimpan di n8n. Jangan mengaktifkan `BACKUP_RESTORE_ENABLED` sebelum restore drill staging lulus.

## Verification

Validasi endpoint berikut setelah deploy:

```bash
curl -fsS https://domain-presensi-anda.com/health/live
curl -fsS https://domain-presensi-anda.com/health/ready
curl -fsS https://domain-presensi-anda.com/version
```

Jalankan UAT, security gate, backup/restore drill, dan reconciliation sesuai runbook. Jangan mematikan volume MySQL sebelum backup dan bukti verifikasi disimpan.

## Legacy rollback

`Dockerfile.legacy`, `api/`, dan dump PHP lama hanya dipertahankan sementara sebagai fallback/komparasi. Jangan memilih image legacy untuk cutover migrasi tanpa persetujuan rollback.
