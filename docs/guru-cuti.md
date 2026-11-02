# Status cuti guru

Di **Data Guru → Edit guru**, admin dapat memilih **Cuti — tidak wajib presensi** dan tanggal mulai (hari ini atau sebelumnya). Cuti tidak berakhir otomatis. Untuk mengakhirinya, admin memilih **Aktif — wajib presensi**. Guru tetap bisa login selama cuti.

Aktivasi kembali berlaku mulai tanggal admin mengaktifkan, menurut zona waktu aplikasi. Riwayat periode menggunakan tanggal akhir eksklusif: cuti mulai 30 Oktober dan diaktifkan 2 November berarti 30 Oktober–1 November berstatus Cuti, sedangkan 2 November kembali wajib presensi sesuai kalender. Periode sebelumnya tetap tersimpan dan tidak boleh bertumpang tindih.

Hari cuti ditampilkan sebagai **Cuti**, bukan Alfa, dan tidak masuk pembagi hari wajib presensi. Data presensi yang pernah tersimpan tidak dihapus; tampilan tanggal dalam periode cuti mengikuti status cuti. Pengaturan tanggal mundur dapat memengaruhi perhitungan laporan periode tersebut. Snapshot rekap yang sudah dikonfirmasi sebelumnya tetap merupakan arsip saat konfirmasi.

Endpoint guru belum presensi dan pengingat konfirmasi bulanan mengecualikan guru yang cuti. Endpoint direktori n8n juga mengecualikan guru dengan cuti aktif, sehingga pengingat email/WhatsApp yang memakai endpoint ini tidak memilih guru tersebut. Workflow konfirmasi bulanan produksi mengambil penerima dari `/api/v1/integrations/n8n/monthly-confirmation-reminders`; tidak perlu mengubah jadwal atau credential n8n. Pesan yang telah terkirim sebelum perubahan status tidak dapat ditarik kembali.

Deploy backend dan frontend bersama. Migrasi `009_teacher_leave.sql` menambahkan `users.is_on_leave` dan `users.leave_periods`; data lama otomatis tetap aktif. Hanya admin yang dapat mengubah status tugas melalui endpoint pembaruan guru; endpoint profil guru tidak menerima perubahan cuti.
