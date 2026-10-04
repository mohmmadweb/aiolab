<?php
/* وضعیت کاربر واردشده (AIO_ME) و توابع دسترسی به داده‌های شخصی */
defined('ABSPATH') || exit;

/* مراحل فرایند استخدام (ترتیب = مسیر طبیعی) */
const AIO_APP_STATUSES = [
    'invited' => 'دعوت از طرف کارفرما', 'sent' => 'ارسال‌شده', 'seen' => 'دیده‌شده', 'review' => 'فهرست کوتاه',
    'interview' => 'دعوت به مصاحبه', 'offer' => 'پیشنهاد همکاری', 'accepted' => 'استخدام شد', 'rejected' => 'رد شده', 'withdrawn' => 'انصراف کارجو',
];
const AIO_ORDER_STATUSES = [
    'pending' => 'در انتظار پرداخت', 'paid' => 'پرداخت‌شده', 'processing' => 'در حال انجام',
    'done' => 'انجام‌شده', 'cancelled' => 'لغو‌شده', 'failed' => 'ناموفق',
];

function aio_umeta(int $uid, string $key, $default = [])
{
    $v = get_user_meta($uid, 'aio_' . $key, true);
    return ($v === '' || $v === null) ? $default : $v;
}

function aio_set_umeta(int $uid, string $key, $value): void
{
    update_user_meta($uid, 'aio_' . $key, $value);
}

/* ---------- رزومه ---------- */
function aio_resume_defaults(): array
{
    return ['title' => '', 'city' => '', 'province' => '', 'experience' => '', 'degree' => '', 'field' => '', 'salary' => '',
        'summary' => '', 'skills' => [], 'devices' => [], 'history' => [], 'education' => [], 'gender' => '', 'military' => '', 'dept' => ''];
}

function aio_resume(int $uid): array
{
    /* رزومه‌ی ساخت‌یافته منبع اصلی است؛ نمای قدیمی (عنوان، شهر، مهارت‌ها…) از آن مشتق می‌شود */
    $cv = aio_cv($uid);
    if ($cv) return array_merge(aio_resume_defaults(), aio_cv_legacy($cv));
    $r = aio_umeta($uid, 'resume', []);
    return array_merge(aio_resume_defaults(), is_array($r) ? $r : []);
}

/** درصد تکمیل پروفایل */
function aio_profile_strength(int $uid): int
{
    $cv = aio_cv($uid);
    if ($cv) {
        $u = get_userdata($uid);
        return aio_cv_completeness($cv, $u ? $u->display_name : '', (string) get_user_meta($uid, 'aio_phone', true));
    }
    $r = aio_resume($uid);
    $checks = [
        !empty($r['title']), !empty($r['city']), !empty($r['experience']), !empty($r['degree']), !empty($r['summary']),
        count($r['skills']) >= 3, count($r['devices']) >= 1, !empty(aio_umeta($uid, 'resume_file', 0)),
        !empty(get_user_meta($uid, 'aio_phone', true)), !empty(aio_user_certs($uid)),
    ];
    return (int) round(array_sum(array_map('intval', $checks)) / count($checks) * 100);
}

/** خلاصه‌ی عمومی رزومه (برای کارفرما) */
function aio_resume_public(int $uid, bool $contact = false): array
{
    $u = get_userdata($uid);
    if (!$u) return [];
    $r = aio_resume($uid);
    $file = (int) aio_umeta($uid, 'resume_file', 0);
    $mbti = aio_umeta($uid, 'mbti', null);
    $out = [
        'userId' => $uid, 'name' => $u->display_name, 'title' => $r['title'] ?: aio_role_label(aio_user_role($u)),
        'city' => $r['city'], 'provinceId' => $r['province'], 'experience' => $r['experience'], 'degree' => $r['degree'],
        'field' => $r['field'], 'salary' => $r['salary'], 'summary' => $r['summary'], 'skills' => $r['skills'], 'devices' => $r['devices'],
        'history' => $r['history'], 'education' => $r['education'], 'dept' => $r['dept'],
        'certs' => array_map(fn($c) => $c['title'], aio_user_valid_certs($uid)),
        'mbti' => (is_array($mbti) && aio_umeta($uid, 'mbti_public', 0)) ? ($mbti['type'] ?? '') : '',
        'otw' => (bool) aio_umeta($uid, 'otw', 0), 'strength' => aio_profile_strength($uid),
        'color' => AIO_DEFAULT_COLORS[$uid % 8], 'updated' => aio_jdate('Y/m/d', (int) aio_umeta($uid, 'resume_updated', strtotime($u->user_registered))),
        'volunteer' => aio_user_role($u) === 'volunteer' ? (string) get_user_meta($uid, 'aio_vol_status', true) : '',
    ];
    if ($contact) {
        $out['email'] = $u->user_email;
        $out['phone'] = (string) get_user_meta($uid, 'aio_phone', true);
        $out['file'] = $file ? wp_get_attachment_url($file) : null;
    }
    return $out;
}

