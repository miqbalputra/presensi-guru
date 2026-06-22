<?php
// Endpoint debug tanpa autentikasi untuk memverifikasi perhitungan hari kerja backend.
// Hanya untuk development/debugging, tidak untuk production public secara permanen.
require_once 'config.php';
require_once 'workday_service.php';

$method = $_SERVER['REQUEST_METHOD'];
if ($method !== 'GET') {
    http_response_code(405);
    sendResponse(false, 'Method not allowed');
}

$startDate = $_GET['start_date'] ?? '2026-06-01';
$endDate = $_GET['end_date'] ?? '2026-06-22';
$userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : null;

if (!validateDate($startDate) || !validateDate($endDate)) {
    http_response_code(400);
    sendResponse(false, 'Format tanggal tidak valid');
}

$gender = null;
if ($userId) {
    $userStmt = $pdo->prepare("SELECT id, nama, jenis_kelamin FROM users WHERE id = ? LIMIT 1");
    $userStmt->execute([$userId]);
    $user = $userStmt->fetch();
    if ($user) {
        $gender = $user['jenis_kelamin'];
    }
}

$workdayDates = gpw_get_workday_dates($pdo, $startDate, $endDate, $gender, $userId);

$holidaysByDate = [];
$holidayStmt = $pdo->prepare("SELECT tanggal, nama, jenis, is_workday FROM holidays WHERE tanggal BETWEEN ? AND ?");
$holidayStmt->execute([$startDate, $endDate]);
foreach ($holidayStmt->fetchAll() as $row) {
    $holidaysByDate[$row['tanggal']] = $row;
}

$overridesByDate = [];
if ($userId) {
    $overrideStmt = $pdo->prepare("SELECT tanggal, is_workday, keterangan FROM user_weekend_overrides WHERE user_id = ? AND tanggal BETWEEN ? AND ?");
    $overrideStmt->execute([$userId, $startDate, $endDate]);
    foreach ($overrideStmt->fetchAll() as $row) {
        $overridesByDate[$row['tanggal']] = $row;
    }
}

$weekendSettings = gpw_get_weekend_workday_settings($pdo);

$breakdown = [];
foreach (gpw_build_date_range($startDate, $endDate) as $date) {
    $dayOfWeek = (int)date('w', strtotime($date));
    $isWeekend = ($dayOfWeek === 0 || $dayOfWeek === 6);
    $holiday = $holidaysByDate[$date] ?? null;
    $override = $overridesByDate[$date] ?? null;

    if ($override && $isWeekend) {
        $isWorkday = (int)$override['is_workday'] === 1;
    } else {
        $isWeekendWorkday = $isWeekend && gpw_weekend_workday_allowed($weekendSettings, $dayOfWeek, $gender);
        $isSpecialWorkday = gpw_is_special_workday($holiday);
        $isWorkday = $isSpecialWorkday || (!$holiday && (!$isWeekend || $isWeekendWorkday));
    }

    $breakdown[] = [
        'tanggal' => $date,
        'hari' => ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][$dayOfWeek],
        'day_of_week' => $dayOfWeek,
        'is_weekend' => $isWeekend,
        'holiday' => $holiday,
        'override' => $override,
        'is_workday' => $isWorkday,
    ];
}

sendResponse(true, 'Debug hari kerja', [
    'user' => $user ?? null,
    'gender' => $gender,
    'start_date' => $startDate,
    'end_date' => $endDate,
    'total_workdays' => count($workdayDates),
    'workday_dates' => $workdayDates,
    'weekend_settings' => $weekendSettings,
    'breakdown' => $breakdown,
]);
