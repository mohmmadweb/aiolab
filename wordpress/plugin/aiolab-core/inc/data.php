<?php
/**
 * لایه‌ی داده: ساخت داده‌های عمومی سایت (همان ساختار ثابت‌های AIO_* دمو) از پایگاه داده
 * و وضعیت کاربر واردشده (AIO_ME). داده‌ی عمومی کش می‌شود و پس از هر تغییر تازه می‌شود.
 */
defined('ABSPATH') || exit;

/* ---------- نسخه و کش ---------- */
function aio_data_version(): string
{
    $v = get_option('aio_data_ver');
    if (!$v) {
        $v = (string) time();
        update_option('aio_data_ver', $v, true);
    }
    return $v;
}

add_action('aio_data_changed', function () {
    update_option('aio_data_ver', (string) (time() . wp_rand(10, 99)), true);
    delete_transient('aio_data_cache');
});

/* هر تغییر در محتوای آیولب، کش را باطل می‌کند */
$aio_touch = function ($post_id = 0) {
    $pt = $post_id ? get_post_type($post_id) : '';
    if (!$post_id || str_starts_with((string) $pt, 'aio_') || $pt === 'post') do_action('aio_data_changed');
};
add_action('save_post', $aio_touch, 99);
add_action('deleted_post', $aio_touch, 99);
add_action('trashed_post', $aio_touch, 99);
add_action('transition_comment_status', fn() => do_action('aio_data_changed'));
add_action('wp_insert_comment', fn() => do_action('aio_data_changed'));
add_action('edited_term', fn() => do_action('aio_data_changed'));
add_action('created_term', fn() => do_action('aio_data_changed'));
add_action('delete_term', fn() => do_action('aio_data_changed'));
add_action('updated_option', function ($o) {
    if (in_array($o, ['aio_lists', 'aio_tests'], true)) delete_transient('aio_data_cache');
});

function aio_data(): array
{
    $ver = aio_data_version();
    $c = get_transient('aio_data_cache');
    if (is_array($c) && ($c['_v'] ?? '') === $ver) return $c;
    $c = aio_build_data();
    $c['_v'] = $ver;
    set_transient('aio_data_cache', $c, DAY_IN_SECONDS);
    return $c;
}

function aio_data_url(): string
{
    return home_url('/aio-data.js?v=' . aio_data_version());
}

/* سرو فایل داده به‌صورت اسکریپت: const AIO_JOBS = [...]; ... */
add_action('template_redirect', function () {
    if (!get_query_var('aio_data')) return;
    $d = aio_data();
    $fresh = isset($_GET['v']) && $_GET['v'] === $d['_v'];
    unset($d['_v']);
    nocache_headers();
    header('Content-Type: application/javascript; charset=utf-8');
    header($fresh ? 'Cache-Control: public, max-age=31536000, immutable' : 'Cache-Control: no-cache');
    header_remove('Pragma');
    header_remove('Expires');
    echo "/* آیولب — داده‌های سایت (تولید خودکار از پیشخوان) */\n";
    foreach ($d as $k => $v) echo 'const ' . $k . ' = ' . aio_json($v) . ";\n";
    exit;
}, 1);

/* ---------- ساختار هر موجودیت ---------- */
function aio_term_item(WP_Term $t, array $keys): array
{
    $o = ['id' => $t->slug, 'name' => $t->name];
    foreach ($keys as $k) $o[$k] = get_term_meta($t->term_id, 'aio_' . $k, true);
    return $o;
}

function aio_terms(string $tax, array $keys): array
{
    $terms = get_terms(['taxonomy' => $tax, 'hide_empty' => false]);
    if (is_wp_error($terms)) return [];
    usort($terms, fn($a, $b) => ((int) get_term_meta($a->term_id, 'aio_order', true)) <=> ((int) get_term_meta($b->term_id, 'aio_order', true)));
    return array_map(fn($t) => aio_term_item($t, $keys), $terms);
}

function aio_first_term_slug(int $post_id, string $tax): string
{
    $t = get_the_terms($post_id, $tax);
    return ($t && !is_wp_error($t)) ? $t[0]->slug : '';
}

