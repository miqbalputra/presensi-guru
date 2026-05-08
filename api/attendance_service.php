<?php

function gp_map_attendance_record($record)
{
    if (!$record) {
        return null;
    }

    $record['userId'] = $record['user_id'];
    $record['jamMasuk'] = $record['jam_masuk'];
    $record['jamPulang'] = $record['jam_pulang'];
    $record['jamHadir'] = $record['jam_hadir'];
    $record['jamIzin'] = $record['jam_izin'];
    $record['jamSakit'] = $record['jam_sakit'];
    return $record;
}

function gp_get_attendance_by_id($pdo, $id)
{
    $stmt = $pdo->prepare("SELECT * FROM attendance_logs WHERE id = ? LIMIT 1");
    $stmt->execute([$id]);
    return gp_map_attendance_record($stmt->fetch());
}

function gp_write_activity($pdo, $user, $activity, $status)
{
    try {
        $stmt = $pdo->prepare("INSERT INTO activity_logs (user, aktivitas, status) VALUES (?, ?, ?)");
        $stmt->execute([$user, $activity, $status]);
    } catch (Exception $e) {
        // Activity log tidak boleh menggagalkan presensi utama.
    }
}

function gp_get_settings($pdo, $keys)
{
    if (empty($keys)) {
        return [];
    }

    $placeholders = implode(',', array_fill(0, count($keys), '?'));
    $stmt = $pdo->prepare("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ({$placeholders})");
    $stmt->execute($keys);

    $settings = [];
    foreach ($stmt->fetchAll() as $row) {
        $settings[$row['setting_key']] = $row['setting_value'];
    }
    return $settings;
}

