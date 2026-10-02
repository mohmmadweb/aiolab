<?php
/**
 * REST API آیولب — فضای نام aio/v1
 * همه‌ی عملیات کاربران (ورود، رزومه، درخواست، آزمون، دوره، پنل کارفرما، سفارش، جامعه، تماس)
 */
defined('ABSPATH') || exit;

const AIO_NS = 'aio/v1';

function aio_ok(array $data = [], bool $with_me = false): WP_REST_Response
{
    if ($with_me) $data['me'] = aio_build_me();
    return new WP_REST_Response(['ok' => true] + $data, 200);
}

function aio_err(string $msg, int $code = 400, array $extra = []): WP_Error
{
    return new WP_Error('aio_error', $msg, ['status' => $code] + $extra);
}

/** محدودسازی ساده‌ی تعداد درخواست */
function aio_rate_limit(string $key, int $max, int $window): bool
{
    $k = 'aio_rl_' . md5($key);
    $n = (int) get_transient($k);
    if ($n >= $max) return false;
    set_transient($k, $n + 1, $window);
    return true;
}

function aio_p(WP_REST_Request $r, string $k, $default = '')
{
    $v = $r->get_param($k);
    return $v === null ? $default : $v;
}

/** پاک‌سازی بازگشتی داده‌های کاربر */
function aio_clean_deep($v, int $depth = 0)
{
    if ($depth > 8) return null;
    if (is_array($v)) {
        $out = [];
        foreach ($v as $k => $x) {
            $key = is_int($k) ? $k : preg_replace('/[^A-Za-z0-9_\-]/', '', (string) $k);
            if ($key === '') continue;
            $out[$key] = aio_clean_deep($x, $depth + 1);
            if (count($out) > 400) break;
        }
        return $out;
    }
    if (is_bool($v) || is_int($v) || is_float($v) || $v === null) return $v;
    return aio_clean_textarea((string) $v, 3000);
}

add_action('rest_api_init', function () {
    $pub = '__return_true';
    $user = fn() => is_user_logged_in();
    $emp = fn() => is_user_logged_in() && in_array(aio_user_role(), ['employer', 'admin', 'supplier'], true);
    $R = function (string $methods, string $route, callable $cb, $perm) {
        register_rest_route(AIO_NS, $route, ['methods' => $methods, 'callback' => $cb, 'permission_callback' => $perm]);
    };

    /* ================= احراز هویت ================= */
    $R('POST', '/auth/login', 'aio_api_login', $pub);
    $R('POST', '/auth/register', 'aio_api_register', $pub);
    $R('POST', '/auth/lost', 'aio_api_lost', $pub);
    $R('POST', '/auth/logout', function () { wp_logout(); return aio_ok(['redirect' => home_url('/')]); }, $user);

    /* ================= کاربر ================= */
    $R('GET', '/me', fn() => aio_ok([], true), $user);
    $R('POST', '/me/profile', 'aio_api_profile', $user);
    $R('POST', '/me/password', 'aio_api_password', $user);
    $R('POST', '/me/resume', 'aio_api_resume', $user);
    $R('POST', '/me/resume-file', 'aio_api_resume_file', $user);
    $R('DELETE', '/me/resume-file', function () {
        $uid = get_current_user_id();
        $f = (int) aio_umeta($uid, 'resume_file', 0);
        if ($f && (int) get_post_field('post_author', $f) === $uid) wp_delete_attachment($f, true);
        aio_set_umeta($uid, 'resume_file', 0);
        return aio_ok([], true);
    }, $user);
    $R('POST', '/me/otw', function ($r) {
        aio_set_umeta(get_current_user_id(), 'otw', aio_bool(aio_p($r, 'on')) ? 1 : 0);
        return aio_ok([], true);
    }, $user);
    $R('POST', '/me/saved', function ($r) {
        $uid = get_current_user_id();
        $id = (int) aio_p($r, 'job_id');
        if (get_post_type($id) !== 'aio_job') return aio_err('آگهی پیدا نشد.', 404);
        $s = array_map('intval', (array) aio_umeta($uid, 'saved', []));
        $on = $r->has_param('on') ? aio_bool(aio_p($r, 'on')) : !in_array($id, $s, true);
        $s = $on ? array_values(array_unique(array_merge($s, [$id]))) : array_values(array_diff($s, [$id]));
        aio_set_umeta($uid, 'saved', $s);
        return aio_ok(['on' => $on], true);
    }, $user);
    $R('POST', '/me/alerts', 'aio_api_alert_add', $user);
    $R('DELETE', '/me/alerts/(?P<id>[A-Za-z0-9]+)', function ($r) {
        $uid = get_current_user_id();
        $a = array_values(array_filter((array) aio_umeta($uid, 'alerts', []), fn($x) => ($x['id'] ?? '') !== $r['id']));
        aio_set_umeta($uid, 'alerts', $a);
        return aio_ok([], true);
    }, $user);
    $R('POST', '/me/mbti', function ($r) {
        $uid = get_current_user_id();
        $type = strtoupper(preg_replace('/[^EISNTFJP]/i', '', (string) aio_p($r, 'type')));
        if (strlen($type) !== 4) return aio_err('نتیجه نامعتبر است.');
        $res = aio_clean_deep((array) aio_p($r, 'result', []));
        $res['type'] = $type;
        $res['date'] = aio_jdate('Y/m/d');
        aio_set_umeta($uid, 'mbti', $res);
        return aio_ok([], true);
    }, $user);
    $R('POST', '/me/mbti-public', function ($r) {
        aio_set_umeta(get_current_user_id(), 'mbti_public', aio_bool(aio_p($r, 'on')) ? 1 : 0);
        return aio_ok([], true);
    }, $user);
    $R('POST', '/me/assess', function ($r) {
        $res = aio_clean_deep((array) aio_p($r, 'result', []));
        $res['date'] = aio_jdate('Y/m/d');
        aio_set_umeta(get_current_user_id(), 'assess', $res);
        return aio_ok([], true);
    }, $user);
    $R('POST', '/me/notices/read', function ($r) {
        $uid = get_current_user_id();
        $id = (string) aio_p($r, 'id', '');
        $n = array_map(function ($x) use ($id) {
            if (!$id || ($x['id'] ?? '') === $id) $x['unread'] = false;
            return $x;
        }, (array) aio_umeta($uid, 'notices', []));
        aio_set_umeta($uid, 'notices', $n);
        return aio_ok([], true);
    }, $user);
    $R('POST', '/me/wishlist', function ($r) {
        $uid = get_current_user_id();
        $id = (int) aio_p($r, 'course_id');
        if (get_post_type($id) !== 'aio_course') return aio_err('دوره پیدا نشد.', 404);
        $w = array_map('intval', (array) aio_umeta($uid, 'wishlist', []));
        $on = !in_array($id, $w, true);
        $w = $on ? array_merge($w, [$id]) : array_values(array_diff($w, [$id]));
        aio_set_umeta($uid, 'wishlist', $w);
        return aio_ok(['on' => $on], true);
    }, $user);
    $R('POST', '/me/follow', function ($r) {
        $uid = get_current_user_id();
        $id = (int) aio_p($r, 'lab_id');
        if (get_post_type($id) !== 'aio_lab') return aio_err('مرکز پیدا نشد.', 404);
        $f = array_map('intval', (array) aio_umeta($uid, 'follows', []));
        $on = !in_array($id, $f, true);
        $f = $on ? array_merge($f, [$id]) : array_values(array_diff($f, [$id]));
        aio_set_umeta($uid, 'follows', $f);
        return aio_ok(['on' => $on], true);
    }, $user);
    $R('POST', '/me/groups', function ($r) {
        $uid = get_current_user_id();
        $g = aio_clean_text(aio_p($r, 'group'), 80);
        $list = (array) aio_umeta($uid, 'groups', []);
        $on = !in_array($g, $list, true);
        $list = $on ? array_merge($list, [$g]) : array_values(array_diff($list, [$g]));
        aio_set_umeta($uid, 'groups', $list);
        return aio_ok(['on' => $on], true);
    }, $user);

    /* ================= آگهی و مرکز ================= */
    $R('POST', '/jobs/(?P<id>\d+)/apply', 'aio_api_apply', $user);
    $R('POST', '/labs/(?P<id>\d+)/review', 'aio_api_lab_review', $user);
    $R('POST', '/labs/(?P<id>\d+)/message', 'aio_api_lab_message', $user);

    /* ================= آزمون مهارت ================= */
    $R('POST', '/exams/(?P<id>\d+)/start', 'aio_api_exam_start', $user);
    $R('POST', '/exams/(?P<id>\d+)/submit', 'aio_api_exam_submit', $user);

    /* ================= آکادمی ================= */
    $R('POST', '/courses/(?P<id>\d+)/enroll', 'aio_api_enroll', $user);
    $R('DELETE', '/courses/(?P<id>\d+)/enroll', function ($r) {
        $uid = get_current_user_id();
        $e = aio_course_enrollment($uid, (int) $r['id']);
        if ($e && !empty($e['paid'])) return aio_err('دوره‌ی پرداخت‌شده از فهرست شما حذف نمی‌شود.');
        aio_unenroll($uid, (int) $r['id']);
        return aio_ok([], true);
    }, $user);
    $R('GET', '/courses/(?P<id>\d+)/lesson', 'aio_api_lesson', $user);
    $R('POST', '/courses/(?P<id>\d+)/progress', function ($r) {
        $uid = get_current_user_id();
        $cid = (int) $r['id'];
        if (!aio_can_learn($uid, $cid)) return aio_err('ابتدا در دوره ثبت‌نام کنید.', 403);
        $key = (string) aio_p($r, 'key');
        $l = aio_course_lessons($cid)[$key] ?? null;
        if (!$l) return aio_err('درس پیدا نشد.', 404);
        if (($l['type'] ?? '') === 'quiz' && !empty($l['questions']) && aio_bool(aio_p($r, 'done', true))) {
            $e = aio_course_enrollment($uid, $cid);
            if (!isset($e['quiz'][$key]) || $e['quiz'][$key] < 60) return aio_err('برای تکمیل این درس، آزمون آن را با نمره‌ی حداقل ۶۰ قبول شوید.');
        }
        $res = aio_mark_lesson($uid, $cid, $key, aio_bool(aio_p($r, 'done', true)));
        return aio_ok(['cert' => !empty($res['certId'])], true);
    }, $user);
    $R('POST', '/courses/(?P<id>\d+)/quiz', 'aio_api_lesson_quiz', $user);
    $R('POST', '/courses/(?P<id>\d+)/review', function ($r) {
        $uid = get_current_user_id();
        $cid = (int) $r['id'];
        if (!aio_course_enrollment($uid, $cid)) return aio_err('فقط فراگیران دوره می‌توانند نظر ثبت کنند.', 403);
        $stars = max(1, min(5, (int) aio_p($r, 'stars')));
        $text = aio_clean_textarea(aio_p($r, 'text'), 1500);
        if (mb_strlen($text) < 5) return aio_err('متن نظر خیلی کوتاه است.');
        aio_add_review($cid, $uid, ['stars' => $stars, 'text' => $text, 'role' => aio_clean_text(aio_p($r, 'role'), 80)]);
        return aio_ok(['approved' => (bool) aio_opt('review_auto_approve', 0)]);
    }, $user);
    $R('POST', '/builder', 'aio_api_builder_save', $user);
    $R('DELETE', '/builder/(?P<id>\d+)', function ($r) {
        $p = get_post((int) $r['id']);
        if (!$p || $p->post_type !== 'aio_course' || (int) $p->post_author !== get_current_user_id()) return aio_err('دوره پیدا نشد.', 404);
        if ($p->post_status === 'publish') return aio_err('دوره‌ی منتشرشده را فقط مدیر سایت می‌تواند حذف کند.');
        wp_trash_post($p->ID);
        return aio_ok([], true);
    }, $user);

    /* ================= پنل کارفرما ================= */
    $R('POST', '/employer/lab', 'aio_api_emp_lab', $emp);
    $R('POST', '/employer/lab-draft', 'aio_api_emp_lab_draft', $emp);
    $R('POST', '/employer/lab/(?P<id>\d+)/logo', 'aio_api_emp_lab_logo', $emp);
    $R('POST', '/employer/job', 'aio_api_emp_job', $emp);
    $R('POST', '/employer/job/(?P<id>\d+)/status', 'aio_api_emp_job_status', $emp);
    $R('POST', '/employer/application/(?P<id>\d+)', 'aio_api_emp_app_status', $emp);
    $R('GET', '/employer/resume/(?P<uid>\d+)', 'aio_api_emp_resume', $emp);
    $R('GET', '/employer/resumes', 'aio_api_emp_resumes', $emp);
    $R('POST', '/employer/searches', function ($r) {
        $uid = get_current_user_id();
        $s = (array) aio_umeta($uid, 'saved_searches', []);
        array_unshift($s, ['id' => uniqid('s'), 'title' => aio_clean_text(aio_p($r, 'title', 'جستجوی ذخیره‌شده'), 120), 'filters' => aio_clean_deep((array) aio_p($r, 'filters', [])), 'date' => aio_jdate('Y/m/d')]);
        aio_set_umeta($uid, 'saved_searches', array_slice($s, 0, 20));
        return aio_ok([], true);
    }, $emp);
    $R('POST', '/employer/exam', 'aio_api_emp_exam', $emp);

    /* ================= سفارش و پرداخت ================= */
    $R('POST', '/orders', 'aio_api_order_create', $user);
    $R('POST', '/orders/(?P<id>\d+)/pay', function ($r) {
        $o = get_post((int) $r['id']);
        if (!$o || $o->post_type !== 'aio_order' || (int) $o->post_author !== get_current_user_id()) return aio_err('سفارش پیدا نشد.', 404);
        if (aio_meta($o->ID, 'status') !== 'pending') return aio_err('این سفارش در انتظار پرداخت نیست.');
        $res = aio_pay_start($o->ID);
        if (!empty($res['error'])) return aio_err($res['error'], 502);
        return aio_ok($res);
    }, $user);
    $R('POST', '/orders/(?P<id>\d+)/cancel', function ($r) {
        $o = get_post((int) $r['id']);
        if (!$o || $o->post_type !== 'aio_order' || (int) $o->post_author !== get_current_user_id()) return aio_err('سفارش پیدا نشد.', 404);
        if (!in_array(aio_meta($o->ID, 'status'), ['pending', 'processing'], true)) return aio_err('این سفارش قابل لغو نیست.');
        aio_order_set_status($o->ID, 'cancelled', 'لغو توسط کاربر');
        return aio_ok([], true);
    }, $user);

    /* ================= جامعه ================= */
    $R('POST', '/community', 'aio_api_community_post', $user);
    $R('POST', '/community/(?P<id>\d+)/like', function ($r) {
        $uid = get_current_user_id();
        $pid = (int) $r['id'];
        if (get_post_type($pid) !== 'aio_community') return aio_err('پست پیدا نشد.', 404);
        $likes = array_map('intval', (array) aio_umeta($uid, 'likes', []));
        $on = !in_array($pid, $likes, true);
        $likes = $on ? array_merge($likes, [$pid]) : array_values(array_diff($likes, [$pid]));
        aio_set_umeta($uid, 'likes', $likes);
        aio_set_meta($pid, 'likes', max(0, (int) aio_meta($pid, 'likes', 0) + ($on ? 1 : -1)));
        do_action('aio_data_changed');
        return aio_ok(['on' => $on, 'likes' => (int) aio_meta($pid, 'likes_base', 0) + (int) aio_meta($pid, 'likes', 0)]);
    }, $user);
    $R('GET', '/community/(?P<id>\d+)/comments', function ($r) {
        $out = [];
        foreach (get_comments(['post_id' => (int) $r['id'], 'status' => 'approve', 'order' => 'ASC']) as $c) {
            $out[] = ['author' => $c->comment_author, 'text' => wp_strip_all_tags($c->comment_content), 'time' => aio_time_ago(strtotime($c->comment_date_gmt . ' UTC'))];
        }
        return aio_ok(['comments' => $out]);
    }, $pub);
    $R('POST', '/community/(?P<id>\d+)/comments', function ($r) {
        $uid = get_current_user_id();
        $pid = (int) $r['id'];
        if (get_post_type($pid) !== 'aio_community' || get_post_status($pid) !== 'publish') return aio_err('پست پیدا نشد.', 404);
        $text = aio_clean_textarea(aio_p($r, 'text'), 1000);
        if (mb_strlen($text) < 2) return aio_err('متنی بنویسید.');
        if (!aio_rate_limit('cm' . $uid, 20, HOUR_IN_SECONDS)) return aio_err('تعداد دیدگاه‌ها زیاد است؛ کمی بعد دوباره تلاش کنید.', 429);
        $u = wp_get_current_user();
        $approved = aio_opt('community_auto_publish', 1) ? 1 : 0;
        wp_insert_comment(['comment_post_ID' => $pid, 'user_id' => $uid, 'comment_author' => $u->display_name, 'comment_author_email' => $u->user_email, 'comment_content' => $text, 'comment_approved' => $approved]);
        $author = (int) get_post_field('post_author', $pid);
        if ($author && $author !== $uid) aio_notify($author, $u->display_name . ' برای پست شما در جامعه دیدگاه گذاشت.', aio_page_url('community'), 'جامعه آیولب', false, '💬');
        return aio_ok(['approved' => (bool) $approved]);
    }, $user);

    /* ================= تماس و درخواست همکاری ================= */
    $R('POST', '/contact', 'aio_api_contact', $pub);
});