function aio_review_stars(WP_Comment $c): int
{
    $s = (float) get_comment_meta($c->comment_ID, 'aio_stars', true);
    return (int) round($s > 0 ? $s : (float) get_comment_meta($c->comment_ID, 'aio_display_stars', true));
}

function aio_reviews_of(int $post_id): array
{
    return get_comments(['post_id' => $post_id, 'status' => 'approve', 'type' => 'aio_review', 'orderby' => 'comment_date_gmt', 'order' => 'DESC']);
}

/** امتیاز ترکیبی: امتیاز پایه × تعداد پایه + نظرات تأییدشده */
function aio_rating_of(int $post_id, array $breakdown_keys = []): array
{
    $base = (float) aio_meta($post_id, 'rating_base', 0);
    $base_n = (int) aio_meta($post_id, 'rating_count_base', 0);
    $sum = $base * $base_n;
    $n = $base_n;
    $bd = [];
    foreach ($breakdown_keys as $k) $bd[$k] = ((float) aio_meta($post_id, 'rb_' . $k, $base)) * $base_n;
    foreach (aio_reviews_of($post_id) as $c) {
        $s = (float) get_comment_meta($c->comment_ID, 'aio_stars', true);
        if ($s <= 0) continue;
        $sum += $s;
        $n++;
        $b = (array) get_comment_meta($c->comment_ID, 'aio_breakdown', true);
        foreach ($breakdown_keys as $k) $bd[$k] += (float) ($b[$k] ?? $s);
    }
    $out = ['rating' => $n ? round($sum / $n, 1) : 0, 'count' => $n];
    if ($breakdown_keys) {
        foreach ($breakdown_keys as $k) $bd[$k] = $n ? round($bd[$k] / $n, 1) : 0;
        $out['breakdown'] = $bd;
    }
    return $out;
}

const AIO_LAB_BREAKDOWN = ['salary', 'environment', 'learning', 'management', 'worklife'];

function aio_lab_item(WP_Post $p): array
{
    $id = $p->ID;
    $r = aio_rating_of($id, AIO_LAB_BREAKDOWN);
    $logo = get_post_thumbnail_id($id);
    return [
        'id' => $id, 'name' => $p->post_title, 'vertical' => aio_meta($id, 'vertical', 'lab'),
        'city' => (string) aio_meta($id, 'city', ''), 'provinceId' => (string) aio_meta($id, 'province', ''),
        'type' => (string) aio_meta($id, 'type', ''), 'sector' => (string) aio_meta($id, 'sector', ''),
        'orgKind' => (string) aio_meta($id, 'org_kind', ''), 'size' => (string) aio_meta($id, 'size', ''),
        'color' => aio_hex(aio_meta($id, 'color', '')), 'lat' => (float) aio_meta($id, 'lat', 0), 'lng' => (float) aio_meta($id, 'lng', 0),
        'address' => (string) aio_meta($id, 'address', ''), 'about' => wp_strip_all_tags($p->post_content),
        'perks' => array_values((array) aio_meta($id, 'perks', [])), 'staff' => (int) aio_meta($id, 'staff', 0),
        'founded' => (int) aio_meta($id, 'founded', 0), 'verified' => (bool) aio_meta($id, 'verified', 0),
        'avgSalary' => (float) aio_meta($id, 'avg_salary', 0), 'avgSalaryUpdated' => (string) aio_meta($id, 'avg_salary_updated', ''),
        'rating' => $r['rating'], 'ratingCount' => $r['count'], 'ratingBreakdown' => $r['breakdown'],
        'phone' => (string) aio_meta($id, 'phone', ''), 'email' => (string) aio_meta($id, 'email', ''), 'website' => (string) aio_meta($id, 'website', ''),
        'logo' => $logo ? wp_get_attachment_image_url($logo, 'thumbnail') : null,
        'url' => get_permalink($p), 'status' => $p->post_status,
    ] + aio_lab_extra($id);
}

