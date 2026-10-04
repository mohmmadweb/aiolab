<?php
/**
 * رزومه‌ی ساخت‌یافته، کاتالوگ‌ها، موتور تطبیق (همسان با assets/js/match.js)،
 * پروفایل کامل سازمان (گالری، خدمات، ساعات، شبکه‌ها)، محصولات و API مرکز تطبیق.
 *
 * همه‌ی کاتالوگ‌ها از پیشخوان مدیریت می‌شوند:
 *   طبقه‌بندی‌ها: aio_skill (مهارت/دستگاه)، aio_role (عنوان شغلی)، aio_university، aio_license، aio_product_cat
 *   فهرست‌ها (تنظیمات آیولب ← رزومه و تطبیق): سطح مهارت، رده، مقطع، زبان، سطح زبان، آمادگی، نوع سازمان، اعتباربخشی، خدمات
 * سن و سابقه هرگز ذخیره نمی‌شوند؛ از تاریخ تولد و تاریخ‌های شروع/پایان محاسبه می‌شوند.
 */
defined('ABSPATH') || exit;

const AIO_WEEKDAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];
const AIO_SOCIALS = [['website', 'وب‌سایت'], ['instagram', 'اینستاگرام'], ['linkedin', 'لینکدین'], ['telegram', 'تلگرام'], ['aparat', 'آپارات']];

function aio_talent_seed(): array
{
    static $s = null;
    if ($s === null) $s = json_decode((string) @file_get_contents(AIO_DIR . 'data/talent.json'), true) ?: [];
    return $s;
}

/* ================================================================
   کاتالوگ‌ها
   ================================================================ */

/** فهرست سطح‌دار ({id: "1", name}) → [{v: 1, name}] */
function aio_levels(string $list): array
{
    $out = [];
    foreach ((array) aio_list($list, []) as $x) {
        if (!is_array($x) || !isset($x['id'])) continue;
        $out[] = ['v' => (int) $x['id'], 'name' => (string) ($x['name'] ?? $x['id'])];
    }
    usort($out, fn($a, $b) => $a['v'] <=> $b['v']);
    return $out;
}

function aio_id_list(string $list, array $extra = []): array
{
    $out = [];
    foreach ((array) aio_list($list, []) as $x) {
        if (!is_array($x) || empty($x['id'])) continue;
        $row = ['id' => (string) $x['id'], 'name' => (string) ($x['name'] ?? $x['id'])];
        foreach ($extra as $k) if (isset($x[$k])) $row[$k] = $x[$k];
        $out[] = $row;
    }
    return $out;
}

/** طبقه‌بندی کاتالوگ → [{id: slug, name, ...meta}] به ترتیب «ترتیب نمایش» */
function aio_catalog_flush(): void
{
    $GLOBALS['aio_catalog_cache'] = [];
}

function aio_catalog(string $tax, array $keys = []): array
{
    $cache = &$GLOBALS['aio_catalog_cache'];
    if (!is_array($cache)) $cache = [];
    $ck = $tax . implode(',', $keys);
    if (isset($cache[$ck])) return $cache[$ck];
    $terms = get_terms(['taxonomy' => $tax, 'hide_empty' => false]);
    if (is_wp_error($terms)) return [];
    $out = [];
    foreach ($terms as $t) {
        $row = ['id' => $t->slug, 'name' => $t->name];
        foreach ($keys as $k) $row[$k] = (string) get_term_meta($t->term_id, 'aio_' . $k, true);
        $row['_o'] = (int) get_term_meta($t->term_id, 'aio_order', true);
        $out[] = $row;
    }
    usort($out, fn($a, $b) => ($a['_o'] <=> $b['_o']) ?: strcmp($a['name'], $b['name']));
    return $cache[$ck] = array_map(function ($r) { unset($r['_o']); return $r; }, $out);
}

function aio_catalog_ids(string $tax): array
{
    return array_column(aio_catalog($tax), 'id');
}

/** وزن‌های موتور تطبیق (تنظیمات آیولب ← موتور تطبیق) */
function aio_match_weights(): array
{
    $sk = (float) aio_opt('match_w_skills', 65);
    $sk = max(0, min(100, $sk)) / 100;
    return ['skills' => $sk, 'criteria' => 1 - $sk, 'thresholdIrrelevant' => (int) aio_opt('match_t_low', 30),
        'high' => (int) aio_opt('match_t_high', 75), 'mid' => (int) aio_opt('match_t_mid', 55)];
}

/** کاتالوگ‌ها و داده‌های رزومه/سازمان برای فایل داده‌ی سایت */
function aio_talent_bundle(): array
{
    $products = array_map('aio_product_item', aio_posts('aio_product', ['orderby' => 'date', 'order' => 'DESC']));
    return [
        'AIO_SKILL_LEVELS' => aio_levels('skill_levels'),
        'AIO_SKILL_GROUPS' => aio_id_list('skill_groups', ['color']),
        'AIO_SKILLS' => aio_catalog('aio_skill', ['group', 'dept']),
        'AIO_ROLES' => aio_catalog('aio_role', ['dept']),
        'AIO_SENIORITY' => aio_levels('seniority'),
        'AIO_DEGREE_LEVELS' => aio_levels('degree_levels'),
        'AIO_UNIVERSITIES' => aio_catalog('aio_university'),
        'AIO_LICENSES' => aio_catalog('aio_license'),
        'AIO_LANGUAGES' => aio_id_list('languages'),
        'AIO_LANG_LEVELS' => aio_levels('lang_levels'),
        'AIO_AVAILABILITY' => aio_id_list('availability'),
        'AIO_ORG_TYPES' => aio_id_list('org_types', ['short']),
        'AIO_PRODUCT_CATS' => aio_catalog('aio_product_cat', ['icon', 'color', 'bg']),
        'AIO_ACCREDITATIONS' => array_values((array) aio_list('accreditations', [])),
        'AIO_ORG_SERVICES' => array_values((array) aio_list('org_services', [])),
        'AIO_WEEKDAYS' => AIO_WEEKDAYS,
        'AIO_SOCIALS' => AIO_SOCIALS,
        'AIO_MATCH_WEIGHTS' => aio_match_weights(),
        'AIO_APP_STATUSES' => AIO_APP_STATUSES, 'AIO_INTERVIEW_MODES' => AIO_INTERVIEW_MODES, 'AIO_REJECT_REASONS' => aio_reject_reasons(),
        'AIO_PRODUCTS' => $products,
    ];
}

/* ================================================================
   سازمان: نوع، گالری، خدمات، ساعات، شبکه‌ها
   ================================================================ */
