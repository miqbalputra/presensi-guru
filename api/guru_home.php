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

    $holidayStmt = $pdo->prepare("SELECT * FROM holidays WHERE tanggal = ?");
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

    $attendanceStmt = $pdo->prepare("SELECT * FROM attendance_logs WHERE user_id = ? AND tanggal = ? LIMIT 1");
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
        SELECT jp.id, jp.user_id, jp.nama_guru, jp.hari, jp.jam_piket, jp.jam_pulang_piket,
               jp.keterangan, jp.created_at, jp.updated_at, u.username
        FROM jadwal_piket jp
        LEFT JOIN users u ON jp.user_id = u.id
        WHERE jp.hari = ?
        ORDER BY jp.jam_piket ASC
    ");
    $piketStmt->execute([$hari]);
    $jadwal = $piketStmt->fetchAll();

    $myPiket = null;
    foreach ($jadwal as $row) {
        if ((int)$row['user_id'] === (int)$userId) {
            $myPiket = $row;
            break;
        }
    }

    sendResponse(true, 'Data dashboard guru berhasil diambil', [
        'today' => $today,
        'settings' => $settings,
        'holiday' => $holidayData,
        'attendance' => $attendance ?: null,
        'piket' => [
            'hari' => $hari,
            'jadwal' => $jadwal,
            'mine' => $myPiket,
            'isPiketToday' => $myPiket ? true : false
        ]
    ]);
} catch (PDOException $e) {
    handleError($e, 'guru_home.php');
}
?>
