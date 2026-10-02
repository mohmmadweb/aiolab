<?php
/**
 * Plugin Name: آیولب — هسته پلتفرم
 * Description: مدل داده، پنل مدیریت، API و منطق کسب‌وکار آیولب (آگهی، مراکز، آکادمی، آزمون، سفارش و پرداخت). قالب «آیولب» ظاهر را می‌سازد؛ همه‌ی داده‌ها از همین افزونه و از پیشخوان قابل ویرایش‌اند.
 * Version: 1.2.0
 * Author: آیولب
 * Text Domain: aiolab
 * Requires PHP: 8.0
 */

defined('ABSPATH') || exit;

define('AIO_VERSION', '1.2.0');
define('AIO_FILE', __FILE__);
define('AIO_DIR', plugin_dir_path(__FILE__));
define('AIO_URL', plugin_dir_url(__FILE__));

foreach ([
    'helpers', 'jalali', 'roles', 'cpt', 'fields', 'schemas', 'settings', 'admin',
    'reviews', 'notify', 'data', 'me', 'academy', 'payments', 'rest', 'talent', 'pipeline', 'cron', 'comingsoon', 'importer', 'talent-import',
] as $f) {
    require_once AIO_DIR . "inc/$f.php";
}

register_activation_hook(__FILE__, function () {
    aio_register_roles();
    aio_register_types();
    aio_add_rewrites();
    flush_rewrite_rules();
    aio_cron_schedule();
    $s = get_option('aio_settings');
    if (!is_array($s)) $s = aio_default_settings();
    if (empty($s['cs_preview_key'])) $s['cs_preview_key'] = wp_generate_password(16, false);
    update_option('aio_settings', $s);
});

register_deactivation_hook(__FILE__, function () {
    wp_clear_scheduled_hook('aio_daily');
    wp_clear_scheduled_hook('aio_hourly');
    flush_rewrite_rules();
});

/* مهاجرت‌های نسخه — هر بار که نسخه عوض شود، نقش‌ها و قوانین بازنویسی تازه می‌شوند */
add_action('init', function () {
    if (get_option('aio_db_version') !== AIO_VERSION) {
        aio_register_roles();
        aio_add_rewrites();
        flush_rewrite_rules(false);
        aio_cron_schedule();
        update_option('aio_db_version', AIO_VERSION);
    }
}, 99);