function aio_lab_extra(int $id): array
{
    $gal = [];
    foreach ((array) aio_meta($id, 'gallery', []) as $g) {
        $att = (int) ($g['att'] ?? 0);
        $url = $att ? wp_get_attachment_image_url($att, 'large') : '';
        $gal[] = ['t' => (string) ($g['t'] ?? ''), 'att' => $att, 'img' => $url ?: null, 'c' => (string) ($g['c'] ?? '')];
    }
    $socials = [];
    foreach (['instagram', 'linkedin', 'telegram', 'aparat'] as $k) {
        $v = (string) aio_meta($id, 'social_' . $k, '');
        if ($v) $socials[$k] = $v;
    }
    $days = array_values(array_map('intval', (array) aio_meta($id, 'hours_days', [])));
    $spec = ['days' => $days, 'from' => (int) aio_meta($id, 'hours_from', 8), 'to' => (int) aio_meta($id, 'hours_to', 17), 'h24' => (bool) aio_meta($id, 'hours_24', 0)];
    $type = (string) aio_meta($id, 'org_type', '');
    if (!$type) $type = in_array((string) aio_meta($id, 'org_kind', ''), ['manufacturer', 'distributor', 'importer'], true) ? 'company' : 'lab';
    return [
        'orgType' => $type, 'tagline' => (string) aio_meta($id, 'tagline', ''),
        'services' => array_values((array) aio_meta($id, 'services', [])), 'accreditations' => array_values((array) aio_meta($id, 'accreditations', [])),
        'hoursSpec' => $spec, 'hours' => aio_hours_text($spec), 'socials' => (object) $socials, 'video' => (string) aio_meta($id, 'video', ''),
        'branches' => (int) aio_meta($id, 'branches', 0), 'gallery' => $gal,
    ];
}

function aio_hours_text(array $h): string
{
    if (!empty($h['h24'])) return 'شبانه‌روزی';
    $d = array_values(array_filter(array_map('intval', (array) ($h['days'] ?? [])), fn($x) => $x >= 0 && $x <= 6));
    if (!$d) return '';
    sort($d);
    $consec = count($d) > 2;
    foreach ($d as $i => $x) if ($i && $x !== $d[$i - 1] + 1) $consec = false;
    $days = $consec ? AIO_WEEKDAYS[$d[0]] . ' تا ' . AIO_WEEKDAYS[end($d)] : implode('، ', array_map(fn($x) => AIO_WEEKDAYS[$x], $d));
    return $days . ' ' . aio_fa((string) (int) ($h['from'] ?? 8)) . ' تا ' . aio_fa((string) (int) ($h['to'] ?? 17));
}

/* ================================================================
   محصولات
   ================================================================ */
function aio_product_item(WP_Post $p): array
{
    $id = $p->ID;
    $cat = aio_first_term_slug($id, 'aio_product_cat');
    $catc = null;
    foreach (aio_catalog('aio_product_cat', ['icon', 'color', 'bg']) as $c) if ($c['id'] === $cat) $catc = $c;
    $th = get_post_thumbnail_id($id);
    $price = aio_meta($id, 'price', '');
    return [
        'id' => $id, 'orgId' => (int) aio_meta($id, 'lab_id', 0), 'cat' => $cat, 'name' => $p->post_title,
        'brand' => (string) aio_meta($id, 'brand', ''), 'model' => (string) aio_meta($id, 'model', ''),
        'price' => ($price === '' || $price === null || (float) $price <= 0) ? null : (float) $price,
        'desc' => wp_strip_all_tags($p->post_content),
        'specs' => array_values(array_map(fn($s) => [(string) ($s['k'] ?? ''), (string) ($s['v'] ?? '')], (array) aio_meta($id, 'specs', []))),
        'img' => $th ? wp_get_attachment_image_url($th, 'large') : null, 'att' => (int) $th,
        'color' => $catc['color'] ?? '#0d9488', 'url' => get_permalink($p), 'status' => $p->post_status,
    ];
}

/* ================================================================
   نیازمندی ساخت‌یافته‌ی پوزیشن (آگهی یا پوزیشن داخلی)
   ================================================================ */
function aio_job_req(int $id): ?array
{
    $skills = [];
    foreach ((array) aio_meta($id, 'req_skills', []) as $s) {
        if (empty($s['id'])) continue;
        $skills[] = ['id' => (string) $s['id'], 'w' => max(1, min(10, (int) ($s['w'] ?? 5))), 'lvl' => max(1, min(5, (int) ($s['lvl'] ?? 3))), 'must' => !empty($s['must'])];
    }
    $role = (string) aio_meta($id, 'req_role', '');
    if (!$skills && !$role) return null;
    $r = ['role' => $role, 'skills' => $skills];
    if ($v = (int) aio_meta($id, 'req_seniority', 0)) $r['seniority'] = $v;
    if ($v = (float) aio_meta($id, 'req_min_exp', 0)) $r['minExp'] = (int) round($v * 12);
    if ($v = (float) aio_meta($id, 'req_exp_dept', 0)) $r['expDept'] = (int) round($v * 12);
    if ($v = (int) aio_meta($id, 'req_degree', 0)) $r['degree'] = $v;
    if ($v = array_values((array) aio_meta($id, 'req_fields', []))) $r['fields'] = $v;
    if ($v = array_values((array) aio_meta($id, 'req_licenses', []))) $r['licenses'] = $v;
    $langs = [];
    foreach ((array) aio_meta($id, 'req_langs', []) as $l) if (!empty($l['id'])) $langs[] = ['id' => (string) $l['id'], 'lvl' => max(1, (int) ($l['lvl'] ?? 2))];
    if ($langs) $r['langs'] = $langs;
    $amin = (int) aio_meta($id, 'req_age_min', 0);
    $amax = (int) aio_meta($id, 'req_age_max', 0);
    if ($amin || $amax) $r['age'] = [$amin ?: 16, $amax ?: 70];
    $g = (string) aio_meta($id, 'gender', '');
    if ($g && $g !== 'فرقی نمی‌کند') $r['gender'] = $g;
    if ($v = array_values((array) aio_meta($id, 'req_military', []))) $r['military'] = $v;
    return $r;
}

/* ================================================================
   رزومه‌ی ساخت‌یافته (CV)
   ================================================================ */
function aio_cv(int $uid): array
{
    $cv = aio_umeta($uid, 'cv', []);
    return is_array($cv) ? $cv : [];
}

function aio_valid_ym($s): ?string
{
    $s = aio_en_digits((string) $s);
    if (!preg_match('/^(\d{4})-(\d{2})$/', $s, $m)) return null;
    if ((int) $m[2] < 1 || (int) $m[2] > 12 || (int) $m[1] < 1940 || (int) $m[1] > (int) gmdate('Y') + 10) return null;
    return $s;
}

function aio_valid_date($s): ?string
{
    $s = aio_en_digits((string) $s);
    if (!preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $s, $m) || !checkdate((int) $m[2], (int) $m[3], (int) $m[1])) return null;
    return $s;
}