/* ---------- گواهی‌ها ---------- */
function aio_user_certs(int $uid): array
{
    $out = [];
    foreach (get_posts(['post_type' => 'aio_cert', 'post_status' => 'publish', 'author' => $uid, 'numberposts' => -1]) as $c) {
        $out[] = aio_cert_item($c);
    }
    return $out;
}

function aio_cert_item(WP_Post $c): array
{
    $code = (string) aio_meta($c->ID, 'code', '');
    return [
        'id' => $c->ID, 'code' => $code, 'type' => (string) aio_meta($c->ID, 'type', 'exam'), 'refId' => (int) aio_meta($c->ID, 'ref_id', 0),
        'examId' => (int) aio_meta($c->ID, 'ref_id', 0), 'courseId' => (int) aio_meta($c->ID, 'ref_id', 0),
        'title' => $c->post_title, 'score' => (int) aio_meta($c->ID, 'score', 100),
        'date' => aio_jdate('Y/m/d', get_post_time('U', true, $c)), 'badge' => (string) aio_meta($c->ID, 'badge', '🏅'),
        'verify' => home_url('/verify/' . $code . '/'),
        'expires' => ($exp = (int) aio_meta($c->ID, 'expires', 0)) ? aio_jdate('Y/m/d', $exp) : '', 'expired' => $exp && $exp < time(),
    ];
}

/** گواهی‌های معتبر (منقضی‌نشده) — برای رزومه و مرکز تطبیق */
function aio_user_valid_certs(int $uid): array
{
    return array_values(array_filter(aio_user_certs($uid), fn($c) => empty($c['expired'])));
}

function aio_issue_cert(int $uid, string $type, int $ref_id, string $title, int $score = 100, string $badge = '🏅'): int
{
    foreach (get_posts(['post_type' => 'aio_cert', 'author' => $uid, 'post_status' => 'publish', 'numberposts' => -1, 'fields' => 'ids']) as $cid) {
        if (aio_meta($cid, 'type') === $type && (int) aio_meta($cid, 'ref_id') === $ref_id) {
            if ($score > (int) aio_meta($cid, 'score', 0)) aio_set_meta($cid, 'score', $score);
            return $cid;
        }
    }
    $id = wp_insert_post(['post_type' => 'aio_cert', 'post_status' => 'publish', 'post_author' => $uid, 'post_title' => $title]);
    if (is_wp_error($id)) return 0;
    aio_set_meta($id, 'type', $type);
    aio_set_meta($id, 'ref_id', $ref_id);
    aio_set_meta($id, 'score', $score);
    aio_set_meta($id, 'badge', $badge);
    aio_set_meta($id, 'code', aio_code('AIO-', 8));
    $u = get_userdata($uid);
    aio_notify($uid, '🎓 گواهی «' . $title . '» صادر و به رزومه شما اضافه شد.', aio_page_url('dashboard', '#certs'));
    return $id;
}

