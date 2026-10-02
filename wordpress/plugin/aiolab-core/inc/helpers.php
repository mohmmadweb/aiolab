<?php
/* توابع کمکی عمومی */
defined('ABSPATH') || exit;

/** تنظیمات سراسری (گزینه‌ی aio_settings) */
function aio_opt(string $key, $default = null)
{
    /* get_option در حافظه‌ی وردپرس کش می‌شود و پس از update_option همیشه تازه است */
    $cache = get_option('aio_settings', []);
    if (!is_array($cache)) $cache = [];
    if (array_key_exists($key, $cache) && $cache[$key] !== '' && $cache[$key] !== null) return $cache[$key];
    if ($default === null && !array_key_exists($key, $cache)) {
        $d = aio_default_settings();
        if (isset($d[$key])) return $d[$key];
    }
    return $default;
}

/** فهرست‌های پایه (نوع همکاری، شیفت، مزایا و …) — گزینه‌ی aio_lists */
function aio_list(string $name, $default = [])
{
    $lists = get_option('aio_lists', []);
    return (is_array($lists) && isset($lists[$name])) ? $lists[$name] : $default;
}

/** مقدار متای پست با پیشوند _aio_ */
function aio_meta(int $post_id, string $key, $default = null)
{
    $v = get_post_meta($post_id, '_aio_' . $key, true);
    return ($v === '' || $v === null) ? $default : $v;
}

function aio_set_meta(int $post_id, string $key, $value): void
{
    update_post_meta($post_id, '_aio_' . $key, $value);
}

/** اعداد لاتین → فارسی */
function aio_fa($s): string
{
    return strtr((string) $s, ['0' => '۰', '1' => '۱', '2' => '۲', '3' => '۳', '4' => '۴', '5' => '۵', '6' => '۶', '7' => '۷', '8' => '۸', '9' => '۹']);
}

/** اعداد فارسی/عربی → لاتین (برای ورودی کاربر) */
function aio_en_digits($s): string
{
    return strtr((string) $s, ['۰' => '0', '۱' => '1', '۲' => '2', '۳' => '3', '۴' => '4', '۵' => '5', '۶' => '6', '۷' => '7', '۸' => '8', '۹' => '9',
        '٠' => '0', '١' => '1', '٢' => '2', '٣' => '3', '٤' => '4', '٥' => '5', '٦' => '6', '٧' => '7', '٨' => '8', '٩' => '9']);
}

/** عدد با جداکننده‌ی هزارگان فارسی */
function aio_fa_money($n): string
{
    return aio_fa(number_format((float) $n, 0, '.', '٬'));
}

/**
 * پاک‌سازی متن ورودی کاربر (غیرمدیر): حذف تگ‌ها و کاراکترهایی که در قالب‌های
 * سمت کلاینت (innerHTML / ویژگی‌ها) خطر تزریق دارند.
 */
function aio_clean_text($s, int $max = 500): string
{
    $s = wp_strip_all_tags((string) $s);
    $s = str_replace(['<', '>', '`', '"', "'"], ['', '', '', '”', '’'], $s);
    $s = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F]/u', '', $s);
    $s = trim(preg_replace('/[ \t]+/u', ' ', $s));
    return mb_substr($s, 0, $max);
}

/** متن چندخطی کاربر */
function aio_clean_textarea($s, int $max = 5000): string
{
    $lines = preg_split('/\r\n|\r|\n/', (string) $s);
    $lines = array_map(fn($l) => aio_clean_text($l, $max), $lines);
    return mb_substr(trim(implode("\n", $lines)), 0, $max);
}

/** آرایه‌ای از رشته‌های تمیز */
function aio_clean_list($arr, int $max_items = 50, int $max_len = 200): array
{
    if (is_string($arr)) $arr = preg_split('/\r\n|\r|\n|،|,/u', $arr);
    if (!is_array($arr)) return [];
    $out = [];
    foreach ($arr as $v) {
        if (!is_scalar($v)) continue;
        $v = aio_clean_text($v, $max_len);
        if ($v !== '') $out[] = $v;
        if (count($out) >= $max_items) break;
    }
    return array_values(array_unique($out));
}

function aio_hex($c, string $default = '#0d9488'): string
{
    $c = sanitize_hex_color((string) $c);
    return $c ?: $default;
}

/** نقش اصلی کاربر در آیولب */
function aio_user_role($user = null): string
{
    $user = $user ? (is_numeric($user) ? get_userdata($user) : $user) : wp_get_current_user();
    if (!$user || !$user->ID) return '';
    $roles = (array) $user->roles;
    if (in_array('administrator', $roles, true) || user_can($user, 'manage_options')) return 'admin';
    foreach (['employer', 'supplier', 'volunteer', 'seeker'] as $r) {
        if (in_array('aio_' . $r, $roles, true)) return $r;
    }
    if (in_array('editor', $roles, true)) return 'admin';
    return 'seeker';
}

