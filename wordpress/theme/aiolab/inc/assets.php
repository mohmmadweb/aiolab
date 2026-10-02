<?php
/* بارگذاری استایل‌ها و اسکریپت‌ها + پیکربندی و وضعیت کاربر برای جاوااسکریپت */
defined('ABSPATH') || exit;

function aio_asset(string $rel): string
{
    return get_template_directory_uri() . '/assets/' . $rel;
}

function aio_asset_ver(string $rel): string
{
    $f = get_template_directory() . '/assets/' . $rel;
    return file_exists($f) ? (string) filemtime($f) : AIO_THEME_VER;
}

/** نقش برگه‌ی فعلی (home, jobs, tpl-job, …) */
function aio_current_role(): string
{
    static $role = null;
    if ($role !== null) return $role;
    $role = '';
    if (get_query_var('aio_learn')) return $role = 'tpl-learn';
    if (get_query_var('aio_verify')) return $role = 'verify';
    if (is_front_page()) return $role = 'home';
    if (is_singular(['aio_job', 'aio_lab', 'aio_course', 'aio_exam', 'aio_path', 'aio_product'])) return $role = 'tpl-' . substr(get_post_type(), 4);
    if (is_page()) return $role = (string) get_post_meta(get_queried_object_id(), '_aio_page', true);
    if (is_404()) return $role = '404';
    if (is_singular('post') || is_category() || is_home() || is_search()) return $role = 'article';
    return $role;
}

/** برگه‌ای که در منو فعال نشان داده می‌شود */
function aio_active_role(): string
{
    $r = aio_current_role();
    $map = ['tpl-product' => 'products', 'talent' => 'employer', 'tpl-job' => 'jobs', 'tpl-lab' => 'labs', 'tpl-course' => 'courses', 'tpl-exam' => 'exams', 'tpl-path' => 'courses', 'tpl-learn' => 'courses', 'article' => 'magazine', 'verify' => 'exams', 'checkout' => 'services'];
    return $map[$r] ?? $r;
}

/** شناسه‌ی موجودیت صفحه‌ی فعلی برای جاوااسکریپت */
function aio_ctx(): array
{
    if ($id = (int) get_query_var('aio_learn')) return ['type' => 'learn', 'id' => $id];
    if (is_singular(['aio_job', 'aio_lab', 'aio_course', 'aio_exam', 'aio_product'])) return ['type' => substr(get_post_type(), 4), 'id' => get_queried_object_id(), 'status' => get_post_status()];
    if (is_singular('aio_path')) return ['type' => 'path', 'id' => get_queried_object()->post_name];
    return [];
}