/* ================================================================
   احراز هویت
   ================================================================ */
function aio_home_for(WP_User $u): string
{
    $role = aio_user_role($u);
    if ($role === 'admin') return aio_page_url('employer');
    return $role === 'employer' ? aio_page_url('employer') : ($role === 'supplier' ? aio_page_url('advertise') : aio_page_url('dashboard'));
}

function aio_safe_redirect(string $to, string $fallback): string
{
    $to = trim($to);
    if ($to === '') return $fallback;
    if (str_starts_with($to, '/') && !str_starts_with($to, '//')) return home_url($to);
    return wp_validate_redirect($to, $fallback);
}

function aio_api_login(WP_REST_Request $r)
{
    $ip = aio_client_ip();
    if (!aio_rate_limit('login' . $ip, 10, 15 * MINUTE_IN_SECONDS)) return aio_err('تلاش‌های ناموفق زیاد بود؛ ۱۵ دقیقه دیگر دوباره امتحان کنید.', 429);
    $login = trim(aio_en_digits((string) aio_p($r, 'login')));
    $pass = (string) aio_p($r, 'password');
    if ($login === '' || $pass === '') return aio_err('ایمیل و رمز عبور را وارد کنید.');
    $user = null;
    if (is_email($login)) $user = get_user_by('email', $login);
    elseif (preg_match('/^09\d{9}$/', $login)) {
        $q = get_users(['meta_key' => 'aio_phone', 'meta_value' => $login, 'number' => 1]);
        $user = $q[0] ?? null;
    } else $user = get_user_by('login', $login);
    if (!$user || !wp_check_password($pass, $user->user_pass, $user->ID)) {
        return aio_err('ایمیل یا رمز عبور درست نیست.', 401);
    }
    $signed = wp_signon(['user_login' => $user->user_login, 'user_password' => $pass, 'remember' => aio_bool(aio_p($r, 'remember', true))], is_ssl());
    if (is_wp_error($signed)) return aio_err('ورود ناموفق بود.', 401);
    delete_transient('aio_rl_' . md5('login' . $ip));
    return aio_ok(['redirect' => aio_safe_redirect((string) aio_p($r, 'redirect'), aio_home_for($signed)), 'role' => aio_user_role($signed)]);
}

