<?php
/**
 * API Endpoint khusus untuk n8n
 * Return guru yang belum presensi hari ini
 */

require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type, X-API-Key');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// API Key validation
$api_key = 'n8n_geopresensi_2024_secret_key';
$request_key = $_SERVER['HTTP_X_API_KEY'] ?? $_GET['api_key'] ?? '';

if ($request_key !== $api_key) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Unauthorized: Invalid API Key'
    ]);
    exit();
}

// GET GURU YANG BELUM PRESENSI HARI INI
try {
    $today = date('Y-m-d');
    $dayOfWeek = date('N'); // 1=Senin, 7=Minggu
    
    // CEK HARI LIBUR
    // 1. Cek weekend (Sabtu=6, Minggu=7)
    if ($dayOfWeek == 6 || $dayOfWeek == 7) {
        echo json_encode([
            'success' => true,
            'message' => 'Hari ini adalah hari libur (Weekend)',
            'data' => [],
            'tanggal' => $today,
            'total' => 0,
            'isHoliday' => true,
            'holidayType' => 'weekend',
            'holidayName' => $dayOfWeek == 6 ? 'Sabtu' : 'Minggu'
        ]);
        exit();
    }
    
    // 2. Cek hari libur nasional dari database
    $holidayStmt = $pdo->prepare("SELECT * FROM holidays WHERE tanggal = ?");
    $holidayStmt->execute([$today]);
    $holiday = $holidayStmt->fetch(PDO::FETCH_ASSOC);
    
    if ($holiday) {
        echo json_encode([
            'success' => true,
            'message' => 'Hari ini adalah hari libur: ' . $holiday['nama'],
            'data' => [],
            'tanggal' => $today,
            'total' => 0,
            'isHoliday' => true,
            'holidayType' => $holiday['jenis'],
            'holidayName' => $holiday['nama']
        ]);
        exit();
    }
    
    // HARI KERJA - Query guru yang belum presensi hari ini
    $stmt = $pdo->prepare("
        SELECT u.id, u.nama, u.no_hp, u.role, u.jabatan, 
               u.id_guru, u.jenis_kelamin, u.tanggal_bertugas, u.alamat
        FROM users u
        LEFT JOIN attendance_logs a ON u.id = a.user_id AND a.tanggal = ?
        WHERE u.role = 'guru' 
        AND a.id IS NULL
        AND u.no_hp IS NOT NULL 
        AND u.no_hp != ''
        ORDER BY u.nama ASC
    ");
    
    $stmt->execute([$today]);
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Format response
    foreach ($users as &$user) {
        // Parse jabatan dari JSON
        if (!empty($user['jabatan'])) {
            $jabatan = json_decode($user['jabatan'], true);
            $user['jabatan'] = is_array($jabatan) ? $jabatan : [$user['jabatan']];
        } else {
            $user['jabatan'] = [];
        }
        
        // Convert snake_case to camelCase
        $user['idGuru'] = $user['id_guru'];
        $user['noHP'] = $user['no_hp'];
        $user['jenisKelamin'] = $user['jenis_kelamin'];
        $user['tanggalBertugas'] = $user['tanggal_bertugas'];
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Data guru yang belum presensi berhasil diambil',
        'data' => $users,
        'tanggal' => $today,
        'total' => count($users),
        'isHoliday' => false,
        'isWorkday' => true
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