function aio_job_item(WP_Post $p): array
{
    $id = $p->ID;
    return [
        'id' => $id, 'title' => $p->post_title, 'labId' => (int) aio_meta($id, 'lab_id', 0),
        'vertical' => aio_meta($id, 'vertical', 'lab'), 'city' => (string) aio_meta($id, 'city', ''),
        'provinceId' => (string) aio_meta($id, 'province', ''), 'dept' => aio_first_term_slug($id, 'aio_dept'),
        'type' => (string) aio_meta($id, 'type', ''), 'shift' => (string) aio_meta($id, 'shift', ''),
        'salary' => (string) aio_meta($id, 'salary', 'توافقی'),
        'salaryMin' => (float) aio_meta($id, 'salary_min', 0), 'salaryMax' => (float) aio_meta($id, 'salary_max', 0),
        'experience' => (string) aio_meta($id, 'experience', ''), 'degree' => (string) aio_meta($id, 'degree', ''),
        'fieldOfStudy' => (string) aio_meta($id, 'field_of_study', ''), 'gender' => (string) aio_meta($id, 'gender', 'فرقی نمی‌کند'),
        'military' => (string) aio_meta($id, 'military', 'مهم نیست'),
        'remote' => (bool) aio_meta($id, 'remote', 0), 'urgent' => (bool) aio_meta($id, 'urgent', 0), 'featured' => (bool) aio_meta($id, 'featured', 0),
        'days' => aio_days_ago($p), 'date' => aio_jdate('Y/m/d', get_post_time('U', true, $p)),
        'benefits' => array_values((array) aio_meta($id, 'benefits', [])), 'skills' => array_values((array) aio_meta($id, 'skills', [])),
        'desc' => wp_strip_all_tags($p->post_content), 'requirements' => array_values((array) aio_meta($id, 'requirements', [])),
        'expires' => (string) aio_meta($id, 'expires', ''), 'url' => $p->post_status === 'aio_internal' ? '' : get_permalink($p),
        'req' => aio_job_req($id), 'internal' => $p->post_status === 'aio_internal', 'clientName' => (string) aio_meta($id, 'client_name', ''),
    ];
}

function aio_exam_item(WP_Post $p, bool $with_answers = false): array
{
    $id = $p->ID;
    $qs = [];
    foreach ((array) aio_meta($id, 'questions', []) as $q) {
        $item = ['q' => (string) ($q['q'] ?? ''), 'options' => array_values((array) ($q['options'] ?? []))];
        if ($with_answers) $item['answer'] = max(0, (int) ($q['correct'] ?? 1) - 1);
        $qs[] = $item;
    }
    return [
        'id' => $id, 'title' => $p->post_title, 'vertical' => aio_meta($id, 'vertical', 'lab'), 'dept' => aio_first_term_slug($id, 'aio_dept'),
        'authorLabId' => (int) aio_meta($id, 'author_lab', 0), 'level' => (string) aio_meta($id, 'level', ''),
        'duration' => (int) aio_meta($id, 'duration', 15), 'passScore' => (int) aio_meta($id, 'pass_score', 60),
        'retakeDays' => (int) aio_meta($id, 'retake_days', 7), 'price' => (int) aio_meta($id, 'price', 0),
        'badge' => (string) aio_meta($id, 'badge', '🏅'), 'color' => aio_hex(aio_meta($id, 'color', '')), 'bg' => aio_hex(aio_meta($id, 'bg', ''), '#ccfbf1'),
        'takers' => (int) aio_meta($id, 'takers_base', 0) + (int) aio_meta($id, 'takers', 0),
        'certIssued' => (int) aio_meta($id, 'certs_base', 0) + (int) aio_meta($id, 'passes', 0),
        'desc' => wp_strip_all_tags($p->post_content), 'qCount' => count($qs),
        /* سؤالات عمومی بدون پاسخ؛ پاسخ‌ها فقط سمت سرور تصحیح می‌شوند */
        'questions' => $with_answers ? $qs : array_map(fn($q) => ['q' => $q['q'], 'options' => $q['options']], $qs),
        'url' => get_permalink($p), 'status' => $p->post_status,
    ];
}

function aio_course_syllabus_public(array $syl): array
{
    $out = [];
    foreach ($syl as $m) {
        $lessons = [];
        foreach ((array) ($m['lessons'] ?? []) as $l) {
            $lessons[] = ['t' => (string) ($l['t'] ?? ''), 'type' => (string) ($l['type'] ?? 'video'), 'min' => (int) ($l['min'] ?? 0),
                'hasVideo' => !empty($l['video']), 'qCount' => count((array) ($l['questions'] ?? []))];
        }
        $out[] = ['title' => (string) ($m['title'] ?? ''), 'hours' => (float) ($m['hours'] ?? 0), 'lessons' => $lessons];
    }
    return $out;
}