function aio_api_register(WP_REST_Request $r)
{
    if (aio_opt('cs_enabled', 0) && !aio_preview_allowed()) return aio_err('ثبت‌نام پس از راه‌اندازی رسمی سایت فعال می‌شود.', 403);
    if (!aio_rate_limit('reg' . aio_client_ip(), 6, HOUR_IN_SECONDS)) return aio_err('تعداد ثبت‌نام از این شبکه زیاد است؛ کمی بعد تلاش کنید.', 429);
    $role = sanitize_key(aio_p($r, 'role', 'seeker'));
    if (!in_array($role, ['seeker', 'volunteer', 'employer', 'supplier'], true)) $role = 'seeker';
    $name = aio_clean_text(aio_p($r, 'name'), 80);
    $email = sanitize_email((string) aio_p($r, 'email'));
    $phone = aio_en_digits(preg_replace('/\s+/', '', (string) aio_p($r, 'phone')));
    $pass = (string) aio_p($r, 'password');
    if (mb_strlen($name) < 2) return aio_err('نام را کامل وارد کنید.');
    if (!is_email($email)) return aio_err('ایمیل معتبر وارد کنید.');
    if (email_exists($email)) return aio_err('با این ایمیل قبلاً ثبت‌نام شده است؛ وارد شوید یا رمز را بازیابی کنید.', 409);
    if (!preg_match('/^09\d{9}$/', $phone)) return aio_err('شماره موبایل را به شکل ۰۹xxxxxxxxx وارد کنید؛ برای ارتباط کارفرما و کارجو لازم است.', 422, ['field' => 'phone']);
    if (get_users(['meta_key' => 'aio_phone', 'meta_value' => $phone, 'number' => 1, 'fields' => 'ID'])) return aio_err('این شماره موبایل قبلاً ثبت شده است.', 409);
    if (strlen($pass) < 8) return aio_err('رمز عبور باید حداقل ۸ کاراکتر باشد.');
    $base = sanitize_user(strstr($email, '@', true), true) ?: 'user';
    $login = $base;
    $i = 1;
    while (username_exists($login)) $login = $base . (++$i);
    $uid = wp_insert_user(['user_login' => $login, 'user_email' => $email, 'user_pass' => $pass, 'display_name' => $name,
        'first_name' => $name, 'nickname' => $name, 'role' => 'aio_' . $role]);
    if (is_wp_error($uid)) return aio_err('ثبت‌نام انجام نشد: ' . $uid->get_error_message());
    update_user_meta($uid, 'aio_phone', $phone);
    update_user_meta($uid, 'aio_province', sanitize_key(aio_p($r, 'province')));
    if ($role === 'volunteer') update_user_meta($uid, 'aio_vol_status', aio_clean_text(aio_p($r, 'vol_status'), 80));
    if (in_array($role, ['employer', 'supplier'], true)) update_user_meta($uid, 'aio_center_type', aio_clean_text(aio_p($r, 'center_type'), 80));
    $prov = sanitize_key(aio_p($r, 'province'));
    if ($prov) aio_set_umeta($uid, 'resume', array_merge(aio_resume_defaults(), ['province' => $prov]));
    wp_set_current_user($uid);
    wp_set_auth_cookie($uid, true, is_ssl());
    $welcome = in_array($role, ['employer'], true)
        ? 'به آیولب خوش آمدید! ابتدا مرکز خود را ثبت کنید، سپس آگهی استخدام بگذارید.'
        : ($role === 'supplier' ? 'به آیولب خوش آمدید! پکیج‌های تبلیغاتی را در صفحه «تبلیغات و همکاری» ببینید.'
        : 'به آیولب خوش آمدید! مسیر «بعد از ثبت‌نام» را در داشبورد دنبال کنید تا پروفایل‌تان دیده شود.');
    aio_notify($uid, $welcome, '', 'پشتیبانی آیولب', false, '🎉');
    if (!aio_is_test_email($email)) aio_mail($email, 'به آیولب خوش آمدید', '<p>' . esc_html($name) . ' عزیز، حساب شما در آیولب ساخته شد.</p><p>' . esc_html($welcome) . '</p><p><a class="btn" href="' . esc_url(aio_home_for(get_userdata($uid))) . '">ورود به پنل</a></p>');
    if (!aio_is_test_email($email)) aio_notify_admin('کاربر جدید: ' . $name, '<p>' . esc_html($name) . ' (' . esc_html(aio_role_label($role)) . ') — ' . esc_html($email) . '</p>');
    return aio_ok(['redirect' => aio_safe_redirect((string) aio_p($r, 'redirect'), aio_home_for(get_userdata($uid))), 'role' => $role]);
}

function aio_api_lost(WP_REST_Request $r)
{
    if (!aio_rate_limit('lost' . aio_client_ip(), 5, HOUR_IN_SECONDS)) return aio_err('درخواست‌ها زیاد است؛ کمی بعد تلاش کنید.', 429);
    $login = trim((string) aio_p($r, 'login'));
    $u = is_email($login) ? get_user_by('email', $login) : get_user_by('login', $login);
    if ($u) retrieve_password($u->user_login);
    /* پاسخ یکسان برای جلوگیری از افشای وجود حساب */
    return aio_ok(['message' => 'اگر حسابی با این مشخصات وجود داشته باشد، لینک بازیابی رمز به ایمیل آن ارسال شد.']);
}

/* ================================================================
   پروفایل و رزومه
   ================================================================ */
function aio_api_profile(WP_REST_Request $r)
{
    $uid = get_current_user_id();
    $name = aio_clean_text(aio_p($r, 'name'), 80);
    if ($name !== '') wp_update_user(['ID' => $uid, 'display_name' => $name, 'first_name' => $name, 'nickname' => $name]);
    if ($r->has_param('phone')) {
        $phone = aio_en_digits((string) aio_p($r, 'phone'));
        if ($phone !== '' && !preg_match('/^09\d{9}$/', $phone)) return aio_err('شماره موبایل نامعتبر است.');
        update_user_meta($uid, 'aio_phone', $phone);
    }
    if ($r->has_param('province')) update_user_meta($uid, 'aio_province', sanitize_key(aio_p($r, 'province')));
    if ($r->has_param('headline')) update_user_meta($uid, 'aio_headline', aio_clean_text(aio_p($r, 'headline'), 100));
    return aio_ok([], true);
}

function aio_api_password(WP_REST_Request $r)
{
    $u = wp_get_current_user();
    if (!wp_check_password((string) aio_p($r, 'current'), $u->user_pass, $u->ID)) return aio_err('رمز فعلی درست نیست.', 403);
    $new = (string) aio_p($r, 'new');
    if (strlen($new) < 8) return aio_err('رمز جدید باید حداقل ۸ کاراکتر باشد.');
    wp_set_password($new, $u->ID);
    wp_set_auth_cookie($u->ID, true, is_ssl());
    return aio_ok(['message' => 'رمز عبور تغییر کرد.']);
}

function aio_api_resume(WP_REST_Request $r)
{
    $uid = get_current_user_id();
    $cur = aio_resume($uid);
    $in = (array) aio_p($r, 'resume', []);
    foreach (['title', 'city', 'province', 'experience', 'degree', 'field', 'salary', 'gender', 'military', 'dept'] as $k) {
        if (array_key_exists($k, $in)) $cur[$k] = aio_clean_text($in[$k], 120);
    }
    if (array_key_exists('summary', $in)) $cur['summary'] = aio_clean_textarea($in['summary'], 2000);
    foreach (['skills', 'devices'] as $k) if (array_key_exists($k, $in)) $cur[$k] = aio_clean_list($in[$k], 40, 80);
    foreach (['history', 'education'] as $k) {
        if (array_key_exists($k, $in) && is_array($in[$k])) {
            $cur[$k] = array_slice(array_map(fn($x) => array_map(fn($v) => aio_clean_text($v, 200), array_filter((array) $x, 'is_scalar')), $in[$k]), 0, 20);
        }
    }
    if (!$cur['province'] && $cur['city']) $cur['province'] = aio_province_of_city($cur['city']);
    aio_set_umeta($uid, 'resume', $cur);
    aio_set_umeta($uid, 'resume_updated', time());
    if (!empty($in['name'])) wp_update_user(['ID' => $uid, 'display_name' => aio_clean_text($in['name'], 80)]);
    if (array_key_exists('phone', $in)) {
        $p = aio_en_digits((string) $in['phone']);
        if ($p === '' || preg_match('/^09\d{9}$/', $p)) update_user_meta($uid, 'aio_phone', $p);
    }
    return aio_ok([], true);
}

function aio_handle_upload(string $field, array $mimes, int $max_mb, int $uid)
{
    if (empty($_FILES[$field]['name'])) return aio_err('فایلی انتخاب نشده است.');
    if ((int) $_FILES[$field]['size'] > $max_mb * 1024 * 1024) return aio_err("حجم فایل باید کمتر از {$max_mb} مگابایت باشد.");
    require_once ABSPATH . 'wp-admin/includes/file.php';
    require_once ABSPATH . 'wp-admin/includes/image.php';
    require_once ABSPATH . 'wp-admin/includes/media.php';
    $_FILES[$field]['name'] = wp_unique_filename(wp_upload_dir()['path'], 'aio-' . wp_generate_password(10, false) . '.' . strtolower(pathinfo($_FILES[$field]['name'], PATHINFO_EXTENSION)));
    $up = wp_handle_upload($_FILES[$field], ['test_form' => false, 'mimes' => $mimes]);
    if (!empty($up['error'])) return aio_err('بارگذاری ناموفق بود: ' . $up['error']);
    $att = wp_insert_attachment(['post_mime_type' => $up['type'], 'post_title' => sanitize_file_name(basename($up['file'])), 'post_status' => 'inherit', 'post_author' => $uid], $up['file']);
    if (str_starts_with($up['type'], 'image/')) wp_update_attachment_metadata($att, wp_generate_attachment_metadata($att, $up['file']));
    return (int) $att;
}

function aio_api_resume_file(WP_REST_Request $r)
{
    $uid = get_current_user_id();
    $att = aio_handle_upload('file', ['pdf' => 'application/pdf', 'doc' => 'application/msword', 'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'], 5, $uid);
    if (is_wp_error($att)) return $att;
    $old = (int) aio_umeta($uid, 'resume_file', 0);
    if ($old && (int) get_post_field('post_author', $old) === $uid) wp_delete_attachment($old, true);
    aio_set_umeta($uid, 'resume_file', $att);
    return aio_ok([], true);
}

function aio_api_alert_add(WP_REST_Request $r)
{
    $uid = get_current_user_id();
    $alerts = (array) aio_umeta($uid, 'alerts', []);
    if (count($alerts) >= 10) return aio_err('حداکثر ۱۰ هشدار فعال می‌توانید داشته باشید.');
    $f = (array) aio_p($r, 'filters', []);
    $filters = ['q' => aio_clean_text($f['q'] ?? '', 80), 'dept' => sanitize_key($f['dept'] ?? ''), 'provinceId' => sanitize_key($f['provinceId'] ?? ''),
        'city' => aio_clean_text($f['city'] ?? '', 60), 'type' => aio_clean_text($f['type'] ?? '', 60), 'band' => sanitize_key($f['band'] ?? '')];
    $channels = array_values(array_intersect(aio_clean_list(aio_p($r, 'channels', [])), ['ایمیل', 'اعلان سایت', 'پیامک', 'تلگرام']));
    if (!$channels) $channels = ['ایمیل', 'اعلان سایت'];
    $title = aio_clean_text(aio_p($r, 'title', ''), 120);
    if ($title === '') {
        $parts = [];
        if ($filters['q']) $parts[] = $filters['q'];
        $parts[] = $filters['dept'] ? (get_term_by('slug', $filters['dept'], 'aio_dept')->name ?? $filters['dept']) : 'همه بخش‌ها';
        $parts[] = $filters['city'] ?: ($filters['provinceId'] ? aio_province_name($filters['provinceId']) : 'سراسر کشور');
        $title = implode(' · ', $parts);
    }
    $freq = aio_clean_text(aio_p($r, 'freq', 'خلاصه روزانه'), 40);
    array_unshift($alerts, ['id' => substr(md5(uniqid('', true)), 0, 10), 'title' => $title, 'filters' => $filters, 'channels' => $channels, 'freq' => $freq, 'created' => aio_jdate('Y/m/d'), 'ts' => time()]);
    aio_set_umeta($uid, 'alerts', $alerts);
    return aio_ok(['title' => $title], true);
}

