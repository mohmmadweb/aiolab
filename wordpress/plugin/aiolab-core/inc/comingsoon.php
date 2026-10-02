<?php
/* حالت «به‌زودی»: بازدیدکنندگان فقط صفحه‌ی به‌زودی را می‌بینند؛ مدیران و دارندگان لینک پیش‌نمایش سایت کامل را */
defined('ABSPATH') || exit;

function aio_preview_allowed(): bool
{
    if (current_user_can('edit_posts')) return true;
    if (is_user_logged_in()) return true;
    $key = (string) aio_opt('cs_preview_key', '');
    return $key !== '' && isset($_COOKIE['aio_preview']) && hash_equals(wp_hash($key), (string) $_COOKIE['aio_preview']);
}

add_action('init', function () {
    $key = (string) aio_opt('cs_preview_key', '');
    if ($key !== '' && isset($_GET['preview']) && is_string($_GET['preview']) && hash_equals($key, (string) $_GET['preview'])) {
        setcookie('aio_preview', wp_hash($key), ['expires' => time() + 30 * DAY_IN_SECONDS, 'path' => COOKIEPATH ?: '/', 'secure' => is_ssl(), 'httponly' => true, 'samesite' => 'Lax']);
        $_COOKIE['aio_preview'] = wp_hash($key);
        wp_safe_redirect(remove_query_arg('preview'));
        exit;
    }
});

add_action('template_redirect', function () {
    if (!aio_opt('cs_enabled', 0) || aio_preview_allowed()) return;
    if (get_query_var('aio_data') || !empty($_GET['aio_pay_cb'])) return;
    status_header(200);
    nocache_headers();
    $tpl = locate_template('coming-soon.php');
    if ($tpl) { include $tpl; exit; }
    $title = esc_html(aio_opt('cs_title', 'به‌زودی'));
    $text = esc_html(aio_opt('cs_text', ''));
    echo '<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>' . $title . '</title></head><body style="font-family:Tahoma;text-align:center;padding:80px 16px"><h1>' . $title . '</h1><p>' . $text . '</p></body></html>';
    exit;
}, 0);

/* در حالت به‌زودی موتورهای جستجو سایت را ایندکس نکنند */
add_filter('wp_robots', function ($r) {
    if (aio_opt('cs_enabled', 0)) { $r['noindex'] = true; $r['nofollow'] = true; }
    return $r;
});
