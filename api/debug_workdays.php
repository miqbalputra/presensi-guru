<?php
// Debug endpoint tanpa config.php (mirip health.php) untuk verifikasi deploy
// dan perhitungan hari kerja backend.
date_default_timezone_set(getenv('APP_TIMEZONE') ?: 'Asia/Jakarta');
header('Content-Type: application/json');
header('Cache-Control: no-store, no-cache, must-revalidate');

function debugResponse($success, $message, $data = null, $statusCode = 200)
{
    http_response_code($statusCode);
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data
    ]);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    debugResponse(false, 'Invalid request method', null, 405);
}

function debugEnv($key, $default = null)
{
    $value = getenv($key);
    return ($value === false || $value === '') ? $default : $value;
}

try {
    $host = debugEnv('DB_HOST', 'mysql');
    $port = debugEnv('DB_PORT', '3306');
    $name = debugEnv('DB_NAME', 'geogqpresence');
    $user = debugEnv('DB_USER', 'geopresensi');
    $pass = debugEnv('DB_PASS', '');
    $dbTz = debugEnv('DB_TIMEZONE', '+07:00');

    $pdo = new PDO(
        "mysql:host={$host};port={$port};dbname={$name};charset=utf8mb4",
        $user,
        $pass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::ATTR_TIMEOUT => 3
        ]
    );
    $pdo->exec("SET time_zone = " . $pdo->quote($dbTz));

    $startDate = $_GET['start_date'] ?? '2026-06-01';
    $endDate = $_GET['end_date'] ?? '2026-06-22';
    $userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;

    // Ambil data user
    $userStmt = $pdo->prepare("SELECT id, nama, jenis_kelamin FROM users WHERE id = ? LIMIT 1");
    $userStmt->execute([$userId]);
    $user = $userStmt->fetch();

    // Ambil holiday
    $holidayStmt = $pdo->prepare("SELECT tanggal, nama, jenis, is_workday FROM holidays WHERE tanggal BETWEEN ? AND ?");
    $holidayStmt->execute([$startDate, $endDate]);
    $holidays = $holidayStmt->fetchAll();

    // Ambil override user
    $overrideStmt = $pdo->prepare("SELECT tanggal, is_workday, keterangan FROM user_weekend_overrides WHERE user_id = ? AND tanggal BETWEEN ? AND ?");
    $overrideStmt->execute([$userId, $startDate, $endDate]);
    $overrides = $overrideStmt->fetchAll();

    // Ambil settings weekend
    $settingsStmt = $pdo->prepare("
        SELECT setting_key, setting_value FROM settings
        WHERE setting_key IN ('weekend_workday_enabled','saturday_male_workday_enabled','saturday_female_workday_enabled','sunday_male_workday_enabled','sunday_female_workday_enabled')
    ");
    $settingsStmt->execute();
    $settingsRows = $settingsStmt->fetchAll();

    debugResponse(true, 'Debug workdays', [
        'server_time' => date('c'),
        'request' => $_GET,
        'user' => $user,
        'holidays' => $holidays,
        'overrides' => $overrides,
        'settings' => $settingsRows,
    ]);
} catch (Throwable $e) {
    debugResponse(false, $e->getMessage(), [
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ], 500);
}
