<?php
/**
 * Test Kirim WhatsApp Langsung ke Gowa (Tanpa n8n)
 * Untuk troubleshooting
 */

// GANTI INI DENGAN DATA ANDA
$gowaUrl = 'https://api.gowa.id/send'; // Endpoint Gowa Anda
$gowaApiKey = 'YOUR_GOWA_API_KEY'; // API Key Gowa Anda
$testPhone = '081234567890'; // Nomor HP Anda untuk test

// Pesan test
$message = "🔔 *Test Pengingat Presensi*\n\nHalo,\n\nIni adalah test pesan dari sistem GeoPresensi.\n\nJika Anda menerima pesan ini, berarti integrasi WhatsApp berhasil!\n\n_Sistem GeoPresensi Sekolah_";

// Format nomor (konversi 08xxx ke 628xxx)
if (substr($testPhone, 0, 1) === '0') {
    $testPhone = '62' . substr($testPhone, 1);
}

echo "<h2>Test Kirim WhatsApp ke Gowa</h2>";
echo "<p><strong>URL:</strong> $gowaUrl</p>";
echo "<p><strong>Phone:</strong> $testPhone</p>";
echo "<hr>";

// Kirim ke Gowa
$ch = curl_init($gowaUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'target' => $testPhone,
    'message' => $message
]));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $gowaApiKey,
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
$curlInfo = curl_getinfo($ch);
curl_close($ch);

echo "<h3>Result:</h3>";
echo "<p><strong>HTTP Code:</strong> $httpCode</p>";

if ($curlError) {
    echo "<p style='color:red;'><strong>cURL Error:</strong> $curlError</p>";
}

echo "<p><strong>Response:</strong></p>";
echo "<pre>" . htmlspecialchars($response) . "</pre>";

echo "<hr>";
echo "<h3>Debug Info:</h3>";
echo "<pre>" . print_r($curlInfo, true) . "</pre>";

if ($httpCode >= 200 && $httpCode < 300) {
    echo "<p style='color:green; font-weight:bold;'>✅ SUCCESS! Cek WhatsApp Anda.</p>";
} else {
    echo "<p style='color:red; font-weight:bold;'>❌ FAILED! Cek error di atas.</p>";
}
?>
