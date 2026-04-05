<?php
date_default_timezone_set('Asia/Jakarta');
// =====================================================
// Database Configuration - Auto-detect Environment
// =====================================================

// Detect if running on localhost (Laragon/XAMPP) or production
$httpHost = $_SERVER['HTTP_HOST'] ?? '';
$isLocalhost = in_array($httpHost, ['localhost', '127.0.0.1', 'geopresensi.test']) ||
    strpos($httpHost, 'localhost:') === 0 ||
    strpos($httpHost, '.test') !== false ||
    ($_SERVER['SERVER_NAME'] ?? '') === 'localhost';

if ($isLocalhost) {
    // LARAGON / Local Development
    define('DB_HOST', 'localhost');
    define('DB_NAME', 'geopresensi');
    define('DB_USER', 'root');
    define('DB_PASS', '');
    // Allow any localhost port for development
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if (strpos($origin, 'http://localhost') === 0 || strpos($origin, 'https://localhost') === 0) {
        $corsOrigin = $origin;
    } else {
        $corsOrigin = 'http://localhost:5174';
    }
} else {
    // PRODUCTION - geoloc.kelolasekolah.web.id
    define('DB_HOST', 'localhost');
    define('DB_NAME', 'username_geopresensi_db');  // Ganti dengan nama database production
    define('DB_USER', 'username_geopresensi_user'); // Ganti dengan username production
    define('DB_PASS', 'your_password_here');        // Ganti dengan password production
    $corsOrigin = 'https://geoloc.kelolasekolah.web.id';
}

// Load security functions
require_once __DIR__ . '/security.php';

// Setup secure session
setupSecureSession();

// Setup CORS
setupCORS($corsOrigin);

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