/* ---------- درخواست‌های همکاری ---------- */
function aio_application_item(WP_Post $a, bool $for_employer = false): array
{
    $job_id = (int) aio_meta($a->ID, 'job_id', 0);
    $job = get_post($job_id);
    $lab = get_post((int) aio_meta($a->ID, 'lab_id', 0));
    $st = (string) aio_meta($a->ID, 'status', 'sent');
    $item = [
        'id' => $a->ID, 'jobId' => $job_id, 'job' => $job ? $job->post_title : '(آگهی حذف شده)', 'jobUrl' => $job ? get_permalink($job) : '',
        'lab' => $lab ? $lab->post_title : '', 'labId' => $lab ? $lab->ID : 0, 'date' => aio_jdate('Y/m/d', get_post_time('U', true, $a)),
        'status' => $st, 'statusText' => AIO_APP_STATUSES[$st] ?? $st, 'note' => (string) aio_meta($a->ID, 'note', ''),
        'match' => (int) aio_meta($a->ID, 'match', 0), 'ts' => (int) get_post_time('U', true, $a),
        'updated' => (int) aio_meta($a->ID, 'updated', 0), 'channel' => (string) aio_meta($a->ID, 'channel', 'apply'),
        'interview' => aio_meta($a->ID, 'interview', null), 'offer' => aio_meta($a->ID, 'offer', null),
        'rejectReason' => (string) aio_meta($a->ID, 'reject_reason', ''), 'unread' => aio_app_unread($a->ID, $for_employer ? 'employer' : 'seeker'),
        'jobInternal' => $job && $job->post_status === 'aio_internal',
    ];
    if ($item['jobInternal']) { $item['job'] = (string) aio_meta($job->ID, 'client_name', '') ?: $item['job']; $item['jobUrl'] = ''; }
    if ($for_employer) {
        $uid = (int) $a->post_author;
        $r = aio_resume_public($uid, true);
        $item += ['userId' => $uid, 'name' => $r['name'] ?? '', 'title' => $r['title'] ?? '', 'city' => $r['city'] ?? '',
            'color' => $r['color'] ?? '#0d9488', 'certs' => $r['certs'] ?? [], 'mbti' => $r['mbti'] ?? '',
            'employerNote' => (string) aio_meta($a->ID, 'employer_note', '')];
        /* تطبیق زنده با رزومه‌ی فعلی (رزومه ممکن است بعد از درخواست به‌روز شده باشد) */
        $cv = aio_cv($uid);
        if ($cv && $job && ($ji = aio_job_item($job)) && !empty($ji['req'])) {
            $m = aio_match_cv($cv, $ji);
            $item['match'] = $m['score']; $item['fit'] = $m['fit']; $item['eligible'] = $m['eligible'];
        } else {
            $w = aio_match_weights();
            $item['fit'] = $item['match'] >= $w['high'] ? 'high' : ($item['match'] >= $w['mid'] ? 'mid' : ($item['match'] >= $w['thresholdIrrelevant'] ? 'low' : 'none'));
            $item['eligible'] = true;
        }
    }
    return $item;
}

/** درصد تطبیق رزومه با آگهی (مهارت، بخش، شهر، سابقه، مدرک، گواهی) */
function aio_match_score(int $uid, int $job_id): int
{
    $job = aio_job_item(get_post($job_id));
    $cv = aio_cv($uid);
    if ($cv && !empty($job['req'])) return aio_match_cv($cv, $job)['score'];
    $r = aio_resume($uid);
    $score = 35;
    $norm = fn($s) => mb_strtolower(trim((string) $s));
    $mine = array_map($norm, array_merge($r['skills'], $r['devices']));
    $need = array_map($norm, $job['skills']);
    if ($need) {
        $hit = 0;
        foreach ($need as $n) {
            foreach ($mine as $m) {
                if ($m !== '' && (str_contains($n, $m) || str_contains($m, $n))) { $hit++; break; }
            }
        }
        $score += (int) round(30 * $hit / count($need));
    }
    if ($r['dept'] && $r['dept'] === $job['dept']) $score += 10;
    if ($r['city'] && ($r['city'] === $job['city'] || $job['remote'])) $score += 10;
    elseif ($r['province'] && $r['province'] === $job['provinceId']) $score += 5;
    if ($r['experience'] && $r['experience'] === $job['experience']) $score += 5;
    if ($r['degree'] && $job['degree'] && (str_contains($r['degree'], $job['degree']) || $job['degree'] === 'مهم نیست')) $score += 5;
    if (aio_user_certs($uid)) $score += 5;
    return max(10, min(99, $score));
}

/* ---------- سفارش‌ها ---------- */
function aio_order_item(WP_Post $o): array
{
    $st = (string) aio_meta($o->ID, 'status', 'pending');
    $items = (array) aio_meta($o->ID, 'items', []);
    $first = $items[0] ?? [];
    return [
        'id' => $o->ID, 'number' => (string) aio_meta($o->ID, 'number', (string) $o->ID), 'code' => (string) ($first['code'] ?? ''),
        'title' => $o->post_title, 'price' => (int) aio_meta($o->ID, 'amount', 0), 'unit' => (string) ($first['unit'] ?? ''),
        'date' => aio_jdate('Y/m/d', get_post_time('U', true, $o)), 'status' => $st, 'statusText' => AIO_ORDER_STATUSES[$st] ?? $st,
        'payUrl' => $st === 'pending' ? aio_checkout_url($o->ID) : '', 'refId' => (string) aio_meta($o->ID, 'ref_id', ''),
    ];
}

