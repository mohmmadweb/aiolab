<?php
/**
 * درون‌ریزی داده‌های نمونه‌ی دمو (data/seed.json) و برگه‌ها/منوها (data/pages.json)
 * اجرای دوباره امن است: هر مورد با _aio_demo_id شناسایی و فقط اگر نبود ساخته می‌شود.
 * همه‌ی محتوای نمونه با _aio_sample=1 علامت می‌خورد و از «ابزارها» قابل حذف یکجاست.
 */
defined('ABSPATH') || exit;

function aio_seed(): array
{
    static $s = null;
    if ($s === null) $s = json_decode((string) @file_get_contents(AIO_DIR . 'data/seed.json'), true) ?: [];
    return $s;
}

function aio_import_all(): array
{
    @set_time_limit(300);
    wp_defer_term_counting(true);
    $r = [];
    $r['فهرست‌ها'] = aio_import_lists();
    $r['دسته‌ها'] = aio_import_terms();
    $r['مراکز'] = aio_import_labs();
    $r['آگهی‌ها'] = aio_import_jobs();
    $r['آزمون‌ها'] = aio_import_exams();
    $r['آکادمی'] = aio_import_academy();
    $r['خدمات'] = aio_import_services();
    $r['سؤالات'] = aio_import_faq();
    $r['مقالات'] = aio_import_articles();
    $r['جامعه'] = aio_import_community();
    $r['کارجویان نمونه'] = aio_import_seekers();
    $r['برگه‌ها'] = aio_import_pages();
    $r['منوها'] = aio_import_menus();
    $r = apply_filters('aio_import_all_extra', $r);
    wp_defer_term_counting(false);
    do_action('aio_data_changed');
    flush_rewrite_rules(false);
    return $r;
}

function aio_insert_sample(array $post, string $demo_id, array $meta = []): int
{
    $existing = aio_post_by_demo($post['post_type'], $demo_id);
    if ($existing) return -$existing;
    $post += ['post_status' => 'publish', 'post_author' => 1];
    $id = wp_insert_post(wp_slash($post), true);
    if (is_wp_error($id)) return 0;
    update_post_meta($id, '_aio_demo_id', $demo_id);
    update_post_meta($id, '_aio_sample', 1);
    foreach ($meta as $k => $v) aio_set_meta($id, $k, $v);
    return $id;
}

/* ---------- فهرست‌ها ---------- */
function aio_import_lists(): int
{
    $s = aio_seed();
    $lists = get_option('aio_lists', []);
    if (!is_array($lists)) $lists = [];
    $simple = ['job_types' => 'AIO_JOB_TYPES', 'shifts' => 'AIO_SHIFTS', 'degrees' => 'AIO_DEGREES', 'fields_study' => 'AIO_FIELDS_STUDY',
        'genders' => 'AIO_GENDERS', 'military' => 'AIO_MILITARY', 'experiences' => 'AIO_EXPERIENCES', 'benefits' => 'AIO_BENEFITS',
        'org_sizes' => 'AIO_ORG_SIZES', 'exam_levels' => 'AIO_EXAM_LEVELS', 'course_levels' => 'AIO_COURSE_LEVELS',
        'course_langs' => 'AIO_COURSE_LANGS', 'trending_skills' => 'AIO_TRENDING_SKILLS', 'colors' => 'AIO_COLORS',
        'salary_bands' => 'AIO_SALARY_BANDS', 'post_ages' => 'AIO_POST_AGES', 'sectors' => 'AIO_SECTORS', 'org_kinds' => 'AIO_ORG_KINDS',
        'verticals' => 'AIO_VERTICALS', 'course_formats' => 'AIO_COURSE_FORMATS', 'course_durations' => 'AIO_COURSE_DURATIONS',
        'course_types' => 'AIO_COURSE_TYPES', 'payers' => 'AIO_PAYERS', 'pay_models' => 'AIO_PAY_MODELS'];
    $n = 0;
    foreach ($simple as $k => $src) {
        if (!empty($lists[$k]) || !isset($s[$src])) continue;
        $lists[$k] = $s[$src];
        $n++;
    }
    if (empty($lists['lesson_types'])) {
        $lists['lesson_types'] = [];
        foreach ((array) ($s['AIO_LESSON_TYPES'] ?? []) as $id => $t) $lists['lesson_types'][] = ['id' => $id, 'name' => $t['name'], 'icon' => $t['icon']];
        $n++;
    }
    update_option('aio_lists', $lists);

    $tests = get_option('aio_tests', []);
    if (!is_array($tests)) $tests = [];
    if (empty($tests['mbti_questions'])) $tests['mbti_questions'] = $s['AIO_MBTI_QUESTIONS'] ?? [];
    if (empty($tests['mbti_types'])) {
        $tests['mbti_types'] = [];
        foreach ((array) ($s['AIO_MBTI_TYPES'] ?? []) as $code => $t) $tests['mbti_types'][] = ['code' => $code] + $t;
    }
    $catmap = ['tech' => 'hematology', 'qc' => 'qc', 'safety' => 'safety', 'soft' => 'soft', 'digital' => 'lis', 'growth' => 'soft'];
    if (empty($tests['self_assess'])) $tests['self_assess'] = array_map(fn($g) => $g + ['course_cat' => $catmap[$g['id']] ?? ''], (array) ($s['AIO_SELF_ASSESS'] ?? []));
    if (empty($tests['assess_levels'])) $tests['assess_levels'] = $s['AIO_ASSESS_LEVELS'] ?? [];
    update_option('aio_tests', $tests);
    return $n;
}

