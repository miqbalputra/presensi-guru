<?php
// Simple version endpoint without requiring config.php to avoid CORS/session issues
echo json_encode([
    'success' => true,
    'message' => 'Deployment version info',
    'data' => [
        'version' => 'manual-check',
        'php_time' => date('Y-m-d H:i:s'),
        'teacher_workdays_role' => ['admin', 'kepala_sekolah', 'guru'],
        'optional_workdays_role' => ['admin', 'kepala_sekolah', 'guru']
    ]
]);
exit();

// Public version check endpoint to verify deployment state
$version = 'unknown';
$gitHeadFile = __DIR__ . '/../.git/refs/heads/main';
if (file_exists($gitHeadFile)) {
    $version = trim(file_get_contents($gitHeadFile));
}

http_response_code(200);
header('Content-Type: application/json; charset=UTF-8');
echo json_encode([
    'success' => true,
    'message' => 'Deployment version info',
    'data' => [
        'version' => $version,
        'php_time' => date('Y-m-d H:i:s'),
        'teacher_workdays_role' => ['admin', 'kepala_sekolah', 'guru'],
        'optional_workdays_role' => ['admin', 'kepala_sekolah', 'guru']
    ]
]);
exit();