function aio_user_orders(int $uid): array
{
    return array_map('aio_order_item', get_posts(['post_type' => 'aio_order', 'post_status' => 'publish', 'author' => $uid, 'numberposts' => 100]));
}

/* ---------- کارفرما ---------- */
function aio_employer_labs(int $uid): array
{
    $args = ['post_type' => 'aio_lab', 'post_status' => ['publish', 'pending', 'draft'], 'numberposts' => -1];
    /* مدیر سایت از پنل کارفرما همه‌ی سازمان‌ها را می‌تواند مدیریت کند */
    if (!user_can($uid, 'edit_others_posts')) $args['author'] = $uid;
    return array_map('aio_lab_item', get_posts($args));
}

function aio_employer_jobs(int $uid): array
{
    $out = [];
    $st = ['publish' => 'فعال', 'pending' => 'در انتظار تأیید', 'draft' => 'پیش‌نویس', 'aio_expired' => 'منقضی‌شده', 'private' => 'بسته‌شده', 'aio_internal' => 'پوزیشن داخلی'];
    $cls = ['publish' => 'active', 'pending' => 'pending', 'draft' => 'pending', 'aio_expired' => 'expired', 'private' => 'expired', 'aio_internal' => 'active'];
    foreach (get_posts(['post_type' => 'aio_job', 'post_status' => array_keys($st), 'author' => $uid, 'numberposts' => -1]) as $p) {
        $apps = (int) (new WP_Query(['post_type' => 'aio_application', 'post_status' => 'publish', 'meta_key' => '_aio_job_id', 'meta_value' => $p->ID, 'fields' => 'ids', 'posts_per_page' => 1]))->found_posts;
        $plan = (string) aio_meta($p->ID, 'plan', 'normal');
        $exp = (string) aio_meta($p->ID, 'expires', '');
        $out[] = aio_job_item($p) + ['views' => (int) aio_meta($p->ID, 'views', 0), 'applicants' => $apps, 'status' => $cls[$p->post_status] ?? 'pending',
            'wpStatus' => $p->post_status, 'statusText' => $st[$p->post_status] ?? $p->post_status,
            'expire' => $exp ? aio_jdate('Y/m/d', strtotime($exp)) : '—', 'plan' => ['normal' => 'پایه', 'featured' => 'ویژه', 'urgent' => 'فوری'][$plan] ?? 'پایه'];
    }
    return $out;
}

function aio_employer_applicants(int $uid): array
{
    $jobs = get_posts(['post_type' => 'aio_job', 'post_status' => ['publish', 'pending', 'draft', 'private', 'aio_expired', 'aio_internal'], 'author' => $uid, 'numberposts' => -1, 'fields' => 'ids']);
    if (!$jobs) return [];
    $apps = get_posts(['post_type' => 'aio_application', 'post_status' => 'publish', 'numberposts' => 300,
        'meta_query' => [['key' => '_aio_job_id', 'value' => $jobs, 'compare' => 'IN']]]);
    return array_map(fn($a) => aio_application_item($a, true), $apps);
}

function aio_credits(int $uid): array
{
    $c = aio_umeta($uid, 'credits', []);
    return array_merge(['job' => 0, 'featured' => 0, 'urgent' => 0], is_array($c) ? $c : []);
}

function aio_has_resume_bank(int $uid): bool
{
    if (!aio_opt('paid_resume_bank', 0)) return true;
    if (user_can($uid, 'manage_options')) return true;
    return (int) aio_umeta($uid, 'resume_bank_until', 0) > time() || (int) aio_umeta($uid, 'plan_until', 0) > time();
}