/* ---------- طبقه‌بندی‌ها ---------- */
function aio_upsert_term(string $tax, string $slug, string $name, array $meta, string $desc = ''): int
{
    $t = get_term_by('slug', $slug, $tax);
    if (!$t) {
        $r = wp_insert_term($name, $tax, ['slug' => $slug, 'description' => $desc]);
        if (is_wp_error($r)) return 0;
        $tid = (int) $r['term_id'];
        foreach ($meta as $k => $v) update_term_meta($tid, 'aio_' . $k, $v);
        return $tid;
    }
    return (int) $t->term_id;
}

function aio_import_terms(): int
{
    $s = aio_seed();
    $n = 0;
    foreach ((array) $s['AIO_DEPARTMENTS'] as $i => $d) $n += (bool) aio_upsert_term('aio_dept', $d['id'], $d['name'], ['en' => $d['en'], 'icon' => $d['icon'], 'color' => $d['color'], 'bg' => $d['bg'], 'order' => $i + 1]);
    foreach ((array) $s['AIO_COURSE_CATS'] as $i => $d) $n += (bool) aio_upsert_term('aio_course_cat', $d['id'], $d['name'], ['icon' => $d['icon'], 'color' => $d['color'], 'bg' => $d['bg'], 'order' => $i + 1]);
    foreach ((array) $s['AIO_SERVICE_GROUPS'] as $i => $g) $n += (bool) aio_upsert_term('aio_service_group', $g['id'], $g['name'], ['icon' => $g['icon'], 'color' => $g['color'], 'bg' => $g['bg'], 'payer' => $g['payer'], 'order' => $i + 1], $g['desc']);
    foreach ((array) $s['AIO_FAQ'] as $i => $c) $n += (bool) aio_upsert_term('aio_faq_cat', 'faq-' . ($i + 1), $c['cat'], ['order' => $i + 1]);
    return $n;
}

/* ---------- مراکز و نظرات ---------- */
function aio_import_labs(): int
{
    $n = 0;
    foreach ((array) aio_seed()['AIO_LABS'] as $l) {
        $b = $l['ratingBreakdown'] ?? [];
        $id = aio_insert_sample(['post_type' => 'aio_lab', 'post_title' => $l['name'], 'post_content' => $l['about'],
            'post_date' => wp_date('Y-m-d H:i:s', time() - (400 - (int) $l['id']) * 3600)], 'lab-' . $l['id'], [
            'vertical' => $l['vertical'], 'city' => $l['city'], 'province' => $l['provinceId'], 'type' => $l['type'], 'sector' => $l['sector'],
            'org_kind' => $l['orgKind'], 'size' => $l['size'], 'color' => $l['color'], 'lat' => $l['lat'], 'lng' => $l['lng'], 'address' => $l['address'],
            'perks' => $l['perks'], 'staff' => $l['staff'], 'founded' => $l['founded'], 'verified' => $l['verified'] ? 1 : 0,
            'avg_salary' => $l['avgSalary'], 'avg_salary_updated' => $l['avgSalaryUpdated'],
            'rating_base' => $l['rating'], 'rating_count_base' => $l['ratingCount'],
            'rb_salary' => $b['salary'] ?? $l['rating'], 'rb_environment' => $b['environment'] ?? $l['rating'], 'rb_learning' => $b['learning'] ?? $l['rating'],
            'rb_management' => $b['management'] ?? $l['rating'], 'rb_worklife' => $b['worklife'] ?? $l['rating'],
        ]);
        if ($id > 0) $n++;
    }
    /* نظرات نمونه جزو «تعداد نظرات پایه» حساب شده‌اند؛ متن‌شان به‌صورت نظر تأییدشده ذخیره می‌شود ولی در امتیاز دوباره شمرده نمی‌شود */
    foreach ((array) aio_seed()['AIO_REVIEWS'] as $i => $rv) {
        $lab = aio_post_by_demo('aio_lab', 'lab-' . $rv['labId']);
        if (!$lab || get_comments(['post_id' => $lab, 'meta_key' => 'aio_demo_id', 'meta_value' => 'rv-' . $i, 'count' => true])) continue;
        $cid = wp_insert_comment(['comment_post_ID' => $lab, 'comment_type' => 'aio_review', 'comment_author' => 'کاربر ناشناس', 'comment_content' => $rv['text'],
            'comment_approved' => 1, 'comment_date' => wp_date('Y-m-d H:i:s', aio_jalali_to_ts($rv['date'])), 'comment_date_gmt' => gmdate('Y-m-d H:i:s', aio_jalali_to_ts($rv['date']))]);
        if (!$cid) continue;
        add_comment_meta($cid, 'aio_demo_id', 'rv-' . $i);
        add_comment_meta($cid, 'aio_sample', 1);
        add_comment_meta($cid, 'aio_title', $rv['author']);
        add_comment_meta($cid, 'aio_role', $rv['role']);
        add_comment_meta($cid, 'aio_pros', $rv['pros']);
        add_comment_meta($cid, 'aio_cons', $rv['cons']);
        add_comment_meta($cid, 'aio_stars', 0); // نمایش فقط متن؛ امتیاز در پایه لحاظ شده
        add_comment_meta($cid, 'aio_display_stars', $rv['stars']);
        $n++;
    }
    return $n;
}

