<?php
require_once 'config.php';

// Public version check endpoint to verify deployment state
$version = 'unknown';
$gitHeadFile = __DIR__ . '/../.git/refs/heads/main';
if (file_exists($gitHeadFile)) {
    $version = trim(file_get_contents($gitHeadFile));
}

sendResponse(true, 'Deployment version info', [
    'version' => $version,
    'php_time' => date('Y-m-d H:i:s'),
    'teacher_workdays_role' => ['admin', 'kepala_sekolah', 'guru'],
    'optional_workdays_role' => ['admin', 'kepala_sekolah', 'guru']
]);
