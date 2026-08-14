# Workflow Backup GeoPresensi

Import `backup-geopresensi.json` ke n8n, lalu isi environment variable n8n berikut:

```text
GEO_PRESENSI_URL=https://geo.griyaquran.web.id
BACKUP_N8N_API_KEY=<nilai BACKUP_N8N_API_KEY pada aplikasi>
BACKUP_STORAGE_PROVIDER=google_drive atau s3
GOOGLE_DRIVE_SHARED_DRIVE_ID=<opsional>
GOOGLE_DRIVE_FOLDER_ID=<folder private backup>
S3_BUCKET=<bucket private>
S3_PREFIX=geopresensi/production
```

Konfigurasikan credential Google Drive atau S3 pada node upload. Jangan menaruh credential provider di source repository atau di environment aplikasi GeoPresensi.

Jadwal default workflow memakai timezone `Asia/Jakarta`:

- SQL harian pukul 02:00;
- full mingguan Minggu pukul 02:30;
- full bulanan tanggal 1 pukul 03:00.

Workflow menggunakan idempotency key sehingga retry pada execution yang sama tidak membuat job backup duplikat. Artifact diunduh sebagai binary, lalu dikirim ke provider storage. Setelah import, ubah node provider yang tidak dipakai menjadi inactive atau biarkan branch IF memilih berdasarkan `BACKUP_STORAGE_PROVIDER`.

Google Drive harus menggunakan folder private dan upload resumable untuk file besar. S3 harus menggunakan bucket private, Block Public Access, versioning, dan server-side encryption. Terapkan lifecycle 30 hari harian, 12 minggu mingguan, dan 12 bulan bulanan di provider atau workflow retention terpisah.
