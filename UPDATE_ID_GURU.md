# Update: ID Guru (Nomor Induk Guru)

## Perubahan

### 1. Struktur Data (dummyData.js)
Menambahkan field `idGuru` untuk setiap guru:
- Format: `G[TAHUN][NOMOR]`
- Contoh: `G2020001`, `G2019001`, `G2021001`
- Fungsi: Nomor Induk Guru untuk keperluan administrasi yayasan

```javascript
{ 
  id: 3, 
  idGuru: 'G2020001',  // ← BARU
  username: 'guru1', 
  password: 'guru123',
  // ... field lainnya
}
```

### 2. Tabel Data Guru (DataGuru.jsx)

**Kolom Baru:**
| Kolom Lama | Kolom Baru | Keterangan |
|------------|------------|------------|
| ID | No | Nomor urut tampilan (1, 2, 3, ...) |
| - | ID Guru | Nomor Induk Guru (G2020001, dll) |
| - | Username | Username untuk login |
| - | Password | Password (ditampilkan sebagai •••) |

**Urutan Kolom:**
1. No (nomor urut)
2. ID Guru (Nomor Induk)
3. Nama
4. Jenis Kelamin
5. Alamat
6. No HP
7. Jabatan
8. Tanggal Bertugas
9. Lama Bertugas
10. Username
11. Password
12. Aksi

### 3. Form Guru (GuruModal.jsx)
Menambahkan input field:
- **ID Guru** (required)
- Placeholder: "Contoh: G2020001"
- Keterangan: "(Nomor Induk Guru)"

### 4. Export Excel
Data yang diekspor sekarang mencakup:
- No (nomor urut)
- ID Guru
- Nama
- Jenis Kelamin
- Alamat
- No HP
- Jabatan
- Tanggal Bertugas
- Lama Bertugas
- Username
- Password (plaintext untuk backup admin)

## Perbedaan Field

| Field | Fungsi | Contoh |
|-------|--------|--------|
| `id` | ID internal sistem (tidak ditampilkan) | 3, 4, 5 |
| `idGuru` | Nomor Induk Guru (ditampilkan) | G2020001 |
| `username` | Username untuk login | guru1, guru2 |
| `password` | Password untuk login | guru123 |

## Data Guru Existing

| No | ID Guru | Nama | Username | Password |
|----|---------|------|----------|----------|
| 1 | G2020001 | Budi Santoso | guru1 | guru123 |
| 2 | G2019001 | Siti Nurhaliza | guru2 | guru123 |
| 3 | G2021001 | Ahmad Fauzi | guru3 | guru123 |
| 4 | G2018001 | Dewi Lestari | guru4 | guru123 |
| 5 | G2022001 | Rudi Hartono | guru5 | guru123 |

## Catatan
- ID Guru wajib diisi saat menambah guru baru
- ID Guru bersifat unik dan tidak boleh sama
- Password ditampilkan sebagai bullet (•••) di tabel untuk keamanan
- Password asli tetap tersimpan dan bisa diekspor untuk backup