/** اعتبارسنجی کامل رزومه با کاتالوگ‌ها — هر شناسه‌ی نامعتبر کنار گذاشته می‌شود */
function aio_cv_sanitize(array $in)
{
    $skill_ids = aio_catalog_ids('aio_skill');
    $role_ids = aio_catalog_ids('aio_role');
    $dept_ids = array_column(aio_terms('aio_dept', []), 'id');
    $uni_ids = aio_catalog_ids('aio_university');
    $lic_ids = aio_catalog_ids('aio_license');
    $lang_ids = array_column(aio_id_list('languages'), 'id');
    $lv = fn($list) => array_column(aio_levels($list), 'v');
    $in_list = fn($v, $list) => in_array((string) $v, array_map('strval', (array) aio_list($list, [])), true) ? (string) $v : '';
    $provs = aio_province_options();
    $city_ok = function ($city, $prov = '') {
        foreach (aio_provinces() as $p) if ((!$prov || $p['id'] === $prov) && in_array($city, $p['cities'], true)) return true;
        return false;
    };
    $ids = fn($arr, $valid, $max) => array_slice(array_values(array_unique(array_filter(array_map('strval', (array) $arr), fn($x) => in_array($x, $valid, true)))), 0, $max);

    $cv = [];
    $cv['gender'] = in_array($in['gender'] ?? '', ['آقا', 'خانم'], true) ? $in['gender'] : '';
    $birth = aio_valid_date($in['birth'] ?? '');
    if ($birth) {
        $age = (int) date_diff(date_create($birth), date_create('today'))->y;
        if ($age < 14 || $age > 90) return aio_err('تاریخ تولد معتبر نیست.', 422, ['field' => 'birth']);
    }
    $cv['birth'] = $birth ?: '';
    $cv['provinceId'] = isset($provs[$in['provinceId'] ?? '']) ? $in['provinceId'] : '';
    $city = aio_clean_text($in['city'] ?? '', 60);
    $cv['city'] = ($city && $city_ok($city, $cv['provinceId'])) ? $city : '';
    $cv['relocate'] = !empty($in['relocate']);
    $cv['provinces'] = $ids($in['provinces'] ?? [], array_keys($provs), 31);
    $cv['military'] = $cv['gender'] === 'آقا' ? $in_list($in['military'] ?? '', 'military') : '';
    $cv['targetRoles'] = $ids($in['targetRoles'] ?? [], $role_ids, 6);
    $cv['seniority'] = in_array((int) ($in['seniority'] ?? 0), $lv('seniority'), true) ? (int) $in['seniority'] : '';
    $cv['wantTypes'] = $ids($in['wantTypes'] ?? [], array_map('strval', (array) aio_list('job_types', [])), 6);
    $cv['wantShifts'] = $ids($in['wantShifts'] ?? [], array_map('strval', (array) aio_list('shifts', [])), 6);
    foreach (['salaryMin', 'salaryMax'] as $k) {
        $v = aio_en_digits((string) ($in[$k] ?? ''));
        $cv[$k] = ($v !== '' && is_numeric($v) && (float) $v >= 0 && (float) $v <= 2000) ? (float) $v + 0 : '';
    }
    if ($cv['salaryMin'] !== '' && $cv['salaryMax'] !== '' && $cv['salaryMax'] < $cv['salaryMin']) [$cv['salaryMin'], $cv['salaryMax']] = [$cv['salaryMax'], $cv['salaryMin']];
    $cv['availability'] = in_array($in['availability'] ?? '', array_column(aio_id_list('availability'), 'id'), true) ? $in['availability'] : '';
    $cv['availableFrom'] = $cv['availability'] === 'date' ? (aio_valid_date($in['availableFrom'] ?? '') ?: '') : '';

    $now = gmdate('Y-m');
    $cv['experience'] = [];
    foreach (array_slice((array) ($in['experience'] ?? []), 0, 30) as $x) {
        if (!is_array($x)) continue;
        $start = aio_valid_ym($x['start'] ?? '');
        $end = ($x['end'] ?? null) ? aio_valid_ym($x['end']) : null;
        $role = in_array($x['role'] ?? '', $role_ids, true) ? $x['role'] : '';
        $dept = in_array($x['dept'] ?? '', $dept_ids, true) ? $x['dept'] : '';
        if (!$start || !$role || !$dept) continue;
        if ($start > $now) $start = $now;
        if ($end && $end < $start) $end = $start;
        if ($end && $end > $now) $end = null;
        $type = in_array($x['orgType'] ?? '', ['lab', 'company', 'other'], true) ? $x['orgType'] : 'other';
        $org_id = (int) ($x['orgId'] ?? 0);
        $org_name = aio_clean_text($x['orgName'] ?? '', 120);
        if ($type !== 'other') {
            $p = $org_id ? get_post($org_id) : null;
            if ($p && $p->post_type === 'aio_lab' && $p->post_status === 'publish') $org_name = $p->post_title;
            else { $type = 'other'; $org_id = 0; }
        } else $org_id = 0;
        if ($org_name === '') continue;
        $row = ['orgType' => $type, 'orgName' => $org_name, 'role' => $role, 'dept' => $dept,
            'type' => $in_list($x['type'] ?? '', 'job_types'), 'city' => $city_ok(aio_clean_text($x['city'] ?? '', 60)) ? aio_clean_text($x['city'], 60) : '',
            'start' => $start, 'end' => $end, 'skills' => $ids($x['skills'] ?? [], $skill_ids, 30)];
        if ($org_id) $row['orgId'] = $org_id;
        $cv['experience'][] = $row;
    }
    $gy = (int) gmdate('Y');
    $cv['education'] = [];
    foreach (array_slice((array) ($in['education'] ?? []), 0, 10) as $x) {
        if (!is_array($x)) continue;
        $deg = (int) ($x['degree'] ?? 0);
        $field = $in_list($x['field'] ?? '', 'fields_study');
        $uni = in_array($x['uni'] ?? '', $uni_ids, true) ? $x['uni'] : '';
        if (!in_array($deg, $lv('degree_levels'), true) || !$field || !$uni) continue;
        $st = (int) ($x['start'] ?? 0); $en = (int) ($x['end'] ?? 0);
        $st = ($st >= 1940 && $st <= $gy) ? $st : null;
        $en = ($en >= 1940 && $en <= $gy + 6) ? $en : null;
        if ($st && $en && $en < $st) $en = $st;
        $cv['education'][] = ['degree' => $deg, 'field' => $field, 'uni' => $uni, 'start' => $st, 'end' => $en];
    }
    $cv['skills'] = [];
    $seen = [];
    foreach (array_slice((array) ($in['skills'] ?? []), 0, 100) as $x) {
        $id = (string) ($x['id'] ?? '');
        if (!in_array($id, $skill_ids, true) || isset($seen[$id])) continue;
        $seen[$id] = 1;
        $cv['skills'][] = ['id' => $id, 'lvl' => max(1, min(5, (int) ($x['lvl'] ?? 3)))];
    }
    $cv['licenses'] = [];
    foreach (array_slice((array) ($in['licenses'] ?? []), 0, 20) as $x) {
        $id = (string) ($x['id'] ?? '');
        if (!in_array($id, $lic_ids, true)) continue;
        $is = ($x['issued'] ?? '') ? aio_valid_ym($x['issued']) : null;
        $ex = ($x['expires'] ?? '') ? aio_valid_ym($x['expires']) : null;
        $cv['licenses'][] = ['id' => $id, 'issued' => $is, 'expires' => $ex];
    }
    $cv['langs'] = [];
    foreach (array_slice((array) ($in['langs'] ?? []), 0, 10) as $x) {
        $id = (string) ($x['id'] ?? '');
        if (!in_array($id, $lang_ids, true)) continue;
        $cv['langs'][] = ['id' => $id, 'lvl' => in_array((int) ($x['lvl'] ?? 0), $lv('lang_levels'), true) ? (int) $x['lvl'] : 1];
    }
    $cv['summary'] = aio_clean_textarea($in['summary'] ?? '', 400);
    $cv['updated'] = gmdate('Y-m-d');
    return $cv;
}