function aio_role_label(string $role): string
{
    return [
        'seeker' => 'کارجو', 'volunteer' => 'داوطلب', 'employer' => 'کارفرما',
        'supplier' => 'تأمین‌کننده', 'admin' => 'مدیر',
    ][$role] ?? $role;
}

/** نقش‌هایی که پنل کارفرما دارند (مدیر هم برای بررسی دسترسی دارد) */
function aio_is_employer($user = null): bool
{
    return in_array(aio_user_role($user), ['employer', 'admin'], true);
}

/** آدرس برگه‌ی سیستمی بر اساس نقش آن (متای _aio_page) */
function aio_page_id(string $role): int
{
    $map = get_option('aio_page_map', []);
    if (!empty($map[$role]) && get_post_status($map[$role]) === 'publish') return (int) $map[$role];
    $q = get_posts(['post_type' => 'page', 'post_status' => 'publish', 'numberposts' => 1, 'meta_key' => '_aio_page', 'meta_value' => $role, 'fields' => 'ids']);
    if ($q) {
        $map[$role] = $q[0];
        update_option('aio_page_map', $map, true);
        return (int) $q[0];
    }
    return 0;
}

function aio_page_url(string $role, string $suffix = ''): string
{
    if ($role === 'home') return home_url('/') . ltrim($suffix, '/');
    $id = aio_page_id($role);
    $url = $id ? get_permalink($id) : home_url('/' . $role . '/');
    return $url . $suffix;
}

/* هر بار برگه‌ای ذخیره شد نقشه‌ی نقش→شناسه پاک شود */
add_action('save_post_page', function () { delete_option('aio_page_map'); });

/** نشانی تک‌صفحه‌ها */
function aio_single_url(string $type, $id): string
{
    switch ($type) {
        case 'job':    return home_url("/job/$id/");
        case 'lab':    return home_url("/lab/$id/");
        case 'course': return home_url("/course/$id/");
        case 'exam':   return home_url("/exam/$id/");
        case 'learn':  return home_url("/learn/$id/");
        case 'path':   return home_url("/path/$id/");
        case 'product': return home_url("/product/$id/");
    }
    return home_url('/');
}

/** شناسه‌ی پست از روی شناسه‌ی دموی قدیمی (برای درون‌ریزی) */
function aio_post_by_demo(string $post_type, $demo_id): int
{
    $q = get_posts(['post_type' => $post_type, 'post_status' => 'any', 'numberposts' => 1, 'fields' => 'ids',
        'meta_key' => '_aio_demo_id', 'meta_value' => (string) $demo_id]);
    return $q ? (int) $q[0] : 0;
}

/** شناسه‌ی پست از روی نامک (برای ارائه‌دهنده/مدرس/مسیر) */
function aio_post_by_slug(string $post_type, string $slug): int
{
    $p = get_page_by_path($slug, OBJECT, $post_type);
    return $p ? (int) $p->ID : 0;
}

/** متن قیمت */
function aio_price_text($price, string $free = 'رایگان', string $na = 'استعلام قیمت'): string
{
    if ($price === null || $price === '') return $na;
    if ((float) $price == 0) return $free;
    return aio_fa_money($price) . ' تومان';
}

/** JSON امن برای قرار دادن داخل <script> */
function aio_json($data): string
{
    return wp_json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP);
}

/** بولی از ورودی‌های متنوع */
function aio_bool($v): bool
{
    return filter_var($v, FILTER_VALIDATE_BOOLEAN) || $v === 1 || $v === '1' || $v === 'on';
}

/** آی‌پی کاربر (برای محدودسازی تلاش ورود) */
function aio_client_ip(): string
{
    foreach (['HTTP_CF_CONNECTING_IP', 'REMOTE_ADDR'] as $k) {
        if (!empty($_SERVER[$k])) return sanitize_text_field(wp_unslash($_SERVER[$k]));
    }
    return '0.0.0.0';
}

/** کد یکتای کوتاه (کد رهگیری گواهی و سفارش) */
function aio_code(string $prefix = '', int $len = 8): string
{
    $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    $s = '';
    for ($i = 0; $i < $len; $i++) $s .= $alphabet[random_int(0, strlen($alphabet) - 1)];
    return $prefix . $s;
}

/** «n روز پیش» از روی تاریخ */
function aio_days_ago($post_or_time): int
{
    $t = is_numeric($post_or_time) && $post_or_time > 100000 ? (int) $post_or_time : get_post_time('U', true, $post_or_time);
    if (!$t) $t = (int) get_post_time('U', false, $post_or_time) ?: time();
    return max(0, (int) floor((time() - $t) / DAY_IN_SECONDS));
}