/* ---------- آگهی‌ها ---------- */
function aio_import_jobs(): int
{
    $n = 0;
    foreach ((array) aio_seed()['AIO_JOBS'] as $j) {
        $lab = aio_post_by_demo('aio_lab', 'lab-' . $j['labId']);
        $ts = time() - (int) $j['days'] * DAY_IN_SECONDS - 3600;
        $id = aio_insert_sample(['post_type' => 'aio_job', 'post_title' => $j['title'], 'post_content' => $j['desc'],
            'post_date' => wp_date('Y-m-d H:i:s', $ts), 'post_date_gmt' => gmdate('Y-m-d H:i:s', $ts)], 'job-' . $j['id'], [
            'lab_id' => $lab, 'vertical' => $j['vertical'], 'city' => $j['city'], 'province' => $j['provinceId'], 'type' => $j['type'], 'shift' => $j['shift'],
            'salary' => $j['salary'], 'salary_min' => $j['salaryMin'], 'salary_max' => $j['salaryMax'], 'experience' => $j['experience'], 'degree' => $j['degree'],
            'field_of_study' => $j['fieldOfStudy'], 'gender' => $j['gender'], 'military' => $j['military'], 'remote' => $j['remote'] ? 1 : 0,
            'urgent' => $j['urgent'] ? 1 : 0, 'featured' => $j['featured'] ? 1 : 0, 'benefits' => $j['benefits'], 'skills' => $j['skills'],
            'requirements' => $j['requirements'], 'expires' => wp_date('Y-m-d', $ts + 60 * DAY_IN_SECONDS),
            'plan' => $j['urgent'] ? 'urgent' : ($j['featured'] ? 'featured' : 'normal'), 'views' => 120 + ((int) $j['id'] * 37) % 900,
        ]);
        if ($id > 0) {
            wp_set_object_terms($id, $j['dept'], 'aio_dept');
            update_post_meta($id, '_aio_alerted', time());
            $n++;
        }
    }
    return $n;
}

/* ---------- آزمون‌ها ---------- */
function aio_import_exams(): int
{
    $n = 0;
    foreach ((array) aio_seed()['AIO_EXAMS'] as $e) {
        $qs = array_map(fn($q) => ['q' => $q['q'], 'options' => $q['options'], 'correct' => (int) $q['answer'] + 1], $e['questions']);
        $id = aio_insert_sample(['post_type' => 'aio_exam', 'post_title' => $e['title'], 'post_content' => $e['desc']], 'exam-' . $e['id'], [
            'vertical' => $e['vertical'], 'author_lab' => aio_post_by_demo('aio_lab', 'lab-' . $e['authorLabId']), 'level' => $e['level'],
            'duration' => $e['duration'], 'pass_score' => $e['passScore'], 'retake_days' => 7, 'price' => 0, 'badge' => $e['badge'],
            'color' => $e['color'], 'bg' => $e['bg'], 'takers_base' => $e['takers'], 'certs_base' => $e['certIssued'], 'questions' => $qs,
        ]);
        if ($id > 0) { wp_set_object_terms($id, $e['dept'], 'aio_dept'); $n++; }
    }
    return $n;
}

