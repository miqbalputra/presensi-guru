<?php
require_once 'config.php';

// Admin dan Guru bisa akses endpoint ini
requireAuth(['admin', 'guru']);

$method = $_SERVER['REQUEST_METHOD'];

// GET ALL ACTIVITY LOGS
if ($method === 'GET') {
    try {
        $stmt = $pdo->query("SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 100");
        $logs = $stmt->fetchAll();
        
        // Format waktu
        foreach ($logs as &$log) {
            if (!empty($log['created_at'])) {
                $log['waktu'] = date('d-m-Y H:i:s', strtotime($log['created_at']));
            } else {
                $log['waktu'] = '-';
            }
        }
        
        sendResponse(true, 'Activity logs berhasil diambil', $logs);
    } catch (PDOException $e) {
        sendResponse(false, 'Error: ' . $e->getMessage());
    }
}

// CREATE ACTIVITY LOG
if ($method === 'POST') {
    $data = getRequestData();
    
    try {
        $stmt = $pdo->prepare("
            INSERT INTO activity_logs (user, aktivitas, status)
            VALUES (?, ?, ?)
        ");
        
        $stmt->execute([
            $data['user'],
            $data['aktivitas'],
            $data['status']
        ]);
        
        sendResponse(true, 'Activity log berhasil disimpan', ['id' => $pdo->lastInsertId()]);
    } catch (PDOException $e) {
        sendResponse(false, 'Error: ' . $e->getMessage());
    }
}

sendResponse(false, 'Invalid request');
?>
