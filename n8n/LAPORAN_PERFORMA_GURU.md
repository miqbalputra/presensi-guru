# Laporan Performa Guru Setelah Konfirmasi

Workflow `laporan-performa-guru-setelah-konfirmasi.json` mengirim laporan personal melalui email setelah guru menyetujui rekap presensi bulanan di aplikasi. Pengiriman ini hanya terjadi saat guru melakukan konfirmasi sendiri; konfirmasi oleh admin tidak memicu email.

## Isi laporan

Email memuat ringkasan hari kerja, kehadiran, ketepatan waktu, keterlambatan, izin, sakit, tidak ada presensi, presensi pulang yang belum tercatat, dan catatan presensi pada hari piket. Rincian harian memakai snapshot rekap yang disetujui guru. Saran disusun dari indikator yang memiliki catatan; apresiasi dan ucapan terima kasih tetap disertakan.

Angka pada hari piket menunjukkan catatan presensi pada jadwal piket. Angka tersebut tidak menyimpulkan secara otomatis apakah tugas piket benar-benar terlaksana.

## Konfigurasi

1. Deploy backend terbaru dan import workflow ke n8n.
2. Aktifkan workflow, lalu salin Production URL dari node **Webhook Konfirmasi Guru**.
3. Tambahkan pada environment backend:

   ```env
   N8N_MONTHLY_PERFORMANCE_WEBHOOK_URL=https://n8n.example.com/webhook/geopresensi-laporan-performa-guru-v1
   N8N_MONTHLY_PERFORMANCE_WEBHOOK_SECRET=<secret-acak-minimal-32-karakter>
   ```

4. Isi `sharedSecret` pada node **Validasi Event & Konfigurasi** dengan nilai secret yang sama. Isi juga `appUrl`, `n8nApiKey` dengan nilai `N8N_API_KEY` backend, dan `emailFrom`.
5. Atur credential SMTP di node **Kirim email laporan**, lalu pastikan profil setiap guru memiliki email yang valid.

Endpoint laporan n8n mengambil hanya guru dan periode dalam event, lalu backend memastikan status konfirmasinya `confirmed`. Alamat email diambil dari profil guru oleh backend; workflow tidak menerima alamat tujuan dari pemanggil webhook.

Jika URL webhook belum dikonfigurasi di backend, konfirmasi aplikasi tetap berjalan tetapi email laporan belum dipicu.
