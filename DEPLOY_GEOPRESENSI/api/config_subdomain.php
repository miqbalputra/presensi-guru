<?php
// Database Configuration untuk SUBDOMAIN geoloc.kelolasekolah.web.id
// GANTI dengan credentials database Anda dari cPanel

// ============================================
// PILIH SALAH SATU OPSI DI BAWAH:
// ============================================

// OPSI 1: Database Baru (RECOMMENDED)
// Uncomment 3 baris di bawah jika pakai database baru
// define('DB_HOST', 'localhost');
// define('DB_NAME', 'sobataja2_geo');           // Database baru untuk subdomain
// define('DB_USER', 'sobataja2_geo_user');      // User baru untuk subdomain
// define('DB_PASS', 'password_baru_anda');      // Password baru

// OPSI 2: Database yang Sama (jika ingin share data)
// Uncomment 3 baris di bawah jika pakai database yang sama
define('DB_HOST', 'localhost');
define('DB_NAME', 'sobataja2_geopresence');   // Database yang sama
define('DB_USER', 'sobataja2_mip');           // User yang sama
define('DB_PASS', 'Alhamdulillah`123');       // Password yang sama

// Load security functions
require_once __DIR__ . '/security.php';

// Setup secure session
setupSecureSession();

// Setup CORS dengan domain spesifik
setupCORS();

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database Connection
try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed: ' . $e->getMessage()
    ]);
    exit();
}

// Helper Functions
function sendResponse($success, $message, $data = null)
{
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data
    ]);
    exit();
}

function getRequestData()
{
    $data = json_decode(file_get_contents('php://input'), true);

    // Sanitize input untuk keamanan
    if ($data) {
        $data = sanitizeInput($data);
    }

    return $data;
}
?>