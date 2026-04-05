<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

// GET settings - bisa diakses tanpa auth (untuk cek jam masuk)
if ($method === 'GET' && !isset($_GET['id'])) {
    // Public endpoint untuk get settings
} else if (in_array($method, ['POST', 'PUT'])) {
    // Write operations - hanya admin
    requireAuth(['admin']);
} else {
    // Read operations - semua role
    requireAuth(['admin', 'guru']);
}

// GET ALL SETTINGS
if ($method === 'GET' && !isset($_GET['id'])) {
    try {
        $query = "SELECT * FROM settings ORDER BY setting_key ASC";
        $stmt = $pdo->prepare($query);
        $stmt->execute();
        $settings = $stmt->fetchAll();
        
        // Convert to key-value object
        $settingsObj = [];
        foreach ($settings as $setting) {
            $settingsObj[$setting['setting_key']] = $setting['setting_value'];
        }
        
        sendResponse(true, 'Settings berhasil diambil', $settingsObj);
    } catch (PDOException $e) {
        sendResponse(false, 'Error: ' . $e->getMessage());
    }
}

// UPDATE SETTING (Admin only)
if ($method === 'PUT') {
    $data = getRequestData();
    
    try {
        if (empty($data['setting_key']) || !isset($data['setting_value'])) {
            sendResponse(false, 'Setting key dan value harus diisi');
        }
        
        // Validasi setting_key yang diizinkan sesuai fitur LENGKAP 2026
        $allowedKeys = [
            'jam_masuk_normal', 'toleransi_terlambat', 'radius_gps', 'sekolah_latitude', 'sekolah_longitude', 'sekolah_nama', 'mode_testing',
            'lokasi_laki_latitude', 'lokasi_laki_longitude', 'lokasi_perempuan_latitude', 'lokasi_perempuan_longitude',
            'lokasi_apel_latitude', 'lokasi_apel_longitude', 'apel_senin_enabled',
            'qr_secret', 'qr_enabled', 'piket_terlambat_adalah_terlambat', 'jam_piket_default', 'button_enabled'
        ];
        if (!in_array($data['setting_key'], $allowedKeys)) {
            sendResponse(false, 'Setting key tidak valid: ' . $data['setting_key']);
        }
        
        // ... validasi format jam, angka, dll tetap berjalan ...

        // Get user info from session - SESUAIKAN DENGAN auth.php
        $updatedBy = $_SESSION['username'] ?? 'admin';
        
        $stmt = $pdo->prepare("
            UPDATE settings 
            SET setting_value = ?, updated_by = ?, updated_at = NOW()
            WHERE setting_key = ?
        ");
        
        $stmt->execute([
            $data['setting_value'],
            $updatedBy,
            $data['setting_key']
        ]);
        
        // Jika kueri sukses (meskipun row tidak berubah karena data sama), return true
        sendResponse(true, 'Setting berhasil diupdate');
    } catch (PDOException $e) {
        sendResponse(false, 'Error Database: ' . $e->getMessage());
    }
}

sendResponse(false, 'Invalid request');
?>
