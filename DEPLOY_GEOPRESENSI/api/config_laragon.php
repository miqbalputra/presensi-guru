<?php
// =====================================================
// Database Configuration untuk LARAGON (Development)
// =====================================================

define('DB_HOST', 'localhost');
define('DB_NAME', 'geopresensi');  // Nama database di Laragon
define('DB_USER', 'root');         // Default Laragon
define('DB_PASS', '');             // Default Laragon (kosong)

// Load security functions
require_once __DIR__ . '/security.php';

// Setup secure session untuk development
setupSecureSession();

// Setup CORS untuk localhost development
setupCORS('http://localhost:5173');

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