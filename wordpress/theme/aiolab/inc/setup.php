<?php
/* تنظیمات پایه‌ی قالب و پاک‌سازی خروجی وردپرس */
defined('ABSPATH') || exit;

add_action('after_setup_theme', function () {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('html5', ['search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script']);
    add_theme_support('custom-logo');
    add_theme_support('editor-styles');
    add_theme_support('responsive-embeds');
    add_editor_style(['assets/css/fonts.css', 'assets/css/editor.css']);
    register_nav_menus([
        'primary'  => 'منوی اصلی (بالای سایت)',
        'footer_1' => 'فوتر — ستون ۱',
        'footer_2' => 'فوتر — ستون ۲',
        'footer_3' => 'فوتر — ستون ۳',
    ]);
});

/* متن و HTML برگه‌ها بدون تغییر خودکار نمایش داده شوند */
add_filter('run_wptexturize', '__return_false');
remove_action('wp_head', 'print_emoji_detection_script', 7);
remove_action('wp_print_styles', 'print_emoji_styles');
remove_action('admin_print_scripts', 'print_emoji_detection_script');
remove_action('admin_print_styles', 'print_emoji_styles');
remove_filter('the_content', 'convert_smilies', 20);
remove_action('wp_head', 'wp_generator');
remove_action('wp_head', 'wlwmanifest_link');
remove_action('wp_head', 'rsd_link');
remove_action('wp_head', 'wp_shortlink_wp_head');

/* توضیحات آیتم‌های منو (زیرعنوان زیرمنوها) در پیشخوان همیشه نمایش داده شود */
add_filter('default_hidden_columns', function ($hidden, $screen) {
    if ($screen && $screen->id === 'nav-menus') $hidden = array_diff($hidden, ['description', 'css-classes']);
    return $hidden;
}, 10, 2);
add_filter('manage_nav-menus_columns', function ($c) { return $c; });
add_action('admin_head-nav-menus.php', function () {
    echo '<style>.field-description,.field-css-classes{display:block!important}</style>';
    echo '<script>document.addEventListener("DOMContentLoaded",function(){var n=document.querySelector(".manage-menus");if(n)n.insertAdjacentHTML("afterend","<div class=\"notice notice-info inline\"><p>زیرعنوان هر زیرمنو = فیلد «توضیحات»؛ آیکن = کلاس CSS به شکل <code>icon-pin</code> (نام‌ها: flask, drop, microbe, scope, syringe, shield, dna, briefcase, pin, users, building, doc, chart, heart, comment, bookmark, home, bell, grad, path, machine, clock, send).</p></div>")});</script>';
});

/* صفحه‌ی ورود/بازیابی رمز وردپرس (لینک ایمیل بازیابی به این‌جا می‌آید) با ظاهر آیولب */
add_action('login_enqueue_scripts', function () {
    wp_enqueue_style('aio-fonts', get_template_directory_uri() . '/assets/css/fonts.css', [], AIO_THEME_VER);
    $logo = 'data:image/svg+xml,' . rawurlencode(AIO_LOGO_SVG);
    wp_add_inline_style('aio-fonts', 'body.login{background:linear-gradient(160deg,#f0fdfa,#fff 60%);font-family:Vazirmatn,Tahoma,sans-serif}
        .login h1 a{background-image:url("' . esc_attr($logo) . '");background-size:64px;width:64px;height:64px}
        .login form{border-radius:14px;border:1px solid #e2e8f0;box-shadow:0 10px 30px rgba(15,23,42,.06)}
        .login .button-primary{background:#0d9488;border-color:#0d9488;border-radius:8px;font-family:inherit}
        .login .button-primary:hover{background:#0f766e;border-color:#0f766e}
        .login input,.login label,.login .message,.login #nav a,.login #backtoblog a{font-family:inherit}
        .login .message,.login .success{border-right-color:#0d9488}');
});
add_filter('login_headerurl', fn() => home_url('/'));
add_filter('login_headertext', fn() => get_bloginfo('name'));
/* پس از تعیین رمز جدید، کاربر به برگه‌ی ورود آیولب هدایت شود */
add_action('after_password_reset', function () {
    if (function_exists('aio_page_url')) add_filter('login_redirect', fn() => aio_page_url('login'));
});
add_filter('lostpassword_redirect', fn($r) => $r);