/* ---------- آکادمی ---------- */
function aio_sample_lesson_body(array $c, array $m, array $l): string
{
    $ins = implode('، ', array_map(function ($i) {
        foreach (aio_seed()['AIO_INSTRUCTORS'] as $x) if ($x['id'] === $i) return $x['name'];
        return '';
    }, $c['instructorIds']));
    switch ($l['type']) {
        case 'video':
            return '<h3>خلاصه این درس</h3><p>' . esc_html($l['t']) . ' — بخشی از ماژول «' . esc_html($m['title']) . '» دوره «' . esc_html($c['title']) . '». پس از تماشا، نکات را در دفترچه یادداشت خود ثبت کنید.</p><h3>مهارت‌های مرتبط</h3><p>' . esc_html(implode('، ', array_slice($c['skills'], 0, 3))) . '</p>' . ($ins ? '<p class="muted">مدرس: ' . esc_html($ins) . '</p>' : '');
        case 'reading':
            return '<p>این متن، منبع مطالعه‌ی درس «' . esc_html($l['t']) . '» است و مطالعه‌ی آن حدود ' . aio_fa($l['min']) . ' دقیقه زمان می‌برد.</p><h3>نکات کلیدی</h3><ul class="bullets">' . implode('', array_map(fn($o) => '<li>' . esc_html($o) . '</li>', $c['outcomes'])) . '</ul><h3>واژگان این درس</h3><p>' . esc_html(implode(' · ', $c['skills'])) . '</p>';
        case 'lab':
            return '<p>این تمرین را با داده یا تجهیزات واقعی انجام دهید و نتیجه را در برگه‌ی تمرین ثبت کنید.</p><ol><li>مطالعه دستورالعمل تمرین</li><li>انجام مراحل عملی</li><li>ثبت نتیجه در برگه تمرین</li><li>مقایسه با پاسخ نمونه</li></ol>';
        case 'project':
            return '<p>پروژه پایانی، جمع‌بندی مهارت‌های این دوره است و توسط مدرس بازبینی می‌شود.</p><ol><li>مطالعه شرح پروژه و معیارهای ارزیابی</li><li>انجام پروژه مطابق قالب ارائه‌شده</li><li>بارگذاری فایل یا گزارش نهایی</li><li>خودارزیابی با چک‌لیست</li></ol>';
    }
    return '';
}

/** سؤالات نمونه‌ی آزمون ماژول — همان منطق دمو، این‌بار ذخیره‌شده و قابل ویرایش */
function aio_sample_quiz(array $c, int $mi): array
{
    $mine = [];
    $others = [];
    foreach ($c['syllabus'] as $i => $m) foreach ($m['lessons'] as $l) {
        if ($l['type'] === 'quiz') continue;
        if ($i === $mi) $mine[] = $l['t']; else $others[] = $l['t'];
    }
    $h = fn($s) => abs(crc32($s));
    usort($mine, fn($a, $b) => $h($a . $mi) <=> $h($b . $mi));
    $out = [];
    foreach (array_slice($mine, 0, 3) as $k => $ans) {
        $o = $others;
        usort($o, fn($a, $b) => $h($a . $ans) <=> $h($b . $ans));
        $opts = array_merge([$ans], array_slice($o, 0, 3));
        usort($opts, fn($a, $b) => $h($a . $k) <=> $h($b . $k));
        $out[] = ['q' => 'کدام مورد جزو مباحث ماژول «' . $c['syllabus'][$mi]['title'] . '» است؟', 'options' => $opts, 'correct' => array_search($ans, $opts, true) + 1];
    }
    return $out;
}