/* ================================================================
   درخواست همکاری، نظر مرکز، پیام به مرکز
   ================================================================ */
function aio_api_apply(WP_REST_Request $r)
{
    $uid = get_current_user_id();
    $job = get_post((int) $r['id']);
    if (!$job || $job->post_type !== 'aio_job' || $job->post_status !== 'publish') return aio_err('این آگهی فعال نیست.', 404);
    if (in_array(aio_user_role(), ['employer', 'supplier'], true)) return aio_err('با حساب کارفرما/تأمین‌کننده نمی‌توانید درخواست همکاری بدهید.', 403);
    $dup = get_posts(['post_type' => 'aio_application', 'author' => $uid, 'post_status' => 'publish', 'meta_key' => '_aio_job_id', 'meta_value' => $job->ID, 'fields' => 'ids', 'numberposts' => 1]);
    if ($dup) return aio_err('قبلاً برای این آگهی درخواست داده‌اید.', 409);
    $cv = aio_cv($uid);
    if (empty($cv['skills'])) return aio_err('ابتدا رزومه‌ی آیتمی خود را در داشبورد بسازید (حداقل عنوان شغلی و مهارت‌ها).', 422, ['needResume' => true]);
    if (!preg_match('/^09\d{9}$/', (string) get_user_meta($uid, 'aio_phone', true))) return aio_err('برای ارسال درخواست، شماره موبایل خود را در رزومه وارد کنید تا کارفرما بتواند با شما تماس بگیرد.', 422, ['needResume' => true]);
    $u = wp_get_current_user();
    $lab = (int) aio_meta($job->ID, 'lab_id', 0);
    $id = wp_insert_post(['post_type' => 'aio_application', 'post_status' => 'publish', 'post_author' => $uid, 'post_title' => $u->display_name . ' ← ' . $job->post_title]);
    if (is_wp_error($id)) return aio_err('ثبت درخواست ناموفق بود.');
    aio_set_meta($id, 'job_id', $job->ID);
    aio_set_meta($id, 'lab_id', $lab);
    aio_set_meta($id, 'employer_id', (int) $job->post_author);
    aio_set_meta($id, 'status', 'sent');
    aio_set_meta($id, 'note', aio_clean_textarea(aio_p($r, 'note'), 1500));
    aio_set_meta($id, 'match', aio_match_score($uid, $job->ID));
    aio_set_meta($id, 'channel', 'apply');
    aio_app_log($id, 'seeker', 'status', 'درخواست ارسال شد' . (aio_p($r, 'note') ? ' — ' . aio_clean_textarea(aio_p($r, 'note'), 300) : ''), ['status' => 'sent']);
    $emp = (int) $job->post_author;
    $panel = aio_page_url('employer', '#applicants');
    if ($emp && !user_can($emp, 'edit_posts')) aio_notify($emp, "درخواست جدید از {$u->display_name} برای «{$job->post_title}»", $panel, 'آیولب', true, '📥');
    else aio_notify_admin('درخواست همکاری جدید', '<p>' . esc_html($u->display_name) . ' برای «' . esc_html($job->post_title) . '» درخواست داد.</p><p><a class="btn" href="' . esc_url(admin_url('post.php?action=edit&post=' . $id)) . '">مشاهده</a></p>');
    aio_notify($uid, "درخواست شما برای «{$job->post_title}» ارسال شد.", aio_page_url('dashboard', '#applications'), 'آیولب', false, '📤');
    return aio_ok([], true);
}

function aio_api_lab_review(WP_REST_Request $r)
{
    $uid = get_current_user_id();
    $lab = get_post((int) $r['id']);
    if (!$lab || $lab->post_type !== 'aio_lab' || $lab->post_status !== 'publish') return aio_err('مرکز پیدا نشد.', 404);
    if ((int) $lab->post_author === $uid) return aio_err('برای مرکز خودتان نمی‌توانید نظر بدهید.', 403);
    if (get_comments(['post_id' => $lab->ID, 'user_id' => $uid, 'type' => 'aio_review', 'count' => true, 'status' => 'all'])) return aio_err('قبلاً برای این مرکز نظر ثبت کرده‌اید.', 409);
    $bd = [];
    foreach (AIO_LAB_BREAKDOWN as $k) {
        $v = (int) (aio_p($r, 'breakdown', [])[$k] ?? 0);
        if ($v < 1 || $v > 5) return aio_err('لطفاً به هر پنج شاخص امتیاز بدهید.');
        $bd[$k] = $v;
    }
    $stars = round(array_sum($bd) / count($bd), 1);
    $text = aio_clean_textarea(aio_p($r, 'text'), 2000);
    aio_add_review($lab->ID, $uid, ['stars' => $stars, 'breakdown' => $bd, 'text' => $text, 'name' => 'کاربر ناشناس',
        'title' => aio_clean_text(aio_p($r, 'title', ''), 80) ?: (aio_resume($uid)['title'] ?: 'کاربر آیولب'),
        'role' => aio_clean_text(aio_p($r, 'role', ''), 60), 'pros' => aio_clean_text(aio_p($r, 'pros'), 200), 'cons' => aio_clean_text(aio_p($r, 'cons'), 200)]);
    return aio_ok(['approved' => (bool) aio_opt('review_auto_approve', 0)]);
}

function aio_api_lab_message(WP_REST_Request $r)
{
    $uid = get_current_user_id();
    $lab = get_post((int) $r['id']);
    if (!$lab || $lab->post_type !== 'aio_lab') return aio_err('مرکز پیدا نشد.', 404);
    $text = aio_clean_textarea(aio_p($r, 'text'), 1500);
    if (mb_strlen($text) < 5) return aio_err('متن پیام خیلی کوتاه است.');
    if (!aio_rate_limit('labmsg' . $uid, 10, DAY_IN_SECONDS)) return aio_err('امروز پیام‌های زیادی ارسال کرده‌اید.', 429);
    $u = wp_get_current_user();
    $mid = wp_insert_post(['post_type' => 'aio_message', 'post_status' => 'publish', 'post_title' => 'پیام به ' . $lab->post_title . ' از ' . $u->display_name, 'post_content' => $text]);
    aio_set_meta($mid, 'kind', 'lab');
    aio_set_meta($mid, 'lab_id', $lab->ID);
    aio_set_meta($mid, 'user_id', $uid);
    aio_set_meta($mid, 'name', $u->display_name);
    aio_set_meta($mid, 'contact', $u->user_email);
    $owner = (int) $lab->post_author;
    if ($owner && !user_can($owner, 'edit_posts')) aio_notify($owner, "پیام از {$u->display_name}: " . wp_trim_words($text, 20), aio_page_url('employer'), 'آیولب', true, '✉️');
    else aio_notify_admin('پیام برای ' . $lab->post_title, '<p><b>' . esc_html($u->display_name) . '</b> (' . esc_html($u->user_email) . '):</p><p>' . nl2br(esc_html($text)) . '</p>');
    return aio_ok();
}

/* ================================================================
   آزمون مهارت — تصحیح فقط سمت سرور
   ================================================================ */
function aio_api_exam_start(WP_REST_Request $r)
{
    $uid = get_current_user_id();
    $ex = get_post((int) $r['id']);
    if (!$ex || $ex->post_type !== 'aio_exam' || $ex->post_status !== 'publish') return aio_err('آزمون پیدا نشد.', 404);
    $item = aio_exam_item($ex);
    $mine = (array) (((array) aio_umeta($uid, 'exams', []))[$ex->ID] ?? []);
    if ($item['price'] > 0 && empty($mine['paid']) && !user_can($uid, 'edit_posts')) return aio_err('شرکت در این آزمون نیاز به پرداخت دارد.', 402, ['needPay' => true]);
    $retake = $item['retakeDays'];
    if (!empty($mine['last']) && $retake > 0 && time() - (int) $mine['last'] < $retake * DAY_IN_SECONDS && !user_can($uid, 'edit_posts')) {
        $left = (int) ceil(($retake * DAY_IN_SECONDS - (time() - (int) $mine['last'])) / DAY_IN_SECONDS);
        return aio_err('امکان شرکت مجدد ' . aio_fa($left) . ' روز دیگر فراهم می‌شود.', 429);
    }
    if (!$item['qCount']) return aio_err('سؤالات این آزمون هنوز ثبت نشده است.');
    $token = wp_generate_password(20, false);
    set_transient('aio_ex_' . $uid . '_' . $ex->ID, ['t' => time(), 'token' => $token], ($item['duration'] + 30) * MINUTE_IN_SECONDS);
    return aio_ok(['token' => $token, 'duration' => $item['duration'], 'questions' => $item['questions']]);
}