/** درصد تکمیل رزومه (همان فرمول ResumeBuilder.completeness) */
function aio_cv_completeness(array $cv, string $name = '', string $phone = ''): int
{
    $checks = [$name, $cv['gender'] ?? '', $cv['birth'] ?? '', ($cv['provinceId'] ?? '') && ($cv['city'] ?? ''), $cv['targetRoles'] ?? [], $cv['seniority'] ?? '',
        $cv['wantTypes'] ?? [], $cv['availability'] ?? '', $cv['experience'] ?? [], $cv['education'] ?? [], count($cv['skills'] ?? []) >= 5, $cv['langs'] ?? [],
        $cv['salaryMin'] ?? '', $cv['summary'] ?? ''];
    return (int) round(count(array_filter($checks)) / count($checks) * 100);
}

/** نام‌ها از کاتالوگ */
function aio_cat_name(string $tax, string $id): string
{
    foreach (aio_catalog($tax) as $x) if ($x['id'] === $id) return $x['name'];
    return $id;
}

function aio_level_name(string $list, int $v): string
{
    foreach (aio_levels($list) as $x) if ($x['v'] === $v) return $x['name'];
    return '';
}

/** نمای سازگار با رزومه‌ی قدیمی (عنوان، شهر، سابقه، مدرک، مهارت‌ها) برای بخش‌های دیگر سایت */
function aio_cv_legacy(array $cv): array
{
    $p = aio_match_profile($cv);
    $cur = $p['current'] ?: $p['last'];
    $role = $cur['role'] ?? (($cv['targetRoles'] ?? [])[0] ?? '');
    $dept = $cur['dept'] ?? '';
    if (!$dept && $role) foreach (aio_catalog('aio_role', ['dept']) as $r) if ($r['id'] === $role) $dept = $r['dept'];
    $m = $p['expMonths'];
    $exp = $m < 1 ? 'بدون نیاز به سابقه' : ($m < 12 ? 'کمتر از ۱ سال' : ($m < 36 ? '۱ تا ۳ سال' : ($m <= 60 ? '۳ تا ۵ سال' : 'بیش از ۵ سال')));
    $edu = $cv['education'] ?? [];
    usort($edu, fn($a, $b) => $b['degree'] <=> $a['degree']);
    $skills = []; $devices = [];
    $groups = [];
    foreach (aio_catalog('aio_skill', ['group']) as $s) $groups[$s['id']] = $s['group'];
    foreach ($cv['skills'] ?? [] as $s) {
        $n = aio_cat_name('aio_skill', $s['id']);
        if (($groups[$s['id']] ?? '') === 'device') $devices[] = $n; else $skills[] = $n;
    }
    $sal = '';
    if (($cv['salaryMin'] ?? '') !== '') $sal = aio_fa((string) $cv['salaryMin']) . (($cv['salaryMax'] ?? '') !== '' ? ' تا ' . aio_fa((string) $cv['salaryMax']) : '') . ' میلیون تومان';
    return [
        'title' => $role ? aio_cat_name('aio_role', $role) : '', 'city' => $cv['city'] ?? '', 'province' => $cv['provinceId'] ?? '',
        'experience' => $exp, 'degree' => $edu ? aio_level_name('degree_levels', (int) $edu[0]['degree']) : '', 'field' => $edu ? $edu[0]['field'] : '',
        'salary' => $sal, 'summary' => $cv['summary'] ?? '', 'skills' => $skills, 'devices' => $devices, 'history' => [], 'education' => [],
        'gender' => $cv['gender'] ?? '', 'military' => $cv['military'] ?? '', 'dept' => $dept,
    ];
}

/* ================================================================
   موتور تطبیق — ترجمه‌ی دقیق AioMatch.profile / AioMatch.score
   ================================================================ */
function aio_ym(string $s): int
{
    $p = explode('-', $s);
    return ((int) $p[0]) * 12 + max(1, (int) ($p[1] ?? 1)) - 1;
}

function aio_merged_months(array $items): int
{
    $now = ((int) gmdate('Y')) * 12 + (int) gmdate('n') - 1;
    $iv = [];
    foreach ($items as $x) {
        if (empty($x['start'])) continue;
        $s = aio_ym($x['start']);
        $e = !empty($x['end']) ? aio_ym($x['end']) : $now;
        if ($e >= $s) $iv[] = [$s, $e];
    }
    usort($iv, fn($a, $b) => $a[0] <=> $b[0]);
    $total = 0; $cur = null;
    foreach ($iv as [$s, $e]) {
        if (!$cur) $cur = [$s, $e];
        elseif ($s <= $cur[1] + 1) $cur[1] = max($cur[1], $e);
        else { $total += $cur[1] - $cur[0] + 1; $cur = [$s, $e]; }
    }
    if ($cur) $total += $cur[1] - $cur[0] + 1;
    return $total;
}

function aio_age(string $birth): ?int
{
    if (!$birth) return null;
    $b = array_map('intval', explode('-', $birth));
    $y = (int) gmdate('Y'); $m = (int) gmdate('n'); $d = (int) gmdate('j');
    return $y - $b[0] - (($m < ($b[1] ?? 1) || ($m === ($b[1] ?? 1) && $d < ($b[2] ?? 1))) ? 1 : 0);
}

function aio_match_profile(array $c): array
{
    $exp = $c['experience'] ?? [];
    $byDept = []; $byRole = [];
    foreach ($exp as $e) {
        if (!empty($e['dept'])) $byDept[$e['dept']][] = $e;
        if (!empty($e['role'])) $byRole[$e['role']][] = $e;
    }
    $expDept = array_map('aio_merged_months', $byDept);
    $current = null; $last = null;
    foreach ($exp as $e) {
        if (empty($e['end']) && (!$current || aio_ym($e['start']) > aio_ym($current['start']))) $current = $e;
        if (!$last || aio_ym($e['end'] ?: $e['start']) > aio_ym($last['end'] ?: $last['start'])) $last = $e;
    }
    $degree = 0.0;
    foreach ($c['education'] ?? [] as $e) {
        $d = (int) ($e['degree'] ?? 0);
        $degree = max($degree, (!empty($e['end']) || $d < 3) ? $d : $d - 0.5);
    }
    $skills = [];
    foreach ($c['skills'] ?? [] as $s) $skills[$s['id']] = max($skills[$s['id']] ?? 0, (int) $s['lvl']);
    foreach ($exp as $e) foreach ((array) ($e['skills'] ?? []) as $id) if (empty($skills[$id])) $skills[$id] = 2;
    $now = gmdate('Y-m');
    $lic = [];
    foreach ($c['licenses'] ?? [] as $l) $lic[$l['id']] = empty($l['expires']) || $l['expires'] >= $now;
    $langs = [];
    foreach ($c['langs'] ?? [] as $l) $langs[$l['id']] = max($langs[$l['id']] ?? 0, (int) $l['lvl']);
    return [
        'age' => aio_age((string) ($c['birth'] ?? '')), 'expMonths' => aio_merged_months($exp), 'expDept' => $expDept,
        'current' => $current, 'last' => $current ?: $last, 'degree' => (int) floor($degree),
        'fields' => array_values(array_filter(array_column($c['education'] ?? [], 'field'))), 'skills' => $skills, 'licenses' => $lic, 'langs' => $langs,
    ];
}

