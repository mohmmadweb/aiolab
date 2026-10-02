<?php
/* تاریخ شمسی (جلالی) — بدون وابستگی به افزونه‌ی دیگر */
defined('ABSPATH') || exit;

function aio_g2j(int $gy, int $gm, int $gd): array
{
    $g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    $gy2 = ($gm > 2) ? ($gy + 1) : $gy;
    $days = 355666 + (365 * $gy) + intdiv($gy2 + 3, 4) - intdiv($gy2 + 99, 100) + intdiv($gy2 + 399, 400) + $gd + $g_d_m[$gm - 1];
    $jy = -1595 + (33 * intdiv($days, 12053));
    $days %= 12053;
    $jy += 4 * intdiv($days, 1461);
    $days %= 1461;
    if ($days > 365) {
        $jy += intdiv($days - 1, 365);
        $days = ($days - 1) % 365;
    }
    if ($days < 186) {
        $jm = 1 + intdiv($days, 31);
        $jd = 1 + ($days % 31);
    } else {
        $jm = 7 + intdiv($days - 186, 30);
        $jd = 1 + (($days - 186) % 30);
    }
    return [$jy, $jm, $jd];
}

function aio_j2g(int $jy, int $jm, int $jd): array
{
    $jy += 1595;
    $days = -355668 + (365 * $jy) + (intdiv($jy, 33) * 8) + intdiv(($jy % 33) + 3, 4) + $jd + (($jm < 7) ? ($jm - 1) * 31 : (($jm - 7) * 30) + 186);
    $gy = 400 * intdiv($days, 146097);
    $days %= 146097;
    if ($days > 36524) {
        $gy += 100 * intdiv(--$days, 36524);
        $days %= 36524;
        if ($days >= 365) $days++;
    }
    $gy += 4 * intdiv($days, 1461);
    $days %= 1461;
    if ($days > 365) {
        $gy += intdiv($days - 1, 365);
        $days = ($days - 1) % 365;
    }
    $gd = $days + 1;
    $sal_a = [0, 31, (($gy % 4 == 0 && $gy % 100 != 0) || ($gy % 400 == 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    for ($gm = 0; $gm < 13 && $gd > $sal_a[$gm]; $gm++) $gd -= $sal_a[$gm];
    return [$gy, $gm, $gd];
}

const AIO_JMONTHS = ['', 'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];

/**
 * تاریخ شمسی با ارقام فارسی.
 * قالب‌ها: Y سال، m ماه دو رقمی، n ماه، d روز دو رقمی، j روز، F نام ماه، l نام روز هفته، H:i ساعت
 */
function aio_jdate(string $format = 'Y/m/d', $timestamp = null): string
{
    $ts = $timestamp === null ? time() : (is_numeric($timestamp) ? (int) $timestamp : strtotime((string) $timestamp));
    if (!$ts || $ts < 0) $ts = time(); /* نوشته‌های در انتظار تاریخ GMT ندارند */
    $dt = (new DateTime('@' . $ts))->setTimezone(wp_timezone());
    [$jy, $jm, $jd] = aio_g2j((int) $dt->format('Y'), (int) $dt->format('n'), (int) $dt->format('j'));
    $out = strtr($format, [
        'Y' => $jy, 'm' => str_pad($jm, 2, '0', STR_PAD_LEFT), 'n' => $jm,
        'd' => str_pad($jd, 2, '0', STR_PAD_LEFT), 'j' => $jd, 'F' => '{F}', 'l' => '{L}',
        'H' => $dt->format('H'), 'i' => $dt->format('i'),
    ]);
    $out = str_replace('{F}', AIO_JMONTHS[$jm], $out);
    $out = str_replace('{L}', ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'][(int) $dt->format('w')], $out);
    return aio_fa($out);
}

/** «امروز / دیروز / n روز پیش» */
function aio_time_ago($timestamp): string
{
    if (!$timestamp) return 'همین حالا';
    $d = (int) floor((time() - (int) $timestamp) / DAY_IN_SECONDS);
    if ($d <= 0) {
        $h = (int) floor((time() - (int) $timestamp) / HOUR_IN_SECONDS);
        return $h <= 0 ? 'همین حالا' : aio_fa($h) . ' ساعت پیش';
    }
    if ($d === 1) return 'دیروز';
    if ($d < 30) return aio_fa($d) . ' روز پیش';
    return aio_jdate('Y/m/d', $timestamp);
}

/** «۱۴۰۵/۰۳/۱۰» → timestamp (برای درون‌ریزی تاریخ‌های دمو) */
function aio_jalali_to_ts(string $s): int
{
    $s = aio_en_digits($s);
    if (!preg_match('/(\d{4})\/(\d{1,2})(?:\/(\d{1,2}))?/', $s, $m)) return time();
    [$gy, $gm, $gd] = aio_j2g((int) $m[1], (int) $m[2], (int) ($m[3] ?? 1));
    return (int) (new DateTime(sprintf('%04d-%02d-%02d 10:00:00', $gy, $gm, $gd), wp_timezone()))->getTimestamp();
}
