<?php
// File minimal untuk memastikan deploy dan PHP runtime bekerja
header('Content-Type: text/plain');
echo "PHP OK\n";
echo "Time: " . date('Y-m-d H:i:s') . "\n";
echo "Request: " . ($_SERVER['REQUEST_URI'] ?? 'unknown') . "\n";
if (function_exists('getenv')) {
    echo "APP_ENV: " . (getenv('APP_ENV') ?: '(not set)') . "\n";
}
echo "Extension PDO: " . (extension_loaded('pdo') ? 'yes' : 'no') . "\n";
echo "Extension PDO_MYSQL: " . (extension_loaded('pdo_mysql') ? 'yes' : 'no') . "\n";