function aio_import_academy(): int
{
    $s = aio_seed();
    $n = 0;
    foreach ($s['AIO_PROVIDERS'] as $p) {
        if (aio_post_by_slug('aio_provider', $p['id'])) continue;
        $id = aio_insert_sample(['post_type' => 'aio_provider', 'post_title' => $p['name'], 'post_name' => $p['id'], 'post_content' => $p['about']], 'prov-' . $p['id'],
            ['kind' => $p['kind'], 'color' => $p['color'], 'lab_id' => $p['labId'] ? aio_post_by_demo('aio_lab', 'lab-' . $p['labId']) : 0]);
        $n += $id > 0;
    }
    foreach ($s['AIO_INSTRUCTORS'] as $i) {
        if (aio_post_by_slug('aio_instructor', $i['id'])) continue;
        $id = aio_insert_sample(['post_type' => 'aio_instructor', 'post_title' => $i['name'], 'post_name' => $i['id'], 'post_content' => $i['bio']], 'ins-' . $i['id'],
            ['title' => $i['title'], 'org' => $i['org'], 'color' => $i['color'], 'students' => $i['students'], 'rating' => $i['rating'], 'courses_count' => $i['courses']]);
        $n += $id > 0;
    }
    foreach ($s['AIO_COURSES'] as $k => $c) {
        $syl = [];
        foreach ($c['syllabus'] as $mi => $m) {
            $lessons = [];
            foreach ($m['lessons'] as $l) {
                $row = ['t' => $l['t'], 'type' => $l['type'], 'min' => $l['min'], 'video' => '', 'body' => aio_sample_lesson_body($c, $m, $l), 'questions' => []];
                if ($l['type'] === 'quiz') $row['questions'] = aio_sample_quiz($c, $mi);
                $lessons[] = $row;
            }
            $syl[] = ['title' => $m['title'], 'hours' => $m['hours'], 'lessons' => $lessons];
        }
        $meta = ['type' => $c['type'], 'subtitle' => $c['subtitle'], 'level' => $c['level'], 'format' => $c['format'], 'lang' => $c['lang'],
            'provider' => $c['providerId'], 'instructors' => $c['instructorIds'], 'price' => $c['price'], 'old_price' => $c['oldPrice'] ?? '',
            'hours' => $c['hours'], 'weeks' => $c['weeks'], 'cert' => $c['cert'] ? 1 : 0, 'cert_type' => $c['certType'], 'updated' => $c['updated'],
            'bestseller' => !empty($c['bestseller']) ? 1 : 0, 'is_new' => !empty($c['isNew']) ? 1 : 0, 'featured' => !empty($c['featured']) ? 1 : 0,
            'next_start' => $c['nextStart'] ?? '', 'seats' => $c['seats'] ?? '', 'skills' => $c['skills'], 'outcomes' => $c['outcomes'],
            'prereq' => $c['prereq'], 'audience' => $c['audience'], 'syllabus' => $syl, 'faq' => $c['faq'] ?? [],
            'students_base' => $c['students'], 'rating_base' => $c['rating'], 'rating_count_base' => $c['ratingCount']];
        $id = aio_insert_sample(['post_type' => 'aio_course', 'post_title' => $c['title'], 'post_content' => '',
            'post_date' => wp_date('Y-m-d H:i:s', time() - (200 - $k) * 3600)], 'course-' . $c['id'], $meta);
        if ($id <= 0) continue;
        $n++;
        wp_set_object_terms($id, $c['cat'], 'aio_course_cat');
        foreach ((array) ($c['reviews'] ?? []) as $ri => $rv) {
            $cid = wp_insert_comment(['comment_post_ID' => $id, 'comment_type' => 'aio_review', 'comment_author' => $rv['name'], 'comment_content' => $rv['text'], 'comment_approved' => 1,
                'comment_date' => wp_date('Y-m-d H:i:s', aio_jalali_to_ts($rv['date'])), 'comment_date_gmt' => gmdate('Y-m-d H:i:s', aio_jalali_to_ts($rv['date']))]);
            if ($cid) {
                add_comment_meta($cid, 'aio_role', $rv['role']);
                add_comment_meta($cid, 'aio_stars', 0);
                add_comment_meta($cid, 'aio_display_stars', $rv['stars']);
                add_comment_meta($cid, 'aio_sample', 1);
            }
        }
    }
    /* پیوندهای وابسته پس از ساخت همه‌ی دوره‌ها و آزمون‌ها */
    foreach ($s['AIO_COURSES'] as $c) {
        $id = aio_post_by_demo('aio_course', 'course-' . $c['id']);
        if ($id && !empty($c['relatedExamId']) && !aio_meta($id, 'related_exam')) aio_set_meta($id, 'related_exam', aio_post_by_demo('aio_exam', 'exam-' . $c['relatedExamId']));
    }
    foreach ($s['AIO_LEARNING_PATHS'] as $k => $p) {
        if (aio_post_by_slug('aio_path', $p['id'])) continue;
        $id = aio_insert_sample(['post_type' => 'aio_path', 'post_title' => $p['title'], 'post_name' => $p['id'], 'post_content' => $p['desc'],
            'post_date' => wp_date('Y-m-d H:i:s', time() - (100 - $k) * 3600)], 'path-' . $p['id'], [
            'kind' => $p['kind'], 'role' => $p['role'], 'level' => $p['level'], 'cert' => $p['cert'], 'icon' => $p['icon'], 'color' => $p['color'], 'bg' => $p['bg'],
            'students_base' => $p['students'], 'rating' => $p['rating'], 'outcomes' => $p['outcomes'],
            'courses' => array_map(fn($cid) => aio_post_by_demo('aio_course', 'course-' . $cid), $p['courseIds']),
            'related_exam' => !empty($p['relatedExamId']) ? aio_post_by_demo('aio_exam', 'exam-' . $p['relatedExamId']) : 0,
        ]);
        $n += $id > 0;
    }
    return $n;
}

