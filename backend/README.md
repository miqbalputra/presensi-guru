# GeoPresensi Go API

Backend migrasi menggunakan Go 1.25, Fiber, GORM, dan MySQL. Untuk local development sementara tersedia mode SQLite pure-Go; staging/production tetap MySQL.

## Lokal

### MySQL

1. Jalankan MySQL 8.x dengan database `geopresensi`.
2. Isi environment dari `.env.example` dengan `DB_*` dan `JWT_SECRET`.
3. Jalankan:

```powershell
go mod download
go test ./...
go vet ./...
go run ./cmd/server
```

API akan tersedia di `http://localhost:8080`.

### SQLite sementara di Windows/local

Dari root repository, setelah frontend dibuild:

```powershell
npm.cmd run build:local
Set-Location backend
go build -trimpath -o build/geopresensi-local.exe ./cmd/server
Set-Location ..
.\scripts\start-local-sqlite.cmd
```

Buka `http://localhost:8080`. Database dibuat di `data/geopresensi-local.db` dan akun seed development adalah `admin` / `admin123`. Jangan memakai file SQLite ini untuk staging atau production.

## Endpoint fondasi

- `GET /health/live`
- `GET /health/ready`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

Endpoint kompatibilitas fitur berada di `/api/*.php` selama masa migrasi frontend.

## Notifikasi pengajuan revisi ke Telegram

Notifikasi Telegram bersifat opsional. Untuk mengaktifkannya, buat bot melalui `@BotFather`. Setiap akun penerima perlu membuka chat bot dan mengirim `/start`, lalu ambil masing-masing `message.chat.id` dari update bot. Atur `TELEGRAM_BOT_TOKEN` dan `TELEGRAM_CHAT_ID` pada environment backend; keduanya harus diisi bersama. Beberapa chat ID ditulis dipisahkan koma, misalnya `TELEGRAM_CHAT_ID=123456789,987654321`. Pesan memuat guru, tanggal, alasan, jam yang diajukan, dan tautan ke halaman admin.

Untuk mengaktifkan tombol **Setujui**/**Tolak**, isi juga `TELEGRAM_WEBHOOK_SECRET` dan `TELEGRAM_ADMIN_USER_MAP`. Buat secret dengan `openssl rand -hex 32`. Peta admin memakai format `telegram_user_id:users.id`, dipisahkan koma; contoh `TELEGRAM_ADMIN_USER_MAP=123456789:1,987654321:2`. Setiap ID Telegram harus dipetakan ke ID akun aplikasi yang aktif dengan role `admin`. Akun Telegram penerima perlu mengirim `/start` ke bot. ID chat pribadi biasanya sama dengan ID pengguna Telegram.

Setelah backend dapat diakses melalui HTTPS, daftarkan webhook bot satu kali. Gunakan bot khusus GeoPresensi agar URL webhook bot lain tidak tertimpa:

```sh
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -d "url=${APP_URL}/api/telegram/webhook" \
  -d "secret_token=${TELEGRAM_WEBHOOK_SECRET}" \
  -d 'allowed_updates=["callback_query","message"]'
```

### Mengirim notifikasi melalui n8n

Workflow siap impor tersedia di `n8n/telegram-revisi-presensi.json`. Setelah import, buat credential Telegram API untuk bot GeoPresensi, aktifkan workflow, dan salin **Production URL** dari node Webhook. Buat secret baru dengan `openssl rand -hex 32`, lalu masukkan nilai yang sama pada konstanta `sharedSecret` di node **Validasi & Pecah Penerima** dan environment backend `TELEGRAM_N8N_WEBHOOK_SECRET`. Atur `TELEGRAM_N8N_WEBHOOK_URL` ke Production URL tersebut, lalu redeploy backend.

Workflow menerima payload pengajuan dari backend dan mengirimkannya ke semua `TELEGRAM_CHAT_ID`, termasuk tombol Setujui/Tolak yang callback-nya tetap diproses backend GeoPresensi. Karena itu, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `TELEGRAM_WEBHOOK_SECRET`, dan `TELEGRAM_ADMIN_USER_MAP` tetap diperlukan. Jangan menambahkan Telegram Trigger di workflow ini karena bot sudah memakai webhook Telegram langsung ke backend untuk menangani tombol.

Tombol **Setujui** langsung menerapkan revisi dan mencatat akun admin yang menekan tombol. Tombol **Tolak** meminta admin memilih alasan singkat atau menulis alasan sendiri; catatan penolakan disimpan dan diteruskan ke guru melalui status pengajuannya. Bot hanya memproses callback dari Telegram ID yang dipetakan ke akun admin aktif. Simpan semua secret di server dan jangan masukkan ke frontend. Pengajuan tetap tersimpan jika Telegram sedang tidak tersedia.

## Keamanan lokal

- Jangan menggunakan `JWT_SECRET` development di staging/production.
- Refresh token hanya disimpan dalam cookie `HttpOnly` dan hash-nya di database aktif.
- Google OAuth dan Turnstile harus menggunakan credential khusus environment.
- Jangan mengimpor database production secara langsung ke development.