function aio_api_exam_submit(WP_REST_Request $r)
{
    $uid = get_current_user_id();
    $ex = get_post((int) $r['id']);
    if (!$ex || $ex->post_type !== 'aio_exam') return aio_err('آزمون پیدا نشد.', 404);
    $sess = get_transient('aio_ex_' . $uid . '_' . $ex->ID);
    if (!$sess || !hash_equals((string) $sess['token'], (string) aio_p($r, 'token'))) return aio_err('جلسه‌ی آزمون منقضی شده است؛ دوباره شروع کنید.', 410);
    delete_transient('aio_ex_' . $uid . '_' . $ex->ID);
    $duration = (int) aio_meta($ex->ID, 'duration', 15);
    $late = (time() - (int) $sess['t']) > ($duration * 60 + 120);
    $answers = array_map(fn($a) => ($a === null || $a === '') ? null : (int) $a, (array) aio_p($r, 'answers', []));
    $g = aio_grade((array) aio_meta($ex->ID, 'questions', []), $answers);
    $pass_score = (int) aio_meta($ex->ID, 'pass_score', 60);
    $pass = !$late && $g['score'] >= $pass_score;
    $all = (array) aio_umeta($uid, 'exams', []);
    $mine = (array) ($all[$ex->ID] ?? []);
    $first = empty($mine['attempts']);
    $was_passed = !empty($mine['passed']);
    $mine['attempts'] = (int) ($mine['attempts'] ?? 0) + 1;
    $mine['last'] = time();
    $mine['lastScore'] = $g['score'];
    $mine['best'] = max((int) ($mine['best'] ?? 0), $g['score']);
    $mine['passed'] = $was_passed || $pass;
    $all[$ex->ID] = $mine;
    aio_set_umeta($uid, 'exams', $all);
    if ($first) aio_set_meta($ex->ID, 'takers', (int) aio_meta($ex->ID, 'takers', 0) + 1);
    if ($pass && !$was_passed) aio_set_meta($ex->ID, 'passes', (int) aio_meta($ex->ID, 'passes', 0) + 1);
    $cert = ($pass && aio_bool(aio_meta($ex->ID, 'auto_cert', 1))) ? aio_issue_cert($uid, 'exam', $ex->ID, $ex->post_title, $g['score'], (string) aio_meta($ex->ID, 'badge', '🏅')) : 0;
    /* اعتبار گواهی: با هر قبولی دوباره از امروز تمدید می‌شود */
    if ($cert) { $months = (int) aio_meta($ex->ID, 'cert_valid', 0); aio_set_meta($cert, 'expires', $months > 0 ? strtotime("+{$months} months") : 0); }
    if ($pass) aio_exam_auto_invite($ex, $uid, $g['score']);
    do_action('aio_data_changed');
    return aio_ok(['score' => $g['score'], 'right' => $g['right'], 'total' => $g['total'], 'pass' => $pass, 'late' => $late,
        'passScore' => $pass_score, 'key' => $g['key'], 'cert' => $cert ? aio_cert_item(get_post($cert)) : null], true);
}

/* ================================================================
   آکادمی
   ================================================================ */
function aio_api_enroll(WP_REST_Request $r)
{
    $uid = get_current_user_id();
    $c = get_post((int) $r['id']);
    if (!$c || $c->post_type !== 'aio_course' || $c->post_status !== 'publish') return aio_err('دوره پیدا نشد.', 404);
    $price = (int) aio_meta($c->ID, 'price', 0);
    if ($price > 0 && !aio_can_learn($uid, $c->ID)) {
        $oid = aio_find_pending_order($uid, 'course', $c->ID) ?: aio_create_order($uid, ['kind' => 'course', 'ref' => $c->ID, 'code' => 'C' . $c->ID, 'title' => 'دوره: ' . $c->post_title, 'price' => $price, 'unit' => 'هر دوره']);
        return aio_ok(['needPay' => true, 'order' => $oid, 'checkout' => aio_checkout_url($oid)], true);
    }
    $was = (bool) aio_course_enrollment($uid, $c->ID);
    aio_enroll($uid, $c->ID, $price > 0);
    return aio_ok(['enrolled' => true, 'was' => $was, 'learn' => aio_single_url('learn', $c->ID)], true);
}

function aio_find_pending_order(int $uid, string $kind, $ref): int
{
    foreach (get_posts(['post_type' => 'aio_order', 'author' => $uid, 'post_status' => 'publish', 'numberposts' => 50, 'meta_key' => '_aio_status', 'meta_value' => 'pending']) as $o) {
        $it = ((array) aio_meta($o->ID, 'items', []))[0] ?? [];
        if (($it['kind'] ?? '') === $kind && (string) ($it['ref'] ?? '') === (string) $ref) return $o->ID;
    }
    return 0;
}

function aio_api_lesson(WP_REST_Request $r)
{
    $uid = get_current_user_id();
    $cid = (int) $r['id'];
    if (!aio_can_learn($uid, $cid)) return aio_err('برای دیدن محتوای درس ابتدا در دوره ثبت‌نام کنید.', 403);
    $key = (string) aio_p($r, 'key');
    $l = aio_course_lessons($cid)[$key] ?? null;
    if (!$l) return aio_err('درس پیدا نشد.', 404);
    $e = aio_course_enrollment($uid, $cid);
    return aio_ok(['lesson' => [
        'key' => $key, 't' => $l['t'] ?? '', 'type' => $l['type'] ?? 'video', 'min' => (int) ($l['min'] ?? 0),
        'video' => (string) ($l['video'] ?? ''), 'embed' => aio_video_embed((string) ($l['video'] ?? '')),
        'body' => (string) ($l['body'] ?? ''), 'module' => $l['module'] ?? '',
        'questions' => array_map(fn($q) => ['q' => $q['q'] ?? '', 'options' => array_values((array) ($q['options'] ?? []))], (array) ($l['questions'] ?? [])),
        'quizScore' => $e['quiz'][$key] ?? null,
    ]]);
}

/** تبدیل لینک آپارات/یوتیوب به embed */
function aio_video_embed(string $url): string
{
    if ($url === '') return '';
    if (preg_match('~aparat\.com/v/([A-Za-z0-9]+)~', $url, $m)) return 'https://www.aparat.com/video/video/embed/videohash/' . $m[1] . '/vt/frame';
    if (preg_match('~(?:youtube\.com/watch\?v=|youtu\.be/)([A-Za-z0-9_-]{6,})~', $url, $m)) return 'https://www.youtube-nocookie.com/embed/' . $m[1];
    return '';
}

function aio_api_lesson_quiz(WP_REST_Request $r)
{
    $uid = get_current_user_id();
    $cid = (int) $r['id'];
    if (!aio_can_learn($uid, $cid)) return aio_err('ابتدا در دوره ثبت‌نام کنید.', 403);
    $key = (string) aio_p($r, 'key');
    $l = aio_course_lessons($cid)[$key] ?? null;
    if (!$l) return aio_err('درس پیدا نشد.', 404);
    $qs = (array) ($l['questions'] ?? []);
    $answers = array_map(fn($a) => ($a === null || $a === '') ? null : (int) $a, (array) aio_p($r, 'answers', []));
    $g = aio_grade($qs, $answers);
    $all = (array) aio_umeta($uid, 'courses', []);
    $all[$cid]['quiz'][$key] = max((int) ($all[$cid]['quiz'][$key] ?? 0), $g['score']);
    aio_set_umeta($uid, 'courses', $all);
    $pass = $g['score'] >= 60;
    $cert = false;
    if ($pass) $cert = !empty(aio_mark_lesson($uid, $cid, $key, true)['certId']);
    return aio_ok(['score' => $g['score'], 'pass' => $pass, 'key' => $g['key'], 'cert' => $cert], true);
}

/** ذخیره‌ی پیش‌نویس سازنده دوره + نگاشت به فیلدهای واقعی دوره */
function aio_api_builder_save(WP_REST_Request $r)
{
    $uid = get_current_user_id();
    $d = aio_clean_deep((array) aio_p($r, 'draft', []));
    $id = (int) aio_p($r, 'id', 0);
    $submit = aio_bool(aio_p($r, 'submit', false));
    if ($id) {
        $p = get_post($id);
        if (!$p || $p->post_type !== 'aio_course' || (int) $p->post_author !== $uid) return aio_err('دوره پیدا نشد.', 404);
        if ($p->post_status === 'publish' && !current_user_can('edit_post', $id)) return aio_err('دوره‌ی منتشرشده فقط از طریق پشتیبانی ویرایش می‌شود.', 403);
    }
    $title = aio_clean_text($d['title'] ?? '', 150) ?: 'دوره بدون عنوان';
    $status = $submit ? 'pending' : 'draft';
    $arr = ['post_type' => 'aio_course', 'post_title' => $title, 'post_status' => $status, 'post_author' => $uid,
        'post_content' => aio_clean_textarea($d['about'] ?? ($d['desc'] ?? ''), 5000)];
    if ($id) { $arr['ID'] = $id; $id = wp_update_post($arr, true); }
    else $id = wp_insert_post($arr, true);
    if (is_wp_error($id)) return aio_err('ذخیره ناموفق بود.');
    unset($d['id'], $d['status'], $d['url']);
    aio_set_meta($id, 'builder', $d);
    $num = fn($k, $def = 0) => is_numeric($d[$k] ?? null) ? (float) $d[$k] : $def;
    aio_set_meta($id, 'type', in_array($d['type'] ?? '', ['course', 'guided'], true) ? $d['type'] : 'course');
    aio_set_meta($id, 'subtitle', aio_clean_text($d['subtitle'] ?? '', 300));
    foreach (['level', 'format', 'lang', 'cert_type' => 'certType', 'next_start' => 'nextStart'] as $mk => $dk) {
        if (is_int($mk)) $mk = $dk;
        aio_set_meta($id, $mk, aio_clean_text($d[$dk] ?? '', 120));
    }
    aio_set_meta($id, 'price', (int) $num('price'));
    aio_set_meta($id, 'weeks', (int) $num('weeks', 1));
    aio_set_meta($id, 'cert', !empty($d['cert']) ? 1 : 0);
    if (!empty($d['seats'])) aio_set_meta($id, 'seats', (int) $num('seats'));
    foreach (['skills', 'outcomes', 'prereq', 'audience'] as $k) aio_set_meta($id, $k, aio_clean_list($d[$k] ?? [], 30, 200));
    $syl = [];
    $mins = 0;
    foreach ((array) ($d['syllabus'] ?? []) as $m) {
        $lessons = [];
        foreach ((array) ($m['lessons'] ?? []) as $l) {
            $min = (int) ($l['min'] ?? 0);
            $mins += $min;
            $lessons[] = ['t' => aio_clean_text($l['t'] ?? '', 200), 'type' => sanitize_key($l['type'] ?? 'video'), 'min' => $min,
                'video' => esc_url_raw((string) ($l['video'] ?? '')), 'body' => aio_clean_textarea($l['body'] ?? '', 5000)];
        }
        $syl[] = ['title' => aio_clean_text($m['title'] ?? '', 200), 'hours' => round(array_sum(array_column($lessons, 'min')) / 60, 1), 'lessons' => $lessons];
    }
    aio_set_meta($id, 'syllabus', $syl);
    aio_set_meta($id, 'hours', $num('hours', 0) ?: round($mins / 60, 1));
    aio_set_meta($id, 'faq', array_map(fn($f) => ['q' => aio_clean_text($f['q'] ?? '', 300), 'a' => aio_clean_textarea($f['a'] ?? '', 1500)], array_slice((array) ($d['faq'] ?? []), 0, 20)));
    aio_set_meta($id, 'provider', sanitize_title($d['providerId'] ?? '') === 'mine' ? 'aiolab' : (sanitize_title($d['providerId'] ?? '') ?: 'aiolab'));
    aio_set_meta($id, 'instructors', aio_clean_list($d['instructorIds'] ?? [], 10, 40));
    if (!empty($d['cat']) && term_exists(sanitize_key($d['cat']), 'aio_course_cat')) wp_set_object_terms($id, sanitize_key($d['cat']), 'aio_course_cat');
    if ($submit) aio_notify($uid, "دوره «{$title}» برای بازبینی ارسال شد؛ نتیجه تا ۳ روز کاری اعلام می‌شود.", aio_page_url('dashboard', '#courses'), 'آکادمی آیولب', false, '📨');
    return aio_ok(['id' => $id, 'status' => $submit ? 'pending' : 'draft', 'preview' => add_query_arg('preview', 1, get_permalink($id))], true);
}

