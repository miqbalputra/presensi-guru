<?php
// Run with: php scripts/test-attendance-rules.php
require_once __DIR__ . '/../api/attendance_service.php';

$pdo = new PDO('sqlite::memory:', null, null, [PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
$pdo->exec('CREATE TABLE jadwal_piket (user_id INTEGER, hari TEXT, jam_piket TEXT, jam_pulang_piket TEXT, is_active INTEGER)');
$pdo->exec("INSERT INTO jadwal_piket VALUES (42, 'Senin', '06:40:00', '13:00:00', 1), (43, 'Senin', '06:40:00', '13:00:00', 0)");

$cases = [
    ['piket before target', 42, '1', 'full_time', '06:39:00', '06:40:00', ' (Piket)', 'hadir', ''],
    ['piket at target', 42, '1', 'full_time', '06:40:00', '06:40:00', ' (Piket)', 'hadir', ''],
    ['piket late within tolerance', 42, '1', 'full_time', '06:41:00', '06:40:00', ' (Piket)', 'hadir_terlambat', 'Terlambat 1 menit (Piket)'],
    ['piket before apel', 42, '1', 'full_time', '06:50:00', '06:40:00', ' (Piket)', 'hadir_terlambat', 'Terlambat 10 menit (Piket)'],
    ['piket without apel', 42, '0', 'full_time', '06:50:00', '06:40:00', ' (Piket)', 'hadir_terlambat', 'Terlambat 10 menit (Piket)'],
    ['partime piket', 42, '1', 'partime', '06:50:00', '06:40:00', ' (Piket)', 'hadir_terlambat', 'Terlambat 10 menit (Piket)'],
    ['partime piket without apel', 42, '0', 'partime', '06:50:00', '06:40:00', ' (Piket)', 'hadir_terlambat', 'Terlambat 10 menit (Piket)'],
    ['piket severe delay', 42, '1', 'full_time', '07:01:00', '06:40:00', ' (Piket)', 'hadir_terlambat', 'Terlambat 21 menit (Parah) (Piket)'],
    ['inactive piket follows apel', 43, '1', 'full_time', '06:50:00', '07:00', ' (Apel Senin)', 'hadir', ''],
    ['apel at target', 43, '1', 'full_time', '07:00:00', '07:00', ' (Apel Senin)', 'hadir', ''],
    ['apel late', 43, '1', 'full_time', '07:01:00', '07:00', ' (Apel Senin)', 'hadir_terlambat', 'Terlambat 1 menit (Apel Senin)'],
    ['partime apel late', 43, '1', 'partime', '07:01:00', '07:00', ' (Apel Senin)', 'hadir_terlambat', 'Terlambat 1 menit (Apel Senin)'],
    ['partime normal hours remain flexible', 43, '0', 'partime', '08:00:00', '07:20', '', 'hadir', 'Guru Partime'],
];

foreach ($cases as [$name, $userId, $apel, $teacherType, $time, $expectedTarget, $expectedLabel, $expectedStatus, $expectedNote]) {
    $settings = ['jam_masuk_normal' => '07:20', 'apel_senin_enabled' => $apel];
    [$target, $label] = gp_get_checkin_target($pdo, $userId, '2026-08-17', $settings, null, false);
    [$status, $note] = gp_classify_checkin(['tipe_guru' => $teacherType], $time, $target, $label, 15);
    $actual = [$target, $label, $status, $note];
    $expected = [$expectedTarget, $expectedLabel, $expectedStatus, $expectedNote];
    if ($actual !== $expected) {
        throw new RuntimeException($name . ': ' . json_encode(['actual' => $actual, 'expected' => $expected]));
    }
}

echo count($cases), " attendance rule cases passed", PHP_EOL;