/** امتیاز تطبیق یک رزومه با یک پوزیشن — خروجی همان ساختار AioMatch.score (بدون متن‌ها) */
function aio_match_cv(array $c, array $job): array
{
    $req = $job['req'] ?? [];
    $p = aio_match_profile($c);
    $w = aio_match_weights();
    $sumW = 0; $acc = 0; $blockers = [];
    foreach ((array) ($req['skills'] ?? []) as $r) {
        $have = $p['skills'][$r['id']] ?? 0;
        $cover = $have >= $r['lvl'] ? 1 : $have / max(1, $r['lvl']);
        $sumW += $r['w'];
        $acc += $r['w'] * $cover;
        if (!empty($r['must']) && $cover < 0.5) $blockers[] = 'مهارت الزامی: ' . aio_cat_name('aio_skill', $r['id']);
    }
    $skillScore = $sumW ? $acc / $sumW : 1;
    $crit = [];
    $add = function ($key, $label, $pts, $hard = false) use (&$crit) { $crit[] = ['key' => $key, 'label' => $label, 'pts' => max(0, min(1, $pts)), 'hard' => $hard]; };
    if (!empty($req['minExp'])) $add('exp', 'سابقه کل', $p['expMonths'] / $req['minExp']);
    if (!empty($req['expDept']) && !empty($job['dept'])) $add('expDept', 'سابقه در همین بخش', ($p['expDept'][$job['dept']] ?? 0) / $req['expDept']);
    if (!empty($req['degree'])) $add('degree', 'حداقل مدرک', $p['degree'] >= $req['degree'] ? 1 : $p['degree'] / $req['degree'] * 0.8);
    if (!empty($req['fields'])) $add('field', 'رشته تحصیلی', array_intersect($p['fields'], $req['fields']) ? 1 : 0.3);
    foreach ((array) ($req['licenses'] ?? []) as $id) $add('lic-' . $id, 'مدرک: ' . aio_cat_name('aio_license', $id), !empty($p['licenses'][$id]) ? 1 : 0, true);
    foreach ((array) ($req['langs'] ?? []) as $l) $add('lang-' . $l['id'], 'زبان', ($p['langs'][$l['id']] ?? 0) / max(1, $l['lvl']));
    if (!empty($req['age']) && $p['age'] !== null) $add('age', 'بازه سنی', ($p['age'] >= $req['age'][0] && $p['age'] <= $req['age'][1]) ? 1 : 0, true);
    if (!empty($req['gender']) && $req['gender'] !== 'فرقی نمی‌کند') $add('gender', 'جنسیت', ($c['gender'] ?? '') === $req['gender'] ? 1 : 0, true);
    if (!empty($req['military']) && ($c['gender'] ?? '') === 'آقا') $add('military', 'وضعیت سربازی', in_array($c['military'] ?? '', $req['military'], true) ? 1 : 0, true);
    if (!empty($job['provinceId']) && empty($job['remote'])) {
        $moves = !empty($c['relocate']) && (empty($c['provinces']) || in_array($job['provinceId'], $c['provinces'], true));
        $add('location', 'محل کار', ($c['city'] ?? '') === ($job['city'] ?? '') ? 1 : (($c['provinceId'] ?? '') === $job['provinceId'] ? 0.85 : ($moves ? 0.7 : 0.15)));
    }
    if (!empty($req['seniority']) && !empty($c['seniority'])) $add('seniority', 'رده شغلی', $c['seniority'] >= $req['seniority'] ? 1 : $c['seniority'] / $req['seniority']);
    $critScore = $crit ? array_sum(array_column($crit, 'pts')) / count($crit) : 1;
    foreach ($crit as $x) if ($x['hard'] && $x['pts'] < 1) $blockers[] = $x['label'];
    /* Math.round در جاوااسکریپت ۰٫۵ را به بالا گرد می‌کند؛ این‌جا هم همان */
    $total = (int) floor(100 * ($sumW ? ($w['skills'] * $skillScore + $w['criteria'] * $critScore) : $critScore) + 0.5);
    if ($blockers) $total = min($total, $w['thresholdIrrelevant'] + 9);
    $fit = $total >= $w['high'] ? 'high' : ($total >= $w['mid'] ? 'mid' : ($total >= $w['thresholdIrrelevant'] ? 'low' : 'none'));
    return ['score' => $total, 'fit' => $fit, 'eligible' => !$blockers, 'blockers' => $blockers,
        'skillScore' => (int) floor($skillScore * 100 + 0.5), 'critScore' => (int) floor($critScore * 100 + 0.5)];
}

/* ================================================================
   داده‌ی کارجو برای مرکز تطبیق کارفرما
   ================================================================ */
function aio_talent_candidate(int $uid): ?array
{
    $u = get_userdata($uid);
    if (!$u) return null;
    $cv = aio_cv($uid);
    if (empty($cv['skills'])) return null;
    $mbti = aio_umeta($uid, 'mbti', null);
    /* تاریخ تولد دقیق منتشر نمی‌شود؛ برای محاسبه‌ی سن، روز به ۱۵ ماه گرد می‌شود */
    $birth = !empty($cv['birth']) ? substr($cv['birth'], 0, 7) . '-15' : '';
    return array_merge($cv, [
        'id' => $uid, 'name' => $u->display_name, 'birth' => $birth, 'color' => AIO_DEFAULT_COLORS[$uid % 8],
        'otw' => (bool) aio_umeta($uid, 'otw', 0), 'certs' => array_map(fn($c) => $c['title'], aio_user_valid_certs($uid)),
        'mbti' => (is_array($mbti) && aio_umeta($uid, 'mbti_public', 0)) ? ($mbti['type'] ?? '') : '',
    ]);
}

/** پوزیشن‌هایی که کاربر فعلی در مرکز تطبیق می‌بیند */
function aio_talent_positions(int $uid): array
{
    $admin = user_can($uid, 'edit_others_posts');
    $args = ['post_type' => 'aio_job', 'post_status' => ['publish', 'aio_internal', 'pending', 'draft'], 'numberposts' => 300, 'orderby' => 'date', 'order' => 'DESC'];
    if (!$admin) $args['author'] = $uid;
    $out = [];
    foreach (get_posts($args) as $p) {
        $j = aio_job_item($p);
        if (empty($j['req'])) continue;
        $lab = get_post($j['labId']);
        $j['orgName'] = $j['internal'] ? ($j['clientName'] ?: 'پوزیشن داخلی') : ($lab ? $lab->post_title : '');
        $j['mine'] = (int) $p->post_author === $uid;
        $out[] = $j;
    }
    return $out;
}