/* ---------- خدمات ---------- */
function aio_import_services(): int
{
    $grants = ['R1' => [['key' => 'job_credits', 'value' => 1]], 'R2' => [['key' => 'featured_credits', 'value' => 1]],
        'R3' => [['key' => 'job_credits', 'value' => 5]], 'R4' => [['key' => 'job_credits', 'value' => 10]],
        'R27' => [['key' => 'plan_days', 'value' => 365], ['key' => 'resume_bank_days', 'value' => 365], ['key' => 'job_credits', 'value' => 10]],
        'R28' => [['key' => 'plan_days', 'value' => 365], ['key' => 'resume_bank_days', 'value' => 365], ['key' => 'job_credits', 'value' => 30], ['key' => 'featured_credits', 'value' => 5]],
        'R29' => [['key' => 'plan_days', 'value' => 365]], 'R30' => [['key' => 'plan_days', 'value' => 365]]];
    $n = 0;
    foreach ((array) aio_seed()['AIO_SERVICES'] as $i => $s) {
        $id = aio_insert_sample(['post_type' => 'aio_service', 'post_title' => $s['title'], 'post_content' => $s['desc'], 'menu_order' => $i + 1], 'svc-' . $s['code'], [
            'code' => $s['code'], 'stream' => $s['stream'], 'payer' => $s['payer'], 'model' => $s['model'], 'priority' => $s['priority'],
            'price' => $s['price'] === null ? '' : $s['price'], 'unit' => $s['unit'], 'price_model' => $s['priceModel'],
            'free_label' => $s['freeLabel'] ?? '', 'price_label' => $s['priceLabel'] ?? '', 'highlight' => !empty($s['highlight']) ? 1 : 0,
            'limited' => !empty($s['limited']) ? 1 : 0, 'plan' => !empty($s['plan']) ? 1 : 0, 'note' => $s['note'] ?? '', 'features' => $s['features'] ?? [],
            'grants' => $grants[$s['code']] ?? [], 'period_days' => $s['model'] === 'period' ? 365 : '',
        ]);
        if ($id > 0) { wp_set_object_terms($id, $s['group'], 'aio_service_group'); $n++; }
    }
    return $n;
}

/* ---------- سؤالات پرتکرار ---------- */
function aio_import_faq(): int
{
    $n = 0;
    foreach ((array) aio_seed()['AIO_FAQ'] as $ci => $cat) {
        foreach ($cat['items'] as $qi => $it) {
            $content = preg_replace_callback("/href='([a-z0-9\-]+)\.html(#[a-z]+)?'/", fn($m) => "href='" . aio_demo_link($m[1], $m[2] ?? '') . "'", $it['a']);
            $id = aio_insert_sample(['post_type' => 'aio_faq', 'post_title' => $it['q'], 'post_content' => $content, 'menu_order' => $ci * 20 + $qi], 'faq-' . $ci . '-' . $qi);
            if ($id > 0) { wp_set_object_terms($id, 'faq-' . ($ci + 1), 'aio_faq_cat'); $n++; }
        }
    }
    return $n;
}

/** تبدیل لینک‌های دمو (jobs.html) به نشانی وردپرس (/jobs/) */
function aio_demo_link(string $page, string $hash = ''): string
{
    return ($page === 'index' ? '/' : '/' . $page . '/') . $hash;
}

/* ---------- مجله ---------- */
function aio_import_articles(): int
{
    $n = 0;
    foreach ((array) aio_seed()['AIO_ARTICLES'] as $k => $a) {
        $cat = get_term_by('name', $a['cat'], 'category');
        $cat_id = $cat ? $cat->term_id : (int) (wp_insert_term($a['cat'], 'category')['term_id'] ?? 0);
        $ts = time() - ([3, 5, 7, 8, 14, 15][$k] ?? 20) * DAY_IN_SECONDS;
        $body = '<!-- wp:paragraph --><p>' . esc_html($a['title']) . ' — این مقاله در مجله‌ی آیولب منتشر می‌شود.</p><!-- /wp:paragraph -->'
            . '<!-- wp:paragraph --><p>متن کامل این مقاله را می‌توانید از پیشخوان (نوشته‌ها) ویرایش و تکمیل کنید.</p><!-- /wp:paragraph -->';
        $id = aio_insert_sample(['post_type' => 'post', 'post_title' => $a['title'], 'post_content' => $body, 'post_category' => [$cat_id],
            'post_date' => wp_date('Y-m-d H:i:s', $ts), 'post_date_gmt' => gmdate('Y-m-d H:i:s', $ts)], 'article-' . $a['id'],
            ['read_time' => $a['time'], 'icon' => $a['icon'], 'color' => $a['color'], 'bg' => $a['bg']]);
        $n += $id > 0;
    }
    return $n;
}

/* ---------- جامعه ---------- */
function aio_import_community(): int
{
    $n = 0;
    $hours = [2, 5, 26, 30];
    foreach ((array) aio_seed()['AIO_POSTS'] as $k => $p) {
        $ts = time() - ($hours[$k] ?? 48) * HOUR_IN_SECONDS;
        $id = aio_insert_sample(['post_type' => 'aio_community', 'post_title' => wp_trim_words($p['text'], 8, '…'), 'post_content' => $p['text'],
            'post_date' => wp_date('Y-m-d H:i:s', $ts), 'post_date_gmt' => gmdate('Y-m-d H:i:s', $ts), 'comment_status' => 'open'], 'cpost-' . $p['id'],
            ['author_name' => $p['author'], 'role' => $p['role'], 'color' => $p['color'], 'likes_base' => $p['likes']]);
        $n += $id > 0;
    }
    return $n;
}