function aio_course_item(WP_Post $p): array
{
    $id = $p->ID;
    $r = aio_rating_of($id);
    $reviews = [];
    foreach (aio_reviews_of($id) as $c) {
        $reviews[] = ['name' => $c->comment_author, 'role' => (string) get_comment_meta($c->comment_ID, 'aio_role', true),
            'stars' => aio_review_stars($c), 'date' => aio_jdate('Y/m/d', strtotime($c->comment_date_gmt . ' UTC')),
            'text' => wp_strip_all_tags($c->comment_content)];
    }
    $related = (int) aio_meta($id, 'related_exam', 0);
    $old = aio_meta($id, 'old_price', '');
    $item = [
        'id' => $id, 'type' => aio_meta($id, 'type', 'course'), 'title' => $p->post_title, 'subtitle' => (string) aio_meta($id, 'subtitle', ''),
        'about' => apply_filters('the_content', $p->post_content),
        'cat' => aio_first_term_slug($id, 'aio_course_cat'), 'level' => (string) aio_meta($id, 'level', ''),
        'format' => (string) aio_meta($id, 'format', 'self'), 'lang' => (string) aio_meta($id, 'lang', 'فارسی'),
        'providerId' => (string) aio_meta($id, 'provider', 'aiolab'), 'instructorIds' => array_values((array) aio_meta($id, 'instructors', [])),
        'price' => (int) aio_meta($id, 'price', 0), 'hours' => (float) aio_meta($id, 'hours', 0), 'weeks' => (int) aio_meta($id, 'weeks', 1),
        'cert' => (bool) aio_meta($id, 'cert', 1), 'certType' => (string) aio_meta($id, 'cert_type', 'گواهی مهارت آیولب'),
        'rating' => $r['rating'], 'ratingCount' => $r['count'],
        'students' => (int) aio_meta($id, 'students_base', 0) + (int) aio_meta($id, 'enrolled', 0),
        'updated' => (string) aio_meta($id, 'updated', aio_jdate('Y/m', get_post_modified_time('U', true, $p))),
        'bestseller' => (bool) aio_meta($id, 'bestseller', 0), 'isNew' => (bool) aio_meta($id, 'is_new', 0), 'featured' => (bool) aio_meta($id, 'featured', 0),
        'skills' => array_values((array) aio_meta($id, 'skills', [])), 'outcomes' => array_values((array) aio_meta($id, 'outcomes', [])),
        'prereq' => array_values((array) aio_meta($id, 'prereq', [])), 'audience' => array_values((array) aio_meta($id, 'audience', [])),
        'syllabus' => aio_course_syllabus_public((array) aio_meta($id, 'syllabus', [])),
        'faq' => array_values((array) aio_meta($id, 'faq', [])), 'reviews' => $reviews,
        'url' => get_permalink($p), 'status' => $p->post_status,
    ];
    if ($old) $item['oldPrice'] = (int) $old;
    if ($related) $item['relatedExamId'] = $related;
    if ($v = aio_meta($id, 'next_start', '')) $item['nextStart'] = $v;
    if ($v = aio_meta($id, 'seats', '')) $item['seats'] = (int) $v;
    return $item;
}

function aio_path_item(WP_Post $p): array
{
    $id = $p->ID;
    $item = [
        'id' => $p->post_name, 'wpId' => $id, 'kind' => aio_meta($id, 'kind', 'specialization'), 'title' => $p->post_title,
        'desc' => wp_strip_all_tags($p->post_content), 'role' => (string) aio_meta($id, 'role', ''), 'level' => (string) aio_meta($id, 'level', ''),
        'courseIds' => array_values(array_map('intval', (array) aio_meta($id, 'courses', []))),
        'color' => aio_hex(aio_meta($id, 'color', '')), 'bg' => aio_hex(aio_meta($id, 'bg', ''), '#ccfbf1'), 'icon' => (string) aio_meta($id, 'icon', 'path'),
        'students' => (int) aio_meta($id, 'students_base', 0), 'rating' => (float) aio_meta($id, 'rating', 0),
        'cert' => (string) aio_meta($id, 'cert', ''), 'outcomes' => array_values((array) aio_meta($id, 'outcomes', [])),
        'url' => get_permalink($p),
    ];
    if ($e = (int) aio_meta($id, 'related_exam', 0)) $item['relatedExamId'] = $e;
    return $item;
}