/* ================================================================
   پوزیشن داخلی = وضعیت جداگانه (هیچ‌جای عمومی سایت دیده نمی‌شود)
   ================================================================ */
add_action('init', function () {
    register_post_status('aio_internal', [
        'label' => 'پوزیشن داخلی', 'public' => false, 'internal' => false, 'protected' => true, 'exclude_from_search' => true,
        'show_in_admin_all_list' => true, 'show_in_admin_status_list' => true,
        'label_count' => _n_noop('پوزیشن داخلی <span class="count">(%s)</span>', 'پوزیشن‌های داخلی <span class="count">(%s)</span>'),
    ]);
});

/* در پیشخوان: کلید «پوزیشن داخلی» وضعیت را تعیین می‌کند */
add_action('aio_fields_saved', function ($post_id, $post) {
    if ($post->post_type !== 'aio_job') return;
    $internal = (bool) aio_meta($post_id, 'internal', 0);
    if ($internal && in_array($post->post_status, ['publish', 'pending', 'draft'], true)) {
        remove_action('save_post', [AIO_Fields::class, 'save_post'], 10);
        wp_update_post(['ID' => $post_id, 'post_status' => 'aio_internal']);
    } elseif (!$internal && $post->post_status === 'aio_internal') {
        remove_action('save_post', [AIO_Fields::class, 'save_post'], 10);
        wp_update_post(['ID' => $post_id, 'post_status' => 'publish']);
    }
}, 10, 2);

/* ================================================================
   REST
   ================================================================ */
add_action('rest_api_init', function () {
    $user = fn() => is_user_logged_in();
    $emp = fn() => is_user_logged_in() && in_array(aio_user_role(), ['employer', 'admin'], true);
    $R = fn($m, $route, $cb, $perm) => register_rest_route(AIO_NS, $route, ['methods' => $m, 'callback' => $cb, 'permission_callback' => $perm]);

    $R('POST', '/me/cv', 'aio_api_cv', $user);
    $R('GET', '/talent/candidates', 'aio_api_talent_candidates', $emp);
    $R('GET', '/talent/positions', fn() => aio_ok(['positions' => aio_talent_positions(get_current_user_id())]), $emp);
    $R('POST', '/talent/filters', function ($r) {
        $uid = get_current_user_id();
        $list = (array) aio_umeta($uid, 'talent_filters', []);
        if (count($list) >= 30) return aio_err('حداکثر ۳۰ فیلتر ذخیره‌شده.');
        $tree = aio_filter_tree_clean((array) aio_p($r, 'tree', []));
        if (!$tree) return aio_err('شرط نامعتبر است.');
        $list[] = ['name' => aio_clean_text(aio_p($r, 'name'), 80) ?: 'فیلتر من', 'tree' => $tree];
        aio_set_umeta($uid, 'talent_filters', $list);
        return aio_ok([], true);
    }, $emp);
    $R('DELETE', '/talent/filters/(?P<i>\d+)', function ($r) {
        $uid = get_current_user_id();
        $list = (array) aio_umeta($uid, 'talent_filters', []);
        array_splice($list, (int) $r['i'], 1);
        aio_set_umeta($uid, 'talent_filters', array_values($list));
        return aio_ok([], true);
    }, $emp);
    $R('POST', '/employer/org/(?P<id>\d+)', 'aio_api_org_profile', $emp);
    $R('POST', '/employer/image', 'aio_api_emp_image', $emp);
    $R('POST', '/employer/product', 'aio_api_product_save', $emp);
    $R('DELETE', '/employer/product/(?P<id>\d+)', function ($r) {
        $p = aio_own_post((int) $r['id'], 'aio_product');
        if (!$p) return aio_err('محصول پیدا نشد.', 404);
        wp_trash_post($p->ID);
        return aio_ok([], true);
    }, $emp);
});

/** درخت شرط فیلتر: فقط ساختار مجاز ذخیره می‌شود */
function aio_filter_tree_clean(array $t, int $depth = 0): ?array
{
    if ($depth > 3 || !isset($t['rules']) || !is_array($t['rules'])) return null;
    $out = ['op' => ($t['op'] ?? '') === 'or' ? 'or' : 'and', 'rules' => []];
    foreach (array_slice($t['rules'], 0, 30) as $r) {
        if (!is_array($r)) continue;
        if (isset($r['rules'])) { $g = aio_filter_tree_clean($r, $depth + 1); if ($g) $out['rules'][] = $g; continue; }
        $field = preg_replace('/[^A-Za-z]/', '', (string) ($r['field'] ?? ''));
        $op = in_array($r['op'] ?? '', ['has', '>=', '<=', '=', 'between', 'in', 'notin', 'hasall', 'hasany', 'is'], true) ? $r['op'] : 'in';
        if ($field === '') continue;
        $out['rules'][] = ['field' => $field, 'op' => $op, 'value' => aio_clean_deep($r['value'] ?? null)];
    }
    return $out;
}

function aio_api_cv(WP_REST_Request $r)
{
    $uid = get_current_user_id();
    $in = (array) aio_p($r, 'cv', []);
    $cv = aio_cv_sanitize($in);
    if (is_wp_error($cv)) return $cv;
    $name = aio_clean_text($in['name'] ?? '', 80);
    if (mb_strlen($name) < 3) return aio_err('نام و نام خانوادگی را کامل وارد کنید.', 422, ['field' => 'name']);
    if (!$cv['gender'] || !$cv['birth'] || !$cv['provinceId'] || !$cv['city'] || !$cv['targetRoles'] || !$cv['skills']) {
        return aio_err('جنسیت، تاریخ تولد، استان و شهر، عنوان شغلی موردنظر و حداقل یک مهارت لازم است.', 422);
    }
    $phone = aio_en_digits((string) ($in['phone'] ?? ''));
    if (!preg_match('/^09\d{9}$/', $phone)) return aio_err('شماره موبایل لازم است (۰۹xxxxxxxxx) تا کارفرما بتواند با شما تماس بگیرد.', 422, ['field' => 'phone']);
    $dup = get_users(['meta_key' => 'aio_phone', 'meta_value' => $phone, 'number' => 1, 'fields' => 'ID', 'exclude' => [$uid]]);
    if ($dup) return aio_err('این شماره موبایل برای حساب دیگری ثبت شده است.', 409, ['field' => 'phone']);
    update_user_meta($uid, 'aio_phone', $phone);
    wp_update_user(['ID' => $uid, 'display_name' => $name]);
    aio_set_umeta($uid, 'cv', $cv);
    aio_set_umeta($uid, 'resume', array_merge(aio_resume_defaults(), aio_cv_legacy($cv)));
    aio_set_umeta($uid, 'resume_updated', time());
    do_action('aio_cv_saved', $uid);
    return aio_ok([], true);
}

