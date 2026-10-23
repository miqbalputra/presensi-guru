# Pengingat Konfirmasi Rekap Presensi Bulanan

Workflow `pengingat-konfirmasi-presensi-bulanan.json` mengirim pengingat lewat WhatsApp dan email. Jadwalnya pukul 15.00 WIB pada tanggal terakhir bulan berjalan, lalu pukul 09.00 WIB pada tanggal 1, 2, dan 3. Backend hanya menyediakan guru yang belum mengonfirmasi dan memiliki setidaknya satu kontak valid. Status konfirmasi diperiksa ulang setiap kali workflow berjalan, sehingga pengingat berhenti pada jadwal berikutnya setelah guru konfirmasi.

Guru yang mengajukan koreksi tetap menerima pengingat sampai rekapnya dikonfirmasi. Status `confirmed` dan `confirmed_by_admin` tidak menerima pengingat.

## Menyiapkan workflow

1. Deploy backend yang memiliki endpoint `GET /api/v1/integrations/n8n/monthly-confirmation-reminders`.
2. Import file workflow ini ke n8n.
3. Pada node **Konfigurasi**, isi URL aplikasi, `N8N_API_KEY`, URL endpoint GOWA, dan email pengirim. Gunakan nilai API key yang sama dengan backend.
4. Pada node **Kirim WhatsApp via GOWA**, pilih credential Basic Auth GOWA.
5. Pada node **Kirim email via SMTP**, pilih credential SMTP dan pastikan email pengirim di node **Konfigurasi** sesuai dengan alamat yang diizinkan SMTP.
6. Aktifkan workflow. Pengaturan timezone workflow sudah `Asia/Jakarta`.

Guru yang sudah konfirmasi (`confirmed` atau `confirmed_by_admin`) tidak menerima pesan lagi. Guru yang hanya memiliki email valid menerima email; yang hanya memiliki nomor WhatsApp valid menerima WhatsApp. Di luar tanggal dan jam pengingat, endpoint mengembalikan `shouldSend: false`.
