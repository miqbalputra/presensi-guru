<?php
require_once __DIR__ . '/workday_service.php';

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
        WHERE id = ? AND role = 'guru' AND archived_at IS NULL
        LIMIT 1
    ");
    $stmt->execute([$userId]);
    return $stmt->fetch();
}

function gp_calculate_distance($lat1, $lon1, $lat2, $lon2)
{
    $earthRadius = 6371000;
    $latDiff = deg2rad($lat2 - $lat1);
    $lonDiff = deg2rad($lon2 - $lon1);

    $a = sin($latDiff / 2) * sin($latDiff / 2) +
        cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
        sin($lonDiff / 2) * sin($lonDiff / 2);
    $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

    return round($earthRadius * $c);
}

function gp_get_setting_coordinate($settings, $latKey, $lonKey)
{
    if (!isset($settings[$latKey], $settings[$lonKey])) {
        return null;
    }

    if (!validateCoordinates($settings[$latKey], $settings[$lonKey])) {
        return null;
    }

    return [
        'lat' => (float)$settings[$latKey],
        'lon' => (float)$settings[$lonKey]
    ];
}

function gp_add_location_target(&$targets, $label, $coord)
{
    if (!$coord) {
        return;
    }

    $key = $coord['lat'] . ',' . $coord['lon'];
    if (isset($targets[$key])) {
        return;
    }

    $targets[$key] = [
        'label' => $label,
        'lat' => $coord['lat'],
        'lon' => $coord['lon']
    ];
}

function gp_get_attendance_location_targets($settings, $user, $date, $isCheckout = false)
{
    $targets = [];
    $school = gp_get_setting_coordinate($settings, 'sekolah_latitude', 'sekolah_longitude');
    $apel = gp_get_setting_coordinate($settings, 'lokasi_apel_latitude', 'lokasi_apel_longitude');

    $isMonday = date('w', strtotime($date)) == 1;
    if ($isMonday && ($settings['apel_senin_enabled'] ?? '0') == '1') {
        gp_add_location_target($targets, 'Lokasi Apel Senin', $apel ?: $school);
    }

    gp_add_location_target($targets, 'Lokasi Sekolah', $school);
    gp_add_location_target($targets, 'Area Guru Laki-laki', gp_get_setting_coordinate($settings, 'lokasi_laki_latitude', 'lokasi_laki_longitude'));
    gp_add_location_target($targets, 'Area Guru Perempuan', gp_get_setting_coordinate($settings, 'lokasi_perempuan_latitude', 'lokasi_perempuan_longitude'));

    return array_values($targets);
}

function gp_enforce_attendance_location($settings, $user, $latitude, $longitude, $date, $isCheckout = false)
{
    if (($settings['mode_testing'] ?? '0') == '1') {
        return;
    }

    if (!validateCoordinates($latitude, $longitude)) {
        sendResponse(false, 'Koordinat GPS tidak valid');
    }

    $targets = gp_get_attendance_location_targets($settings, $user, $date, $isCheckout);
    if (empty($targets)) {
        sendResponse(false, 'Lokasi presensi belum dikonfigurasi. Hubungi admin.');
    }

    $radius = (int)($settings['radius_gps'] ?? 100);
    $nearestDistance = null;
    $nearestLabel = '';
    $allowedLabels = [];

    foreach ($targets as $target) {
        $distance = gp_calculate_distance((float)$latitude, (float)$longitude, $target['lat'], $target['lon']);
        $allowedLabels[] = $target['label'];

        if ($distance <= $radius) {
            return;
        }

        if ($nearestDistance === null || $distance < $nearestDistance) {
            $nearestDistance = $distance;
            $nearestLabel = $target['label'];
        }
    }

    $areaLabel = implode(' / ', array_unique($allowedLabels));
    $distanceText = $nearestDistance === null ? '-' : $nearestDistance . 'm';
    sendResponse(false, "Anda berada di luar area {$areaLabel}. Jarak terdekat: {$distanceText} dari {$nearestLabel}, Maksimal: {$radius}m");
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

function gp_validate_workday($pdo, $date, $gender = null)
{
    $status = gpw_get_date_status($pdo, $date, $gender);
    $holiday = $status['holiday'];
    $isWeekend = $status['isWeekend'];
    $isSpecialWorkday = $status['isSpecialWorkday'];

    if (!$status['isWorkday']) {
        $message = $holiday
            ? 'Tidak dapat melakukan presensi pada hari libur: ' . $holiday['nama']
            : 'Tidak dapat melakukan presensi pada hari weekend untuk kelompok Anda';
        sendResponse(false, $message);
    }

    return [$holiday, $isSpecialWorkday];
}

function gp_get_piket($pdo, $userId, $date)
{
    $stmt = $pdo->prepare("SELECT jam_piket, jam_pulang_piket FROM jadwal_piket WHERE user_id = ? AND hari = ? AND is_active = 1 LIMIT 1");
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

    [$holiday, $isSpecialWorkday] = gp_validate_workday($pdo, $date, $user['jenis_kelamin'] ?? null);
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

    $minPulangFormatted = '12:30';
    $minPulangMinutes = gp_get_min_pulang_minutes($pdo, $minPulangFormatted);
    $nowMinutes = gp_time_to_minutes(date('H:i'));
    if ($nowMinutes < $minPulangMinutes && ($_SESSION['role'] ?? '') !== 'admin') {
        sendResponse(false, 'Presensi pulang hanya bisa dilakukan mulai pukul ' . $minPulangFormatted . ' WIB');
    }

    $user = gp_get_guru($pdo, $record['user_id']);
    if (!$user) {
        sendResponse(false, 'Data guru tidak ditemukan');
    }

    [$holiday, $isSpecialWorkday] = gp_validate_workday($pdo, $date, $user['jenis_kelamin'] ?? null);
    if (!empty($options['validate_location'])) {
        $settings = gp_get_settings($pdo, [
            'sekolah_latitude', 'sekolah_longitude', 'radius_gps', 'mode_testing',
            'lokasi_laki_latitude', 'lokasi_laki_longitude',
            'lokasi_perempuan_latitude', 'lokasi_perempuan_longitude',
            'lokasi_apel_latitude', 'lokasi_apel_longitude',
            'apel_senin_enabled'
        ]);
        gp_enforce_attendance_location(
            $settings,
            $user,
            $options['latitude'] ?? null,
            $options['longitude'] ?? null,
            $date,
            true
        );
    }

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
    return ((int)$parts[0] * 60) + (int)($parts[1] ?? 0);
}

/**
 * Ambil batas minimal jam presensi pulang (menit sejak 00:00) dari settings.
 * Default 12:30 = 750 menit. Dipakai oleh tombol pulang & QR scan pulang.
 */
function gp_get_min_pulang_minutes($pdo, &$formatted = null)
{
    $settings = gp_get_settings($pdo, ['jam_min_pulang']);
    $value = $settings['jam_min_pulang'] ?? '12:30';
    $formatted = substr($value, 0, 5);
    return gp_time_to_minutes($formatted);
}
?>