/* ================================================================
   پنل کارفرما
   ================================================================ */
function aio_own_post(int $id, string $type): ?WP_Post
{
    $p = get_post($id);
    if (!$p || $p->post_type !== $type) return null;
    if ((int) $p->post_author !== get_current_user_id() && !current_user_can('edit_post', $id)) return null;
    return $p;
}

function aio_api_emp_lab(WP_REST_Request $r)
{
    $uid = get_current_user_id();
    $d = (array) aio_p($r, 'lab', []);
    $name = aio_clean_text($d['name'] ?? '', 150);
    if (mb_strlen($name) < 3) return aio_err('نام مرکز را کامل وارد کنید.', 422, ['field' => 'name']);
    $city = aio_clean_text($d['city'] ?? '', 60);
    $prov = sanitize_key($d['provinceId'] ?? '') ?: aio_province_of_city($city);
    if (!$prov) return aio_err('استان را انتخاب کنید.', 422, ['field' => 'prov']);
    if (!$city) return aio_err('شهر را انتخاب کنید.', 422, ['field' => 'city']);
    $lat = (float) ($d['lat'] ?? 0);
    $lng = (float) ($d['lng'] ?? 0);
    if ($lat < 24 || $lat > 40.5 || $lng < 44 || $lng > 63.5) return aio_err('محل مرکز را روی نقشه پین کنید.', 422, ['field' => 'map']);
    $phone = aio_en_digits(trim((string) ($d['phone'] ?? '')));
    if (!preg_match('/^0\d{9,10}$/', preg_replace('/[\s\-]/', '', $phone))) return aio_err('تلفن سازمان را با پیش‌شماره وارد کنید (مثلاً ۰۲۱۲۲۲۲۰۰۰۰ یا موبایل).', 422, ['field' => 'phone']);
    $org_email = sanitize_email((string) ($d['email'] ?? ''));
    if (!is_email($org_email)) return aio_err('ایمیل سازمان را وارد کنید؛ اطلاع‌رسانی درخواست‌ها به آن ارسال می‌شود.', 422, ['field' => 'email']);
    $id = (int) ($d['id'] ?? 0);
    if ($id && !aio_own_post($id, 'aio_lab')) return aio_err('مرکز پیدا نشد.', 404);
    $arr = ['post_type' => 'aio_lab', 'post_title' => $name, 'post_content' => aio_clean_textarea($d['about'] ?? '', 3000), 'post_author' => $uid];
    if ($id) { $arr['ID'] = $id; $was = get_post_status($id); $id = wp_update_post($arr, true); }
    else { $arr['post_status'] = 'pending'; $id = wp_insert_post($arr, true); $was = 'new'; }
    if (is_wp_error($id)) return aio_err('ثبت مرکز ناموفق بود.');
    $colors = aio_list('colors', AIO_DEFAULT_COLORS);
    $map = ['type' => 'type', 'sector' => 'sector', 'org_kind' => 'orgKind', 'size' => 'size', 'address' => 'address', 'avg_salary_updated' => 'avgSalaryUpdated'];
    foreach ($map as $mk => $dk) if (isset($d[$dk])) aio_set_meta($id, $mk, aio_clean_text($d[$dk], 200));
    aio_set_meta($id, 'city', $city);
    aio_set_meta($id, 'province', $prov);
    aio_set_meta($id, 'lat', round($lat, 6));
    aio_set_meta($id, 'lng', round($lng, 6));
    aio_set_meta($id, 'vertical', 'lab');
    if (isset($d['website'])) aio_set_meta($id, 'website', esc_url_raw((string) $d['website']));
    aio_set_meta($id, 'phone', $phone);
    aio_set_meta($id, 'email', $org_email);
    if (isset($d['perks'])) aio_set_meta($id, 'perks', aio_clean_list($d['perks'], 20, 60));
    foreach (['staff' => 'staff', 'founded' => 'founded'] as $mk => $dk) if (isset($d[$dk]) && $d[$dk] !== '') aio_set_meta($id, $mk, (int) aio_en_digits((string) $d[$dk]));
    if (isset($d['avgSalary']) && $d['avgSalary'] !== '') {
        aio_set_meta($id, 'avg_salary', (float) aio_en_digits((string) $d['avgSalary']));
        aio_set_meta($id, 'avg_salary_updated', aio_jdate('Y/m/d'));
    }
    if (!aio_meta($id, 'color')) aio_set_meta($id, 'color', $colors[$id % max(1, count($colors))] ?? '#0d9488');
    if (isset($d['orgType']) && in_array($d['orgType'], array_column(aio_id_list('org_types'), 'id'), true)) aio_set_meta($id, 'org_type', $d['orgType']);
    if ($was === 'new') delete_user_meta($uid, 'aio_lab_draft');
    if ($was === 'publish') aio_notify_admin('ویرایش مرکز: ' . $name, '<p>کارفرما اطلاعات مرکز «' . esc_html($name) . '» را ویرایش کرد.</p><p><a class="btn" href="' . esc_url(admin_url('post.php?action=edit&post=' . $id)) . '">بررسی</a></p>');
    return aio_ok(['id' => $id, 'status' => get_post_status($id)], true);
}

/** پیش‌نویس فرم ثبت مرکز (بدون اعتبارسنجی؛ فقط برای همین کاربر، روی هر دستگاهی) */
function aio_api_emp_lab_draft(WP_REST_Request $r)
{
    $uid = get_current_user_id();
    $d = (array) aio_p($r, 'lab', []);
    if (!$d) { delete_user_meta($uid, 'aio_lab_draft'); return aio_ok([], true); }
    $out = [];
    foreach (['name', 'orgType', 'type', 'sector', 'orgKind', 'size', 'founded', 'staff', 'provinceId', 'city', 'address', 'phone', 'email', 'website', 'avgSalary'] as $k)
        if (isset($d[$k])) $out[$k] = aio_clean_text((string) $d[$k], 200);
    $out['about'] = aio_clean_textarea($d['about'] ?? '', 3000);
    $out['perks'] = aio_clean_list($d['perks'] ?? [], 20, 60);
    $lat = (float) ($d['lat'] ?? 0); $lng = (float) ($d['lng'] ?? 0);
    if ($lat >= 24 && $lat <= 40.5 && $lng >= 44 && $lng <= 63.5) { $out['lat'] = round($lat, 6); $out['lng'] = round($lng, 6); }
    $out['saved'] = aio_jdate('Y/m/d H:i');
    aio_set_umeta($uid, 'lab_draft', $out);
    return aio_ok(['saved' => $out['saved']], true);
}

function aio_api_emp_lab_logo(WP_REST_Request $r)
{
    $lab = aio_own_post((int) $r['id'], 'aio_lab');
    if (!$lab) return aio_err('مرکز پیدا نشد.', 404);
    $att = aio_handle_upload('file', ['jpg|jpeg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp'], 2, get_current_user_id());
    if (is_wp_error($att)) return $att;
    set_post_thumbnail($lab->ID, $att);
    return aio_ok([], true);
}

