<?php
require_once 'config.php';

// Admin dan Guru bisa akses endpoint ini
requireAuth(['admin', 'guru']);

$method = $_SERVER['REQUEST_METHOD'];

// GET ALL PRESENSI (dengan filter optional)
if ($method === 'GET' && !isset($_GET['id'])) {
    try {
        $query = "SELECT * FROM attendance_logs WHERE 1=1";
        $params = [];
        
        // Filter by user_id
        if (isset($_GET['user_id'])) {
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
    
    try {
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
        
        $stmt = $pdo->prepare("
            INSERT INTO attendance_logs 
            (user_id, nama, tanggal, status, jam_masuk, jam_pulang, jam_hadir, jam_izin, jam_sakit, keterangan, latitude, longitude)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $data['userId'],
            $data['nama'],
            $data['tanggal'],
            $data['status'],
            !empty($data['jamMasuk']) ? $data['jamMasuk'] : null,
            !empty($data['jamPulang']) ? $data['jamPulang'] : null,
            !empty($data['jamHadir']) ? $data['jamHadir'] : null,
            !empty($data['jamIzin']) ? $data['jamIzin'] : null,
            !empty($data['jamSakit']) ? $data['jamSakit'] : null,
            $data['keterangan'] ?? '',
            $data['latitude'] ?? null,
            $data['longitude'] ?? null
        ]);
        
        sendResponse(true, 'Presensi berhasil disimpan', ['id' => $pdo->lastInsertId()]);
    } catch (PDOException $e) {
        handleError($e, 'presensi.php - create');
    }
}

// UPDATE PRESENSI (untuk presensi pulang atau edit admin)
if ($method === 'PUT') {
    $data = getRequestData();
    
    try {
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
