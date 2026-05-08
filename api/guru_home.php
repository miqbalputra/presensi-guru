<?php
require_once 'config.php';

requireAuth(['guru']);

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(false, 'Invalid request method');
}

try {
    $userId = $_SESSION['user_id'];
    $today = date('Y-m-d');

    $settingsStmt = $pdo->prepare("SELECT setting_key, setting_value FROM settings");
    $settingsStmt->execute();
    $settingsRows = $settingsStmt->fetchAll();
    $settings = [];
    foreach ($settingsRows as $row) {
        $settings[$row['setting_key']] = $row['setting_value'];
    }

    $holidayStmt = $pdo->prepare("
        SELECT tanggal, nama, jenis, is_workday, jam_masuk_khusus
        FROM holidays
        WHERE tanggal = ?
        LIMIT 1
    ");
    $holidayStmt->execute([$today]);
    $holiday = $holidayStmt->fetch();

    $dayOfWeek = date('w');
    $isWeekend = ($dayOfWeek == 0 || $dayOfWeek == 6);
    $isWorkday = $holiday ? ($holiday['is_workday'] == 1 || $holiday['jenis'] === 'sekolah') : (!$isWeekend);
    $holidayData = [
        'tanggal' => $today,
        'isHoliday' => $holiday ? true : false,
        'isWeekend' => $isWeekend,
        'isWorkday' => $isWorkday,
        'jamMasukKhusus' => $holiday ? $holiday['jam_masuk_khusus'] : null,
        'holidayName' => $holiday ? $holiday['nama'] : null,
        'holidayType' => $holiday ? $holiday['jenis'] : null,
        'dayName' => ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][$dayOfWeek]
    ];

    $attendanceStmt = $pdo->prepare("
        SELECT id, user_id, nama, tanggal, status, jam_masuk, jam_pulang, jam_hadir,
               jam_izin, jam_sakit, keterangan, latitude, longitude, metode,
               created_at, updated_at
        FROM attendance_logs
        WHERE user_id = ? AND tanggal = ?
        LIMIT 1
    ");
    $attendanceStmt->execute([$userId, $today]);
    $attendance = $attendanceStmt->fetch();
    if ($attendance) {
        $attendance['userId'] = $attendance['user_id'];
        $attendance['jamMasuk'] = $attendance['jam_masuk'];
        $attendance['jamPulang'] = $attendance['jam_pulang'];
        $attendance['jamHadir'] = $attendance['jam_hadir'];
        $attendance['jamIzin'] = $attendance['jam_izin'];
        $attendance['jamSakit'] = $attendance['jam_sakit'];
    }

    $hariInggris = date('l');
    $hariIndonesia = [
        'Monday' => 'Senin',
        'Tuesday' => 'Selasa',
        'Wednesday' => 'Rabu',
        'Thursday' => 'Kamis',
        'Friday' => 'Jumat',
        'Saturday' => 'Sabtu',
        'Sunday' => 'Minggu'
    ];
    $hari = $hariIndonesia[$hariInggris];

    $piketStmt = $pdo->prepare("
        SELECT id, user_id, nama_guru, hari, jam_piket, jam_pulang_piket, keterangan
        FROM jadwal_piket
        WHERE user_id = ? AND hari = ?
        LIMIT 1
    ");
    $piketStmt->execute([$userId, $hari]);
    $myPiket = $piketStmt->fetch();

    sendResponse(true, 'Data dashboard guru berhasil diambil', [
        'today' => $today,
        'settings' => $settings,
        'holiday' => $holidayData,
        'attendance' => $attendance ?: null,
        'piket' => [
            'hari' => $hari,
            'mine' => $myPiket,
            'isPiketToday' => $myPiket ? true : false
        ]
    ]);
} catch (PDOException $e) {
    handleError($e, 'guru_home.php');
}
?>
