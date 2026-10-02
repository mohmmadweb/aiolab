<?php
/* مسیریابی قالب: تک‌صفحه‌ها از «برگه‌ی قالب» (tpl-*) خوانده می‌شوند تا متن‌هایشان از پیشخوان قابل ویرایش باشد */
defined('ABSPATH') || exit;

/** شناسه‌ی برگه‌ی سیستمی با هر وضعیتی (برگه‌های قالب خصوصی‌اند) */
function aio_tpl_page(string $role): ?WP_Post
{
    $q = get_posts(['post_type' => 'page', 'post_status' => ['publish', 'private'], 'numberposts' => 1, 'meta_key' => '_aio_page', 'meta_value' => $role]);
    return $q[0] ?? null;
}

/** خروجی محتوای یک برگه (بلوک‌ها + کدهای کوتاه) */
function aio_page_html(?WP_Post $p): string
{
    if (!$p) return '';
    $html = do_blocks($p->post_content);
    $html = do_shortcode(shortcode_unautop($html));
    return $html;
}

/* صفحات نیازمند ورود: هدایت سمت سرور به برگه‌ی ورود */
add_action('template_redirect', function () {
    if (is_user_logged_in()) return;
    $role = aio_current_role();
    if (in_array($role, ['dashboard', 'employer', 'course-builder', 'checkout', 'tpl-learn'], true)) {
        $to = add_query_arg(['redirect' => rawurlencode(wp_make_link_relative(home_url(add_query_arg([])))), 'role' => $role === 'employer' ? 'employer' : false], aio_page_url('login'));
        wp_safe_redirect($to);
        exit;
    }
}, 5);

add_filter('template_include', function ($tpl) {
    if (get_query_var('aio_learn')) {
        $c = get_post((int) get_query_var('aio_learn'));
        if (!$c || $c->post_type !== 'aio_course') { global $wp_query; $wp_query->set_404(); status_header(404); return get_404_template(); }
        status_header(200);
        return get_template_directory() . '/views/entity.php';
    }
    if (get_query_var('aio_verify')) {
        status_header(200);
        return get_template_directory() . '/views/verify.php';
    }
    if (is_singular(['aio_job', 'aio_lab', 'aio_course', 'aio_exam', 'aio_path', 'aio_product'])) {
        if (is_singular('aio_job') && !current_user_can('edit_posts') && get_queried_object()->post_author != get_current_user_id()
            && !preg_match('/bot|crawl|spider|slurp/i', (string) ($_SERVER['HTTP_USER_AGENT'] ?? ''))) {
            aio_set_meta(get_queried_object_id(), 'views', (int) aio_meta(get_queried_object_id(), 'views', 0) + 1);
        }
        return get_template_directory() . '/views/entity.php';
    }
    return $tpl;
}, 20);

/* برگه‌های قالب (tpl-*) و ۴۰۴ مستقیماً قابل مشاهده نیستند */
add_action('template_redirect', function () {
    if (is_page() && str_starts_with((string) get_post_meta(get_queried_object_id(), '_aio_page', true), 'tpl-') && !current_user_can('edit_pages')) {
        global $wp_query;
        $wp_query->set_404();
        status_header(404);
    }
});

/* کدهای کوتاه برای متن برگه‌ها: [aio_opt key="support_email" link="mailto"] ، [aio_count type="jobs"] */
add_shortcode('aio_opt', function ($a) {
    $a = shortcode_atts(['key' => '', 'link' => '', 'default' => ''], $a);
    $v = (string) aio_opt($a['key'], $a['default']);
    if ($v === '') return '';
    if ($a['link'] === 'mailto') return '<a href="mailto:' . esc_attr($v) . '">' . esc_html($v) . '</a>';
    if ($a['link'] === 'tel') return '<a href="tel:' . esc_attr(preg_replace('/[^0-9+]/', '', aio_en_digits($v))) . '" dir="ltr">' . esc_html($v) . '</a>';
    if ($a['link'] === 'url') return '<a href="' . esc_url($v) . '" target="_blank" rel="noopener">' . esc_html($v) . '</a>';
    return esc_html($v);
});
add_shortcode('aio_icon', fn($a) => aio_icon((string) (shortcode_atts(['name' => 'flask'], $a)['name'])));
add_shortcode('aio_count', function ($a) {
    $a = shortcode_atts(['type' => 'jobs', 'plus' => ''], $a);
    $d = aio_data();
    $n = ['jobs' => count($d['AIO_JOBS']), 'labs' => count($d['AIO_LABS']), 'courses' => count($d['AIO_COURSES']), 'exams' => count($d['AIO_EXAMS']),
        'provinces' => count(array_unique(array_filter(array_column($d['AIO_LABS'], 'provinceId')))),
        'seekers' => (int) (count_users()['avail_roles']['aio_seeker'] ?? 0) + (int) (count_users()['avail_roles']['aio_volunteer'] ?? 0)][$a['type']] ?? 0;
    return esc_html(($a['plus'] ? '+' : '') . aio_fa_money($n));
});
