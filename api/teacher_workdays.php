<?php
require_once 'config.php';
require_once 'workday_service.php';

$method = $_SERVER['REQUEST_METHOD'];

// Semua endpoint memerlukan autentikasi admin/kepala_sekolah
requireAuth(['admin', 'kepala_sekolah']);

if ($method !== 'GET') {
    sendResponse(false, 'Invalid request method');
}

try {
    $userId = isset($_GET['user_id']) ? validateInt($_GET['user_id'], 1) : null;
    $startDate = $_GET['start_date'] ?? date('Y-m-01');
    $endDate = $_GET['end_date'] ?? date('Y-m-d');

    if (!validateDate($startDate) || !validateDate($endDate)) {
        http_response_code(400);
        sendResponse(false, 'Format tanggal tidak valid');
    }

    if ($startDate > $endDate) {
        http_response_code(400);
        sendResponse(false, 'Tanggal awal tidak boleh lebih besar dari tanggal akhir');
    }

    $gender = null;
    if ($userId !== null && $userId !== false) {
        $userStmt = $pdo->prepare("SELECT jenis_kelamin FROM users WHERE id = ? LIMIT 1");
        $userStmt->execute([$userId]);
        $user = $userStmt->fetch();
        if ($user) {
            $gender = $user['jenis_kelamin'];
        }
    }

    // Build per-date breakdown
    $holidaysByDate = [];
    $holidayStmt = $pdo->prepare("SELECT tanggal, jenis, is_workday FROM holidays WHERE tanggal BETWEEN ? AND ?");
    $holidayStmt->execute([$startDate, $endDate]);
    foreach ($holidayStmt->fetchAll() as $row) {
        $holidaysByDate[$row['tanggal']] = $row;
    }

    $overridesByDate = [];
    if ($userId !== null && $userId !== false) {
        $overrideStmt = $pdo->prepare("SELECT tanggal, is_workday, keterangan FROM user_weekend_overrides WHERE user_id = ? AND tanggal BETWEEN ? AND ?");
        $overrideStmt->execute([$userId, $startDate, $endDate]);
        foreach ($overrideStmt->fetchAll() as $row) {
            $overridesByDate[$row['tanggal']] = $row;
        }
    }

    $weekendSettings = gpw_get_weekend_workday_settings($pdo);

    // Optional workdays: tanggal di mana kehadiran dihitung bonus, tetapi tidak wajib
    $optionalStmt = $pdo->prepare("SELECT tanggal, nama, keterangan FROM optional_workdays WHERE tanggal BETWEEN ? AND ?");
    $optionalStmt->execute([$startDate, $endDate]);
    $optionalWorkdays = [];
    foreach ($optionalStmt->fetchAll() as $row) {
        $optionalWorkdays[$row['tanggal']] = $row;
    }

    $workdayDates = [];
    $nonWorkdayDates = [];
    $optionalDates = array_keys($optionalWorkdays);
    $breakdown = [];
    foreach (gpw_build_date_range($startDate, $endDate) as $date) {
        $dayOfWeek = (int)date('w', strtotime($date));
        $isWeekend = ($dayOfWeek === 0 || $dayOfWeek === 6);
        $holiday = $holidaysByDate[$date] ?? null;
        $override = $overridesByDate[$date] ?? null;
        $isOptional = isset($optionalWorkdays[$date]);

        // Compute workday status: override wins for weekend dates, otherwise normal rules
        if ($override && $isWeekend) {
            $isWorkday = (int)$override['is_workday'] === 1;
        } else {
            $isWeekendWorkday = $isWeekend && gpw_weekend_workday_allowed($weekendSettings, $dayOfWeek, $gender);
            $isSpecialWorkday = gpw_is_special_workday($holiday);
            $isWorkday = $isSpecialWorkday || (!$holiday && (!$isWeekend || $isWeekendWorkday));
        }

        $entry = [
            'tanggal' => $date,
            'day_of_week' => $dayOfWeek,
            'is_weekend' => $isWeekend,
            'is_workday' => $isWorkday,
            'is_optional' => $isOptional,
            'holiday' => $holiday,
            'override' => $override,
            'optional_workday' => $optionalWorkdays[$date] ?? null,
        ];

        $breakdown[] = $entry;
        if ($isWorkday) {
            $workdayDates[] = $date;
        } else {
            $nonWorkdayDates[] = $date;
        }
    }

    sendResponse(true, 'Data hari kerja berhasil diambil', [
        'user_id' => $userId,
        'gender' => $gender,
        'start_date' => $startDate,
        'end_date' => $endDate,
        'total_workdays' => count($workdayDates),
        'workday_dates' => $workdayDates,
        'non_workday_dates' => $nonWorkdayDates,
        'optional_dates' => $optionalDates,
        'optional_workdays' => $optionalWorkdays,
        'breakdown' => $breakdown,
    ]);
} catch (PDOException $e) {
    handleError($e, 'teacher_workdays.php - GET');
}

sendResponse(false, 'Invalid request method');