/* ---------- کارجویان نمونه (برای بانک رزومه) ---------- */
function aio_import_seekers(): int
{
    $n = 0;
    $skills = [['کار با سل‌کانتر Sysmex', 'لام محیطی', 'کنترل کیفیت داخلی', 'آشنایی با LIS'], ['کنترل کیفیت', 'بیوشیمی روتین', 'اتوآنالایزر', 'Excel'],
        ['نمونه‌گیری وریدی', 'پذیرش و جوابدهی', 'کار با LIS', 'میکروب‌شناسی پایه'], ['هماتولوژی پیشرفته', 'فلوسایتومتری', 'لام محیطی', 'ایمنی زیستی']];
    foreach ((array) aio_seed()['AIO_APPLICANTS'] as $k => $a) {
        $email = 'sample-seeker-' . ($k + 1) . '@aiolab.invalid';
        if (email_exists($email)) continue;
        $uid = wp_insert_user(['user_login' => 'sample_seeker_' . ($k + 1), 'user_email' => $email, 'user_pass' => wp_generate_password(24), 'display_name' => $a['name'], 'role' => 'aio_seeker']);
        if (is_wp_error($uid)) continue;
        update_user_meta($uid, 'aio_sample', 1);
        [$title, $exp] = array_map('trim', explode('—', $a['title']) + [1 => '']);
        aio_set_umeta($uid, 'resume', array_merge(aio_resume_defaults(), ['title' => $title, 'city' => $a['city'], 'province' => aio_province_of_city($a['city']),
            'experience' => $exp, 'degree' => 'کارشناسی', 'field' => 'علوم آزمایشگاهی', 'skills' => $skills[$k] ?? [], 'devices' => ['Sysmex XN-1000'],
            'summary' => $a['title'] . '؛ علاقه‌مند به کار در محیط آموزش‌محور.', 'dept' => $k === 1 ? 'qc' : ($k === 2 ? 'sampling' : 'hematology')]));
        aio_set_umeta($uid, 'otw', 1);
        aio_set_umeta($uid, 'resume_updated', time() - $k * DAY_IN_SECONDS);
        if (!empty($a['mbti'])) { aio_set_umeta($uid, 'mbti', ['type' => $a['mbti']]); aio_set_umeta($uid, 'mbti_public', 1); }
        foreach ((array) $a['certs'] as $ct) {
            $cid = wp_insert_post(['post_type' => 'aio_cert', 'post_status' => 'publish', 'post_author' => $uid, 'post_title' => 'گواهی ' . $ct]);
            aio_set_meta($cid, 'type', 'exam');
            aio_set_meta($cid, 'score', 80);
            aio_set_meta($cid, 'code', aio_code('AIO-', 8));
            update_post_meta($cid, '_aio_sample', 1);
        }
        $n++;
    }
    return $n;
}

/* ---------- برگه‌ها و منوها ---------- */
function aio_import_pages(): int
{
    $pages = json_decode((string) @file_get_contents(AIO_DIR . 'data/pages.json'), true) ?: [];
    $n = 0;
    foreach ($pages as $p) {
        $existing = get_posts(['post_type' => 'page', 'post_status' => ['publish', 'private', 'draft'], 'numberposts' => 1, 'fields' => 'ids', 'meta_key' => '_aio_page', 'meta_value' => $p['role']])[0] ?? 0;
        if (!$existing) {
            $by_path = get_page_by_path($p['slug']);
            if ($by_path && get_post_meta($by_path->ID, '_aio_page', true) === $p['role']) $existing = $by_path->ID;
        }
        if ($existing) continue;
        $content = aio_resolve_markers((string) ($p['content'] ?? ''));
        $id = wp_insert_post(wp_slash(['post_type' => 'page', 'post_status' => $p['status'] ?? 'publish', 'post_title' => $p['title'], 'post_name' => $p['slug'],
            'post_content' => $content, 'post_author' => 1, 'menu_order' => $p['order'] ?? 0, 'comment_status' => 'closed']), true);
        if (is_wp_error($id)) continue;
        update_post_meta($id, '_aio_page', $p['role']);
        update_post_meta($id, '_aio_content_hash', md5((string) get_post_field('post_content', $id)));
        if (!empty($p['template'])) update_post_meta($id, '_wp_page_template', $p['template']);
        if (!empty($p['desc'])) update_post_meta($id, '_aio_seo_desc', $p['desc']);
        if (!empty($p['seo_title'])) update_post_meta($id, '_aio_seo_title', $p['seo_title']);
        $n++;
    }
    delete_option('aio_page_map');
    $home = aio_page_id('home');
    if ($home) {
        update_option('show_on_front', 'page');
        update_option('page_on_front', $home);
    }
    $mag = aio_page_id('magazine');
    if ($mag && !get_option('page_for_posts')) { /* مجله برگه‌ی سفارشی است؛ صفحه‌ی نوشته‌ها لازم نیست */ }
    return $n;
}

