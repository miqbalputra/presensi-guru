<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

// GET ALL GURU - Admin dan Guru bisa akses
if ($method === 'GET' && !isset($_GET['id'])) {
    requireAuth(['admin', 'guru']);
    try {
        $stmt = $pdo->query("SELECT * FROM users WHERE role = 'guru' ORDER BY id");
        $guru = $stmt->fetchAll();
        
        // Parse jabatan dari JSON dan convert field names ke camelCase
        foreach ($guru as &$g) {
            if ($g['jabatan']) {
                $g['jabatan'] = json_decode($g['jabatan'], true);
            }
            // Convert snake_case to camelCase for frontend
            $g['idGuru'] = $g['id_guru'];
            $g['noHP'] = $g['no_hp'];
            $g['jenisKelamin'] = $g['jenis_kelamin'];
            $g['tanggalBertugas'] = $g['tanggal_bertugas'];
            $g['tanggalLahir'] = $g['tanggal_lahir'];
            
            unset($g['password']); // Hapus password dari response
        }
        
        sendResponse(true, 'Data guru berhasil diambil', $guru);
    } catch (PDOException $e) {
        sendResponse(false, 'Error: ' . $e->getMessage());
    }
}

// GET GURU BY ID - Admin dan Guru bisa akses
if ($method === 'GET' && isset($_GET['id'])) {
    requireAuth(['admin', 'guru']);
    try {
        $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ? AND role = 'guru'");
        $stmt->execute([$_GET['id']]);
        $guru = $stmt->fetch();
        
        if ($guru) {
            if ($guru['jabatan']) {
                $guru['jabatan'] = json_decode($guru['jabatan'], true);
            }
            // Convert snake_case to camelCase for frontend
            $guru['idGuru'] = $guru['id_guru'];
            $guru['noHP'] = $guru['no_hp'];
            $guru['jenisKelamin'] = $guru['jenis_kelamin'];
            $guru['tanggalBertugas'] = $guru['tanggal_bertugas'];
            $guru['tanggalLahir'] = $guru['tanggal_lahir'];
            
            unset($guru['password']);
            sendResponse(true, 'Data guru ditemukan', $guru);
        } else {
            sendResponse(false, 'Guru tidak ditemukan');
        }
    } catch (PDOException $e) {
        sendResponse(false, 'Error: ' . $e->getMessage());
    }
}

// CREATE GURU - Hanya Admin
if ($method === 'POST') {
    requireAuth(['admin']);
    $data = getRequestData();
    
    try {
        // Validasi data
        if (empty($data['idGuru']) || empty($data['username']) || empty($data['password'])) {
            sendResponse(false, 'ID Guru, Username, dan Password harus diisi');
        }
        
        // Validasi password strength
        $passwordValidation = validatePassword($data['password']);
        if ($passwordValidation !== true) {
            sendResponse(false, $passwordValidation);
        }
        
        // Cek apakah id_guru atau username sudah ada
        $stmt = $pdo->prepare("SELECT id FROM users WHERE id_guru = ? OR username = ?");
        $stmt->execute([$data['idGuru'], $data['username']]);
        if ($stmt->fetch()) {
            sendResponse(false, 'ID Guru atau Username sudah digunakan');
        }
        
        // Encode jabatan ke JSON
        $jabatan = json_encode($data['jabatan']);
        $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
        
        $stmt = $pdo->prepare("
            INSERT INTO users (id_guru, username, password, role, nama, tanggal_lahir, jenis_kelamin, alamat, no_hp, jabatan, tanggal_bertugas)
            VALUES (?, ?, ?, 'guru', ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $data['idGuru'],
            $data['username'],
            $hashedPassword,
            $data['nama'],
            $data['tanggalLahir'] ?? null,
            $data['jenisKelamin'],
            $data['alamat'],
            $data['noHP'],
            $jabatan,
            $data['tanggalBertugas']
        ]);
        
        sendResponse(true, 'Guru berhasil ditambahkan', ['id' => $pdo->lastInsertId()]);
    } catch (PDOException $e) {
        // Handle duplicate entry error
        if ($e->getCode() == 23000) {
            sendResponse(false, 'ID Guru atau Username sudah digunakan');
        } else {
            sendResponse(false, 'Error: ' . $e->getMessage());
        }
    }
}

// UPDATE GURU - Hanya Admin
if ($method === 'PUT') {
    requireAuth(['admin']);
    $data = getRequestData();
    
    try {
        // Validasi data
        if (empty($data['id'])) {
            sendResponse(false, 'ID guru harus diisi');
        }
        
        $jabatan = json_encode($data['jabatan']);
        
        // Cek apakah id_guru atau username sudah digunakan oleh guru lain
        $stmt = $pdo->prepare("SELECT id FROM users WHERE (id_guru = ? OR username = ?) AND id != ?");
        $stmt->execute([$data['idGuru'], $data['username'], $data['id']]);
        if ($stmt->fetch()) {
            sendResponse(false, 'ID Guru atau Username sudah digunakan oleh guru lain');
        }
        
        // Jika password diisi, update password
        if (!empty($data['password'])) {
            // Validasi password strength
            $passwordValidation = validatePassword($data['password']);
            if ($passwordValidation !== true) {
                sendResponse(false, $passwordValidation);
            }
            
            $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("
                UPDATE users SET 
                    id_guru = ?, username = ?, password = ?, nama = ?, 
                    tanggal_lahir = ?, jenis_kelamin = ?, alamat = ?, no_hp = ?, 
                    jabatan = ?, tanggal_bertugas = ?
                WHERE id = ?
            ");
            $result = $stmt->execute([
                $data['idGuru'],
                $data['username'],
                $hashedPassword,
                $data['nama'],
                $data['tanggalLahir'] ?? null,
                $data['jenisKelamin'],
                $data['alamat'],
                $data['noHP'],
                $jabatan,
                $data['tanggalBertugas'],
                $data['id']
            ]);
        } else {
            // Update tanpa password
            $stmt = $pdo->prepare("
                UPDATE users SET 
                    id_guru = ?, username = ?, nama = ?, 
                    tanggal_lahir = ?, jenis_kelamin = ?, alamat = ?, no_hp = ?, 
                    jabatan = ?, tanggal_bertugas = ?
                WHERE id = ?
            ");
            $result = $stmt->execute([
                $data['idGuru'],
                $data['username'],
                $data['nama'],
                $data['tanggalLahir'] ?? null,
                $data['jenisKelamin'],
                $data['alamat'],
                $data['noHP'],
                $jabatan,
                $data['tanggalBertugas'],
                $data['id']
            ]);
        }
        
        if ($result) {
            sendResponse(true, 'Guru berhasil diupdate');
        } else {
            sendResponse(false, 'Gagal update data guru');
        }
    } catch (PDOException $e) {
        // Handle duplicate entry error
        if ($e->getCode() == 23000) {
            sendResponse(false, 'ID Guru atau Username sudah digunakan');
        } else {
            sendResponse(false, 'Error: ' . $e->getMessage());
        }
    }
}

// DELETE GURU - Hanya Admin
if ($method === 'DELETE') {
    requireAuth(['admin']);
    $id = $_GET['id'] ?? null;
    
    if (!$id) {
        sendResponse(false, 'ID guru harus diisi');
    }
    
    try {
        $stmt = $pdo->prepare("DELETE FROM users WHERE id = ? AND role = 'guru'");
        $stmt->execute([$id]);
        
        sendResponse(true, 'Guru berhasil dihapus');
    } catch (PDOException $e) {
        sendResponse(false, 'Error: ' . $e->getMessage());
    }
}

sendResponse(false, 'Invalid request');
?>