function aio_api_talent_candidates(WP_REST_Request $r)
{
    $uid = get_current_user_id();
    $admin = current_user_can('edit_users');
    if (!$admin && !aio_has_resume_bank($uid)) return aio_err('مرکز تطبیق نیاز به اشتراک بانک رزومه دارد.', 402, ['needPlan' => true]);
    $ids = [];
    $args = ['role__in' => ['aio_seeker', 'aio_volunteer'], 'number' => 600, 'fields' => 'ID', 'meta_query' => [['key' => 'aio_cv', 'compare' => 'EXISTS']]];
    if (!$admin) $args['meta_query'][] = ['key' => 'aio_otw', 'value' => '1'];
    foreach (get_users($args) as $id) $ids[(int) $id] = 1;
    /* متقاضیانی که برای آگهی‌های همین کارفرما درخواست داده‌اند، حتی اگر «آماده به کار» نباشند */
    foreach (aio_employer_applicants($uid) as $a) $ids[(int) $a['userId']] = 1;
    /* دارندگان گواهی آزمون‌های همین کارفرما (اگر «نمایش در بالای بانک رزومه» روشن باشد) اول می‌آیند */
    $labs = get_posts(['post_type' => 'aio_lab', 'author' => $uid, 'post_status' => 'any', 'numberposts' => -1, 'fields' => 'ids']);
    $exams = [];
    foreach (get_posts(['post_type' => 'aio_exam', 'post_status' => 'publish', 'numberposts' => -1]) as $ex) {
        $own = (int) $ex->post_author === $uid || in_array((int) aio_meta($ex->ID, 'author_lab', 0), $labs, true);
        if ($own && aio_bool(aio_meta($ex->ID, 'holders_top', 1))) $exams[$ex->ID] = $ex->post_title;
    }
    $out = [];
    foreach (array_keys($ids) as $id) {
        if (!($c = aio_talent_candidate($id))) continue;
        if ($exams) foreach (aio_user_valid_certs($id) as $ct) {
            if ($ct['type'] === 'exam' && isset($exams[$ct['refId']])) { $c['pin'] = 'گواهی آزمون شما: ' . $exams[$ct['refId']]; break; }
        }
        $out[] = $c;
    }
    usort($out, fn($a, $b) => (empty($b['pin']) ? 0 : 1) - (empty($a['pin']) ? 0 : 1));
    return aio_ok(['candidates' => $out]);
}

/** ذخیره‌ی پروفایل کامل سازمان از پنل کارفرما */
function aio_api_org_profile(WP_REST_Request $r)
{
    $lab = aio_own_post((int) $r['id'], 'aio_lab');
    if (!$lab) return aio_err('سازمان پیدا نشد.', 404);
    $d = (array) aio_p($r, 'org', []);
    $id = $lab->ID;
    $types = array_column(aio_id_list('org_types'), 'id');
    if (isset($d['orgType']) && in_array($d['orgType'], $types, true)) aio_set_meta($id, 'org_type', $d['orgType']);
    if (isset($d['tagline'])) aio_set_meta($id, 'tagline', aio_clean_text($d['tagline'], 90));
    if (isset($d['about'])) wp_update_post(['ID' => $id, 'post_content' => aio_clean_textarea($d['about'], 3000)]);
    $okl = fn($arr, $list, $max) => array_slice(array_values(array_intersect(array_map('strval', (array) $arr), array_map('strval', (array) aio_list($list, [])))), 0, $max);
    if (isset($d['services'])) aio_set_meta($id, 'services', $okl($d['services'], 'org_services', 30));
    if (isset($d['accreditations'])) aio_set_meta($id, 'accreditations', $okl($d['accreditations'], 'accreditations', 15));
    if (isset($d['hoursSpec']) && is_array($d['hoursSpec'])) {
        $h = $d['hoursSpec'];
        aio_set_meta($id, 'hours_days', array_values(array_unique(array_filter(array_map('intval', (array) ($h['days'] ?? [])), fn($x) => $x >= 0 && $x <= 6))));
        aio_set_meta($id, 'hours_from', max(0, min(24, (int) ($h['from'] ?? 8))));
        aio_set_meta($id, 'hours_to', max(0, min(24, (int) ($h['to'] ?? 17))));
        aio_set_meta($id, 'hours_24', !empty($h['h24']) ? 1 : 0);
    }
    $url = function ($u) {
        $u = trim((string) $u);
        if ($u === '') return '';
        return preg_match('#^https://[^\s<>"\']+$#', $u) ? esc_url_raw($u) : false;
    };
    foreach (['website' => 'website', 'video' => 'video'] as $mk => $dk) {
        if (!isset($d[$dk])) continue;
        $v = $url($d[$dk]);
        if ($v === false) return aio_err('لینک‌ها باید با https:// شروع شوند.', 422);
        if ($dk === 'video' && $v && !in_array(strtolower(preg_replace('#^www\.#', '', (string) wp_parse_url($v, PHP_URL_HOST))), aio_video_hosts(), true)) return aio_err('لینک ویدئو فقط از این سایت‌ها پذیرفته می‌شود: ' . implode('، ', aio_video_hosts()), 422);
        aio_set_meta($id, $mk, $v);
    }
    foreach (['instagram', 'linkedin', 'telegram', 'aparat'] as $k) {
        if (!isset($d['socials']) || !is_array($d['socials'])) break;
        $v = $url($d['socials'][$k] ?? '');
        if ($v === false) return aio_err('لینک‌ها باید با https:// شروع شوند.', 422);
        aio_set_meta($id, 'social_' . $k, $v);
    }
    if (isset($d['phone'])) {
        $p = aio_en_digits(trim((string) $d['phone']));
        if (!preg_match('/^0\d{9,10}$/', preg_replace('/[\s\-]/', '', $p))) return aio_err('تلفن سازمان لازم است (با پیش‌شماره، مثلاً ۰۲۱۲۲۲۲۰۰۰۰).', 422, ['field' => 'phone']);
        aio_set_meta($id, 'phone', $p);
    }
    if (isset($d['email'])) {
        $e = sanitize_email((string) $d['email']);
        if (!is_email($e)) return aio_err('ایمیل سازمان لازم است.', 422, ['field' => 'email']);
        aio_set_meta($id, 'email', $e);
    }
    foreach (['branches' => 999, 'staff' => 99999, 'founded' => 1500] as $k => $max) {
        if (!isset($d[$k])) continue;
        $v = (int) aio_en_digits((string) $d[$k]);
        if ($v >= 0 && $v <= $max) aio_set_meta($id, $k, $v ?: '');
    }
    if (isset($d['gallery']) && is_array($d['gallery'])) {
        $uid = get_current_user_id();
        $gal = [];
        foreach (array_slice($d['gallery'], 0, 10) as $g) {
            $att = (int) ($g['att'] ?? 0);
            $own = $att && get_post_type($att) === 'attachment' && ((int) get_post_field('post_author', $att) === $uid || current_user_can('edit_post', $att));
            /* نمونه‌های بدون تصویر (رنگی) هم حفظ می‌شوند */
            if (!$own && empty($g['c'])) continue;
            $gal[] = ['att' => $own ? $att : 0, 't' => aio_clean_text($g['t'] ?? '', 60), 'c' => $own ? '' : (sanitize_hex_color((string) $g['c']) ?: '')];
        }
        aio_set_meta($id, 'gallery', $gal);
    }
    do_action('aio_data_changed');
    return aio_ok([], true);
}

