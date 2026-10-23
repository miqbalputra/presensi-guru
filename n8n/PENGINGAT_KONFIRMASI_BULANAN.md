# Pengingat Konfirmasi Rekap Presensi Bulanan

Workflow `pengingat-konfirmasi-presensi-bulanan.json` mengirim pengingat WhatsApp melalui GOWA setiap hari pukul 15.00 WIB. Backend hanya menyediakan guru yang belum mengonfirmasi pada tanggal terakhir bulan berjalan dan tanggal 1–3. Status konfirmasi diperiksa ulang setiap kali workflow berjalan, sehingga pesan untuk guru berhenti setelah konfirmasi berhasil. Guru tanpa nomor WhatsApp yang valid tidak dikirimi pesan.

Guru yang mengajukan koreksi tetap menerima pengingat sampai rekapnya dikonfirmasi. Status `confirmed` dan `confirmed_by_admin` tidak menerima pengingat.

## Menyiapkan workflow

1. Deploy backend yang memiliki endpoint `GET /api/v1/integrations/n8n/monthly-confirmation-reminders`.
2. Import file workflow ini ke n8n.
3. Pada node **Konfigurasi**, isi URL aplikasi, `N8N_API_KEY`, dan URL endpoint GOWA. Gunakan nilai API key yang sama dengan backend.
4. Pada node **Kirim WhatsApp via GOWA**, pilih credential Basic Auth GOWA.
5. Aktifkan workflow. Pengaturan timezone workflow sudah `Asia/Jakarta`.

Di luar tanggal pengingat, endpoint mengembalikan `shouldSend: false`. Workflow tidak mengirim pesan pada hari-hari tersebut.
