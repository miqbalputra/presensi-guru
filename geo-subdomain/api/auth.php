<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

// LOGIN
if ($method === 'POST' && isset($_GET['action']) && $_GET['action'] === 'login') {
    // Rate limiting: 5 attempts per 5 minutes
    checkRateLimit('login', 5, 300);
    
    $data = getRequestData();
    $username = $data['username'] ?? '';
    $password = $data['password'] ?? '';

    if (empty($username) || empty($password)) {
        sendResponse(false, 'Username dan password harus diisi');
    }

    try {
        $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
        $stmt->execute([$username]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password'])) {
            // Parse jabatan dari JSON string ke array
            if ($user['jabatan']) {
                $user['jabatan'] = json_decode($user['jabatan'], true);
            }
            
            // Regenerate session ID untuk keamanan
            session_regenerate_id(true);
            
            // Simpan session
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['role'] = $user['role'];
            $_SESSION['login_time'] = time();

            // Log successful login
            securityLog('login_success', [
                'user_id' => $user['id'],
                'username' => $user['username'],
                'role' => $user['role']
            ]);

            // Hapus password dari response
            unset($user['password']);

            sendResponse(true, 'Login berhasil', $user);
        } else {
            // Log failed login
            securityLog('login_failed', [
                'username' => $username,
                'ip' => getClientIP()
            ]);
            
            sendResponse(false, 'Username atau password salah');
        }
    } catch (PDOException $e) {
        handleError($e, 'auth.php - login');
    }
}

// LOGOUT
if ($method === 'POST' && isset($_GET['action']) && $_GET['action'] === 'logout') {
    // Log logout
    if (isset($_SESSION['user_id'])) {
        securityLog('logout', [
            'user_id' => $_SESSION['user_id'],
            'username' => $_SESSION['username']
        ]);
    }
    
    session_unset();
    session_destroy();
    sendResponse(true, 'Logout berhasil');
}

// CHECK SESSION
if ($method === 'GET' && isset($_GET['action']) && $_GET['action'] === 'check') {
    if (isset($_SESSION['user_id'])) {
        sendResponse(true, 'Session active', [
            'user_id' => $_SESSION['user_id'],
            'username' => $_SESSION['username'],
            'role' => $_SESSION['role']
        ]);
    } else {
        sendResponse(false, 'No active session');
    }
}

sendResponse(false, 'Invalid request');
?>
