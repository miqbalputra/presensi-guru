<?php

function gpw_bool_setting($value)
{
    return in_array(strtolower((string)$value), ['1', 'true', 'yes', 'on'], true);
}

function gpw_weekend_workday_enabled($pdo)
{
    $stmt = $pdo->prepare("SELECT setting_value FROM settings WHERE setting_key = 'weekend_workday_enabled' LIMIT 1");
    $stmt->execute();
    $row = $stmt->fetch();
    return $row ? gpw_bool_setting($row['setting_value']) : false;
}

function gpw_normalize_gender($gender)
{
    $value = strtolower(trim((string)$gender));
    if ($value === 'laki-laki' || $value === 'laki laki' || $value === 'male') {
        return 'male';
    }
    if ($value === 'perempuan' || $value === 'female') {
        return 'female';
    }
    return null;
}

function gpw_get_weekend_workday_settings($pdo)
{
    $keys = [
        'weekend_workday_enabled',
        'saturday_male_workday_enabled',
        'saturday_female_workday_enabled',
        'sunday_male_workday_enabled',
        'sunday_female_workday_enabled'
    ];
    $placeholders = implode(',', array_fill(0, count($keys), '?'));
    $stmt = $pdo->prepare("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ({$placeholders})");
    $stmt->execute($keys);

    $settings = [];
    foreach ($stmt->fetchAll() as $row) {
        $settings[$row['setting_key']] = $row['setting_value'];
    }
    return $settings;
}

function gpw_weekend_workday_allowed($settings, $dayOfWeek, $gender = null)
{
    $normalizedGender = gpw_normalize_gender($gender);
    $specificKeys = [
        'saturday_male_workday_enabled',
        'saturday_female_workday_enabled',
        'sunday_male_workday_enabled',
        'sunday_female_workday_enabled'
    ];
    $hasSpecificSettings = count(array_intersect($specificKeys, array_keys($settings))) > 0;

    if (!$hasSpecificSettings) {
        return gpw_bool_setting($settings['weekend_workday_enabled'] ?? '0');
    }

    if ($dayOfWeek === 6) {
        if ($normalizedGender === 'male') {
            return gpw_bool_setting($settings['saturday_male_workday_enabled'] ?? '0');
        }
        if ($normalizedGender === 'female') {
            return gpw_bool_setting($settings['saturday_female_workday_enabled'] ?? '0');
        }
        return gpw_bool_setting($settings['saturday_male_workday_enabled'] ?? '0')
            || gpw_bool_setting($settings['saturday_female_workday_enabled'] ?? '0');
    }

    if ($dayOfWeek === 0) {
        if ($normalizedGender === 'male') {
            return gpw_bool_setting($settings['sunday_male_workday_enabled'] ?? '0');
        }
        if ($normalizedGender === 'female') {
            return gpw_bool_setting($settings['sunday_female_workday_enabled'] ?? '0');
        }
        return gpw_bool_setting($settings['sunday_male_workday_enabled'] ?? '0')
            || gpw_bool_setting($settings['sunday_female_workday_enabled'] ?? '0');
    }

    return false;
}

function gpw_get_holiday($pdo, $date)
{
    $stmt = $pdo->prepare("
        SELECT tanggal, nama, jenis, is_workday, jam_masuk_khusus
        FROM holidays
        WHERE tanggal = ?
        LIMIT 1
    ");
    $stmt->execute([$date]);
    return $stmt->fetch();
}

function gpw_is_special_workday($holiday)
{
    return $holiday && ((int)$holiday['is_workday'] === 1 || $holiday['jenis'] === 'sekolah');
}

function gpw_get_date_status($pdo, $date, $gender = null)
{
    $holiday = gpw_get_holiday($pdo, $date);
    $dayOfWeek = (int)date('w', strtotime($date));
    $isWeekend = ($dayOfWeek === 0 || $dayOfWeek === 6);
    $weekendSettings = gpw_get_weekend_workday_settings($pdo);
    $isWeekendWorkday = $isWeekend && gpw_weekend_workday_allowed($weekendSettings, $dayOfWeek, $gender);
    $isSpecialWorkday = gpw_is_special_workday($holiday);
    $isWorkday = $isSpecialWorkday || (!$holiday && (!$isWeekend || $isWeekendWorkday));

    return [
        'holiday' => $holiday,
        'dayOfWeek' => $dayOfWeek,
        'isWeekend' => $isWeekend,
        'isWeekendWorkday' => $isWeekendWorkday,
        'gender' => gpw_normalize_gender($gender),
        'isSpecialWorkday' => $isSpecialWorkday,
        'isWorkday' => $isWorkday
    ];
}

function gpw_build_date_range($start, $end)
{
    $dates = [];
    $current = strtotime($start);
    $last = strtotime($end);

    while ($current <= $last) {
        $dates[] = date('Y-m-d', $current);
        $current = strtotime('+1 day', $current);
    }

    return $dates;
}

function gpw_get_workday_dates($pdo, $start, $end, $gender = null)
{
    $stmt = $pdo->prepare("
        SELECT tanggal, jenis, is_workday
        FROM holidays
        WHERE tanggal BETWEEN ? AND ?
    ");
    $stmt->execute([$start, $end]);

    $holidays = [];
    foreach ($stmt->fetchAll() as $holiday) {
        $holidays[$holiday['tanggal']] = $holiday;
    }

    $weekendSettings = gpw_get_weekend_workday_settings($pdo);
    $workdays = [];
    foreach (gpw_build_date_range($start, $end) as $date) {
        $holiday = $holidays[$date] ?? null;
        $dayOfWeek = (int)date('w', strtotime($date));
        $isWeekend = in_array($dayOfWeek, [0, 6], true);
        $isWeekendWorkday = $isWeekend && gpw_weekend_workday_allowed($weekendSettings, $dayOfWeek, $gender);
        $isSpecialWorkday = gpw_is_special_workday($holiday);

        if ($isSpecialWorkday || (!$holiday && (!$isWeekend || $isWeekendWorkday))) {
            $workdays[] = $date;
        }
    }

    return $workdays;
}
?>