add_action('wp_enqueue_scripts', function () {
    $role = aio_current_role();
    wp_enqueue_style('aio-fonts', aio_asset('css/fonts.css'), [], aio_asset_ver('css/fonts.css'));
    wp_enqueue_style('aio-style', aio_asset('css/style.css'), ['aio-fonts'], aio_asset_ver('css/style.css'));
    wp_enqueue_style('aio-wp', aio_asset('css/wp.css'), ['aio-style'], aio_asset_ver('css/wp.css'));
    wp_dequeue_style('classic-theme-styles');
    wp_dequeue_style('global-styles');
    if ($role !== 'article') wp_dequeue_style('wp-block-library');

    $maps = in_array($role, ['labs', 'companies', 'tpl-lab', 'employer'], true);
    if ($maps) {
        wp_enqueue_style('leaflet', aio_asset('vendor/leaflet/leaflet.css'), [], '1.9.4');
        wp_enqueue_script('leaflet', aio_asset('vendor/leaflet/leaflet.js'), [], '1.9.4', true);
    }
    wp_enqueue_script('aio-geo', aio_asset('js/geo.js'), [], aio_asset_ver('js/geo.js'), true);
    wp_enqueue_script('aio-data', aio_data_url(), ['aio-geo'], null, true);
    wp_enqueue_script('aio-app', aio_asset('js/app.js'), ['aio-data'], aio_asset_ver('js/app.js'), true);
    wp_add_inline_script('aio-app', 'window.AIO_CFG=' . aio_json(aio_js_config()) . ';window.AIO_ME=' . aio_json(aio_build_me()) . ';', 'before');
    if ($maps) wp_enqueue_script('aio-map', aio_asset('js/map.js'), ['aio-app', 'leaflet'], aio_asset_ver('js/map.js'), true);
    /* رزومه‌ی ساخت‌یافته، تطبیق و سازمان‌ها — اجزای مشترک با دمو */
    $deps = $maps ? ['aio-map'] : ['aio-app'];
    $talent_roles = ['dashboard', 'employer', 'talent', 'tpl-job', 'tpl-lab', 'labs', 'companies', 'products', 'tpl-product'];
    if (in_array($role, $talent_roles, true)) {
        foreach (['match' => 'aio-app', 'talent-ui' => 'aio-match', 'talent-wp' => 'aio-talent-ui'] as $f => $dep) {
            wp_enqueue_script('aio-' . $f, aio_asset("js/$f.js"), [$dep], aio_asset_ver("js/$f.js"), true);
        }
        $deps[] = 'aio-talent-wp';
        $extra = ['dashboard' => ['resume-builder', 'applications'], 'employer' => ['talent-center', 'employer-talent', 'applications'], 'talent' => ['talent-center', 'applications']][$role] ?? [];
        foreach ($extra as $f) {
            wp_enqueue_script('aio-' . $f, aio_asset("js/$f.js"), ['aio-talent-wp'], aio_asset_ver("js/$f.js"), true);
            $deps[] = 'aio-' . $f;
        }
    }
    $page_js = 'js/pages/' . $role . '.js';
    if ($role && file_exists(get_template_directory() . '/assets/' . $page_js)) {
        wp_enqueue_script('aio-page', aio_asset($page_js), $deps, aio_asset_ver($page_js), true);
    }
}, 20);

function aio_js_config(): array
{
    $pages = [];
    foreach (['home', 'jobs', 'labs', 'companies', 'products', 'talent', 'ranking', 'dashboard', 'employer', 'exams', 'assessment', 'mbti', 'courses', 'course-builder', 'magazine', 'community', 'faq', 'services', 'pricing', 'reports', 'advertise', 'about', 'contact', 'login', 'register', 'checkout', 'verify'] as $r) {
        $pages[$r] = wp_make_link_relative(aio_page_url($r));
    }
    return [
        'home' => home_url('/'), 'rest' => esc_url_raw(rest_url('aio/v1/')), 'nonce' => wp_create_nonce('wp_rest'),
        'role' => aio_current_role(), 'ctx' => (object) aio_ctx(), 'pages' => $pages,
        'logout' => html_entity_decode(wp_logout_url(home_url('/'))), 'lost' => html_entity_decode(wp_lostpassword_url()),
        'gateway' => aio_gateway(), 'paidPosting' => (bool) aio_opt('paid_job_posting', 0),
        'site' => ['name' => get_bloginfo('name'), 'email' => aio_opt('support_email', ''), 'phone' => aio_opt('phone', ''), 'appNote' => aio_opt('app_note', '')],
    ];
}

/* اسکریپت‌های قالب با defer */
add_filter('script_loader_tag', function ($tag, $handle) {
    if ((in_array($handle, ['aio-geo', 'aio-data', 'aio-app', 'aio-map', 'aio-page', 'leaflet'], true) || in_array($handle, ['aio-match', 'aio-talent-ui', 'aio-talent-wp', 'aio-resume-builder', 'aio-talent-center', 'aio-employer-talent', 'aio-applications'], true)) && !str_contains($tag, ' defer')) {
        return str_replace(' src=', ' defer src=', $tag);
    }
    return $tag;
}, 10, 2);
