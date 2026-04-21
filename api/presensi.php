<?php
require_once 'config.php';

// Semua role yang valid bisa akses endpoint ini (filtering per-role dilakukan di dalam)
requireAuth(['admin', 'kepala_sekolah', 'guru']);

$method = $_SERVER['REQUEST_METHOD'];

// Kontrol akses per method:
// - GET     : semua role (admin, kepala_sekolah, guru)
// - PUT     : admin dan guru (guru hanya untuk presensi pulang milik sendiri)
// - POST    : hanya admin
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
        $currentRole = $_SESSION['role'] ?? '';
        $currentUserId = $_SESSION['user_id'] ?? null;
        
        if ($currentRole === 'guru') {
            $isStatusRekan = isset($_GET['status_rekan']) && $_GET['status_rekan'] == '1';
            
            if ($isStatusRekan) {
                // Status Rekan mode: guru boleh lihat semua data, TAPI paksa tanggal = hari ini saja
                $today = date('Y-m-d');
                $query .= " AND tanggal = ?";
                $params[] = $today;
                // Jangan filter user_id → tampilkan semua guru
            } else {
                // Mode normal: guru hanya bisa lihat data sendiri
                $query .= " AND user_id = ?";
                $params[] = $currentUserId;
            }
        } elseif (isset($_GET['user_id'])) {
            // Admin/Kepsek: boleh filter user_id dari parameter
            $user_id = validateInt($_GET['user_id'], 1);
            if ($user_id === false) {
                sendResponse(false, 'Invalid user_id');
            }
            $query .= " AND user_id = ?";
            $params[] = $user_id;
        }
        
        // Filter by tanggal
        if (isset($_GET['tanggal'])) {
            if (!validateDate($_GET['tanggal'])) {
                sendResponse(false, 'Invalid date format');
            }
            $query .= " AND tanggal = ?";
            $params[] = $_GET['tanggal'];
        }
        
        // Filter by date range
        if (isset($_GET['start_date']) && isset($_GET['end_date'])) {
            if (!validateDate($_GET['start_date']) || !validateDate($_GET['end_date'])) {
                sendResponse(false, 'Invalid date format');
            }
            $query .= " AND tanggal BETWEEN ? AND ?";
            $params[] = $_GET['start_date'];
            $params[] = $_GET['end_date'];
        }
        
        $query .= " ORDER BY tanggal DESC, id DESC";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $logs = $stmt->fetchAll();
        
        // Convert snake_case to camelCase for frontend
        foreach ($logs as &$log) {
            $log['userId'] = $log['user_id'];
            $log['jamMasuk'] = $log['jam_masuk'];
            $log['jamPulang'] = $log['jam_pulang'];
            $log['jamHadir'] = $log['jam_hadir'];
            $log['jamIzin'] = $log['jam_izin'];
            $log['jamSakit'] = $log['jam_sakit'];
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
        $data['nama'] = $_SESSION['nama'] ?? $_SESSION['user']['nama'] ?? 'Guru';
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
        
        // CEK APAKAH HARI LIBUR - Blokir presensi di hari libur
        // Hapus is_active karena kolom tidak ada di tabel holidays
        $stmt_holiday = $pdo->prepare("SELECT * FROM holidays WHERE tanggal = ?");
        $stmt_holiday->execute([$data['tanggal']]);
        $holiday = $stmt_holiday->fetch();
        
        // Check if date is weekend (Saturday = 6, Sunday = 0)
        $dayOfWeek = date('w', strtotime($data['tanggal']));
        $isWeekend = ($dayOfWeek == 0 || $dayOfWeek == 6);
        
        if ($holiday || $isWeekend) {
            $message = $holiday ? 'Tidak dapat melakukan presensi pada hari libur: ' . $holiday['nama'] : 'Tidak dapat melakukan presensi pada hari weekend';
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

        // Tentukan target jam masuk: 
        $jamMasukTarget = $app_settings['jam_masuk_normal'] ?? '07:20';
        $piketLabel = "";
        $hariInggris = date('l', strtotime($data['tanggal']));
        $hariIndonesia = [
            'Monday' => 'Senin', 'Tuesday' => 'Selasa', 'Wednesday' => 'Rabu',
            'Thursday' => 'Kamis', 'Friday' => 'Jumat', 'Saturday' => 'Sabtu', 'Sunday' => 'Minggu'
        ];
        $hariIni = $hariIndonesia[$hariInggris];

        // Cek Jadwal Piket
        $stmtPiket = $pdo->prepare("SELECT jam_piket FROM jadwal_piket WHERE user_id = ? AND hari = ?");
        $stmtPiket->execute([$data['userId'], $hariIni]);
        $piket = $stmtPiket->fetch();

        if ($hariIni === 'Senin') {
            if (($app_settings['apel_senin_enabled'] ?? '0') == '1') {
                // MODE APEL AKTIF
                if ($piket) {
                    $jamMasukTarget = $piket['jam_piket']; // 06:40
                    $piketLabel = " (Piket Apel)";
                } else {
                    $jamMasukTarget = '07:00'; // Guru non-piket saat apel
                    $piketLabel = " (Apel Senin)";
                }
            } else {
                // MODE APEL MATI (UAS/Lainnya)
                if ($piket) {
                    $jamMasukTarget = '07:00'; // Override 06:40 -> 07:00
                    $piketLabel = " (Piket)";
                } else {
                    $jamMasukTarget = $app_settings['jam_masuk_normal'] ?? '07:20';
                }
            }
        } else {
            // HARI SELAIN SENIN
            if ($piket) {
                $jamMasukTarget = $piket['jam_piket'];
                $piketLabel = " (Piket)";
            }
        }

        // Simpan presensi dengan pengecekan keterlambatan manual di sini
        // (Catatan: Frontend biasanya mengirim jamMasuk, tapi kita validasi ulang di server)
        $jamPresensi = !empty($data['jamMasuk']) ? $data['jamMasuk'] : date('H:i:s');
        
        $stmt = $pdo->prepare("
            INSERT INTO attendance_logs 
            (user_id, nama, tanggal, status, jam_masuk, jam_pulang, jam_hadir, jam_izin, jam_sakit, keterangan, latitude, longitude)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        // Tambahkan info keterlambatan ke keterangan jika perlu
        $keteranganFix = $data['keterangan'] ?? '';
        if ($data['status'] === 'hadir') {
            $waktuTarget = strtotime($data['tanggal'] . ' ' . $jamMasukTarget);
            $waktuPresensi = strtotime($data['tanggal'] . ' ' . $jamPresensi);
            if ($waktuPresensi > $waktuTarget) {
                $diff = round(($waktuPresensi - $waktuTarget) / 60);
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
            $data['latitude'] ?? null,
            $data['longitude'] ?? null
        ]);
        
        sendResponse(true, 'Presensi berhasil disimpan', ['id' => $pdo->lastInsertId()]);
    } catch (PDOException $e) {
        handleError($e, 'presensi.php - create');
    }
}

if ($method === 'PUT') {
    $data = getRequestData();
    
    // SECURITY: Jika guru, pastikan mereka hanya mengupdate data mereka sendiri
    if ($_SESSION['role'] === 'guru') {
        $stmt_verify = $pdo->prepare("SELECT user_id FROM attendance_logs WHERE id = ?");
        $stmt_verify->execute([$data['id']]);
        $record = $stmt_verify->fetch();
        
        if (!$record || $record['user_id'] != $_SESSION['user_id']) {
            sendResponse(false, 'Forbidden: Anda hanya dapat mengubah data presensi Anda sendiri');
        }
    }

    try {

        // VALIDASI JAM PULANG - Minimal Jam 09:00 WIB (Hanya untuk Guru)
        if ($_SESSION['role'] === 'guru' && !empty($data['jamPulang'])) {
            $currentHour = intval(date('H'));
            $currentMinute = intval(date('i'));
            $currentTimeInMinutes = ($currentHour * 60) + $currentMinute;

            // 1. Cek Waktu Minimal Umum (09:00)
            if ($currentHour < 9) {
                sendResponse(false, 'Presensi pulang hanya bisa dilakukan mulai pukul 09:00 WIB');
            }

            // 2. Cek Jadwal Piket
            $hariInggris = date('l');
            $hariIndonesia = [
                'Monday' => 'Senin', 'Tuesday' => 'Selasa', 'Wednesday' => 'Rabu',
                'Thursday' => 'Kamis', 'Friday' => 'Jumat', 'Saturday' => 'Sabtu', 'Sunday' => 'Minggu'
            ];
            $hariIni = $hariIndonesia[$hariInggris];

            $stmtPiket = $pdo->prepare("SELECT jam_pulang_piket FROM jadwal_piket WHERE user_id = ? AND hari = ?");
            $stmtPiket->execute([$_SESSION['user_id'], $hariIni]);
            $piket = $stmtPiket->fetch();

            if ($piket && !empty($piket['jam_pulang_piket'])) {
                list($piketHour, $piketMinute) = explode(':', $piket['jam_pulang_piket']);
                $piketTimeInMinutes = (intval($piketHour) * 60) + intval($piketMinute);

                // Jika belum waktunya pulang piket DAN tidak ada flag izin_pulang_awal
                if ($currentTimeInMinutes < $piketTimeInMinutes && empty($data['izin_pulang_awal'])) {
                    $jamPulangPiketStr = substr($piket['jam_pulang_piket'], 0, 5);
                    sendResponse(false, "PIKET_RESTRICTION|{$jamPulangPiketStr}");
                }

                // Jika izin_pulang_awal ada, tambahkan info ke keterangan
                if (!empty($data['izin_pulang_awal'])) {
                    $data['keterangan'] = ($data['keterangan'] ? $data['keterangan'] . " " : "") . "(Izin Pulang Awal Piket)";
                }
            }
        }

        $stmt = $pdo->prepare("
            UPDATE attendance_logs SET 
                status = ?, jam_masuk = ?, jam_pulang = ?, 
                jam_hadir = ?, jam_izin = ?, jam_sakit = ?, 
                keterangan = ?, latitude = ?, longitude = ?
            WHERE id = ?
        ");
        
        $stmt->execute([
            $data['status'],
            !empty($data['jamMasuk']) ? $data['jamMasuk'] : null,
            !empty($data['jamPulang']) ? $data['jamPulang'] : null,
            !empty($data['jamHadir']) ? $data['jamHadir'] : null,
            !empty($data['jamIzin']) ? $data['jamIzin'] : null,
            !empty($data['jamSakit']) ? $data['jamSakit'] : null,
            $data['keterangan'] ?? '',
            $data['latitude'] ?? null,
            $data['longitude'] ?? null,
            $data['id']
        ]);
        
        sendResponse(true, 'Presensi berhasil diupdate');
    } catch (PDOException $e) {
        sendResponse(false, 'Error: ' . $e->getMessage());
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