/** بارگذاری تصویر گالری/محصول — شناسه و نشانی برمی‌گرداند */
function aio_api_emp_image(WP_REST_Request $r)
{
    $uid = get_current_user_id();
    if (!aio_rate_limit('img' . $uid, 60, HOUR_IN_SECONDS)) return aio_err('تعداد بارگذاری‌ها زیاد است؛ کمی بعد دوباره تلاش کنید.', 429);
    $att = aio_handle_upload('file', ['jpg|jpeg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp'], 8, $uid);
    if (is_wp_error($att)) return $att;
    return aio_ok(['att' => $att, 'img' => wp_get_attachment_image_url($att, 'large')]);
}

function aio_api_product_save(WP_REST_Request $r)
{
    $uid = get_current_user_id();
    $d = (array) aio_p($r, 'product', []);
    $name = aio_clean_text($d['name'] ?? '', 120);
    if (mb_strlen($name) < 2) return aio_err('نام محصول را وارد کنید.', 422);
    $cat = sanitize_title((string) ($d['cat'] ?? ''));
    if (!in_array($cat, aio_catalog_ids('aio_product_cat'), true)) return aio_err('دسته‌ی محصول را انتخاب کنید.', 422);
    $lab = aio_own_post((int) ($d['orgId'] ?? 0), 'aio_lab');
    if (!$lab) return aio_err('سازمان محصول پیدا نشد.', 404);
    $id = (int) ($d['id'] ?? 0);
    if ($id && !aio_own_post($id, 'aio_product')) $id = 0;
    $arr = ['post_type' => 'aio_product', 'post_title' => $name, 'post_content' => aio_clean_textarea($d['desc'] ?? '', 1500), 'post_author' => $uid];
    /* محصول سازمان تأییدشده مستقیم منتشر می‌شود؛ بقیه پس از بازبینی */
    $arr['post_status'] = (current_user_can('publish_posts') || (aio_meta($lab->ID, 'verified', 0) && $lab->post_status === 'publish')) ? 'publish' : 'pending';
    if ($id) { $arr['ID'] = $id; $id = wp_update_post($arr, true); } else $id = wp_insert_post($arr, true);
    if (is_wp_error($id)) return aio_err('ذخیره‌ی محصول ناموفق بود.');
    wp_set_object_terms($id, $cat, 'aio_product_cat');
    aio_set_meta($id, 'lab_id', $lab->ID);
    aio_set_meta($id, 'brand', aio_clean_text($d['brand'] ?? '', 60));
    aio_set_meta($id, 'model', aio_clean_text($d['model'] ?? '', 60));
    $price = aio_en_digits((string) ($d['price'] ?? ''));
    aio_set_meta($id, 'price', is_numeric($price) && (float) $price > 0 ? (float) $price : '');
    $specs = [];
    foreach (array_slice((array) ($d['specs'] ?? []), 0, 25) as $s) {
        $k = aio_clean_text(is_array($s) ? ($s[0] ?? $s['k'] ?? '') : '', 40);
        $v = aio_clean_text(is_array($s) ? ($s[1] ?? $s['v'] ?? '') : '', 80);
        if ($k !== '' && $v !== '') $specs[] = ['k' => $k, 'v' => $v];
    }
    aio_set_meta($id, 'specs', $specs);
    $att = (int) ($d['att'] ?? 0);
    if ($att && get_post_type($att) === 'attachment' && ((int) get_post_field('post_author', $att) === $uid || current_user_can('edit_post', $att))) set_post_thumbnail($id, $att);
    elseif (!$att) delete_post_thumbnail($id);
    if ($arr['post_status'] === 'pending') aio_notify_admin('محصول جدید در انتظار بررسی', '<p>' . esc_html($name) . '</p><p><a class="btn" href="' . esc_url(admin_url('post.php?action=edit&post=' . $id)) . '">بررسی</a></p>');
    return aio_ok(['product' => aio_product_item(get_post($id))], true);
}

/** ذخیره‌ی نیازمندی ساخت‌یافته‌ی آگهی از پنل کارفرما */
function aio_save_job_req(int $id, array $req): void
{
    $skill_ids = aio_catalog_ids('aio_skill');
    $skills = [];
    foreach (array_slice((array) ($req['skills'] ?? []), 0, 25) as $s) {
        if (!in_array($s['id'] ?? '', $skill_ids, true)) continue;
        $skills[] = ['id' => $s['id'], 'w' => max(1, min(10, (int) ($s['w'] ?? 5))), 'lvl' => max(1, min(5, (int) ($s['lvl'] ?? 3))), 'must' => !empty($s['must']) ? 1 : 0];
    }
    aio_set_meta($id, 'req_skills', $skills);
    aio_set_meta($id, 'req_role', in_array($req['role'] ?? '', aio_catalog_ids('aio_role'), true) ? $req['role'] : '');
    aio_set_meta($id, 'req_seniority', in_array((int) ($req['seniority'] ?? 0), array_column(aio_levels('seniority'), 'v'), true) ? (int) $req['seniority'] : '');
    aio_set_meta($id, 'req_min_exp', round(max(0, min(480, (int) ($req['minExp'] ?? 0))) / 12, 2) ?: '');
    aio_set_meta($id, 'req_exp_dept', round(max(0, min(480, (int) ($req['expDept'] ?? 0))) / 12, 2) ?: '');
    aio_set_meta($id, 'req_degree', in_array((int) ($req['degree'] ?? 0), array_column(aio_levels('degree_levels'), 'v'), true) ? (int) $req['degree'] : '');
    aio_set_meta($id, 'req_fields', array_values(array_intersect(array_map('strval', (array) ($req['fields'] ?? [])), array_map('strval', (array) aio_list('fields_study', [])))));
    aio_set_meta($id, 'req_licenses', array_values(array_intersect(array_map('strval', (array) ($req['licenses'] ?? [])), aio_catalog_ids('aio_license'))));
    $langs = [];
    $lang_ids = array_column(aio_id_list('languages'), 'id');
    foreach (array_slice((array) ($req['langs'] ?? []), 0, 5) as $l) if (in_array($l['id'] ?? '', $lang_ids, true)) $langs[] = ['id' => $l['id'], 'lvl' => max(1, min(5, (int) ($l['lvl'] ?? 2)))];
    aio_set_meta($id, 'req_langs', $langs);
    $age = (array) ($req['age'] ?? []);
    aio_set_meta($id, 'req_age_min', !empty($age[0]) ? max(14, min(80, (int) $age[0])) : '');
    aio_set_meta($id, 'req_age_max', !empty($age[1]) ? max(14, min(80, (int) $age[1])) : '');
    aio_set_meta($id, 'req_military', array_values(array_intersect(array_map('strval', (array) ($req['military'] ?? [])), array_map('strval', (array) aio_list('military', [])))));
    if (isset($req['gender'])) aio_set_meta($id, 'gender', in_array($req['gender'], ['آقا', 'خانم'], true) ? $req['gender'] : 'فرقی نمی‌کند');
}