function gp_get_guru($pdo, $userId)
{
    $stmt = $pdo->prepare("
        SELECT id, nama, jenis_kelamin, tipe_guru
        FROM users
        WHERE id = ? AND role = 'guru'
        LIMIT 1
    ");
    $stmt->execute([$userId]);
    return $stmt->fetch();
}

function gp_day_name($date)
{
    $days = [
        'Monday' => 'Senin',
        'Tuesday' => 'Selasa',
        'Wednesday' => 'Rabu',
        'Thursday' => 'Kamis',
        'Friday' => 'Jumat',
        'Saturday' => 'Sabtu',
        'Sunday' => 'Minggu'
    ];
    return $days[date('l', strtotime($date))] ?? 'Senin';
}

function gp_get_holiday($pdo, $date)
{
    $stmt = $pdo->prepare("
        SELECT tanggal, nama, jenis, is_workday, jam_masuk_khusus
        FROM holidays
        WHERE tanggal = ?
        LIMIT 1
    ");
    $stmt->execute([$date]);
    return $stmt->fetch();
}

function gp_validate_workday($pdo, $date)
{
    $holiday = gp_get_holiday($pdo, $date);
    $dayOfWeek = (int)date('w', strtotime($date));
    $isWeekend = ($dayOfWeek === 0 || $dayOfWeek === 6);
    $isSpecialWorkday = $holiday && ($holiday['is_workday'] == 1 || $holiday['jenis'] === 'sekolah');

    if (!$isSpecialWorkday && ($holiday || $isWeekend)) {
        $message = $holiday
            ? 'Tidak dapat melakukan presensi pada hari libur: ' . $holiday['nama']
            : 'Tidak dapat melakukan presensi pada hari weekend';
        sendResponse(false, $message);
    }

    return [$holiday, $isSpecialWorkday];
}

function gp_get_piket($pdo, $userId, $date)
{
    $stmt = $pdo->prepare("SELECT jam_piket, jam_pulang_piket FROM jadwal_piket WHERE user_id = ? AND hari = ? LIMIT 1");
    $stmt->execute([$userId, gp_day_name($date)]);
    return $stmt->fetch();
}

function gp_get_checkin_target($pdo, $userId, $date, $settings, $holiday, $isSpecialWorkday)
{
    $hariIni = gp_day_name($date);
    $piket = null;
    $jamMasukTarget = $settings['jam_masuk_normal'] ?? '07:20';
    $piketLabel = '';

    if ($isSpecialWorkday && !empty($holiday['jam_masuk_khusus'])) {
        return [substr($holiday['jam_masuk_khusus'], 0, 5), ' (Event: ' . $holiday['nama'] . ')', null];
    }

    $piket = gp_get_piket($pdo, $userId, $date);

    if ($hariIni === 'Senin') {
        if (($settings['apel_senin_enabled'] ?? '0') == '1') {
            if ($piket) {
                $jamMasukTarget = $piket['jam_piket'];
                $piketLabel = ' (Piket Apel)';
            } else {
                $jamMasukTarget = '07:00';
                $piketLabel = ' (Apel Senin)';
            }
        } elseif ($piket) {
            $jamMasukTarget = '07:00';
            $piketLabel = ' (Piket)';
        }
    } elseif ($piket) {
        $jamMasukTarget = $piket['jam_piket'];
        $piketLabel = ' (Piket)';
    }

    return [$jamMasukTarget, $piketLabel, $piket];
}

function gp_create_attendance($pdo, $options)
{
    $user = $options['user'];
    $date = $options['date'] ?? date('Y-m-d');
    $time = $options['time'] ?? date('H:i:s');
    $requestedStatus = $options['status'] ?? 'hadir';
    $keterangan = $options['keterangan'] ?? '';
    $method = $options['method'] ?? 'manual';
    $preserveStatus = !empty($options['preserve_status']);
    $izinTime = $options['jam_izin'] ?? $time;
    $sakitTime = $options['jam_sakit'] ?? $time;

    if (!validateDate($date)) {
        sendResponse(false, 'Format tanggal tidak valid');
    }

    $stmt = $pdo->prepare("SELECT id FROM attendance_logs WHERE user_id = ? AND tanggal = ? LIMIT 1");
    $stmt->execute([$user['id'], $date]);
    if ($stmt->fetch()) {
        sendResponse(false, 'Anda sudah melakukan presensi hari ini.');
    }

    [$holiday, $isSpecialWorkday] = gp_validate_workday($pdo, $date);
    $settings = gp_get_settings($pdo, ['jam_masuk_normal', 'toleransi_terlambat', 'apel_senin_enabled']);

    $status = $requestedStatus;
    $jamMasuk = null;
    $jamHadir = null;
    $jamIzin = null;
    $jamSakit = null;

    if ($preserveStatus) {
        if (in_array($requestedStatus, ['hadir', 'hadir_terlambat', 'hadir_izin_terlambat'], true)) {
            $jamMasuk = $time;
            $jamHadir = $time;
        } elseif ($requestedStatus === 'izin') {
            $jamIzin = $izinTime;
        } elseif ($requestedStatus === 'sakit') {
            $jamSakit = $sakitTime;
        }
    } elseif (in_array($requestedStatus, ['hadir', 'hadir_terlambat', 'hadir_izin_terlambat'], true)) {
        $jamMasuk = $time;
        $jamHadir = $time;

        if (($user['tipe_guru'] ?? '') === 'partime') {
            $status = 'hadir';
            $keterangan = $keterangan ?: 'Guru Partime';
        } else {
            [$jamMasukTarget, $piketLabel] = gp_get_checkin_target($pdo, $user['id'], $date, $settings, $holiday, $isSpecialWorkday);
            $targetMinutes = gp_time_to_minutes($jamMasukTarget);
            $actualMinutes = gp_time_to_minutes($time);
            $lateMinutes = $actualMinutes - $targetMinutes;

            if ($lateMinutes > 0) {
                $status = 'hadir_terlambat';
                $toleransi = (int)($settings['toleransi_terlambat'] ?? 15);
                $severity = $lateMinutes > $toleransi ? ' (Parah)' : '';
                $keterangan = "Terlambat {$lateMinutes} menit{$severity}{$piketLabel}";
            } else {
                $status = 'hadir';
            }
        }
    } elseif ($requestedStatus === 'izin') {
        $jamIzin = $izinTime;
    } elseif ($requestedStatus === 'sakit') {
        $jamSakit = $sakitTime;
    }

    $stmt = $pdo->prepare("
        INSERT INTO attendance_logs
        (user_id, nama, tanggal, status, jam_masuk, jam_pulang, jam_hadir, jam_izin, jam_sakit, keterangan, latitude, longitude, metode)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $user['id'],
        $user['nama'],
        $date,
        $status,
        $jamMasuk,
        null,
        $jamHadir,
        $jamIzin,
        $jamSakit,
        $keterangan,
        $options['latitude'] ?? null,
        $options['longitude'] ?? null,
        $method
    ]);

    $insertId = $pdo->lastInsertId();
    gp_write_activity($pdo, $user['nama'], $method === 'qr_scan' ? 'Presensi QR Scan' : 'Input Presensi', ucfirst(str_replace('_', ' ', $status)));

    return gp_get_attendance_by_id($pdo, $insertId);
}

function gp_checkout_attendance($pdo, $options)
{
    $record = $options['record'];
    $date = $record['tanggal'] ?? date('Y-m-d');
    $time = $options['time'] ?? date('H:i:s');
    $izinPulangAwal = !empty($options['izin_pulang_awal']);
    $reason = trim($options['keterangan'] ?? '');
    $method = $options['method'] ?? 'manual';

    if (!in_array($record['status'], ['hadir', 'hadir_terlambat', 'hadir_izin_terlambat'], true)) {
        sendResponse(false, 'Presensi pulang hanya tersedia untuk status hadir.');
    }

    if (!empty($record['jam_pulang']) && $record['jam_pulang'] !== '-' && $record['jam_pulang'] !== '00:00:00') {
        sendResponse(false, 'Anda sudah melakukan presensi pulang!');
    }

    if ((int)date('H') < 9 && ($_SESSION['role'] ?? '') !== 'admin') {
        sendResponse(false, 'Presensi pulang hanya bisa dilakukan mulai pukul 09:00 WIB');
    }

    [$holiday, $isSpecialWorkday] = gp_validate_workday($pdo, $date);
    $piket = gp_get_piket($pdo, $record['user_id'], $date);

    if (!$isSpecialWorkday && $piket && !empty($piket['jam_pulang_piket'])) {
        $targetMinutes = gp_time_to_minutes($piket['jam_pulang_piket']);
        $actualMinutes = gp_time_to_minutes($time);

        if ($actualMinutes < $targetMinutes && !$izinPulangAwal) {
            sendResponse(false, 'PIKET_RESTRICTION|' . substr($piket['jam_pulang_piket'], 0, 5));
        }
    }

    $keterangan = $record['keterangan'] ?? '';
    if ($izinPulangAwal && strpos($keterangan, 'Izin Pulang Awal Piket') === false) {
        $suffix = '(Izin Pulang Awal Piket' . ($reason ? ' | Alasan: ' . $reason : '') . ')';
        $keterangan = trim(($keterangan ? $keterangan . ' ' : '') . $suffix);
    }

    $stmt = $pdo->prepare("
        UPDATE attendance_logs
        SET jam_pulang = ?, keterangan = ?, updated_at = NOW()
        WHERE id = ?
    ");
    $stmt->execute([$time, $keterangan, $record['id']]);

    gp_write_activity(
        $pdo,
        $record['nama'],
        $method === 'qr_scan' ? 'Presensi Pulang (Smart QR)' : 'Presensi Pulang',
        $izinPulangAwal ? 'Pulang (Izin Awal)' : 'Pulang'
    );

    return gp_get_attendance_by_id($pdo, $record['id']);
}

function gp_time_to_minutes($time)
{
    $parts = explode(':', $time);
    return ((int)$parts[0] * 60) + (int)$parts[1];
}
?>
