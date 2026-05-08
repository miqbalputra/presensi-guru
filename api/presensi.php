<?php
require_once 'config.php';

// Semua role yang valid bisa akses endpoint ini (filtering per-role dilakukan di dalam)
requireAuth(['admin', 'kepala_sekolah', 'guru']);

$method = $_SERVER['REQUEST_METHOD'];

function mapAttendanceRecord($record)
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

function getAttendanceById($pdo, $id)
{
    $stmt = $pdo->prepare("SELECT * FROM attendance_logs WHERE id = ? LIMIT 1");
    $stmt->execute([$id]);
    return mapAttendanceRecord($stmt->fetch());
}

function writeAttendanceActivity($pdo, $user, $activity, $status)
{
    try {
        $stmtLog = $pdo->prepare("INSERT INTO activity_logs (user, aktivitas, status) VALUES (?, ?, ?)");
        $stmtLog->execute([$user, $activity, $status]);
    } catch (Exception $e) {
        // Activity log tidak boleh menggagalkan presensi utama.
    }
}

// Kontrol akses per method:
// - GET     : semua role (admin, kepala_sekolah, guru)
// - PUT     : admin dan guru (guru hanya untuk presensi pulang milik sendiri)
// - POST    : hanya admin dan guru
// - DELETE  : hanya admin
$role = $_SESSION['role'] ?? '';
if ($method === 'POST' && !in_array($role, ['admin', 'guru'])) {
    sendResponse(false, 'Forbidden: Anda tidak memiliki akses untuk menambah data presensi');
}
if ($method === 'DELETE' && $role !== 'admin') {
    sendResponse(false, 'Forbidden: Hanya admin yang dapat menghapus data presensi');
}
if ($method === 'PUT' && !in_array($role, ['admin', 'guru'])) {
    sendResponse(false, 'Forbidden: Anda tidak memiliki akses untuk mengubah data presensi');
}

// GET ALL PRESENSI (dengan filter optional)
if ($method === 'GET' && !isset($_GET['id'])) {
    try {
        $query = "SELECT * FROM attendance_logs WHERE 1=1";
        $params = [];

        // SECURITY: Guru hanya bisa lihat data sendiri
        // KECUALI: jika status_rekan=1 → boleh lihat semua presensi HARI INI saja (untuk fitur Status Rekan)
        $currentRole   = $_SESSION['role'] ?? '';
        $currentUserId = $_SESSION['user_id'] ?? null;

        if ($currentRole === 'guru') {
            $isStatusRekan = isset($_GET['status_rekan']) && $_GET['status_rekan'] == '1';
            if ($isStatusRekan) {
                $today    = date('Y-m-d');
                $query   .= " AND tanggal = ?";
                $params[] = $today;
            } else {
                $query   .= " AND user_id = ?";
                $params[] = $currentUserId;
            }
        } elseif (isset($_GET['user_id'])) {
            $user_id = validateInt($_GET['user_id'], 1);
            if ($user_id === false) {
                sendResponse(false, 'Invalid user_id');
            }
            $query   .= " AND user_id = ?";
            $params[] = $user_id;
        }

        // Filter by tanggal
        if (isset($_GET['tanggal'])) {
            if (!validateDate($_GET['tanggal'])) {
                sendResponse(false, 'Invalid date format');
            }
            $query   .= " AND tanggal = ?";
            $params[] = $_GET['tanggal'];
        }

        // Filter by date range
        if (isset($_GET['start_date']) && isset($_GET['end_date'])) {
            if (!validateDate($_GET['start_date']) || !validateDate($_GET['end_date'])) {
                sendResponse(false, 'Invalid date format');
            }
            $query   .= " AND tanggal BETWEEN ? AND ?";
            $params[] = $_GET['start_date'];
            $params[] = $_GET['end_date'];
        }

        $query .= " ORDER BY tanggal DESC, id DESC";

        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $logs = $stmt->fetchAll();

        // Convert snake_case to camelCase for frontend
        foreach ($logs as &$log) {
            $log = mapAttendanceRecord($log);
        }

        sendResponse(true, 'Data presensi berhasil diambil', $logs);
    } catch (PDOException $e) {
        sendResponse(false, 'Error: ' . $e->getMessage());
    }
}

