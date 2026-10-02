<?php
/**
 * درون‌ریزی کاتالوگ‌ها و داده‌های نمونه‌ی رزومه/تطبیق (data/talent.json)
 * — فهرست‌ها و کاتالوگ‌ها فقط اگر خالی باشند ساخته می‌شوند (ویرایش‌های مدیر دست نمی‌خورد)
 * — نمونه‌ها (تکمیل مراکز، محصولات، نیازمندی آگهی‌ها، پوزیشن‌های داخلی، کارجویان) با _aio_sample علامت می‌خورند
 */
defined('ABSPATH') || exit;

const AIO_TALENT_VER = 2;

function aio_talent_import(bool $samples = true, bool $catalogs = true): array
{
    $s = aio_talent_seed();
    if (!$s) return ['خطا' => 'talent.json پیدا نشد'];
    @set_time_limit(300);
    $r = [];

    /* ---------- فهرست‌ها ---------- */
    $lists = get_option('aio_lists', []);
    if (!is_array($lists)) $lists = [];
    $lvl = fn($arr) => array_map(fn($x) => ['id' => (string) $x['v'], 'name' => $x['name']], (array) $arr);
    $idn = fn($arr, $extra = []) => array_map(function ($x) use ($extra) {
        $row = ['id' => (string) $x['id'], 'name' => $x['name']];
        foreach ($extra as $k) if (isset($x[$k])) $row[$k] = $x[$k];
        return $row;
    }, (array) $arr);
    $want = [
        'skill_groups' => $idn($s['AIO_SKILL_GROUPS'], ['color']), 'skill_levels' => $lvl($s['AIO_SKILL_LEVELS']),
        'seniority' => $lvl($s['AIO_SENIORITY']), 'degree_levels' => $lvl($s['AIO_DEGREE_LEVELS']),
        'languages' => $idn($s['AIO_LANGUAGES']), 'lang_levels' => $lvl($s['AIO_LANG_LEVELS']),
        'availability' => $idn($s['AIO_AVAILABILITY']), 'org_types' => $idn($s['AIO_ORG_TYPES'], ['short']),
        'accreditations' => array_values($s['AIO_ACCREDITATIONS']), 'org_services' => array_values($s['AIO_ORG_SERVICES']),
        'reject_reasons' => aio_reject_reasons(),
    ];
    $n = 0;
    foreach ($want as $k => $v) if (empty($lists[$k])) { $lists[$k] = $v; $n++; }
    /* رشته‌های تحصیلی که در کاتالوگ نمونه استفاده شده‌اند ولی در فهرست نیستند */
    $fields = (array) ($lists['fields_study'] ?? []);
    $used = [];
    foreach ((array) $s['AIO_JOB_REQ'] as $q) foreach ((array) ($q['fields'] ?? []) as $f) $used[] = $f;
    foreach ((array) $s['AIO_CANDIDATES'] as $c) foreach ((array) $c['education'] as $e) $used[] = $e['field'];
    foreach (array_unique($used) as $f) if (!in_array($f, $fields, true)) { $fields[] = $f; $n++; }
    $lists['fields_study'] = $fields;
    update_option('aio_lists', $lists);
    $r['فهرست‌ها'] = $n;

    /* ---------- کاتالوگ‌ها (فقط نصب اول؛ مهارتی که مدیر حذف کرده برنمی‌گردد) ---------- */
    $n = 0;
    if ($catalogs) {
    foreach ($s['AIO_SKILLS'] as $i => $x) $n += aio_upsert_term('aio_skill', $x['id'], $x['name'], ['group' => $x['group'], 'dept' => $x['dept'] ?? '', 'order' => $i + 1]) > 0;
    foreach ($s['AIO_ROLES'] as $i => $x) $n += aio_upsert_term('aio_role', $x['id'], $x['name'], ['dept' => $x['dept'] ?? '', 'order' => $i + 1]) > 0;
    foreach ($s['AIO_UNIVERSITIES'] as $i => $x) $n += aio_upsert_term('aio_university', $x['id'], $x['name'], ['order' => $i + 1]) > 0;
    foreach ($s['AIO_LICENSES'] as $i => $x) $n += aio_upsert_term('aio_license', $x['id'], $x['name'], ['order' => $i + 1]) > 0;
    foreach ($s['AIO_PRODUCT_CATS'] as $i => $x) $n += aio_upsert_term('aio_product_cat', $x['id'], $x['name'], ['icon' => $x['icon'], 'color' => $x['color'], 'bg' => $x['bg'], 'order' => $i + 1]) > 0;
    }
    $r['کاتالوگ‌ها'] = $n;
    aio_catalog_flush();
    $r['برگه‌های جدید'] = aio_import_pages();
    $r['منو'] = aio_talent_menus();
    update_option('aio_talent_ver', AIO_TALENT_VER, false);
    if (!$samples) { do_action('aio_data_changed'); return $r; }

    /* ---------- تکمیل مراکز نمونه ---------- */
    $n = 0;
    foreach ($s['AIO_ORG_EXTRA'] as $demo => $x) {
        $id = aio_post_by_demo('aio_lab', 'lab-' . $demo);
        if (!$id || aio_meta($id, 'org_type')) continue;
        aio_set_meta($id, 'org_type', $x['orgType']);
        aio_set_meta($id, 'tagline', $x['tagline'] ?? '');
        aio_set_meta($id, 'services', $x['services'] ?? []);
        aio_set_meta($id, 'accreditations', $x['accreditations'] ?? []);
        aio_set_meta($id, 'gallery', array_map(fn($g) => ['att' => 0, 't' => $g['t'], 'c' => $g['c']], $x['gallery'] ?? []));
        aio_set_meta($id, 'branches', $x['branches'] ?? '');
        $h = (string) ($x['hours'] ?? '');
        if ($h === 'شبانه‌روزی') aio_set_meta($id, 'hours_24', 1);
        elseif ($h) {
            aio_set_meta($id, 'hours_days', str_contains($h, 'همه‌روزه') ? [0, 1, 2, 3, 4, 5, 6] : (str_contains($h, 'پنجشنبه') ? [0, 1, 2, 3, 4, 5] : [0, 1, 2, 3, 4]));
            if (preg_match_all('/[۰-۹0-9]+/u', aio_en_digits($h), $m) && count($m[0]) >= 2) { aio_set_meta($id, 'hours_from', (int) $m[0][0]); aio_set_meta($id, 'hours_to', (int) $m[0][1]); }
        }
        if (!empty($x['phone']) && !aio_meta($id, 'phone')) aio_set_meta($id, 'phone', $x['phone']);
        $n++;
    }
    $r['تکمیل مراکز'] = $n;

    /* ---------- محصولات نمونه ---------- */
    $n = 0;
    foreach ($s['AIO_PRODUCTS'] as $p) {
        $lab = aio_post_by_demo('aio_lab', 'lab-' . $p['orgId']);
        if (!$lab) continue;
        $id = aio_insert_sample(['post_type' => 'aio_product', 'post_title' => $p['name'], 'post_content' => $p['desc']], 'product-' . $p['id'], [
            'lab_id' => $lab, 'brand' => $p['brand'], 'model' => $p['model'], 'price' => $p['price'] ?: '',
            'specs' => array_map(fn($x) => ['k' => $x[0], 'v' => $x[1]], $p['specs']),
        ]);
        if ($id > 0) { wp_set_object_terms($id, $p['cat'], 'aio_product_cat'); $n++; }
    }
    $r['محصولات'] = $n;

    /* ---------- نیازمندی ساخت‌یافته‌ی آگهی‌های نمونه ---------- */
    $n = 0;
    foreach ($s['AIO_JOB_REQ'] as $demo => $q) {
        $id = aio_post_by_demo('aio_job', 'job-' . $demo);
        if (!$id || aio_meta($id, 'req_skills')) continue;
        aio_save_job_req($id, $q);
        $n++;
    }
    $r['نیازمندی آگهی‌ها'] = $n;

    /* ---------- پوزیشن‌های داخلی نمونه ---------- */
    $n = 0;
    $owner = (int) (get_users(['role' => 'administrator', 'number' => 1, 'fields' => 'ID'])[0] ?? 1);
    $first_lab = aio_post_by_demo('aio_lab', 'lab-1');
    foreach ($s['AIO_POSITIONS_INTERNAL'] as $p) {
        $id = aio_insert_sample(['post_type' => 'aio_job', 'post_title' => $p['title'], 'post_content' => '', 'post_status' => 'aio_internal', 'post_author' => $owner], 'pos-' . $p['id'], [
            'lab_id' => $first_lab, 'city' => $p['city'], 'province' => $p['provinceId'], 'internal' => 1, 'client_name' => $p['orgName'], 'type' => 'تمام‌وقت', 'shift' => 'صبح',
        ]);
        if ($id > 0) { wp_set_object_terms($id, $p['dept'], 'aio_dept'); aio_save_job_req($id, $p['req']); $n++; }
    }
    $r['پوزیشن‌های داخلی'] = $n;

    /* ---------- کارجویان نمونه با رزومه‌ی ساخت‌یافته ---------- */
    $n = 0;
    foreach ($s['AIO_CANDIDATES'] as $c) {
        $uid = 0;
        foreach (get_users(['meta_key' => 'aio_sample', 'meta_value' => '1', 'search' => $c['name'], 'search_columns' => ['display_name'], 'number' => 1, 'fields' => 'ID']) as $x) $uid = (int) $x;
        if (!$uid) {
            $email = 'sample-cand-' . $c['id'] . '@aiolab.invalid';
            $uid = (int) email_exists($email);
            if (!$uid) {
                $uid = wp_insert_user(['user_login' => 'sample_cand_' . $c['id'], 'user_email' => $email, 'user_pass' => wp_generate_password(24), 'display_name' => $c['name'], 'role' => 'aio_seeker']);
                if (is_wp_error($uid)) continue;
                update_user_meta($uid, 'aio_sample', 1);
            }
        }
        if (aio_cv($uid)) continue;
        /* سازمان‌های سوابق: شناسه‌ی دمو → شناسه‌ی وردپرس */
        foreach ($c['experience'] as &$e) {
            if (!empty($e['orgId'])) { $e['orgId'] = aio_post_by_demo('aio_lab', 'lab-' . $e['orgId']); if (!$e['orgId']) $e['orgType'] = 'other'; }
        }
        unset($e);
        $cv = aio_cv_sanitize($c);
        if (is_wp_error($cv)) continue;
        $cv['updated'] = $c['updated'] ?? gmdate('Y-m-d');
        aio_set_umeta($uid, 'cv', $cv);
        aio_set_umeta($uid, 'resume', array_merge(aio_resume_defaults(), aio_cv_legacy($cv)));
        aio_set_umeta($uid, 'otw', !empty($c['otw']) ? 1 : 0);
        aio_set_umeta($uid, 'resume_updated', strtotime($cv['updated']) ?: time());
        if (!empty($c['mbti'])) { aio_set_umeta($uid, 'mbti', ['type' => $c['mbti']]); aio_set_umeta($uid, 'mbti_public', 1); }
        $n++;
    }
    $r['کارجویان با رزومه‌ی ساخت‌یافته'] = $n;
    do_action('aio_data_changed');
    flush_rewrite_rules(false);
    return $r;
}