function aio_menu_item(int $menu, string $title, string $url, int $parent = 0, string $desc = '', string $icon = '', int $order = 0): int
{
    return (int) wp_update_nav_menu_item($menu, 0, ['menu-item-title' => $title, 'menu-item-url' => $url, 'menu-item-status' => 'publish',
        'menu-item-parent-id' => $parent, 'menu-item-description' => $desc, 'menu-item-classes' => $icon ? 'icon-' . $icon : '', 'menu-item-position' => $order]);
}

function aio_import_menus(): int
{
    $data = json_decode((string) @file_get_contents(AIO_DIR . 'data/menus.json'), true) ?: [];
    $locations = get_theme_mod('nav_menu_locations', []);
    $n = 0;
    foreach ($data as $loc => $m) {
        if (!empty($locations[$loc]) && wp_get_nav_menu_object($locations[$loc])) continue;
        $existing = wp_get_nav_menu_object($m['name']);
        $menu_id = $existing ? $existing->term_id : wp_create_nav_menu($m['name']);
        if (is_wp_error($menu_id)) continue;
        if (!$existing) {
            $pos = 1;
            foreach ($m['items'] as $it) {
                $pid = aio_menu_item($menu_id, $it['label'], home_url($it['href'] ?? '#'), 0, $it['desc'] ?? '', $it['icon'] ?? '', $pos++);
                foreach ($it['children'] ?? [] as $ch) aio_menu_item($menu_id, $ch['label'], home_url($ch['href']), $pid, $ch['desc'] ?? '', $ch['icon'] ?? '', $pos++);
            }
        }
        $locations[$loc] = $menu_id;
        $n++;
    }
    set_theme_mod('nav_menu_locations', $locations);
    return $n;
}

/* ---------- حذف داده‌های نمونه (به زباله‌دان) ---------- */
function aio_delete_sample(): int
{
    $n = 0;
    foreach (get_posts(['post_type' => 'any', 'post_status' => 'any', 'numberposts' => -1, 'meta_key' => '_aio_sample', 'meta_value' => '1', 'fields' => 'ids']) as $id) {
        if (get_post_type($id) === 'page') continue;
        wp_trash_post($id);
        $n++;
    }
    foreach (get_users(['meta_key' => 'aio_sample', 'meta_value' => '1', 'fields' => 'ID']) as $uid) {
        require_once ABSPATH . 'wp-admin/includes/user.php';
        wp_delete_user((int) $uid);
        $n++;
    }
    do_action('aio_data_changed');
    return $n;
}

/** جایگزینی نشانگرهای {{course:8}} با نشانی واقعی */
function aio_resolve_markers(string $content): string
{
    return preg_replace_callback('/\{\{(job|lab|course|exam|path|product):([\w-]+)\}\}/', function ($m) {
        $pt = 'aio_' . $m[1];
        $pid = $m[1] === 'path' ? aio_post_by_slug($pt, $m[2]) : aio_post_by_demo($pt, $m[1] . '-' . $m[2]);
        return $pid ? wp_make_link_relative(get_permalink($pid)) : '/' . ($m[1] === 'job' ? 'jobs' : $m[1] . 's') . '/';
    }, $content);
}

/**
 * به‌روزرسانی برگه‌های سیستمی با نسخه‌ی جدید — فقط برگه‌هایی که مدیر ویرایش نکرده است
 * (هش محتوای فعلی = هش آخرین نسخه‌ی نصب‌شده). برگه‌های ویرایش‌شده دست نمی‌خورند.
 */
function aio_sync_pages(): array
{
    $pages = json_decode((string) @file_get_contents(AIO_DIR . 'data/pages.json'), true) ?: [];
    $out = ['updated' => [], 'skipped' => []];
    foreach ($pages as $p) {
        $id = get_posts(['post_type' => 'page', 'post_status' => ['publish', 'private', 'draft'], 'numberposts' => 1, 'fields' => 'ids', 'meta_key' => '_aio_page', 'meta_value' => $p['role']])[0] ?? 0;
        if (!$id) continue;
        $cur = (string) get_post_field('post_content', $id);
        $new = aio_resolve_markers((string) ($p['content'] ?? ''));
        if (!empty($p['seo_title'])) update_post_meta($id, '_aio_seo_title', $p['seo_title']);
        if ($cur === $new) continue;
        if (md5($cur) !== get_post_meta($id, '_aio_content_hash', true)) { $out['skipped'][] = $p['role']; continue; }
        wp_update_post(wp_slash(['ID' => $id, 'post_content' => $new]));
        update_post_meta($id, '_aio_content_hash', md5((string) get_post_field('post_content', $id)));
        $out['updated'][] = $p['role'];
    }
    return $out;
}