// CREATE PRESENSI
if ($method === 'POST') {
    $data = getRequestData();

    // SECURITY: Jika guru, paksa pakai ID dan Nama sendiri dari session
    if ($_SESSION['role'] === 'guru') {
        $data['userId'] = $_SESSION['user_id'];
        $data['nama']   = $_SESSION['nama'] ?? $_SESSION['user']['nama'] ?? 'Guru';
    }

    try {
        // Cek apakah sudah ada presensi hari ini untuk user ini
        $stmt_check = $pdo->prepare("SELECT id FROM attendance_logs WHERE user_id = ? AND tanggal = ?");
        $stmt_check->execute([$data['userId'], $data['tanggal']]);
        if ($stmt_check->fetch()) {
            sendResponse(false, 'Anda sudah melakukan presensi hari ini.');
        }

        // Validasi tanggal
        if (!validateDate($data['tanggal'])) {
            sendResponse(false, 'Format tanggal tidak valid');
        }

        // CEK APAKAH HARI LIBUR
        $stmt_holiday = $pdo->prepare("SELECT * FROM holidays WHERE tanggal = ?");
        $stmt_holiday->execute([$data['tanggal']]);
        $holiday = $stmt_holiday->fetch();

        // Check if date is weekend (Saturday = 6, Sunday = 0)
        $dayOfWeek = date('w', strtotime($data['tanggal']));
        $isWeekend = ($dayOfWeek == 0 || $dayOfWeek == 6);

        // LOGIKA: Jika holiday tapi is_workday=1 ATAU jenis='sekolah', maka DIANGGAP BUKAN LIBUR
        $isSpecialWorkday = $holiday && ($holiday['is_workday'] == 1 || $holiday['jenis'] === 'sekolah');

        if (!$isSpecialWorkday && ($holiday || $isWeekend)) {
            $message = $holiday
                ? 'Tidak dapat melakukan presensi pada hari libur: ' . $holiday['nama']
                : 'Tidak dapat melakukan presensi pada hari weekend';
            sendResponse(false, $message);
        }

        // Validasi koordinat hanya untuk status HADIR
        if ($data['status'] === 'hadir') {
            if (isset($data['latitude']) && isset($data['longitude'])) {
                if (!validateCoordinates($data['latitude'], $data['longitude'])) {
                    sendResponse(false, 'Koordinat GPS tidak valid');
                }
            }
        }

        // GET SETTINGS for validation
        $stmt_settings = $pdo->prepare("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('jam_masuk_normal', 'apel_senin_enabled')");
        $stmt_settings->execute();
        $settings_res = $stmt_settings->fetchAll();
        $app_settings = [];
        foreach ($settings_res as $s) {
            $app_settings[$s['setting_key']] = $s['setting_value'];
        }

        // Tentukan target jam masuk
        $jamMasukTarget = $app_settings['jam_masuk_normal'] ?? '07:20';
        $piketLabel     = "";
        $hariInggris    = date('l', strtotime($data['tanggal']));
        $hariIndonesia  = [
            'Monday' => 'Senin', 'Tuesday' => 'Selasa', 'Wednesday' => 'Rabu',
            'Thursday' => 'Kamis', 'Friday' => 'Jumat', 'Saturday' => 'Sabtu', 'Sunday' => 'Minggu'
        ];
        $hariIni = $hariIndonesia[$hariInggris];

        if ($isSpecialWorkday && !empty($holiday['jam_masuk_khusus'])) {
            $jamMasukTarget = substr($holiday['jam_masuk_khusus'], 0, 5);
            $piketLabel     = " (Event: " . $holiday['nama'] . ")";
        } else {
            $stmtPiket = $pdo->prepare("SELECT jam_piket FROM jadwal_piket WHERE user_id = ? AND hari = ?");
            $stmtPiket->execute([$data['userId'], $hariIni]);
            $piket = $stmtPiket->fetch();

            if ($hariIni === 'Senin') {
                if (($app_settings['apel_senin_enabled'] ?? '0') == '1') {
                    if ($piket) {
                        $jamMasukTarget = $piket['jam_piket'];
                        $piketLabel     = " (Piket Apel)";
                    } else {
                        $jamMasukTarget = '07:00';
                        $piketLabel     = " (Apel Senin)";
                    }
                } else {
                    if ($piket) {
                        $jamMasukTarget = '07:00';
                        $piketLabel     = " (Piket)";
                    } else {
                        $jamMasukTarget = $app_settings['jam_masuk_normal'] ?? '07:20';
                    }
                }
            } else {
                if ($piket) {
                    $jamMasukTarget = $piket['jam_piket'];
                    $piketLabel     = " (Piket)";
                }
            }
        }

        $jamPresensi = !empty($data['jamMasuk']) ? $data['jamMasuk'] : date('H:i:s');

        $stmt = $pdo->prepare("
            INSERT INTO attendance_logs
            (user_id, nama, tanggal, status, jam_masuk, jam_pulang, jam_hadir, jam_izin, jam_sakit, keterangan, latitude, longitude)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        $keteranganFix = $data['keterangan'] ?? '';
        if ($data['status'] === 'hadir') {
            $waktuTarget   = strtotime($data['tanggal'] . ' ' . $jamMasukTarget);
            $waktuPresensi = strtotime($data['tanggal'] . ' ' . $jamPresensi);
            if ($waktuPresensi > $waktuTarget) {
                $diff          = round(($waktuPresensi - $waktuTarget) / 60);
                $keteranganFix = "Terlambat $diff menit$piketLabel";
            }
        }

        $stmt->execute([
            $data['userId'],
            $data['nama'],
            $data['tanggal'],
            $data['status'],
            $jamPresensi,
            null,
            $jamPresensi,
            null,
            null,
            $keteranganFix,
            $data['latitude']  ?? null,
            $data['longitude'] ?? null
        ]);

        $insertId = $pdo->lastInsertId();
        $attendance = getAttendanceById($pdo, $insertId);
        writeAttendanceActivity(
            $pdo,
            $data['nama'],
            'Input Presensi',
            ucfirst(str_replace('_', ' ', $attendance['status'] ?? $data['status']))
        );

        sendResponse(true, 'Presensi berhasil disimpan', [
            'id' => $insertId,
            'attendance' => $attendance
        ]);
    } catch (PDOException $e) {
        handleError($e, 'presensi.php - create');
    }
}

// UPDATE PRESENSI
if ($method === 'PUT') {
    $data = getRequestData();

    if (empty($data['id'])) {
        sendResponse(false, 'ID presensi harus diisi');
    }

    // Pastikan kolom status bisa menerima semua nilai (expand ENUM jika perlu)
    try {
        $pdo->exec("ALTER TABLE attendance_logs MODIFY COLUMN status VARCHAR(30) NOT NULL DEFAULT 'hadir'");
    } catch (Exception $e) { /* abaikan jika sudah VARCHAR */ }

    // Ambil record yang sudah ada
    try {
        $stmt_ex = $pdo->prepare("SELECT * FROM attendance_logs WHERE id = ?");
        $stmt_ex->execute([intval($data['id'])]);
        $rec = $stmt_ex->fetch();
        if (!$rec) {
            sendResponse(false, 'Data presensi tidak ditemukan (id=' . intval($data['id']) . ')');
        }
    } catch (PDOException $e) {
        sendResponse(false, 'Error DB: ' . $e->getMessage());
    }

    // SECURITY: Guru hanya bisa update data sendiri
    if ($_SESSION['role'] === 'guru') {
        if ($rec['user_id'] != $_SESSION['user_id']) {
            sendResponse(false, 'Forbidden: Anda hanya dapat mengubah data presensi Anda sendiri');
        }
    }

    $isAdmin     = ($_SESSION['role'] === 'admin');
    $isGuru      = ($_SESSION['role'] === 'guru');
    $status      = !empty($data['status']) ? $data['status'] : $rec['status'];
    $isHadir     = in_array($status, ['hadir', 'hadir_terlambat', 'hadir_izin_terlambat']);
    $todayDate   = date('Y-m-d');
    $isPastDate  = ($rec['tanggal'] < $todayDate);
    $isTodayDate = ($rec['tanggal'] === $todayDate);

    try {
        // --- JAM MASUK ---
        if ($isHadir) {
            if (!empty($data['jamMasuk'])) {
                $jm = trim($data['jamMasuk']);
                if (strlen($jm) === 5) $jm .= ':00'; // HH:MM -> HH:MM:SS
                $jamMasukToSave = $jm;
            } else {
                // Pertahankan jam masuk yang sudah ada, atau pakai waktu sekarang jika kosong
                $jamMasukToSave = !empty($rec['jam_masuk']) && $rec['jam_masuk'] !== '-'
                    ? $rec['jam_masuk']
                    : date('H:i:s');
            }
        } else {
            $jamMasukToSave = '-';
        }

        // --- JAM PULANG ---
        // Aturan dasar: pertahankan jam pulang yang sudah ada
        $jamPulangToSave = $rec['jam_pulang'];

        if (!$isHadir) {
            // Non-hadir status → hapus jam pulang
            $jamPulangToSave = null;
        } elseif ($isPastDate) {
            // Tanggal lampau: admin bebas ubah jam pulang
            if (!empty($data['jamPulang'])) {
                $jp = trim($data['jamPulang']);
                if (strlen($jp) === 5) $jp .= ':00';
                $jamPulangToSave = $jp;
            }
            // Jika payload jamPulang kosong → pertahankan yang ada (tidak diubah)
        } elseif ($isTodayDate) {
            // Hari ini: cek jam pulang berdasarkan jadwal
            $dayEng    = date('l');
            $dayMap    = [
                'Monday'    => 'Senin',  'Tuesday' => 'Selasa', 'Wednesday' => 'Rabu',
                'Thursday'  => 'Kamis',  'Friday'  => 'Jumat',  'Saturday'  => 'Sabtu',
                'Sunday'    => 'Minggu'
            ];
            $hariIni = $dayMap[$dayEng] ?? 'Senin';

            $stmtP = $pdo->prepare("SELECT jam_pulang_piket FROM jadwal_piket WHERE user_id = ? AND hari = ?");
            $stmtP->execute([$rec['user_id'], $hariIni]);
            $piketRow = $stmtP->fetch();

            $jamPulangTarget = ($hariIni === 'Jumat') ? '10:15:00' : '13:00:00';
            if ($piketRow && !empty($piketRow['jam_pulang_piket'])) {
                $jamPulangTarget = $piketRow['jam_pulang_piket'];
            }

            $nowTime       = date('H:i:s');
            $belumWaktunya = ($nowTime < $jamPulangTarget);

            if ($belumWaktunya) {
                // Belum waktunya pulang
                // Pertahankan jam pulang yang sudah ada; jika belum ada → tetap null
                $existing = $rec['jam_pulang'];
                if (empty($existing) || $existing === '00:00:00' || $existing === '-') {
                    $jamPulangToSave = null;
                } else {
                    $jamPulangToSave = $existing;
                }
            } else {
                // Sudah waktunya pulang
                if ($isGuru && !empty($data['jamPulang'])) {
                    // Validasi guru
                    if (intval(date('H')) < 9) {
                        sendResponse(false, 'Presensi pulang hanya bisa dilakukan mulai pukul 09:00 WIB');
                    }
                    // Cek special workday
                    $stmt_h = $pdo->prepare("SELECT is_workday FROM holidays WHERE tanggal = ?");
                    $stmt_h->execute([$todayDate]);
                    $hRow = $stmt_h->fetch();
                    $isSpecialWorkday = $hRow && $hRow['is_workday'] == 1;

                    if (!$isSpecialWorkday && $piketRow && !empty($piketRow['jam_pulang_piket'])) {
                        $nowMin    = (intval(date('H')) * 60) + intval(date('i'));
                        list($pH, $pM) = explode(':', $piketRow['jam_pulang_piket']);
                        $piketMin  = (intval($pH) * 60) + intval($pM);
                        if ($nowMin < $piketMin && empty($data['izin_pulang_awal'])) {
                            sendResponse(false, "PIKET_RESTRICTION|" . substr($piketRow['jam_pulang_piket'], 0, 5));
                        }
                        if (!empty($data['izin_pulang_awal'])) {
                            $ket = $data['keterangan'] ?? '';
                            if (strpos($ket, '(Izin Pulang Awal Piket)') === false) {
                                $data['keterangan'] = ($ket ? $ket . ' ' : '') . '(Izin Pulang Awal Piket)';
                            }
                        }
                    }
                    $jp = trim($data['jamPulang']);
                    if (strlen($jp) === 5) $jp .= ':00';
                    $jamPulangToSave = $jp;

                } elseif ($isAdmin && !empty($data['jamPulang'])) {
                    $jp = trim($data['jamPulang']);
                    if (strlen($jp) === 5) $jp .= ':00';
                    $jamPulangToSave = $jp;
                }
                // Payload jamPulang kosong → pertahankan yang ada
            }
        }

        // --- JAM HADIR / IZIN / SAKIT ---
        $jamHadirToSave = $isHadir ? $jamMasukToSave : null;
        $jamIzinToSave  = ($status === 'izin')
            ? (!empty($rec['jam_izin']) ? $rec['jam_izin'] : date('H:i:s'))
            : null;
        $jamSakitToSave = ($status === 'sakit')
            ? (!empty($rec['jam_sakit']) ? $rec['jam_sakit'] : date('H:i:s'))
            : null;

        $keteranganToSave = array_key_exists('keterangan', $data)
            ? ($data['keterangan'] ?? '')
            : ($rec['keterangan'] ?? '');

        // UPDATE
        $stmt = $pdo->prepare("
            UPDATE attendance_logs SET
                status     = ?,
                jam_masuk  = ?,
                jam_pulang = ?,
                jam_hadir  = ?,
                jam_izin   = ?,
                jam_sakit  = ?,
                keterangan = ?,
                latitude   = ?,
                longitude  = ?
            WHERE id = ?
        ");

        $stmt->execute([
            $status,
            $jamMasukToSave,
            $jamPulangToSave,
            $jamHadirToSave,
            $jamIzinToSave,
            $jamSakitToSave,
            $keteranganToSave,
            $data['latitude']  ?? $rec['latitude'],
            $data['longitude'] ?? $rec['longitude'],
            intval($data['id'])
        ]);

        $attendance = getAttendanceById($pdo, intval($data['id']));
        if ($isGuru && !empty($data['jamPulang'])) {
            $logStatus = 'Pulang' . (!empty($data['izin_pulang_awal']) ? ' (Izin Awal)' : '');
            writeAttendanceActivity($pdo, $rec['nama'], 'Presensi Pulang', $logStatus);
        } elseif ($isAdmin) {
            writeAttendanceActivity($pdo, $_SESSION['nama'] ?? 'Admin', 'Update Presensi', ucfirst(str_replace('_', ' ', $status)));
        }

        sendResponse(true, 'Presensi berhasil diupdate', [
            'attendance' => $attendance
        ]);
    } catch (PDOException $e) {
        sendResponse(false, 'Error update: ' . $e->getMessage());
    }
}

// DELETE PRESENSI
if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;

    if (!$id) {
        sendResponse(false, 'ID presensi harus diisi');
    }

    try {
        $stmt = $pdo->prepare("DELETE FROM attendance_logs WHERE id = ?");
        $stmt->execute([$id]);

        sendResponse(true, 'Presensi berhasil dihapus');
    } catch (PDOException $e) {
        sendResponse(false, 'Error: ' . $e->getMessage());
    }
}

sendResponse(false, 'Invalid request');
?>
