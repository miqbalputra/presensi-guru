<?php
require_once 'config.php';

// Test koneksi database
try {
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM users");
    $result = $stmt->fetch();
    
    sendResponse(true, 'API Connected Successfully', [
        'database' => 'Connected',
        'total_users' => $result['count'],
        'timestamp' => date('Y-m-d H:i:s')
    ]);
} catch (PDOException $e) {
    sendResponse(false, 'Database connection failed', [
        'error' => $e->getMessage()
    ]);
}
?>
