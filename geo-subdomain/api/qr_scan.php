<?php
/**
 * QR Scan Attendance API
 * Endpoint untuk presensi dengan scan QR Code + validasi GPS
 */
require_once 'config.php';

// Endpoint ini harus login sebagai guru
requireAuth(['guru']);

$method = $_SERVER['REQUEST_METHOD'];

// POST - Proses scan QR Code
if ($method === 'POST') {
    $data = getRequestData();
    
    try {
        // Validasi input
        if (empty($data['qr_data'])) {
            sendResponse(false, 'Data QR Code tidak valid');
        }
        
        if (!isset($data['latitude']) || !isset($data['longitude'])) {
            sendResponse(false, 'Koordinat GPS diperlukan');
        }
        
        // Parse QR data
        $qrData = json_decode($data['qr_data'], true);
        if (!$qrData || !isset($qrData['secret']) || !isset($qrData['type'])) {
            sendResponse(false, 'Format QR Code tidak valid');
        }
        
        // Validasi QR secret dari settings
        $stmt = $pdo->prepare("SELECT setting_value FROM settings WHERE setting_key = 'qr_secret'");
        $stmt->execute();
        $qrSecretSetting = $stmt->fetch();
        
        if (!$qrSecretSetting || $qrData['secret'] !== $qrSecretSetting['setting_value']) {
            sendResponse(false, 'QR Code tidak valid atau sudah kadaluarsa');
        }
        
        // Validasi tipe QR
        if ($qrData['type'] !== 'attendance') {
            sendResponse(false, 'QR Code bukan untuk presensi');
        }
        
        // Cek apakah fitur QR enabled
        $stmt = $pdo->prepare("SELECT setting_value FROM settings WHERE setting_key = 'qr_enabled'");
        $stmt->execute();
        $qrEnabled = $stmt->fetch();
        
        if (!$qrEnabled || $qrEnabled['setting_value'] !== '1') {
            sendResponse(false, 'Fitur QR Code Scan sedang tidak aktif');
        }
        
        // Get settings untuk validasi GPS
        $stmt = $pdo->prepare("SELECT setting_key, setting_value FROM settings WHERE setting_key IN (
            'sekolah_latitude', 'sekolah_longitude', 'radius_gps', 'mode_testing', 
            'jam_masuk_normal', 'toleransi_terlambat',
            'lokasi_laki_latitude', 'lokasi_laki_longitude',
            'lokasi_perempuan_latitude', 'lokasi_perempuan_longitude',
            'lokasi_apel_latitude', 'lokasi_apel_longitude',
            'apel_senin_enabled'
        )");
        $stmt->execute();
        $settingsArr = $stmt->fetchAll();
        
        $settings = [];
        foreach ($settingsArr as $s) {
            $settings[$s['setting_key']] = $s['setting_value'];
        }
        
        // Validasi GPS (kecuali mode testing)
        $isTestingMode = ($settings['mode_testing'] ?? '0') === '1';
        
        if (!$isTestingMode) {
            $user = $_SESSION['user'];
            $dayOfWeek = date('w'); // 0 (Sunday) to 6 (Saturday)
            $isMonday = ($dayOfWeek == 1);
            
            $targetLat = floatval($settings['sekolah_latitude'] ?? 0);
            $targetLon = floatval($settings['sekolah_longitude'] ?? 0);
            $locationName = "Sekolah";

            // 1. Cek Hari Senin (Apel)
            if ($isMonday && ($settings['apel_senin_enabled'] ?? '0') === '1') {
                $targetLat = floatval($settings['lokasi_apel_latitude'] ?? $targetLat);
                $targetLon = floatval($settings['lokasi_apel_longitude'] ?? $targetLon);
                $locationName = "Lokasi Apel Senin";
            } else {
                // 2. Jika bukan Senin, gunakan lokasi berbasis Gender
                if ($user['jenis_kelamin'] === 'Laki-laki') {
                    $targetLat = floatval($settings['lokasi_laki_latitude'] ?? $targetLat);
                    $targetLon = floatval($settings['lokasi_laki_longitude'] ?? $targetLon);
                    $locationName = "Area Guru Laki-laki";
                } else if ($user['jenis_kelamin'] === 'Perempuan') {
                    $targetLat = floatval($settings['lokasi_perempuan_latitude'] ?? $targetLat);
                    $targetLon = floatval($settings['lokasi_perempuan_longitude'] ?? $targetLon);
                    $locationName = "Area Guru Perempuan";
                }
            }

            $radius = intval($settings['radius_gps'] ?? 100);
            $userLat = floatval($data['latitude']);
            $userLon = floatval($data['longitude']);
            
            // Hitung jarak menggunakan Haversine formula
            $distance = calculateDistance($userLat, $userLon, $targetLat, $targetLon);
            
            if ($distance > $radius) {
                sendResponse(false, "Anda berada di luar area {$locationName}. Jarak: {$distance}m, Maksimal: {$radius}m");
            }
        }
        
        // Get user info from session
        $user = $_SESSION['user'];
        $userId = $user['id'];
        $userName = $user['nama'];
        
        // Tanggal hari ini
        $today = date('Y-m-d');
        $currentTime = date('H:i:s');
        
        // Cek apakah hari libur
        $stmt = $pdo->prepare("SELECT * FROM holidays WHERE tanggal = ?");
        $stmt->execute([$today]);
        $holiday = $stmt->fetch();
        
        // Cek weekend
        $dayOfWeek = date('w');
        $isWeekend = ($dayOfWeek == 0 || $dayOfWeek == 6);
        
        if ($holiday || $isWeekend) {
            $message = $holiday ? 'Tidak dapat melakukan presensi pada hari libur: ' . $holiday['nama'] : 'Tidak dapat melakukan presensi pada hari weekend';
            sendResponse(false, $message);
        }
        
        // Cek apakah sudah presensi hari ini
        $stmt = $pdo->prepare("SELECT id, status, jam_masuk, jam_pulang FROM attendance_logs WHERE user_id = ? AND tanggal = ?");
        $stmt->execute([$userId, $today]);
        $existing = $stmt->fetch();
        
        if ($existing) {
            // Sudah presensi masuk, cek apakah ini untuk pulang
            if (!$existing['jam_pulang'] && isset($data['is_pulang']) && $data['is_pulang']) {
                // Update jam pulang
                $stmt = $pdo->prepare("UPDATE attendance_logs SET jam_pulang = ?, updated_at = NOW() WHERE id = ?");
                $stmt->execute([$currentTime, $existing['id']]);
                
                sendResponse(true, 'Presensi pulang berhasil!', [
                    'jam_pulang' => $currentTime,
                    'message' => 'Hati-hati di jalan!'
                ]);
            } else if ($existing['jam_pulang']) {
                sendResponse(false, 'Anda sudah melakukan presensi pulang hari ini');
            } else {
                sendResponse(false, 'Anda sudah melakukan presensi masuk hari ini');
            }
        }
        
        // Cek keterlambatan
        $jamMasukNormal = $settings['jam_masuk_normal'] ?? '07:20';
        $toleransi = intval($settings['toleransi_terlambat'] ?? 15);
        
        list($jamNormal, $menitNormal) = explode(':', $jamMasukNormal);
        list($jamSekarang, $menitSekarang) = explode(':', $currentTime);
        
        $waktuNormal = intval($jamNormal) * 60 + intval($menitNormal);
        $waktuSekarang = intval($jamSekarang) * 60 + intval($menitSekarang);
        
        $selisih = $waktuSekarang - $waktuNormal;
        
        $status = 'hadir';
        $keterangan = '';
        
        if ($selisih > 0) {
            if ($selisih <= $toleransi) {
                $status = 'hadir_terlambat';
                $keterangan = "Terlambat {$selisih} menit";
            } else {
                $status = 'hadir_terlambat';
                $keterangan = "Terlambat {$selisih} menit (Parah)";
            }
        }
        
        // Simpan presensi
        $stmt = $pdo->prepare("
            INSERT INTO attendance_logs 
            (user_id, nama, tanggal, status, jam_masuk, jam_hadir, keterangan, latitude, longitude, metode)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'qr_scan')
        ");
        
        $stmt->execute([
            $userId,
            $userName,
            $today,
            $status,
            $currentTime,
            $currentTime,
            $keterangan,
            $data['latitude'],
            $data['longitude']
        ]);
        
        $insertId = $pdo->lastInsertId();
        
        // Log activity
        try {
            $stmtLog = $pdo->prepare("INSERT INTO activity_logs (user, aktivitas, status) VALUES (?, ?, ?)");
            $stmtLog->execute([$userName, 'Presensi QR Scan', ucfirst($status)]);
        } catch (Exception $e) {
            // Ignore log errors
        }
        
        // Response
        $response = [
            'id' => $insertId,
            'status' => $status,
            'jam_masuk' => $currentTime,
            'keterangan' => $keterangan,
            'metode' => 'qr_scan'
        ];
        
        $message = $status === 'hadir' 
            ? 'Presensi berhasil! Selamat bekerja!' 
            : "Presensi berhasil! ({$keterangan})";
        
        sendResponse(true, $message, $response);
        
    } catch (PDOException $e) {
        handleError($e, 'qr_scan.php - create');
    }
}