function aio_service_item(WP_Post $p): array
{
    $id = $p->ID;
    $price = aio_meta($id, 'price', null);
    $item = [
        'code' => (string) aio_meta($id, 'code', 'S' . $id), 'wpId' => $id, 'group' => aio_first_term_slug($id, 'aio_service_group'),
        'stream' => (string) aio_meta($id, 'stream', ''), 'payer' => (string) aio_meta($id, 'payer', 'any'), 'model' => (string) aio_meta($id, 'model', 'txn'),
        'priority' => (int) aio_meta($id, 'priority', 1), 'title' => $p->post_title, 'desc' => wp_strip_all_tags($p->post_content),
        'priceModel' => (string) aio_meta($id, 'price_model', ''), 'unit' => (string) aio_meta($id, 'unit', ''),
        'price' => ($price === null || $price === '') ? null : (int) $price,
        'features' => array_values((array) aio_meta($id, 'features', [])),
    ];
    foreach (['highlight', 'limited', 'plan'] as $b) if (aio_meta($id, $b, 0)) $item[$b] = true;
    foreach (['note' => 'note', 'freeLabel' => 'free_label', 'priceLabel' => 'price_label'] as $k => $m) if ($v = aio_meta($id, $m, '')) $item[$k] = $v;
    return $item;
}

function aio_article_item(WP_Post $p): array
{
    $cats = get_the_category($p->ID);
    $thumb = get_post_thumbnail_id($p->ID);
    return [
        'id' => $p->ID, 'cat' => $cats ? $cats[0]->name : 'مجله', 'title' => $p->post_title,
        'time' => (string) aio_meta($p->ID, 'read_time', ''), 'date' => aio_time_ago(get_post_time('U', true, $p)),
        'color' => aio_hex(aio_meta($p->ID, 'color', '')), 'bg' => aio_hex(aio_meta($p->ID, 'bg', ''), '#ccfbf1'),
        'icon' => (string) aio_meta($p->ID, 'icon', 'doc'), 'url' => get_permalink($p),
        'excerpt' => wp_trim_words(wp_strip_all_tags($p->post_excerpt ?: $p->post_content), 30),
        'thumb' => $thumb ? wp_get_attachment_image_url($thumb, 'medium_large') : null,
    ];
}

function aio_community_item(WP_Post $p): array
{
    $u = get_userdata((int) $p->post_author);
    $name = (string) aio_meta($p->ID, 'author_name', '') ?: ($u ? $u->display_name : 'کاربر آیولب');
    return [
        'id' => $p->ID, 'author' => $name, 'role' => (string) aio_meta($p->ID, 'role', '') ?: ($u ? (get_user_meta($u->ID, 'aio_headline', true) ?: aio_role_label(aio_user_role($u))) : ''),
        'color' => aio_hex(aio_meta($p->ID, 'color', ''), AIO_DEFAULT_COLORS[$p->ID % 8]),
        'time' => aio_time_ago(get_post_time('U', true, $p)),
        'likes' => (int) aio_meta($p->ID, 'likes_base', 0) + (int) aio_meta($p->ID, 'likes', 0),
        'comments' => (int) get_comments(['post_id' => $p->ID, 'status' => 'approve', 'count' => true]),
        'text' => wp_strip_all_tags($p->post_content),
    ];
}

const AIO_DEFAULT_COLORS = ['#0d9488', '#0ea5e9', '#8b5cf6', '#f59e0b', '#f43f5e', '#115e59', '#6366f1', '#059669'];

function aio_posts(string $type, array $args = []): array
{
    return get_posts($args + ['post_type' => $type, 'post_status' => 'publish', 'numberposts' => -1, 'orderby' => 'menu_order date', 'order' => 'ASC', 'suppress_filters' => false]);
}

