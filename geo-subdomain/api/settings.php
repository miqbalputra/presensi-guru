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
        
        // Validasi setting_key yang diizinkan
        $allowedKeys = ['jam_masuk_normal', 'toleransi_terlambat', 'radius_gps', 'sekolah_latitude', 'sekolah_longitude', 'sekolah_nama', 'mode_testing'];
        if (!in_array($data['setting_key'], $allowedKeys)) {
            sendResponse(false, 'Setting key tidak valid');
        }
        
        // Validasi format jam (HH:MM)
        if ($data['setting_key'] === 'jam_masuk_normal') {
            if (!preg_match('/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/', $data['setting_value'])) {
                sendResponse(false, 'Format jam tidak valid. Gunakan format HH:MM (contoh: 07:20)');
            }
        }
        
        // Validasi angka untuk toleransi dan radius
        if (in_array($data['setting_key'], ['toleransi_terlambat', 'radius_gps'])) {
            if (!is_numeric($data['setting_value']) || $data['setting_value'] < 0) {
                sendResponse(false, 'Nilai harus berupa angka positif');
            }
        }
        
        // Validasi mode testing (0 atau 1)
        if ($data['setting_key'] === 'mode_testing') {
            if (!in_array($data['setting_value'], ['0', '1', 0, 1])) {
                sendResponse(false, 'Mode testing harus 0 (nonaktif) atau 1 (aktif)');
            }
        }
        
        // Validasi koordinat latitude
        if ($data['setting_key'] === 'sekolah_latitude') {
            if (!is_numeric($data['setting_value']) || $data['setting_value'] < -90 || $data['setting_value'] > 90) {
                sendResponse(false, 'Latitude harus berupa angka antara -90 sampai 90');
            }
        }
        
        // Validasi koordinat longitude
        if ($data['setting_key'] === 'sekolah_longitude') {
            if (!is_numeric($data['setting_value']) || $data['setting_value'] < -180 || $data['setting_value'] > 180) {
                sendResponse(false, 'Longitude harus berupa angka antara -180 sampai 180');
            }
        }
        
        // Get user info from session
        $updatedBy = $_SESSION['user']['nama'] ?? 'admin';
        
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
        
        if ($stmt->rowCount() === 0) {
            sendResponse(false, 'Setting tidak ditemukan');
        }
        
        sendResponse(true, 'Setting berhasil diupdate');
    } catch (PDOException $e) {
        sendResponse(false, 'Error: ' . $e->getMessage());
    }
}

sendResponse(false, 'Invalid request');
?>