/** افزودن «شرکت‌ها» و «محصولات» به منوهای موجود (بدون دست زدن به بقیه‌ی ویرایش‌های مدیر) */
function aio_talent_menus(): int
{
    $n = 0;
    $locs = get_theme_mod('nav_menu_locations', []);
    $has = fn($items, $path) => (bool) array_filter($items, fn($i) => str_contains((string) $i->url, $path));
    if (!empty($locs['primary']) && ($items = wp_get_nav_menu_items($locs['primary']))) {
        $parent = null;
        foreach ($items as $i) if (str_contains((string) $i->url, '/labs/') && $i->menu_item_parent) $parent = (int) $i->menu_item_parent;
        if ($parent) {
            $order = 1000;
            if (!$has($items, '/companies/')) { aio_menu_item((int) $locs['primary'], 'شرکت‌ها', aio_page_url('companies'), $parent, 'تولیدکننده، واردکننده و توزیع‌کننده', 'building', $order++); $n++; }
            if (!$has($items, '/products/')) { aio_menu_item((int) $locs['primary'], 'محصولات و تجهیزات', aio_page_url('products'), $parent, 'کاتالوگ دستگاه، کیت و مواد مصرفی', 'machine', $order++); $n++; }
        }
    }
    if (!empty($locs['footer_2']) && ($items = wp_get_nav_menu_items($locs['footer_2']))) {
        foreach ($items as $i) {
            if (str_contains((string) $i->url, '/services/#matching')) {
                update_post_meta($i->ID, '_menu_item_url', esc_url_raw(aio_page_url('talent')));
                $n++;
            }
        }
    }
    if (!empty($locs['footer_3']) && ($items = wp_get_nav_menu_items($locs['footer_3'])) && !$has($items, '/companies/')) {
        aio_menu_item((int) $locs['footer_3'], 'شرکت‌ها و محصولات', aio_page_url('companies'), 0, '', '', count($items) + 1);
        $n++;
    }
    return $n;
}

/* ارتقای خودکار: سایت‌هایی که قبل از این نسخه ساخته شده‌اند، یک‌بار کاتالوگ‌ها (و اگر داده‌ی نمونه دارند، نمونه‌ها) را می‌گیرند */
add_action('admin_init', function () {
    $ver = (int) get_option('aio_talent_ver', 0);
    if ($ver >= AIO_TALENT_VER || !current_user_can('manage_options')) return;
    /* نمونه‌ها فقط بار اول؛ ارتقاهای بعدی فقط فهرست‌ها/کاتالوگ‌های جاافتاده را اضافه می‌کنند (حذف‌های مدیر برنمی‌گردد) */
    $has_samples = !$ver && get_posts(['post_type' => 'aio_lab', 'post_status' => 'any', 'meta_key' => '_aio_sample', 'meta_value' => '1', 'fields' => 'ids', 'numberposts' => 1]);
    aio_talent_import((bool) $has_samples, !$ver);
});

/* «درون‌ریزی داده‌های نمونه» در ابزارها هم بخش رزومه/تطبیق را انجام دهد */
add_filter('aio_import_all_extra', function ($r) { return $r + aio_talent_import(true); });