function aio_api_emp_job(WP_REST_Request $r)
{
    $uid = get_current_user_id();
    $d = (array) aio_p($r, 'job', []);
    $title = aio_clean_text($d['title'] ?? '', 150);
    if (mb_strlen($title) < 3) return aio_err('عنوان موقعیت شغلی را وارد کنید.', 422, ['field' => 'title']);
    $lab_id = (int) ($d['labId'] ?? 0);
    $lab = get_post($lab_id);
    if (!$lab || $lab->post_type !== 'aio_lab' || ((int) $lab->post_author !== $uid && !current_user_can('edit_post', $lab_id))) {
        return aio_err('ابتدا مرکز خود را در بخش «ثبت آزمایشگاه» ثبت کنید و آن را برای آگهی انتخاب کنید.', 422, ['field' => 'lab', 'needLab' => true]);
    }
    if (!aio_meta($lab_id, 'phone') || !is_email((string) aio_meta($lab_id, 'email', ''))) {
        return aio_err('ابتدا تلفن و ایمیل سازمان را در «پروفایل و گالری سازمان» کامل کنید تا متقاضیان بتوانند با شما ارتباط بگیرند.', 422, ['needOrgContact' => true]);
    }
    $dept = sanitize_key($d['dept'] ?? '');
    if (!$dept || !term_exists($dept, 'aio_dept')) return aio_err('بخش آزمایشگاهی را انتخاب کنید.', 422, ['field' => 'dept']);
    $desc = aio_clean_textarea($d['desc'] ?? '', 5000);
    $internal = !empty($d['internal']);
    if (!$internal && mb_strlen($desc) < 20) return aio_err('شرح موقعیت شغلی را کامل‌تر بنویسید (حداقل ۲۰ کاراکتر).', 422, ['field' => 'desc']);
    $id = (int) ($d['id'] ?? 0);
    $plan = in_array($d['plan'] ?? 'normal', ['normal', 'featured', 'urgent'], true) ? ($d['plan'] ?? 'normal') : 'normal';
    /* پوزیشن داخلی آگهی عمومی نیست و اعتبار آگهی مصرف نمی‌کند */
    if (!$id && !$internal && aio_opt('paid_job_posting', 0) && !current_user_can('edit_posts')) {
        $c = aio_credits($uid);
        $need = $plan === 'normal' ? 'job' : $plan;
        if ($c[$need] < 1) return aio_err('برای ثبت این آگهی اعتبار کافی ندارید؛ از بخش «تعرفه‌ها» بسته‌ی آگهی تهیه کنید.', 402, ['needCredit' => $need]);
        $c[$need]--;
        aio_set_umeta($uid, 'credits', $c);
    }
    if ($id && !aio_own_post($id, 'aio_job')) return aio_err('آگهی پیدا نشد.', 404);
    $arr = ['post_type' => 'aio_job', 'post_title' => $title, 'post_content' => $desc, 'post_author' => $uid,
        'post_status' => $internal ? 'aio_internal' : (current_user_can('publish_posts') ? 'publish' : 'pending')];
    if ($id) { $arr['ID'] = $id; unset($arr['post_author']); $id = wp_update_post($arr, true); }
    else $id = wp_insert_post($arr, true);
    if (is_wp_error($id)) return aio_err('ثبت آگهی ناموفق بود.');
    wp_set_object_terms($id, $dept, 'aio_dept');
    $city = aio_clean_text($d['city'] ?? (string) aio_meta($lab_id, 'city', ''), 60);
    $txt = ['type' => 'type', 'shift' => 'shift', 'experience' => 'experience', 'degree' => 'degree', 'field_of_study' => 'fieldOfStudy', 'gender' => 'gender', 'military' => 'military'];
    foreach ($txt as $mk => $dk) aio_set_meta($id, $mk, aio_clean_text($d[$dk] ?? '', 80));
    aio_set_meta($id, 'lab_id', $lab_id);
    aio_set_meta($id, 'city', $city);
    aio_set_meta($id, 'province', sanitize_key($d['provinceId'] ?? '') ?: (aio_province_of_city($city) ?: (string) aio_meta($lab_id, 'province', '')));
    $min = (float) aio_en_digits((string) ($d['salaryMin'] ?? 0));
    $max = (float) aio_en_digits((string) ($d['salaryMax'] ?? 0));
    if ($max && $min > $max) [$min, $max] = [$max, $min];
    aio_set_meta($id, 'salary_min', $min);
    aio_set_meta($id, 'salary_max', $max);
    aio_set_meta($id, 'salary', aio_clean_text($d['salary'] ?? '', 80) ?: ($min && $max ? aio_fa((string) $min) . ' تا ' . aio_fa((string) $max) . ' میلیون تومان' : 'توافقی'));
    foreach (['remote', 'urgent', 'featured'] as $b) aio_set_meta($id, $b, 0);
    aio_set_meta($id, 'remote', !empty($d['remote']) ? 1 : 0);
    aio_set_meta($id, 'plan', $plan);
    if ($plan === 'featured') aio_set_meta($id, 'featured', 1);
    if ($plan === 'urgent') aio_set_meta($id, 'urgent', 1);
    aio_set_meta($id, 'benefits', aio_clean_list($d['benefits'] ?? [], 20, 60));
    aio_set_meta($id, 'skills', aio_clean_list($d['skills'] ?? [], 20, 80));
    aio_set_meta($id, 'requirements', aio_clean_list(is_array($d['requirements'] ?? null) ? $d['requirements'] : preg_split('/\r\n|\n/', (string) ($d['requirements'] ?? '')), 20, 200));
    aio_set_meta($id, 'vertical', 'lab');
    aio_set_meta($id, 'expires', wp_date('Y-m-d', time() + (int) aio_opt('job_default_days', 30) * DAY_IN_SECONDS));
    aio_set_meta($id, 'internal', $internal ? 1 : 0);
    if ($internal) wp_schedule_single_event(time() + 5, 'aio_auto_match_job', [(int) $id]);
    aio_set_meta($id, 'client_name', $internal ? aio_clean_text($d['clientName'] ?? '', 100) : '');
    if (isset($d['req']) && is_array($d['req'])) aio_save_job_req($id, $d['req'] + ['role' => $d['role'] ?? '']);
    /* شرایط احراز و مهارت‌های متنی از نیازمندی ساخت‌یافته ساخته می‌شوند تا جستجوی متنی و فیلترهای قدیمی هم کار کنند */
    $req = aio_job_req($id);
    if ($req && empty($d['experience'])) {
        $m = (int) ($req['minExp'] ?? 0);
        aio_set_meta($id, 'experience', $m < 1 ? 'بدون نیاز به سابقه' : ($m < 12 ? 'کمتر از ۱ سال' : ($m < 36 ? '۱ تا ۳ سال' : ($m <= 60 ? '۳ تا ۵ سال' : 'بیش از ۵ سال'))));
    }
    if ($req && empty($d['degree']) && !empty($req['degree'])) aio_set_meta($id, 'degree', aio_level_name('degree_levels', $req['degree']));
    if ($req && empty($d['fieldOfStudy']) && !empty($req['fields'])) aio_set_meta($id, 'field_of_study', $req['fields'][0]);
    if ($req && empty($d['requirements'])) {
        $lines = [];
        if (!empty($req['degree'])) $lines[] = 'حداقل مدرک: ' . aio_level_name('degree_levels', $req['degree']) . (!empty($req['fields']) ? ' — ' . implode('، ', $req['fields']) : '');
        if (!empty($req['minExp'])) $lines[] = 'حداقل سابقه: ' . aio_fa((string) round($req['minExp'] / 12, 1)) . ' سال';
        foreach ((array) ($req['licenses'] ?? []) as $l) $lines[] = aio_cat_name('aio_license', $l);
        aio_set_meta($id, 'requirements', $lines);
    }
    if ($req && empty($d['skills'])) aio_set_meta($id, 'skills', array_map(fn($x) => aio_cat_name('aio_skill', $x['id']), (array) ($req['skills'] ?? [])));
    return aio_ok(['id' => $id, 'status' => get_post_status($id), 'job' => aio_job_item(get_post($id))], true);
}

function aio_api_emp_job_status(WP_REST_Request $r)
{
    $job = aio_own_post((int) $r['id'], 'aio_job');
    if (!$job) return aio_err('آگهی پیدا نشد.', 404);
    $a = sanitize_key(aio_p($r, 'action'));
    if ($a === 'close') wp_update_post(['ID' => $job->ID, 'post_status' => 'private']);
    elseif (in_array($a, ['reopen', 'renew'], true)) {
        wp_update_post(['ID' => $job->ID, 'post_status' => aio_meta($job->ID, 'internal', 0) ? 'aio_internal' : (current_user_can('publish_posts') ? 'publish' : 'pending')]);
        aio_set_meta($job->ID, 'expires', wp_date('Y-m-d', time() + (int) aio_opt('job_default_days', 30) * DAY_IN_SECONDS));
    } elseif ($a === 'delete') {
        if ($job->post_status === 'publish') return aio_err('آگهی فعال را ابتدا ببندید.');
        wp_trash_post($job->ID);
    } else return aio_err('عملیات نامعتبر.');
    return aio_ok([], true);
}

function aio_api_emp_app_status(WP_REST_Request $r)
{
    $uid = get_current_user_id();
    $app = get_post((int) $r['id']);
    if (!$app || $app->post_type !== 'aio_application') return aio_err('درخواست پیدا نشد.', 404);
    $job_author = (int) get_post_field('post_author', (int) aio_meta($app->ID, 'job_id', 0));
    if ($job_author !== $uid && !current_user_can('edit_post', $app->ID)) return aio_err('دسترسی ندارید.', 403);
    $st = sanitize_key(aio_p($r, 'status'));
    if (!isset(AIO_APP_STATUSES[$st])) return aio_err('وضعیت نامعتبر.');
    $old = aio_meta($app->ID, 'status', 'sent');
    aio_set_meta($app->ID, 'status', $st);
    if ($r->has_param('note')) aio_set_meta($app->ID, 'employer_note', aio_clean_textarea(aio_p($r, 'note'), 1500));
    if ($st !== $old) {
        $job = get_the_title((int) aio_meta($app->ID, 'job_id', 0));
        $lab = get_the_title((int) aio_meta($app->ID, 'lab_id', 0));
        $msgs = ['seen' => "«{$lab}» درخواست شما برای «{$job}» را مشاهده کرد.", 'review' => "درخواست شما برای «{$job}» در حال بررسی است.",
            'interview' => "🎉 شما به مصاحبه‌ی «{$job}» در {$lab} دعوت شدید.", 'accepted' => "🎉 درخواست شما برای «{$job}» پذیرفته شد.",
            'rejected' => "درخواست شما برای «{$job}» این بار پذیرفته نشد. آگهی‌های مشابه را ببینید."];
        $note = aio_clean_textarea(aio_p($r, 'note', ''), 500);
        if (isset($msgs[$st])) aio_notify((int) $app->post_author, $msgs[$st] . ($note ? ' — ' . $note : ''), aio_page_url('dashboard', '#applications'), $lab ?: 'آیولب', $st !== 'seen');
    }
    return aio_ok([], true);
}

function aio_api_emp_resume(WP_REST_Request $r)
{
    $uid = get_current_user_id();
    $seeker = (int) $r['uid'];
    $u = get_userdata($seeker);
    if (!$u || !in_array(aio_user_role($u), ['seeker', 'volunteer'], true)) return aio_err('رزومه پیدا نشد.', 404);
    $my_jobs = get_posts(['post_type' => 'aio_job', 'post_status' => ['publish', 'pending', 'draft', 'private', 'aio_expired', 'aio_internal'], 'author' => $uid, 'numberposts' => -1, 'fields' => 'ids']);
    $applied = $my_jobs && get_posts(['post_type' => 'aio_application', 'author' => $seeker, 'post_status' => 'publish', 'numberposts' => 1, 'fields' => 'ids',
            'meta_query' => [['key' => '_aio_job_id', 'value' => $my_jobs, 'compare' => 'IN']]]);
    $visible = aio_umeta($seeker, 'otw', 0);
    if (!$applied && !current_user_can('edit_users')) {
        if (!$visible) return aio_err('این رزومه عمومی نیست.', 403);
        if (!aio_has_resume_bank($uid)) return aio_err('مشاهده‌ی رزومه‌ی کامل نیاز به اشتراک بانک رزومه دارد.', 402, ['needPlan' => true]);
    }
    $viewed = (array) aio_umeta($seeker, 'viewed_by', []);
    if (!in_array($uid, $viewed, true)) {
        $viewed[] = $uid;
        aio_set_umeta($seeker, 'viewed_by', array_slice($viewed, -200));
        aio_set_umeta($seeker, 'profile_views', (int) aio_umeta($seeker, 'profile_views', 0) + 1);
        $lab = get_posts(['post_type' => 'aio_lab', 'author' => $uid, 'numberposts' => 1]);
        aio_notify($seeker, '👀 ' . ($lab ? $lab[0]->post_title : wp_get_current_user()->display_name) . ' رزومه شما را مشاهده کرد.', aio_page_url('dashboard'), 'آیولب');
    }
    return aio_ok(['resume' => aio_resume_public($seeker, true)]);
}

