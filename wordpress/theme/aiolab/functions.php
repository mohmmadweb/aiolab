<?php
/* قالب آیولب — نیازمند افزونه‌ی «آیولب — هسته پلتفرم» */
defined('ABSPATH') || exit;

define('AIO_THEME_VER', '1.0.0');

require_once __DIR__ . '/inc/icons.php';
require_once __DIR__ . '/inc/setup.php';
if (!function_exists('aio_opt')) {
    /* بدون افزونه‌ی هسته، سایت فقط پیام راهنما نشان می‌دهد */
    add_action('template_redirect', function () {
        if (is_admin()) return;
        wp_die('افزونه‌ی «آیولب — هسته پلتفرم» فعال نیست. از پیشخوان ← افزونه‌ها آن را فعال کنید.', 'آیولب');
    });
    return;
}
require_once __DIR__ . '/inc/assets.php';
require_once __DIR__ . '/inc/render.php';
require_once __DIR__ . '/inc/seo.php';
require_once __DIR__ . '/inc/views.php';
