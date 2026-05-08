<?php
require_once 'config.php';

requireAuth(['admin', 'kepala_sekolah']);

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(false, 'Invalid request method');
}

function dayLabel($dateStr)
{
    $days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    $time = strtotime($dateStr);
    return $days[(int)date('w', $time)] . ' ' . date('j/n', $time);
}

function parseJabatan($value)
{
    if (empty($value)) {
        return [];
    }
    $decoded = json_decode($value, true);
    return is_array($decoded) ? $decoded : [$value];
}

try {
    $chart = $_GET['chart'] ?? 'overview';
    $today = date('Y-m-d');

    if ($chart === 'overview') {
        $startDate = date('Y-m-d', strtotime('-6 days'));
        $trend = [];

        for ($i = 6; $i >= 0; $i--) {
            $date = date('Y-m-d', strtotime("-{$i} days"));
            $trend[$date] = [
                'tanggal' => dayLabel($date),
                'date' => $date,
                'hadir' => 0,
                'tidakHadir' => 0
            ];
        }

        $trendStmt = $pdo->prepare("
            SELECT tanggal, status, COUNT(*) AS total
            FROM attendance_logs
            WHERE tanggal BETWEEN ? AND ?
            GROUP BY tanggal, status
        ");
        $trendStmt->execute([$startDate, $today]);
        foreach ($trendStmt->fetchAll() as $row) {
            $date = $row['tanggal'];
            if (!isset($trend[$date])) {
                continue;
            }

            if (in_array($row['status'], ['hadir', 'hadir_terlambat', 'hadir_izin_terlambat'], true)) {
                $trend[$date]['hadir'] += (int)$row['total'];
            } else {
                $trend[$date]['tidakHadir'] += (int)$row['total'];
            }
        }

        $totalGuruStmt = $pdo->prepare("SELECT COUNT(*) AS total FROM users WHERE role = 'guru'");
        $totalGuruStmt->execute();
        $totalGuru = (int)($totalGuruStmt->fetch()['total'] ?? 0);

        $todayStmt = $pdo->prepare("
            SELECT status, COUNT(*) AS total
            FROM attendance_logs
            WHERE tanggal = ?
            GROUP BY status
        ");
        $todayStmt->execute([$today]);
        $todayStats = [
            'hadir' => 0,
            'izin' => 0,
            'sakit' => 0,
            'belumAbsen' => $totalGuru,
            'total' => $totalGuru,
            'persentase' => 0
        ];

        foreach ($todayStmt->fetchAll() as $row) {
            $count = (int)$row['total'];
            if (in_array($row['status'], ['hadir', 'hadir_terlambat', 'hadir_izin_terlambat'], true)) {
                $todayStats['hadir'] += $count;
            } elseif ($row['status'] === 'izin') {
                $todayStats['izin'] += $count;
            } elseif ($row['status'] === 'sakit') {
                $todayStats['sakit'] += $count;
            }
        }

        $sudahAbsen = $todayStats['hadir'] + $todayStats['izin'] + $todayStats['sakit'];
        $todayStats['belumAbsen'] = max($totalGuru - $sudahAbsen, 0);
        $todayStats['persentase'] = $totalGuru > 0 ? (int)round(($sudahAbsen / $totalGuru) * 100) : 0;

        sendResponse(true, 'Data grafik admin berhasil diambil', [
            'trend7Days' => array_values($trend),
            'todayStats' => $todayStats
        ]);
    }

    if ($chart === 'leaderboard') {
        $period = $_GET['period'] ?? 'month';
        $startDate = null;

        if ($period === 'week') {
            $startDate = date('Y-m-d', strtotime('-6 days'));
        } elseif ($period === 'month') {
            $startDate = date('Y-m-d', strtotime('-29 days'));
        } elseif ($period !== 'all') {
            sendResponse(false, 'Invalid period');
        }

        $dateFilter = $startDate ? "AND tanggal BETWEEN ? AND ?" : "";
        $params = $startDate ? [$startDate, $today] : [];

        $datesStmt = $pdo->prepare("
            SELECT COUNT(DISTINCT tanggal) AS total
            FROM attendance_logs
            WHERE 1=1 {$dateFilter}
        ");
        $datesStmt->execute($params);
        $totalHariAktif = (int)($datesStmt->fetch()['total'] ?? 0);

        $usersStmt = $pdo->prepare("
            SELECT id, nama, jabatan
            FROM users
            WHERE role = 'guru'
            ORDER BY nama ASC
        ");
        $usersStmt->execute();
        $guruRows = $usersStmt->fetchAll();

        $statsStmt = $pdo->prepare("
            SELECT user_id, status, COUNT(*) AS total
            FROM attendance_logs
            WHERE 1=1 {$dateFilter}
            GROUP BY user_id, status
        ");
        $statsStmt->execute($params);

        $byUser = [];
        foreach ($statsStmt->fetchAll() as $row) {
            $userId = (int)$row['user_id'];
            if (!isset($byUser[$userId])) {
                $byUser[$userId] = [
                    'hadir' => 0,
                    'tepatWaktu' => 0,
                    'terlambat' => 0,
                    'izin' => 0,
                    'sakit' => 0,
                    'records' => 0
                ];
            }

            $count = (int)$row['total'];
            $byUser[$userId]['records'] += $count;

            if ($row['status'] === 'hadir') {
                $byUser[$userId]['hadir'] += $count;
                $byUser[$userId]['tepatWaktu'] += $count;
            } elseif (in_array($row['status'], ['hadir_terlambat', 'hadir_izin_terlambat'], true)) {
                $byUser[$userId]['hadir'] += $count;
                $byUser[$userId]['terlambat'] += $count;
            } elseif ($row['status'] === 'izin') {
                $byUser[$userId]['izin'] += $count;
            } elseif ($row['status'] === 'sakit') {
                $byUser[$userId]['sakit'] += $count;
            }
        }

        $leaderboard = [];
        foreach ($guruRows as $guru) {
            $userStats = $byUser[(int)$guru['id']] ?? [
                'hadir' => 0,
                'tepatWaktu' => 0,
                'terlambat' => 0,
                'izin' => 0,
                'sakit' => 0,
                'records' => 0
            ];

            $tidakPresensi = max($totalHariAktif - $userStats['records'], 0);
            $persentaseKehadiran = $totalHariAktif > 0 ? ($userStats['hadir'] / $totalHariAktif) * 100 : 0;
            $persentaseTepatWaktu = $userStats['hadir'] > 0 ? ($userStats['tepatWaktu'] / $userStats['hadir']) * 100 : 0;
            $skor = ($persentaseKehadiran * 0.7) + ($persentaseTepatWaktu * 0.3);

            $leaderboard[] = [
                'id' => (int)$guru['id'],
                'nama' => $guru['nama'],
                'jabatan' => parseJabatan($guru['jabatan']),
                'totalHadir' => $userStats['hadir'],
                'tepatWaktu' => $userStats['tepatWaktu'],
                'terlambat' => $userStats['terlambat'],
                'izin' => $userStats['izin'],
                'sakit' => $userStats['sakit'],
                'tidakPresensi' => $tidakPresensi,
                'totalHariAktif' => $totalHariAktif,
                'persentaseKehadiran' => round($persentaseKehadiran, 1),
                'persentaseTepatWaktu' => round($persentaseTepatWaktu, 1),
                'skor' => round($skor, 1)
            ];
        }

        usort($leaderboard, function ($a, $b) {
            if ($b['skor'] === $a['skor']) {
                return $b['tepatWaktu'] <=> $a['tepatWaktu'];
            }
            return $b['skor'] <=> $a['skor'];
        });

        sendResponse(true, 'Leaderboard guru berhasil diambil', [
            'period' => $period,
            'totalHariAktif' => $totalHariAktif,
            'items' => $leaderboard
        ]);
    }

    sendResponse(false, 'Invalid chart');
} catch (PDOException $e) {
    handleError($e, 'admin_charts.php');
}
?>