/* ---------- ساخت AIO_ME ---------- */
function aio_build_me(int $uid = 0): ?array
{
    $uid = $uid ?: get_current_user_id();
    if (!$uid) return null;
    $u = get_userdata($uid);
    if (!$u) return null;
    $role = aio_user_role($u);
    $courses = [];
    foreach ((array) aio_umeta($uid, 'courses', []) as $cid => $e) {
        $courses[] = ['id' => (int) $cid, 'date' => $e['date'] ?? '', 'done' => array_values((array) ($e['done'] ?? [])), 'last' => $e['last'] ?? null, 'quiz' => (object) ($e['quiz'] ?? [])];
    }
    $created = [];
    foreach (get_posts(['post_type' => 'aio_course', 'post_status' => ['draft', 'pending', 'publish'], 'author' => $uid, 'numberposts' => -1]) as $p) {
        $created[] = aio_builder_draft($p);
    }
    $file = (int) aio_umeta($uid, 'resume_file', 0);
    $me = [
        'id' => $uid, 'name' => $u->display_name, 'email' => $u->user_email, 'phone' => (string) get_user_meta($uid, 'aio_phone', true),
        'botLinked' => (string) get_user_meta($uid, 'aio_bot_chat', true) !== '',
        'role' => $role === 'admin' ? 'employer' : $role, 'realRole' => $role, 'roleLabel' => aio_role_label($role),
        'province' => (string) get_user_meta($uid, 'aio_province', true), 'volStatus' => (string) get_user_meta($uid, 'aio_vol_status', true),
        'centerType' => (string) get_user_meta($uid, 'aio_center_type', true),
        'otw' => (bool) aio_umeta($uid, 'otw', 0), 'resume' => aio_resume($uid), 'strength' => aio_profile_strength($uid),
        'cv' => (object) aio_cv($uid),
        'resumeFile' => $file ? ['url' => wp_get_attachment_url($file), 'name' => basename((string) get_attached_file($file))] : null,
        'applications' => array_map('aio_application_item', get_posts(['post_type' => 'aio_application', 'post_status' => 'publish', 'author' => $uid, 'numberposts' => 200])),
        'saved' => array_values(array_map('intval', (array) aio_umeta($uid, 'saved', []))),
        'alerts' => array_values((array) aio_umeta($uid, 'alerts', [])),
        'certs' => aio_user_certs($uid), 'exams' => (object) aio_umeta($uid, 'exams', []),
        'mbti' => aio_umeta($uid, 'mbti', null), 'mbtiPublic' => (bool) aio_umeta($uid, 'mbti_public', 0), 'assess' => aio_umeta($uid, 'assess', null),
        'courses' => $courses, 'wishlist' => array_values(array_map('intval', (array) aio_umeta($uid, 'wishlist', []))),
        'orders' => aio_user_orders($uid), 'created' => $created,
        'notices' => array_values((array) aio_umeta($uid, 'notices', [])),
        'follows' => array_values(array_map('intval', (array) aio_umeta($uid, 'follows', []))),
        'likes' => array_values(array_map('intval', (array) aio_umeta($uid, 'likes', []))),
        'groups' => array_values((array) aio_umeta($uid, 'groups', [])),
        'profileViews' => (int) aio_umeta($uid, 'profile_views', 0),
        'planUntil' => (int) aio_umeta($uid, 'plan_until', 0) > time() ? aio_jdate('Y/m/d', (int) aio_umeta($uid, 'plan_until', 0)) : '',
    ];
    if (in_array($role, ['employer', 'admin', 'supplier'], true)) {
        $me['labs'] = aio_employer_labs($uid);
        $me['jobs'] = aio_employer_jobs($uid);
        $me['applicants'] = aio_employer_applicants($uid);
        $me['credits'] = aio_credits($uid);
        $me['resumeBank'] = aio_has_resume_bank($uid);
        $me['paidPosting'] = (bool) aio_opt('paid_job_posting', 0);
        $me['myExams'] = array_map(fn($p) => aio_exam_item($p), get_posts(['post_type' => 'aio_exam', 'post_status' => ['publish', 'pending', 'draft'], 'author' => $uid, 'numberposts' => -1]));
        $me['savedSearches'] = array_values((array) aio_umeta($uid, 'saved_searches', []));
        $me['talentFilters'] = array_values((array) aio_umeta($uid, 'talent_filters', []));
        $me['labDraft'] = aio_umeta($uid, 'lab_draft', null) ?: null;
        $me['products'] = array_map('aio_product_item', get_posts(['post_type' => 'aio_product', 'post_status' => ['publish', 'pending', 'draft'], 'author' => $uid, 'numberposts' => -1]));
    }
    return $me;
}

/** قالب ساده‌شده‌ی دوره برای سازنده دوره (همان ساختار MyCreated دمو) */
function aio_builder_draft(WP_Post $p): array
{
    $d = aio_meta($p->ID, 'builder', []);
    $d = is_array($d) ? $d : [];
    $status = ['draft' => 'draft', 'pending' => 'pending', 'publish' => 'published'][$p->post_status] ?? 'draft';
    return array_merge($d, ['id' => $p->ID, 'title' => $p->post_title, 'status' => $status, 'cat' => aio_first_term_slug($p->ID, 'aio_course_cat') ?: ($d['cat'] ?? ''),
        'url' => get_permalink($p), 'updatedAt' => get_post_modified_time('c', true, $p)]);
}
