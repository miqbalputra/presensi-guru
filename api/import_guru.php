<?php
/**
 * Script ini khusus untuk mengimpor data guru dari data_guru.json
 * Silakan buka di browser: http://domain/api/import_guru.php
 */

require_once 'config.php';

echo "<h2>Bulk Import Data Guru dari XLSX</h2>";

// 1. Tambah kolom tempat_lahir jika belum ada
try {
    $pdo->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS tempat_lahir VARCHAR(100) DEFAULT NULL AFTER nama");
    echo "✓ Kolom tempat_lahir dipastikan sudah ada.<br>";
} catch (PDOException $e) {
    // If IF NOT EXISTS is not supported, this might fail, but it's okay if it already exists
}

// 2. Baca file JSON
$json_file = '../data_guru.json';
if (!file_exists($json_file)) {
    die("Error: File data_guru.json tidak ditemukan. Jalankan 'node convert_xlsx.js' terlebih dahulu di terminal.");
}

$data = json_decode(file_get_contents($json_file), true);
if (!$data) {
    die("Error: File JSON kosong atau rusak.");
}

// 3. Konfirmasi Hapus Data Guru Lama (Opsional, tapi biasanya dibutuhkan untuk refresh data)
// Uncomment baris berikut jika ingin menghapus data lama (kecuali admin/kepsek)
// $pdo->exec("DELETE FROM users WHERE role = 'guru'");
// echo "✓ Data guru lama telah dibersihkan.<br>";

try {
    $pdo->beginTransaction();
    $inserted = 0;
    
    foreach ($data as $guru) {
        $hashedPassword = password_hash($guru['password_plain'], PASSWORD_DEFAULT);
        
        $stmt = $pdo->prepare("
            INSERT INTO users (id_guru, username, password, role, nama, tempat_lahir, tanggal_lahir, jenis_kelamin, alamat, no_hp, jabatan, tanggal_bertugas)
            VALUES (?, ?, ?, 'guru', ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                nama = VALUES(nama),
                tempat_lahir = VALUES(tempat_lahir),
                tanggal_lahir = VALUES(tanggal_lahir),
                jenis_kelamin = VALUES(jenis_kelamin),
                alamat = VALUES(alamat),
                no_hp = VALUES(no_hp),
                jabatan = VALUES(jabatan),
                tanggal_bertugas = VALUES(tanggal_bertugas)
        ");
        
        $stmt->execute([
            $guru['id_guru'],
            $guru['username'],
            $hashedPassword,
            $guru['nama'],
            $guru['tempat_lahir'] ?? null,
            $guru['tanggal_lahir'] ?? null,
            $guru['jenis_kelamin'] ?? null,
            $guru['alamat'] ?? null,
            $guru['noHP'] ?? $guru['no_hp'], // Fallback
            $guru['jabatan'] ?? '[]',
            $guru['tanggal_bertugas'] ?? null
        ]);
        $inserted++;
    }
    
    $pdo->commit();
    echo "<h3>✓ Sukses! $inserted data guru berhasil diimpor.</h3>";
    echo "<p>Data telah diurutkan berdasarkan masa kerja. ID dimulai dari GQ001.</p>";
    echo "<p><strong>KEAMANAN:</strong> Silakan hapus file <code>import_guru.php</code> dan <code>data_guru.json</code> sekarang.</p>";

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo "<p style='color:red;'>Gagal Impor: " . $e->getMessage() . "</p>";
}
?>
