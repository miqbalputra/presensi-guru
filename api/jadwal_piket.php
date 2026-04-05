<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

// Admin bisa CRUD, Guru hanya bisa READ
if (in_array($method, ['POST', 'PUT', 'DELETE'])) {
    // Write operations - hanya admin
    requireAuth(['admin']);
} else {
    // Read operations - admin dan guru
    requireAuth(['admin', 'guru']);
}

// GET ALL JADWAL PIKET
if ($method === 'GET' && !isset($_GET['id']) && !isset($_GET['today'])) {
    try {
        $query = "SELECT jp.id, jp.user_id, jp.nama_guru, jp.hari, jp.jam_piket, 
                         jp.keterangan, jp.created_at, jp.updated_at, u.username 
                  FROM jadwal_piket jp 
                  LEFT JOIN users u ON jp.user_id = u.id 
                  WHERE 1=1";
        $params = [];
        
        // Filter by user_id
        if (isset($_GET['user_id'])) {
            $query .= " AND jp.user_id = ?";
            $params[] = $_GET['user_id'];
        }
        
        // Filter by hari
        if (isset($_GET['hari'])) {
            $query .= " AND jp.hari = ?";
            $params[] = $_GET['hari'];
        }
        
        $query .= " ORDER BY 
                    FIELD(jp.hari, 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'),
                    jp.jam_piket ASC";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $jadwal = $stmt->fetchAll();
        
        sendResponse(true, 'Data jadwal piket berhasil diambil', $jadwal);
    } catch (PDOException $e) {
        sendResponse(false, 'Error: ' . $e->getMessage());
    }
}

// GET JADWAL PIKET HARI INI
if ($method === 'GET' && isset($_GET['today'])) {
    try {
        // Set timezone ke Asia/Jakarta (WIB) untuk Indonesia Barat
        date_default_timezone_set('Asia/Jakarta');
        
        // Get hari ini dalam bahasa Indonesia
        $hariInggris = date('l'); // Monday, Tuesday, etc
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
        
        $stmt = $pdo->prepare("
            SELECT jp.id, jp.user_id, jp.nama_guru, jp.hari, jp.jam_piket, 
                   jp.keterangan, jp.created_at, jp.updated_at, u.username 
            FROM jadwal_piket jp 
            LEFT JOIN users u ON jp.user_id = u.id 
            WHERE jp.hari = ?
            ORDER BY jp.jam_piket ASC
        ");
        $stmt->execute([$hari]);
        $jadwal = $stmt->fetchAll();
        
        sendResponse(true, 'Jadwal piket hari ini berhasil diambil', [
            'hari' => $hari,
            'jadwal' => $jadwal
        ]);
    } catch (PDOException $e) {
        sendResponse(false, 'Error: ' . $e->getMessage());
    }
}

// CREATE JADWAL PIKET (Admin only)
if ($method === 'POST') {
    $data = getRequestData();
    
    try {
        // Validasi input
        if (empty($data['user_id']) || empty($data['nama_guru']) || empty($data['hari'])) {
            sendResponse(false, 'User ID, nama guru, dan hari harus diisi');
        }
        
        // Validasi hari
        $allowedHari = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
        if (!in_array($data['hari'], $allowedHari)) {
            sendResponse(false, 'Hari tidak valid');
        }
        
        // Validasi jam piket (format HH:MM:SS atau HH:MM)
        $jamPiket = $data['jam_piket'] ?? '07:00:00';
        if (strlen($jamPiket) === 5) {
            $jamPiket .= ':00'; // Tambah detik jika format HH:MM
        }
        
        $stmt = $pdo->prepare("
            INSERT INTO jadwal_piket (user_id, nama_guru, hari, jam_piket, keterangan)
            VALUES (?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $data['user_id'],
            $data['nama_guru'],
            $data['hari'],
            $jamPiket,
            $data['keterangan'] ?? null
        ]);
        
        sendResponse(true, 'Jadwal piket berhasil ditambahkan', ['id' => $pdo->lastInsertId()]);
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) {
            sendResponse(false, 'Guru sudah memiliki jadwal piket di hari ini');
        } else {
            handleError($e, 'jadwal_piket.php - create');
        }
    }
}

// UPDATE JADWAL PIKET (Admin only)
if ($method === 'PUT') {
    $data = getRequestData();
    
    try {
        if (empty($data['id'])) {
            sendResponse(false, 'ID jadwal piket harus diisi');
        }
        
        // Validasi jam piket (format HH:MM:SS atau HH:MM)
        $jamPiket = $data['jam_piket'] ?? '07:00:00';
        if (strlen($jamPiket) === 5) {
            $jamPiket .= ':00'; // Tambah detik jika format HH:MM
        }
        
        $stmt = $pdo->prepare("
            UPDATE jadwal_piket SET 
                user_id = ?, 
                nama_guru = ?, 
                hari = ?, 
                jam_piket = ?, 
                keterangan = ?
            WHERE id = ?
        ");
        
        $stmt->execute([
            $data['user_id'],
            $data['nama_guru'],
            $data['hari'],
            $jamPiket,
            $data['keterangan'] ?? null,
            $data['id']
        ]);
        
        sendResponse(true, 'Jadwal piket berhasil diupdate');
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) {
            sendResponse(false, 'Guru sudah memiliki jadwal piket di hari ini');
        } else {
            sendResponse(false, 'Error: ' . $e->getMessage());
        }
    }
}

// DELETE JADWAL PIKET (Admin only)
if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    
    if (!$id) {
        sendResponse(false, 'ID jadwal piket harus diisi');
    }
    
    try {
        $stmt = $pdo->prepare("DELETE FROM jadwal_piket WHERE id = ?");
        $stmt->execute([$id]);
        
        sendResponse(true, 'Jadwal piket berhasil dihapus');
    } catch (PDOException $e) {
        sendResponse(false, 'Error: ' . $e->getMessage());
    }
}

sendResponse(false, 'Invalid request');
?>
