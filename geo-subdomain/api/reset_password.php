<?php
/**
 * Script untuk Reset Password Admin
 * Akses: https://sistemflow.biz.id/api/reset_password.php
 * 
 * PENTING: Hapus file ini setelah selesai reset password!
 */

require_once 'config.php';

try {
    // Generate hash untuk password baru
    $adminPassword = password_hash('admin123', PASSWORD_DEFAULT);
    $kepsekPassword = password_hash('kepsek123', PASSWORD_DEFAULT);
    $guruPassword = password_hash('guru123', PASSWORD_DEFAULT);
    
    // Update password admin
    $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE username = 'admin'");
    $stmt->execute([$adminPassword]);
    $adminUpdated = $stmt->rowCount();
    
    // Update password kepala sekolah
    $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE username = 'kepsek'");
    $stmt->execute([$kepsekPassword]);
    $kepsekUpdated = $stmt->rowCount();
    
    // Update password semua guru
    $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE role = 'guru'");
    $stmt->execute([$guruPassword]);
    $guruUpdated = $stmt->rowCount();
    
    echo "<h2>✅ Password Berhasil Direset!</h2>";
    echo "<table border='1' cellpadding='10' style='border-collapse: collapse;'>";
    echo "<tr><th>Username</th><th>Password Baru</th><th>Status</th></tr>";
    echo "<tr><td><strong>admin</strong></td><td>admin123</td><td>" . ($adminUpdated > 0 ? '✅ Updated' : '❌ Not Found') . "</td></tr>";
    echo "<tr><td><strong>kepsek</strong></td><td>kepsek123</td><td>" . ($kepsekUpdated > 0 ? '✅ Updated' : '❌ Not Found') . "</td></tr>";
    echo "<tr><td><strong>guru1, guru2, dll</strong></td><td>guru123</td><td>✅ Updated ($guruUpdated guru)</td></tr>";
    echo "</table>";
    
    echo "<hr>";
    echo "<h3>🎯 Silakan Login:</h3>";
    echo "<ul>";
    echo "<li>URL: <a href='https://sistemflow.biz.id'>https://sistemflow.biz.id</a></li>";
    echo "<li>Username: <strong>admin</strong></li>";
    echo "<li>Password: <strong>admin123</strong></li>";
    echo "</ul>";
    
    echo "<hr>";
    echo "<p style='color: red;'><strong>⚠️ PENTING:</strong> Hapus file ini setelah selesai reset password!</p>";
    echo "<p>File yang harus dihapus: <code>/home/username/api/reset_password.php</code></p>";
    
} catch (PDOException $e) {
    echo "<h2>❌ Error!</h2>";
    echo "<p>Error: " . $e->getMessage() . "</p>";
    echo "<p>Pastikan file config.php sudah benar dan database sudah terkoneksi.</p>";
}
?>