/* ---------- داده‌ی عمومی کامل ---------- */
function aio_build_data(): array
{
    $l = fn($n, $d = []) => aio_list($n, $d);
    $tests = get_option('aio_tests', []);

    $labs = array_map('aio_lab_item', aio_posts('aio_lab', ['orderby' => 'date', 'order' => 'ASC']));
    $jobs = array_map('aio_job_item', aio_posts('aio_job', ['orderby' => 'date', 'order' => 'DESC']));
    $lab_ids = array_column($labs, 'id');
    $jobs = array_values(array_filter($jobs, fn($j) => in_array($j['labId'], $lab_ids, true)));

    $reviews = [];
    foreach (get_comments(['post_type' => 'aio_lab', 'status' => 'approve', 'type' => 'aio_review', 'number' => 300]) as $c) {
        $reviews[] = ['labId' => (int) $c->comment_post_ID, 'author' => (string) get_comment_meta($c->comment_ID, 'aio_title', true) ?: 'کاربر آیولب',
            'role' => (string) get_comment_meta($c->comment_ID, 'aio_role', true), 'date' => aio_jdate('Y/m/d', strtotime($c->comment_date_gmt . ' UTC')),
            'stars' => aio_review_stars($c), 'text' => wp_strip_all_tags($c->comment_content),
            'pros' => (string) get_comment_meta($c->comment_ID, 'aio_pros', true), 'cons' => (string) get_comment_meta($c->comment_ID, 'aio_cons', true)];
    }

    $services = array_map('aio_service_item', aio_posts('aio_service'));
    usort($services, fn($a, $b) => strnatcmp($a['code'], $b['code']));

    $faq = [];
    foreach (aio_terms('aio_faq_cat', []) as $cat) {
        $items = [];
        foreach (aio_posts('aio_faq', ['tax_query' => [['taxonomy' => 'aio_faq_cat', 'field' => 'slug', 'terms' => $cat['id']]]]) as $f) {
            $items[] = ['q' => $f->post_title, 'a' => trim(preg_replace('/<!--.*?-->/s', '', $f->post_content))];
        }
        if ($items) $faq[] = ['cat' => $cat['name'], 'items' => $items];
    }

    $mbti_types = [];
    foreach ((array) ($tests['mbti_types'] ?? []) as $t) {
        if (!empty($t['code'])) $mbti_types[strtoupper($t['code'])] = ['name' => $t['name'] ?? '', 'short' => $t['short'] ?? '', 'fit' => array_values((array) ($t['fit'] ?? []))];
    }
    $lesson_types = [];
    foreach ((array) $l('lesson_types') as $t) $lesson_types[$t['id']] = ['name' => $t['name'], 'icon' => $t['icon'] ?? ''];

    $num = fn($arr, $keys) => array_map(function ($x) use ($keys) {
        foreach ($keys as $k) if (isset($x[$k])) $x[$k] = (float) $x[$k];
        return $x;
    }, (array) $arr);

    $verticals = array_map(fn($v) => ['active' => !empty($v['active'])] + $v, (array) $l('verticals'));

    return [
        'AIO_COLORS' => $l('colors', AIO_DEFAULT_COLORS),
        'AIO_VERTICALS' => $verticals,
        'AIO_DEPARTMENTS' => aio_terms('aio_dept', ['en', 'icon', 'color', 'bg']),
        'AIO_SECTORS' => $l('sectors'), 'AIO_ORG_KINDS' => $l('org_kinds'), 'AIO_ORG_SIZES' => $l('org_sizes'),
        'AIO_JOB_TYPES' => $l('job_types'), 'AIO_SHIFTS' => $l('shifts'), 'AIO_DEGREES' => $l('degrees'),
        'AIO_FIELDS_STUDY' => $l('fields_study'), 'AIO_GENDERS' => $l('genders'), 'AIO_MILITARY' => $l('military'),
        'AIO_EXPERIENCES' => $l('experiences'), 'AIO_BENEFITS' => $l('benefits'),
        'AIO_SALARY_BANDS' => $num($l('salary_bands'), ['min', 'max']), 'AIO_POST_AGES' => $num($l('post_ages'), ['days']),
        'AIO_CITIES' => array_values(array_unique(array_filter(array_column($labs, 'city')))),
        'AIO_LABS' => $labs, 'AIO_REVIEWS' => $reviews, 'AIO_JOBS' => $jobs,
        'AIO_EXAM_LEVELS' => $l('exam_levels'),
        'AIO_EXAMS' => array_map(fn($p) => aio_exam_item($p), aio_posts('aio_exam', ['orderby' => 'date', 'order' => 'ASC'])),
        'AIO_MBTI_QUESTIONS' => array_values((array) ($tests['mbti_questions'] ?? [])),
        'AIO_MBTI_TYPES' => (object) $mbti_types,
        'AIO_SELF_ASSESS' => array_values((array) ($tests['self_assess'] ?? [])),
        'AIO_ASSESS_LEVELS' => $num($tests['assess_levels'] ?? [], ['v']),
        'AIO_FAQ' => $faq,
        'AIO_ARTICLES' => array_map('aio_article_item', get_posts(['post_type' => 'post', 'post_status' => 'publish', 'numberposts' => 24])),
        'AIO_POSTS' => array_map('aio_community_item', get_posts(['post_type' => 'aio_community', 'post_status' => 'publish', 'numberposts' => 40])),
        'AIO_PAYERS' => $l('payers'), 'AIO_PAY_MODELS' => $l('pay_models'),
        'AIO_SERVICE_GROUPS' => aio_terms('aio_service_group', ['icon', 'color', 'bg', 'payer']) ? array_map(function ($g) {
            $t = get_term_by('slug', $g['id'], 'aio_service_group');
            $g['desc'] = $t ? $t->description : '';
            return $g;
        }, aio_terms('aio_service_group', ['icon', 'color', 'bg', 'payer'])) : [],
        'AIO_SERVICES' => $services,
        'AIO_COURSE_CATS' => aio_terms('aio_course_cat', ['icon', 'color', 'bg']),
        'AIO_COURSE_LEVELS' => $l('course_levels'), 'AIO_COURSE_FORMATS' => $l('course_formats'), 'AIO_COURSE_LANGS' => $l('course_langs'),
        'AIO_COURSE_DURATIONS' => $num($l('course_durations'), ['min', 'max']), 'AIO_COURSE_TYPES' => $l('course_types'),
        'AIO_LESSON_TYPES' => (object) $lesson_types,
        'AIO_PROVIDERS' => array_map(fn($p) => ['id' => $p->post_name, 'name' => $p->post_title, 'kind' => (string) aio_meta($p->ID, 'kind', ''),
            'color' => aio_hex(aio_meta($p->ID, 'color', '')), 'labId' => ((int) aio_meta($p->ID, 'lab_id', 0)) ?: null, 'about' => wp_strip_all_tags($p->post_content)],
            aio_posts('aio_provider', ['orderby' => 'date', 'order' => 'ASC'])),
        'AIO_INSTRUCTORS' => array_map(function ($p) {
            $ph = get_post_thumbnail_id($p->ID);
            return ['id' => $p->post_name, 'name' => $p->post_title, 'title' => (string) aio_meta($p->ID, 'title', ''), 'org' => (string) aio_meta($p->ID, 'org', ''),
                'color' => aio_hex(aio_meta($p->ID, 'color', '')), 'students' => (int) aio_meta($p->ID, 'students', 0), 'rating' => (float) aio_meta($p->ID, 'rating', 0),
                'courses' => (int) aio_meta($p->ID, 'courses_count', 0), 'bio' => wp_strip_all_tags($p->post_content), 'photo' => $ph ? wp_get_attachment_image_url($ph, 'thumbnail') : null];
        }, aio_posts('aio_instructor', ['orderby' => 'date', 'order' => 'ASC'])),
        'AIO_COURSES' => array_map('aio_course_item', aio_posts('aio_course', ['orderby' => 'date', 'order' => 'ASC'])),
        'AIO_LEARNING_PATHS' => array_map('aio_path_item', aio_posts('aio_path', ['orderby' => 'date', 'order' => 'ASC'])),
        'AIO_TRENDING_SKILLS' => $l('trending_skills'),
    ] + aio_talent_bundle();
}
