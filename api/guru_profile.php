<?php
/**
 * Guru Profile Self-Service Endpoint
 *
 * Mengizinkan guru yang sedang login untuk:
 *   - Melihat profil mereka sendiri        (GET)
 *   - Memperbarui email, no_hp, alamat      (PUT)
 *   - Mengganti password sendiri            (POST)
 *
 * Perubahan langsung tersimpan ke tabel `users` (database utama Guru)
 * sehingga data yang dilihat Admin juga ikut ter-update.
 */

require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

// Semua aksi pada endpoint ini hanya boleh diakses oleh guru yang login.
requireAuth(['guru']);

/** @var int $currentUserId diambil dari session */
$currentUserId = (int) ($_SESSION['user_id'] ?? 0);

if ($currentUserId <= 0) {
    sendResponse(false, 'Sesi tidak valid, silakan login kembali.');
}

// -------------------------------------------------------------------------
// GET - Ambil profil sendiri (email, no_hp, alamat, google_id, dll)
// -------------------------------------------------------------------------
if ($method === 'GET') {
    try {
        $stmt = $pdo->prepare("
            SELECT id, id_guru, username, email, nama, no_hp, alamat, role, google_id
            FROM users
            WHERE id = ? AND role = 'guru'
            LIMIT 1
        ");
        $stmt->execute([$currentUserId]);
        $guru = $stmt->fetch();

        if (!$guru) {
            sendResponse(false, 'Data guru tidak ditemukan.');
        }

        // Ubah ke camelCase agar konsisten dengan frontend
        $profile = [
            'id'           => (int) $guru['id'],
            'idGuru'       => $guru['id_guru'],
            'username'     => $guru['username'],
            'email'        => $guru['email'],
            'nama'         => $guru['nama'],
            'noHP'         => $guru['no_hp'],
            'alamat'       => $guru['alamat'],
            'role'         => $guru['role'],
            'googleId'     => $guru['google_id'],
            'googleLinked' => !empty($guru['google_id']),
        ];

        sendResponse(true, 'Profil berhasil diambil', $profile);
    } catch (PDOException $e) {
        handleError($e, 'guru_profile.php - GET');
    }
}

// -------------------------------------------------------------------------
// PUT - Update profil sendiri (email, no_hp, alamat)
// -------------------------------------------------------------------------
if ($method === 'PUT') {
    $data = getRequestData();

    $email  = trim($data['email'] ?? '');
    $noHP   = trim($data['noHP'] ?? $data['no_hp'] ?? '');
    $alamat = trim($data['alamat'] ?? '');

    // Validasi email (boleh kosong, tapi kalau diisi harus valid)
    if ($email !== '' && !validateEmail($email)) {
        sendResponse(false, 'Format email tidak valid.');
    }

    // Batasi panjang no_hp
    if (mb_strlen($noHP) > 20) {
        sendResponse(false, 'Nomor HP maksimal 20 karakter.');
    }

    // Sanitasi input
    $email  = $email !== '' ? sanitizeInput($email) : null;
    $noHP   = $noHP !== '' ? sanitizeInput($noHP) : null;
    $alamat = $alamat !== '' ? sanitizeInput($alamat) : null;

    try {
        $stmt = $pdo->prepare("
            UPDATE users
               SET email = ?, no_hp = ?, alamat = ?
             WHERE id = ? AND role = 'guru'
        ");
        $result = $stmt->execute([$email, $noHP, $alamat, $currentUserId]);

        if (!$result || $stmt->rowCount() === 0) {
            // Boleh jadi tidak ada perubahan, cek baris yang ada dulu
            $check = $pdo->prepare("SELECT COUNT(*) FROM users WHERE id = ? AND role = 'guru'");
            $check->execute([$currentUserId]);
            if ((int) $check->fetchColumn() === 0) {
                sendResponse(false, 'Data guru tidak ditemukan.');
            }
            // Tidak ada baris yang berubah = data sama persis, tetap sukses
        }

        // Sinkronkan session agar perubahan langsung terlihat di frontend
        $fresh = $pdo->prepare("SELECT * FROM users WHERE id = ? LIMIT 1");
        $fresh->execute([$currentUserId]);
        $freshUser = $fresh->fetch();
        if ($freshUser) {
            // Decode jabatan seperti helper auth_map_user
            if (!empty($freshUser['jabatan']) && is_string($freshUser['jabatan'])) {
                $decoded = json_decode($freshUser['jabatan'], true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $freshUser['jabatan'] = $decoded;
                }
            }
            unset($freshUser['password']);
            $_SESSION['user'] = $freshUser;
        }

        // Ambil profil terbaru untuk dikirim balik
        $profileStmt = $pdo->prepare("
            SELECT id, id_guru, username, email, nama, no_hp, alamat, role, google_id
            FROM users WHERE id = ? LIMIT 1
        ");
        $profileStmt->execute([$currentUserId]);
        $guru = $profileStmt->fetch();

        $profile = [
            'id'           => (int) $guru['id'],
            'idGuru'       => $guru['id_guru'],
            'username'     => $guru['username'],
            'email'        => $guru['email'],
            'nama'         => $guru['nama'],
            'noHP'         => $guru['no_hp'],
            'alamat'       => $guru['alamat'],
            'role'         => $guru['role'],
            'googleId'     => $guru['google_id'],
            'googleLinked' => !empty($guru['google_id']),
        ];

        sendResponse(true, 'Profil berhasil diperbarui.', $profile);
    } catch (PDOException $e) {
        handleError($e, 'guru_profile.php - PUT');
    }
}

// -------------------------------------------------------------------------
// POST - Ganti password sendiri
// -------------------------------------------------------------------------
if ($method === 'POST') {
    $data = getRequestData();

    $passwordLama     = (string) ($data['passwordLama'] ?? $data['oldPassword'] ?? '');
    $passwordBaru     = (string) ($data['passwordBaru'] ?? $data['newPassword'] ?? '');
    $konfirmasiBaru   = (string) ($data['konfirmasiBaru'] ?? $data['confirmPassword'] ?? '');

    if ($passwordLama === '' || $passwordBaru === '' || $konfirmasiBaru === '') {
        sendResponse(false, 'Semua kolom password harus diisi.');
    }

    if ($passwordBaru !== $konfirmasiBaru) {
        sendResponse(false, 'Konfirmasi password baru tidak cocok.');
    }

    // Validasi kekuatan password (reuse helper security.php)
    $passwordValidation = validatePassword($passwordBaru);
    if ($passwordValidation !== true) {
        sendResponse(false, $passwordValidation);
    }

    try {
        // Ambil password lama dari DB untuk verifikasi
        $stmt = $pdo->prepare("SELECT password FROM users WHERE id = ? AND role = 'guru' LIMIT 1");
        $stmt->execute([$currentUserId]);
        $row = $stmt->fetch();

        if (!$row) {
            sendResponse(false, 'Data guru tidak ditemukan.');
        }

        // Verifikasi password lama
        if (!password_verify($passwordLama, $row['password'])) {
            securityLog('password_change_failed', [
                'user_id' => $currentUserId,
                'reason'  => 'wrong_old_password',
                'ip'      => getClientIP(),
            ]);
            sendResponse(false, 'Password lama tidak sesuai.');
        }

        // Password baru tidak boleh sama dengan password lama
        if (password_verify($passwordBaru, $row['password'])) {
            sendResponse(false, 'Password baru tidak boleh sama dengan password lama.');
        }

        $hashedPassword = password_hash($passwordBaru, PASSWORD_DEFAULT);

        $update = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
        $update->execute([$hashedPassword, $currentUserId]);

        securityLog('password_change_success', [
            'user_id' => $currentUserId,
            'ip'      => getClientIP(),
        ]);

        sendResponse(true, 'Password berhasil diubah.');
    } catch (PDOException $e) {
        handleError($e, 'guru_profile.php - POST (change password)');
    }
}

sendResponse(false, 'Invalid request');
?>