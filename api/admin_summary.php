<?php
require_once 'config.php';

requireAuth(['admin', 'kepala_sekolah']);

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(false, 'Invalid request method');
}

function buildDateRange($start, $end)
{
    $dates = [];
    $current = strtotime($start);
    $last = strtotime($end);
    while ($current <= $last) {
        $dates[] = date('Y-m-d', $current);
        $current = strtotime('+1 day', $current);
    }
    return $dates;
}

function getWorkdayDates($pdo, $start, $end)
{
    $stmt = $pdo->prepare("
        SELECT tanggal, jenis, is_workday
        FROM holidays
        WHERE tanggal BETWEEN ? AND ?
    ");
    $stmt->execute([$start, $end]);

    $holidays = [];
    foreach ($stmt->fetchAll() as $holiday) {
        $holidays[$holiday['tanggal']] = $holiday;
    }

    $workdays = [];
    foreach (buildDateRange($start, $end) as $date) {
        $holiday = $holidays[$date] ?? null;
        $isWeekend = in_array((int)date('w', strtotime($date)), [0, 6], true);
        $isSpecialWorkday = $holiday && ((int)$holiday['is_workday'] === 1 || $holiday['jenis'] === 'sekolah');

        if ($isSpecialWorkday || (!$holiday && !$isWeekend)) {
            $workdays[] = $date;
        }
    }

    return $workdays;
}

try {
    $period = $_GET['period'] ?? 'today';
    $today = date('Y-m-d');
    $startDate = $today;
    $endDate = $today;

    if ($period === 'yesterday') {
        $startDate = date('Y-m-d', strtotime('-1 day'));
        $endDate = $startDate;
    } elseif ($period === '7days') {
        $startDate = date('Y-m-d', strtotime('-6 days'));
    } elseif ($period === '14days') {
        $startDate = date('Y-m-d', strtotime('-13 days'));
    } elseif ($period === '30days') {
        $startDate = date('Y-m-d', strtotime('-29 days'));
    } elseif ($period !== 'today') {
        sendResponse(false, 'Invalid period');
    }

    $totalGuruStmt = $pdo->prepare("SELECT COUNT(*) AS total FROM users WHERE role = 'guru'");
    $totalGuruStmt->execute();
    $totalGuru = (int)($totalGuruStmt->fetch()['total'] ?? 0);

    $statsStmt = $pdo->prepare("
        SELECT status, COUNT(*) AS total
        FROM attendance_logs
        WHERE tanggal BETWEEN ? AND ?
        GROUP BY status
    ");
    $statsStmt->execute([$startDate, $endDate]);
    $statusCounts = [
        'hadir' => 0,
        'izin' => 0,
        'sakit' => 0,
        'alfa' => 0
    ];

    foreach ($statsStmt->fetchAll() as $row) {
        $status = $row['status'];
        $count = (int)$row['total'];
        if (in_array($status, ['hadir', 'hadir_terlambat', 'hadir_izin_terlambat'], true)) {
            $statusCounts['hadir'] += $count;
        } elseif ($status === 'izin') {
            $statusCounts['izin'] += $count;
        } elseif ($status === 'sakit') {
            $statusCounts['sakit'] += $count;
        }
    }

    $totalHariAktif = count(getWorkdayDates($pdo, $startDate, $endDate));
    $totalTercatat = $statusCounts['hadir'] + $statusCounts['izin'] + $statusCounts['sakit'];
    $statusCounts['alfa'] = max(($totalGuru * $totalHariAktif) - $totalTercatat, 0);

    $logsStmt = $pdo->prepare("
        SELECT id, user_id, nama, tanggal, status, jam_masuk, jam_pulang, jam_hadir,
               jam_izin, jam_sakit, keterangan
        FROM attendance_logs
        WHERE tanggal BETWEEN ? AND ?
        ORDER BY tanggal DESC, id DESC
    ");
    $logsStmt->execute([$startDate, $endDate]);
    $logs = $logsStmt->fetchAll();

    foreach ($logs as &$log) {
        $log['userId'] = $log['user_id'];
        $log['jamMasuk'] = $log['jam_masuk'];
        $log['jamPulang'] = $log['jam_pulang'];
        $log['jamHadir'] = $log['jam_hadir'];
        $log['jamIzin'] = $log['jam_izin'];
        $log['jamSakit'] = $log['jam_sakit'];
    }
    unset($log);

    if (in_array($today, getWorkdayDates($pdo, $today, $today), true)) {
        $missingStmt = $pdo->prepare("
            SELECT u.id, u.nama, u.jabatan
            FROM users u
            LEFT JOIN attendance_logs a ON a.user_id = u.id AND a.tanggal = ?
            WHERE u.role = 'guru'
              AND a.id IS NULL
            ORDER BY u.nama ASC
        ");
        $missingStmt->execute([$today]);
        $missingGuru = $missingStmt->fetchAll();
    } else {
        $missingGuru = [];
    }

    foreach ($missingGuru as &$guru) {
        if (!empty($guru['jabatan'])) {
            $jabatan = json_decode($guru['jabatan'], true);
            $guru['jabatan'] = is_array($jabatan) ? $jabatan : [$guru['jabatan']];
        } else {
            $guru['jabatan'] = [];
        }
    }
    unset($guru);

    sendResponse(true, 'Ringkasan dashboard berhasil diambil', [
        'period' => $period,
        'startDate' => $startDate,
        'endDate' => $endDate,
        'totalGuru' => $totalGuru,
        'totalHariAktif' => $totalHariAktif,
        'stats' => $statusCounts,
        'belumPresensiHariIni' => $missingGuru,
        'logs' => $logs
    ]);
} catch (PDOException $e) {
    handleError($e, 'admin_summary.php');
}
?>
