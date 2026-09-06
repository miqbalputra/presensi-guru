# Implementasi redesign UI/UX GeoPresensi

## Ruang lingkup

Perubahan ini memperbarui presentasi, navigasi frontend, aksesibilitas, dan pengelolaan keadaan UI panel admin serta guru. Endpoint, metode HTTP, payload presensi, autentikasi, perhitungan laporan, aturan waktu, GPS, piket, hari libur, dan status presensi tetap menggunakan implementasi yang sudah ada.

Tidak ada perubahan pada backend, tabel, kolom, indeks, relasi, data historis, migrasi, seed, maupun proses rekalkulasi data.

## Perubahan utama

- Beranda admin menempatkan ringkasan dan tabel presensi sebelum konten analitik. Tabel menyediakan pencarian, filter status, pagination 25 baris, kartu pada layar kecil, dan dialog detail.
- Analitik dipisahkan ke `/admin/analitik` dan memuat bagian Kehadiran, Keterlambatan, Kepulangan, Statistik Lengkap, serta Peringkat Guru saat dipilih.
- Sidebar admin dikelompokkan berdasarkan pekerjaan: Utama, Presensi, Guru, Operasional, dan Sistem.
- Beranda guru menampilkan satu tindakan presensi berdasarkan status hari ini. Jadwal/GPS, ringkasan bulanan, dan tiga aktivitas terakhir berada setelah tindakan utama.
- Navigasi guru menggunakan URL `/guru`, `/guru/riwayat`, `/guru/status`, `/guru/statistik`, dan `/guru/akun`, termasuk dukungan refresh, Back, serta tautan langsung.
- Dialog izin, sakit, piket, dan formulir admin memakai dialog terkontrol. Isian dipertahankan saat penyimpanan gagal, tombol dikunci saat proses berjalan, dan dialog ditutup setelah server menyatakan berhasil.
- Keadaan memuat, gagal, kosong, dan berhasil dibedakan. Permintaan lama diabaikan saat filter atau periode sudah berubah.
- Tema terang menjadi bawaan; pilihan tema lama tetap dibaca dan mode gelap tetap tersedia.
- Ajakan pemasangan PWA hanya tampil di halaman Akun guru atau Pengaturan admin agar tidak menutupi tindakan presensi.

## Validasi

- `npm run typecheck`
- `npm run build` dengan `VITE_API_URL=/api`
- `npm run verify:source`
- `npm run verify:security`
- `npm run verify:deployment`
- `npm run verify:pwa`
- `npm run test:reconciliation`
- `git diff --check`

Pengujian visual dilakukan pada build lokal dengan fixture tanpa database untuk admin dan guru. Skenario yang diperiksa meliputi keadaan normal, server gagal memuat, izin gagal simpan, respons lambat, menunggu waktu pulang, pulang piket dengan izin, libur, GPS gagal, navigasi URL, fokus dialog, mode gelap, dan layout guru 390 × 844. Pengujian tidak menulis ke database produksi.

## Rilis dan rollback

Gunakan hanya isi paket frontend `build/geopresensi-ui-redesign.zip`. Jangan menjalankan startup backend sebagai bagian dari rilis UI ini karena startup backend dapat menerapkan migrasi yang tertunda.

Jika rollback diperlukan, ganti aset frontend dengan isi `build/geopresensi-ui-rollback-baseline.zip`. Rollback ini tidak memerlukan perubahan database.

Untuk mengulang preview terisolasi:

```powershell
node scripts/ui-preview.mjs --port=8089 --dist=dist
```

Buka `http://127.0.0.1:8089/__ui`, pilih skenario, lalu masuk menggunakan akun fixture yang tercantum di halaman tersebut.