// GET - Cek status hari ini (untuk tampilan di halaman scan)
if ($method === 'GET') {
    $user = $_SESSION['user'];
    $today = date('Y-m-d');
    
    try {
        $stmt = $pdo->prepare("SELECT * FROM attendance_logs WHERE user_id = ? AND tanggal = ?");
        $stmt->execute([$user['id'], $today]);
        $attendance = $stmt->fetch();
        
        sendResponse(true, 'Status presensi', [
            'has_checked_in' => $attendance ? true : false,
            'has_checked_out' => $attendance && $attendance['jam_pulang'] ? true : false,
            'attendance' => $attendance
        ]);
    } catch (PDOException $e) {
        sendResponse(false, 'Error: ' . $e->getMessage());
    }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in meters
 */
function calculateDistance($lat1, $lon1, $lat2, $lon2) {
    $earthRadius = 6371000; // meters
    
    $latDiff = deg2rad($lat2 - $lat1);
    $lonDiff = deg2rad($lon2 - $lon1);
    
    $a = sin($latDiff / 2) * sin($latDiff / 2) +
         cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
         sin($lonDiff / 2) * sin($lonDiff / 2);
    
    $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
    
    $distance = $earthRadius * $c;
    
    return round($distance);
}

sendResponse(false, 'Invalid request method');
?>