function aio_api_emp_resumes(WP_REST_Request $r)
{
    $q = new WP_User_Query(['role__in' => ['aio_seeker', 'aio_volunteer'], 'number' => 300, 'meta_query' => [['key' => 'aio_otw', 'value' => '1']]]);
    $f = [
        'q' => aio_clean_text(aio_p($r, 'q'), 80), 'dept' => sanitize_key(aio_p($r, 'dept')), 'prov' => sanitize_key(aio_p($r, 'prov')),
        'city' => aio_clean_text(aio_p($r, 'city'), 60), 'exp' => aio_clean_text(aio_p($r, 'exp'), 60), 'degree' => aio_clean_text(aio_p($r, 'degree'), 60),
        'cert' => aio_bool(aio_p($r, 'cert')), 'mbti' => aio_clean_text(aio_p($r, 'mbti'), 4),
    ];
    $out = [];
    foreach ($q->get_results() as $u) {
        $x = aio_resume_public($u->ID, false);
        $hay = implode(' ', [$x['name'], $x['title'], $x['summary'], implode(' ', $x['skills']), implode(' ', $x['devices'])]);
        if ($f['q'] && mb_stripos($hay, $f['q']) === false) continue;
        if ($f['dept'] && $x['dept'] !== $f['dept']) continue;
        if ($f['prov'] && $x['provinceId'] !== $f['prov']) continue;
        if ($f['city'] && $x['city'] !== $f['city']) continue;
        if ($f['exp'] && $x['experience'] !== $f['exp']) continue;
        if ($f['degree'] && mb_strpos((string) $x['degree'], $f['degree']) === false) continue;
        if ($f['cert'] && !$x['certs']) continue;
        if ($f['mbti'] && $x['mbti'] !== strtoupper($f['mbti'])) continue;
        $out[] = $x;
    }
    usort($out, fn($a, $b) => (count($b['certs']) <=> count($a['certs'])) ?: ($b['strength'] <=> $a['strength']));
    return aio_ok(['results' => $out, 'access' => aio_has_resume_bank(get_current_user_id())]);
}

function aio_api_emp_exam(WP_REST_Request $r)
{
    $uid = get_current_user_id();
    $d = (array) aio_p($r, 'exam', []);
    $title = aio_clean_text($d['title'] ?? '', 150);
    if (mb_strlen($title) < 5) return aio_err('عنوان آزمون را وارد کنید.', 422, ['field' => 'title']);
    $qs = [];
    foreach ((array) ($d['questions'] ?? []) as $q) {
        $text = aio_clean_textarea($q['q'] ?? '', 800);
        $opts = aio_clean_list($q['options'] ?? [], 6, 200);
        if ($text === '' || count($opts) < 2) continue;
        $ans = (int) ($q['answer'] ?? 0);
        $qs[] = ['q' => $text, 'options' => $opts, 'correct' => min(count($opts), max(1, $ans + 1))];
    }
    if (count($qs) < 3) return aio_err('حداقل ۳ سؤال کامل (متن + حداقل ۲ گزینه) لازم است.', 422, ['field' => 'questions']);
    $id = wp_insert_post(['post_type' => 'aio_exam', 'post_status' => 'pending', 'post_author' => $uid, 'post_title' => $title, 'post_content' => aio_clean_textarea($d['desc'] ?? '', 2000)], true);
    if (is_wp_error($id)) return aio_err('ثبت آزمون ناموفق بود.');
    $dept = sanitize_key($d['dept'] ?? '');
    if ($dept && term_exists($dept, 'aio_dept')) wp_set_object_terms($id, $dept, 'aio_dept');
    $lab = get_posts(['post_type' => 'aio_lab', 'author' => $uid, 'post_status' => 'any', 'numberposts' => 1, 'fields' => 'ids']);
    aio_set_meta($id, 'author_lab', $lab[0] ?? 0);
    aio_set_meta($id, 'level', aio_clean_text($d['level'] ?? 'متوسط', 40));
    aio_set_meta($id, 'duration', max(3, min(180, (int) ($d['duration'] ?? 15))));
    aio_set_meta($id, 'pass_score', max(30, min(100, (int) ($d['passScore'] ?? 60))));
    aio_set_meta($id, 'retake_days', 7);
    aio_set_meta($id, 'price', 0);
    $badge = (string) ($d['badge'] ?? '');
    aio_set_meta($id, 'badge', in_array($badge, ['🩸', '🛡️', '🧤', '🧬', '🔬', '🎖️', '🏅'], true) ? $badge : '🏅');
    aio_set_meta($id, 'color', '#0d9488');
    aio_set_meta($id, 'bg', '#ccfbf1');
    aio_set_meta($id, 'vertical', 'lab');
    aio_set_meta($id, 'questions', $qs);
    /* تنظیمات گواهی */
    $valid = (int) ($d['certValid'] ?? 0);
    aio_set_meta($id, 'cert_valid', (string) (in_array($valid, [0, 12, 24, 36], true) ? $valid : 0));
    aio_set_meta($id, 'auto_cert', empty($d['autoCert']) ? 0 : 1);
    aio_set_meta($id, 'holders_top', empty($d['holdersTop']) ? 0 : 1);
    aio_set_meta($id, 'auto_invite', empty($d['autoInvite']) ? 0 : 1);
    aio_set_meta($id, 'invite_score', max(50, min(100, (int) ($d['inviteScore'] ?? 90))));
    return aio_ok(['id' => $id], true);
}

/* ================================================================
   سفارش
   ================================================================ */
function aio_api_order_create(WP_REST_Request $r)
{
    $uid = get_current_user_id();
    if (!aio_rate_limit('order' . $uid, 30, HOUR_IN_SECONDS)) return aio_err('درخواست‌های زیادی ثبت کرده‌اید.', 429);
    $code = aio_clean_text(aio_p($r, 'code'), 20);
    $item = null;
    if ($code !== '') {
        $s = get_posts(['post_type' => 'aio_service', 'post_status' => 'publish', 'meta_key' => '_aio_code', 'meta_value' => $code, 'numberposts' => 1]);
        if (!$s) return aio_err('خدمت پیدا نشد.', 404);
        $price = aio_meta($s[0]->ID, 'price', null);
        $item = ['kind' => 'service', 'ref' => $code, 'wp_id' => $s[0]->ID, 'code' => $code, 'title' => $s[0]->post_title,
            'price' => ($price === null || $price === '') ? null : (int) $price, 'unit' => (string) aio_meta($s[0]->ID, 'unit', '')];
        $existing = aio_find_pending_order($uid, 'service', $code);
    } elseif ($eid = (int) aio_p($r, 'exam_id')) {
        $e = get_post($eid);
        if (!$e || $e->post_type !== 'aio_exam') return aio_err('آزمون پیدا نشد.', 404);
        $item = ['kind' => 'exam', 'ref' => $eid, 'code' => 'E' . $eid, 'title' => 'آزمون: ' . $e->post_title, 'price' => (int) aio_meta($eid, 'price', 0), 'unit' => 'هر آزمون'];
        $existing = aio_find_pending_order($uid, 'exam', $eid);
    } else {
        return aio_err('چیزی برای سفارش انتخاب نشده است.');
    }
    $oid = $existing ?: aio_create_order($uid, $item);
    if (!$oid) return aio_err('ثبت سفارش ناموفق بود.');
    $st = (string) aio_meta($oid, 'status');
    return aio_ok(['order' => aio_order_item(get_post($oid)), 'checkout' => $st === 'pending' ? aio_checkout_url($oid) : '', 'status' => $st, 'existing' => (bool) $existing], true);
}

/* ================================================================
   جامعه و تماس
   ================================================================ */
function aio_api_community_post(WP_REST_Request $r)
{
    $uid = get_current_user_id();
    $text = aio_clean_textarea(aio_p($r, 'text'), 3000);
    if (mb_strlen($text) < 5) return aio_err('متنی بنویسید!');
    if (!aio_rate_limit('cpost' . $uid, 10, DAY_IN_SECONDS)) return aio_err('امروز پست‌های زیادی منتشر کرده‌اید.', 429);
    $u = wp_get_current_user();
    $status = aio_opt('community_auto_publish', 1) ? 'publish' : 'pending';
    $id = wp_insert_post(['post_type' => 'aio_community', 'post_status' => $status, 'post_author' => $uid,
        'post_title' => wp_trim_words($text, 8, '…'), 'post_content' => $text], true);
    if (is_wp_error($id)) return aio_err('انتشار ناموفق بود.');
    $r_ = aio_resume($uid);
    aio_set_meta($id, 'role', $r_['title'] ?: aio_role_label(aio_user_role($u)));
    aio_set_meta($id, 'color', AIO_DEFAULT_COLORS[$uid % 8]);
    return aio_ok(['status' => $status, 'post' => $status === 'publish' ? aio_community_item(get_post($id)) : null]);
}

function aio_api_contact(WP_REST_Request $r)
{
    if (!aio_rate_limit('contact' . aio_client_ip(), 6, HOUR_IN_SECONDS)) return aio_err('پیام‌های زیادی ارسال شده؛ کمی بعد تلاش کنید.', 429);
    if (trim((string) aio_p($r, 'website')) !== '') return aio_ok(); // تله‌ی ربات
    $name = aio_clean_text(aio_p($r, 'name'), 80);
    $contact = aio_clean_text(aio_p($r, 'contact'), 120);
    $msg = aio_clean_textarea(aio_p($r, 'message'), 4000);
    $kind = sanitize_key(aio_p($r, 'kind', 'contact'));
    if (mb_strlen($name) < 2 || mb_strlen($contact) < 5 || mb_strlen($msg) < 5) return aio_err('نام، راه ارتباطی و متن پیام را کامل وارد کنید.');
    $topic = aio_clean_text(aio_p($r, 'topic'), 120);
    $kinds = ['contact' => 'پیام تماس', 'advertise' => 'درخواست همکاری تبلیغاتی', 'consult' => 'درخواست مشاوره', 'report' => 'درخواست گزارش'];
    $id = wp_insert_post(['post_type' => 'aio_message', 'post_status' => 'publish', 'post_title' => ($kinds[$kind] ?? 'پیام') . ': ' . ($topic ?: $name), 'post_content' => $msg]);
    foreach (['name' => $name, 'contact' => $contact, 'topic' => $topic, 'role' => aio_clean_text(aio_p($r, 'role'), 40), 'kind' => $kind, 'user_id' => get_current_user_id(), 'ip' => aio_client_ip()] as $k => $v) aio_set_meta($id, $k, $v);
    aio_set_meta($id, 'read', 0);
    aio_notify_admin(($kinds[$kind] ?? 'پیام') . ' جدید از ' . $name, '<p><b>' . esc_html($name) . '</b> — ' . esc_html($contact) . '</p><p>موضوع: ' . esc_html($topic) . '</p><p>' . nl2br(esc_html($msg)) . '</p><p><a class="btn" href="' . esc_url(admin_url('post.php?action=edit&post=' . $id)) . '">مشاهده در پیشخوان</a></p>');
    return aio_ok(['message' => 'پیام شما ثبت شد ✓ به‌زودی پاسخ می‌دهیم.']);
}
