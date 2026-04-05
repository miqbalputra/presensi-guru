<?php
/**
 * Debug/Diagnostic Script - HAPUS SETELAH DEBUG SELESAI
 * Cek status database presensi
 */
require_once 'config.php';
date_default_timezone_set('Asia/Jakarta');

$today = date('Y-m-d');
$results = [];

// 1. Cek semua attendance hari ini
try {
    $stmt = $pdo->prepare("SELECT al.*, u.username, u.nama as nama_user FROM attendance_logs al LEFT JOIN users u ON al.user_id = u.id WHERE al.tanggal = ? ORDER BY al.created_at DESC");
    $stmt->execute([$today]);
    $results['attendance_today'] = $stmt->fetchAll();
} catch (Exception $e) {
    $results['attendance_today_error'] = $e->getMessage();
}

// 2. Cek semua attendance (5 terbaru)
try {
    $stmt = $pdo->prepare("SELECT al.*, u.username FROM attendance_logs al LEFT JOIN users u ON al.user_id = u.id ORDER BY al.created_at DESC LIMIT 10");
    $stmt->execute();
    $results['attendance_latest'] = $stmt->fetchAll();
} catch (Exception $e) {
    $results['attendance_latest_error'] = $e->getMessage();
}

// 3. Cek settings
try {
    $stmt = $pdo->prepare("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('qr_secret', 'qr_enabled', 'mode_testing', 'button_enabled')");
    $stmt->execute();
    $results['settings'] = $stmt->fetchAll();
} catch (Exception $e) {
    $results['settings_error'] = $e->getMessage();
}

// 4. Cek status session
$results['session_active'] = isset($_SESSION['user_id']);
$results['session_user_id'] = $_SESSION['user_id'] ?? null;
$results['session_role'] = $_SESSION['role'] ?? null;
$results['server_date'] = $today;
$results['server_time'] = date('H:i:s');
$results['server_timezone'] = date_default_timezone_get();

// 5. Cek users
try {
    $stmt = $pdo->prepare("SELECT id, username, nama, role FROM users ORDER BY id");
    $stmt->execute();
    $results['users'] = $stmt->fetchAll();
} catch (Exception $e) {
    $results['users_error'] = $e->getMessage();
}

echo json_encode([
    'success' => true,
    'message' => 'Diagnostic data',
    'data' => $results
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
