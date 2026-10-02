<?php
/**
 * فرایند کامل استخدام داخل سایت:
 *   درخواست کارجو (یا دعوت کارفرما از مرکز تطبیق) ← دیده‌شده ← فهرست کوتاه ← دعوت به مصاحبه (زمان/نوع/محل)
 *   ← تأیید/رد/درخواست تغییر زمان توسط کارجو ← پیشنهاد همکاری (حقوق/تاریخ شروع) ← پذیرش/رد ← استخدام
 *   + رد با دلیل از فهرست + انصراف کارجو + گفتگوی دوطرفه + تاریخچه‌ی کامل + اعلان و ایمیل در هر مرحله
 * تطبیق خودکار: با انتشار آگهی یا ذخیره‌ی رزومه، طرف مقابلِ با تطبیق بالا خبردار می‌شود.
 */
defined('ABSPATH') || exit;

const AIO_INTERVIEW_MODES = ['حضوری', 'آنلاین (تماس تصویری)', 'تلفنی'];

/** دامنه‌های رزروشده‌ی تست — هرگز ایمیل نمی‌گیرند و اعلان مدیر نمی‌سازند */
function aio_is_test_email(string $email): bool
{
    $d = strtolower((string) substr(strrchr(trim($email), '@') ?: '', 1));
    foreach (['example.com', 'example.org', 'example.net', 'invalid', 'test', 'localhost'] as $t) if ($d === $t || str_ends_with($d, '.' . $t)) return true;
    return false;
}

function aio_reject_reasons(): array
{
    $l = (array) aio_list('reject_reasons', []);
    return $l ?: ['شرایط احراز با نیاز این پوزیشن همخوانی ندارد', 'سابقه یا مهارت کافی برای این پوزیشن نیست', 'پوزیشن با فرد دیگری پر شد',
        'فاصله‌ی محل سکونت تا محل کار زیاد است', 'حقوق درخواستی با بودجه‌ی پوزیشن همخوانی ندارد', 'سایر'];
}

/* ---------------- دسترسی ---------------- */
function aio_app_access(int $app_id): array
{
    $a = get_post($app_id);
    if (!$a || $a->post_type !== 'aio_application') return [null, ''];
    $uid = get_current_user_id();
    if ((int) $a->post_author === $uid) return [$a, 'seeker'];
    $job_author = (int) get_post_field('post_author', (int) aio_meta($a->ID, 'job_id', 0));
    if ($job_author === $uid || current_user_can('edit_others_posts')) return [$a, 'employer'];
    return [null, ''];
}

function aio_app_log(int $app_id, string $by, string $type, string $text, array $extra = []): void
{
    $h = (array) aio_meta($app_id, 'history', []);
    $h[] = ['ts' => time(), 'by' => $by, 'type' => $type, 'text' => $text] + $extra;
    aio_set_meta($app_id, 'history', array_slice($h, -200));
    aio_set_meta($app_id, 'updated', time());
}

/** ایمیل/اعلان به طرف مقابل */
function aio_app_tell(int $app_id, string $to, string $text, bool $email = true, string $icon = '🔔'): void
{
    $a = get_post($app_id);
    if (!$a) return;
    $job = (int) aio_meta($app_id, 'job_id', 0);
    $lab = get_the_title((int) aio_meta($app_id, 'lab_id', 0)) ?: 'آیولب';
    if ($to === 'seeker') {
        $uid = (int) $a->post_author;
        aio_notify($uid, $text, aio_page_url('dashboard', '#applications'), $lab, $email && !aio_is_test_email((string) get_userdata($uid)->user_email), $icon);
    } else {
        $uid = (int) get_post_field('post_author', $job);
        if (!$uid) return;
        $u = get_userdata($uid);
        aio_notify($uid, $text, aio_page_url('employer', '#applicants'), 'آیولب', $email && $u && !aio_is_test_email($u->user_email), $icon);
    }
}

/* ---------------- ساختار کامل یک درخواست ---------------- */
function aio_app_detail(WP_Post $a, string $side): array
{
    $item = aio_application_item($a, $side === 'employer');
    $msgs = (array) aio_meta($a->ID, 'messages', []);
    $item['messages'] = array_map(fn($m) => ['ts' => (int) $m['ts'], 'from' => $m['from'], 'text' => $m['text'], 'time' => aio_jdate('Y/m/d H:i', (int) $m['ts'])], $msgs);
    $item['history'] = array_map(fn($h) => $h + ['time' => aio_jdate('Y/m/d H:i', (int) $h['ts'])], (array) aio_meta($a->ID, 'history', []));
    $item['side'] = $side;
    $job = get_post((int) aio_meta($a->ID, 'job_id', 0));
    $item['jobItem'] = $job ? aio_job_item($job) : null;
    if ($side === 'employer') {
        $uid = (int) $a->post_author;
        $item['candidate'] = aio_talent_candidate($uid);
        $pub = aio_resume_public($uid, true);
        $item['contact'] = ['email' => $pub['email'] ?? '', 'phone' => $pub['phone'] ?? '', 'file' => $pub['file'] ?? null];
        $item['resume'] = $pub;
    }
    /* خوانده‌شدن پیام‌های طرف مقابل */
    $changed = false;
    foreach ($msgs as &$m) if (($m['from'] ?? '') !== $side && empty($m['read'])) { $m['read'] = 1; $changed = true; }
    unset($m);
    if ($changed) aio_set_meta($a->ID, 'messages', $msgs);
    return $item;
}

/** شمار پیام‌های خوانده‌نشده برای یک طرف */
function aio_app_unread(int $app_id, string $side): int
{
    return count(array_filter((array) aio_meta($app_id, 'messages', []), fn($m) => ($m['from'] ?? '') !== $side && empty($m['read'])));
}

/* ---------------- REST ---------------- */
add_action('rest_api_init', function () {
    $user = fn() => is_user_logged_in();
    $R = fn($m, $route, $cb) => register_rest_route(AIO_NS, $route, ['methods' => $m, 'callback' => $cb, 'permission_callback' => $user]);
    $R('GET', '/applications/(?P<id>\d+)', 'aio_api_app_get');
    $R('POST', '/applications/(?P<id>\d+)/action', 'aio_api_app_action');
    $R('POST', '/applications/(?P<id>\d+)/message', 'aio_api_app_message');
    $R('POST', '/applications/(?P<id>\d+)/respond', 'aio_api_app_respond');
    $R('POST', '/applications/(?P<id>\d+)/withdraw', 'aio_api_app_withdraw');
    $R('POST', '/talent/invite', 'aio_api_talent_invite');
});

function aio_api_app_get(WP_REST_Request $r)
{
    [$a, $side] = aio_app_access((int) $r['id']);
    if (!$a) return aio_err('درخواست پیدا نشد.', 404);
    /* اولین بازدید کارفرما = «دیده‌شده» */
    if ($side === 'employer' && aio_meta($a->ID, 'status', 'sent') === 'sent') {
        aio_set_meta($a->ID, 'status', 'seen');
        aio_app_log($a->ID, 'employer', 'status', 'درخواست توسط کارفرما دیده شد', ['status' => 'seen']);
        aio_app_tell($a->ID, 'seeker', '👀 «' . get_the_title((int) aio_meta($a->ID, 'lab_id', 0)) . '» درخواست شما برای «' . get_the_title((int) aio_meta($a->ID, 'job_id', 0)) . '» را دید.', false, '👀');
    }
    return aio_ok(['app' => aio_app_detail(get_post($a->ID), $side)]);
}

/** اقدام کارفرما: تغییر مرحله، مصاحبه، پیشنهاد، رد با دلیل */
function aio_api_app_action(WP_REST_Request $r)
{
    [$a, $side] = aio_app_access((int) $r['id']);
    if (!$a || $side !== 'employer') return aio_err('درخواست پیدا نشد.', 404);
    $cur = (string) aio_meta($a->ID, 'status', 'sent');
    if ($cur === 'withdrawn') return aio_err('کارجو از این درخواست انصراف داده است.');
    $st = sanitize_key(aio_p($r, 'status'));
    if (!in_array($st, ['seen', 'review', 'interview', 'offer', 'accepted', 'rejected'], true)) return aio_err('مرحله‌ی نامعتبر.');
    $note = aio_clean_textarea(aio_p($r, 'note'), 1000);
    $job = get_the_title((int) aio_meta($a->ID, 'job_id', 0));
    $lab = get_the_title((int) aio_meta($a->ID, 'lab_id', 0));
    $msg = '';
    $email = true;
    switch ($st) {
        case 'review':
            $msg = "✨ درخواست شما برای «{$job}» به فهرست کوتاه {$lab} رفت.";
            break;
        case 'interview':
            $iv = (array) aio_p($r, 'interview', []);
            $at = aio_en_digits((string) ($iv['at'] ?? ''));
            if (!preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/', $at)) return aio_err('تاریخ و ساعت مصاحبه را انتخاب کنید.', 422);
            $ts = (new DateTime($at, wp_timezone()))->getTimestamp();
            if ($ts < time() - 3600) return aio_err('زمان مصاحبه گذشته است.', 422);
            $mode = in_array($iv['mode'] ?? '', AIO_INTERVIEW_MODES, true) ? $iv['mode'] : AIO_INTERVIEW_MODES[0];
            $place = aio_clean_text($iv['place'] ?? '', 300);
            if ($mode !== 'تلفنی' && $place === '') return aio_err($mode === 'حضوری' ? 'نشانی محل مصاحبه را بنویسید.' : 'لینک جلسه‌ی آنلاین را بنویسید.', 422);
            if (str_starts_with($mode, 'آنلاین') && !preg_match('#^https://#', $place)) return aio_err('لینک جلسه‌ی آنلاین باید با https:// شروع شود.', 422);
            $interview = ['ts' => $ts, 'at' => $at, 'mode' => $mode, 'place' => $place, 'note' => $note, 'response' => 'pending', 'responseNote' => ''];
            aio_set_meta($a->ID, 'interview', $interview);
            $when = aio_jdate('l j F Y ساعت H:i', $ts);
            $msg = "🎉 دعوت به مصاحبه‌ی «{$job}» در {$lab} — {$when} ({$mode}). لطفاً از داشبورد تأیید کنید.";
            $note = trim("زمان: {$when} · {$mode}" . ($place ? " · {$place}" : '') . ($note ? "\n{$note}" : ''));
            break;
        case 'offer':
            $of = (array) aio_p($r, 'offer', []);
            $salary = (float) aio_en_digits((string) ($of['salary'] ?? 0));
            $start = aio_valid_date($of['start'] ?? '');
            if ($salary <= 0) return aio_err('حقوق پیشنهادی را وارد کنید (میلیون تومان).', 422);
            if (!$start) return aio_err('تاریخ شروع همکاری را انتخاب کنید.', 422);
            aio_set_meta($a->ID, 'offer', ['salary' => $salary, 'start' => $start, 'note' => $note, 'response' => 'pending', 'responseNote' => '']);
            $msg = "🎉 {$lab} برای «{$job}» به شما پیشنهاد همکاری داد: " . aio_fa((string) $salary) . ' میلیون تومان، شروع ' . aio_jdate('j F Y', strtotime($start)) . '. لطفاً از داشبورد پاسخ دهید.';
            $note = trim('حقوق ' . aio_fa((string) $salary) . ' میلیون · شروع ' . aio_jdate('Y/m/d', strtotime($start)) . ($note ? "\n{$note}" : ''));
            break;
        case 'accepted':
            $msg = "🎉 تبریک! استخدام شما برای «{$job}» در {$lab} قطعی شد.";
            break;
        case 'rejected':
            $reason = aio_clean_text(aio_p($r, 'reason'), 200);
            if (!in_array($reason, aio_reject_reasons(), true)) return aio_err('دلیل رد را از فهرست انتخاب کنید.', 422);
            aio_set_meta($a->ID, 'reject_reason', $reason);
            $msg = "درخواست شما برای «{$job}» این بار پذیرفته نشد. دلیل: {$reason}." . ($note ? " — {$note}" : '') . ' آگهی‌های مشابه را در «پوزیشن‌های مناسب من» ببینید.';
            $note = trim($reason . ($note ? "\n{$note}" : ''));
            break;
        case 'seen':
            $email = false;
            break;
    }
    aio_set_meta($a->ID, 'status', $st);
    aio_app_log($a->ID, 'employer', 'status', AIO_APP_STATUSES[$st] . ($note ? ' — ' . $note : ''), ['status' => $st]);
    if ($msg) aio_app_tell($a->ID, 'seeker', $msg, $email, $st === 'rejected' ? '📩' : '🎉');
    return aio_ok(['app' => aio_app_detail(get_post($a->ID), 'employer')], true);
}

/** گفتگو بین کارجو و کارفرما */
function aio_api_app_message(WP_REST_Request $r)
{
    [$a, $side] = aio_app_access((int) $r['id']);
    if (!$a) return aio_err('درخواست پیدا نشد.', 404);
    $text = aio_clean_textarea(aio_p($r, 'text'), 1500);
    if (mb_strlen($text) < 2) return aio_err('متن پیام را بنویسید.');
    if (!aio_rate_limit('appmsg' . get_current_user_id(), 60, HOUR_IN_SECONDS)) return aio_err('تعداد پیام‌ها زیاد است؛ کمی بعد دوباره تلاش کنید.', 429);
    $msgs = (array) aio_meta($a->ID, 'messages', []);
    $msgs[] = ['ts' => time(), 'from' => $side, 'text' => $text, 'read' => 0];
    aio_set_meta($a->ID, 'messages', array_slice($msgs, -300));
    aio_set_meta($a->ID, 'updated', time());
    /* ایمیل فقط وقتی طرف مقابل پیام خوانده‌نشده‌ی قبلی ندارد (جلوگیری از رگبار ایمیل) */
    $other = $side === 'seeker' ? 'employer' : 'seeker';
    $email = aio_app_unread($a->ID, $other) <= 1;
    $job = get_the_title((int) aio_meta($a->ID, 'job_id', 0));
    $who = $side === 'seeker' ? get_userdata((int) $a->post_author)->display_name : (get_the_title((int) aio_meta($a->ID, 'lab_id', 0)) ?: 'کارفرما');
    aio_app_tell($a->ID, $other, "💬 پیام جدید از {$who} درباره‌ی «{$job}»: " . wp_trim_words($text, 18, '…'), $email, '💬');
    return aio_ok(['app' => aio_app_detail(get_post($a->ID), $side)], true);
}

/** پاسخ کارجو به دعوت/مصاحبه/پیشنهاد */
function aio_api_app_respond(WP_REST_Request $r)
{
    [$a, $side] = aio_app_access((int) $r['id']);
    if (!$a || $side !== 'seeker') return aio_err('درخواست پیدا نشد.', 404);
    $kind = sanitize_key(aio_p($r, 'kind'));
    $ans = sanitize_key(aio_p($r, 'answer'));
    $note = aio_clean_textarea(aio_p($r, 'note'), 600);
    $st = (string) aio_meta($a->ID, 'status', 'sent');
    $job = get_the_title((int) aio_meta($a->ID, 'job_id', 0));
    $name = wp_get_current_user()->display_name;
    if ($kind === 'invite') {
        if ($st !== 'invited') return aio_err('این دعوت دیگر فعال نیست.');
        if (!in_array($ans, ['confirm', 'decline'], true)) return aio_err('پاسخ نامعتبر.');
        $new = $ans === 'confirm' ? 'review' : 'withdrawn';
        aio_set_meta($a->ID, 'status', $new);
        aio_app_log($a->ID, 'seeker', 'response', $ans === 'confirm' ? 'کارجو به دعوت پاسخ مثبت داد' : 'کارجو دعوت را نپذیرفت', ['status' => $new]);
        aio_app_tell($a->ID, 'employer', ($ans === 'confirm' ? "✅ {$name} به دعوت شما برای «{$job}» علاقه نشان داد." : "{$name} دعوت شما برای «{$job}» را نپذیرفت.") . ($note ? " — {$note}" : ''), true, $ans === 'confirm' ? '✅' : '📩');
    } elseif ($kind === 'interview' || $kind === 'offer') {
        $obj = (array) aio_meta($a->ID, $kind, []);
        if (!$obj || ($kind === 'interview' && $st !== 'interview') || ($kind === 'offer' && $st !== 'offer')) return aio_err('موردی برای پاسخ وجود ندارد.');
        $allowed = $kind === 'interview' ? ['confirm', 'decline', 'reschedule'] : ['confirm', 'decline'];
        if (!in_array($ans, $allowed, true)) return aio_err('پاسخ نامعتبر.');
        if ($ans === 'reschedule' && mb_strlen($note) < 5) return aio_err('زمان‌های پیشنهادی خود را بنویسید.', 422);
        $obj['response'] = $ans;
        $obj['responseNote'] = $note;
        aio_set_meta($a->ID, $kind, $obj);
        $label = ['interview' => ['confirm' => 'زمان مصاحبه را تأیید کرد', 'decline' => 'در مصاحبه شرکت نمی‌کند', 'reschedule' => 'درخواست تغییر زمان مصاحبه داد'],
            'offer' => ['confirm' => 'پیشنهاد همکاری را پذیرفت', 'decline' => 'پیشنهاد همکاری را نپذیرفت']][$kind][$ans];
        if ($kind === 'interview' && $ans === 'decline') aio_set_meta($a->ID, 'status', 'withdrawn');
        aio_app_log($a->ID, 'seeker', 'response', $label . ($note ? ' — ' . $note : ''));
        aio_app_tell($a->ID, 'employer', "{$name} {$label} («{$job}»)" . ($note ? ": {$note}" : '.'), true, $ans === 'confirm' ? '✅' : '📩');
    } else return aio_err('نوع پاسخ نامعتبر.');
    return aio_ok(['app' => aio_app_detail(get_post($a->ID), 'seeker')], true);
}

function aio_api_app_withdraw(WP_REST_Request $r)
{
    [$a, $side] = aio_app_access((int) $r['id']);
    if (!$a || $side !== 'seeker') return aio_err('درخواست پیدا نشد.', 404);
    $st = (string) aio_meta($a->ID, 'status', 'sent');
    if (in_array($st, ['accepted', 'rejected', 'withdrawn'], true)) return aio_err('این درخواست بسته شده است.');
    $note = aio_clean_textarea(aio_p($r, 'note'), 600);
    aio_set_meta($a->ID, 'status', 'withdrawn');
    aio_app_log($a->ID, 'seeker', 'status', 'کارجو انصراف داد' . ($note ? ' — ' . $note : ''), ['status' => 'withdrawn']);
    aio_app_tell($a->ID, 'employer', wp_get_current_user()->display_name . ' از درخواست «' . get_the_title((int) aio_meta($a->ID, 'job_id', 0)) . '» انصراف داد.' . ($note ? " — {$note}" : ''), true, '📩');
    return aio_ok(['app' => aio_app_detail(get_post($a->ID), 'seeker')], true);
}

/** دعوت مستقیم کارفرما از مرکز تطبیق (آگهی عمومی یا پوزیشن داخلی) */
function aio_api_talent_invite(WP_REST_Request $r)
{
    if (!in_array(aio_user_role(), ['employer', 'admin'], true)) return aio_err('دسترسی ندارید.', 403);
    $job = get_post((int) aio_p($r, 'job'));
    $uid = (int) aio_p($r, 'uid');
    if (!$job || $job->post_type !== 'aio_job' || !in_array($job->post_status, ['publish', 'aio_internal'], true)) return aio_err('پوزیشن فعال پیدا نشد.', 404);
    if ((int) $job->post_author !== get_current_user_id() && !current_user_can('edit_others_posts')) return aio_err('این پوزیشن متعلق به شما نیست.', 403);
    $cand = aio_talent_candidate($uid);
    if (!$cand) return aio_err('رزومه پیدا نشد.', 404);
    if (!$cand['otw'] && !current_user_can('edit_others_posts')) return aio_err('این کارجو در حال حاضر «آماده به کار» نیست.', 403);
    $dup = get_posts(['post_type' => 'aio_application', 'author' => $uid, 'post_status' => 'publish', 'meta_key' => '_aio_job_id', 'meta_value' => $job->ID, 'fields' => 'ids', 'numberposts' => 1]);
    if ($dup) return aio_err('برای این پوزیشن قبلاً درخواست یا دعوتی با این کارجو ثبت شده است.', 409, ['appId' => (int) $dup[0]]);
    if (!aio_rate_limit('invite' . get_current_user_id(), 40, DAY_IN_SECONDS)) return aio_err('سقف دعوت روزانه پر شده است.', 429);
    $note = aio_clean_textarea(aio_p($r, 'note'), 1000);
    $lab = (int) aio_meta($job->ID, 'lab_id', 0);
    $id = wp_insert_post(['post_type' => 'aio_application', 'post_status' => 'publish', 'post_author' => $uid, 'post_title' => 'دعوت: ' . $cand['name'] . ' ← ' . $job->post_title]);
    if (is_wp_error($id)) return aio_err('ثبت دعوت ناموفق بود.');
    aio_set_meta($id, 'job_id', $job->ID);
    aio_set_meta($id, 'lab_id', $lab);
    aio_set_meta($id, 'employer_id', (int) $job->post_author);
    aio_set_meta($id, 'status', 'invited');
    aio_set_meta($id, 'channel', 'invite');
    aio_set_meta($id, 'note', $note);
    aio_set_meta($id, 'match', aio_match_cv(aio_cv($uid), aio_job_item($job))['score']);
    aio_app_log($id, 'employer', 'status', 'کارفرما از مرکز تطبیق دعوت کرد' . ($note ? ' — ' . $note : ''), ['status' => 'invited']);
    $title = $job->post_status === 'aio_internal' ? ((string) aio_meta($job->ID, 'client_name', '') ?: $job->post_title) : $job->post_title;
    aio_app_tell($id, 'seeker', '📨 ' . (get_the_title($lab) ?: 'یک کارفرما') . " شما را برای پوزیشن «{$title}» دعوت کرد. از داشبورد پاسخ دهید." . ($note ? " — {$note}" : ''), true, '📨');
    return aio_ok(['id' => $id], true);
}

/* ================================================================
   تطبیق خودکار
   ================================================================ */
/** با انتشار آگهی: کارجویان «آماده به کار» با تطبیق بالا و خود کارفرما خبردار می‌شوند */
add_action('aio_job_published', function ($job_id) { wp_schedule_single_event(time() + 5, 'aio_auto_match_job', [(int) $job_id]); });
add_action('aio_auto_match_job', 'aio_auto_match_job');
function aio_auto_match_job(int $job_id): array
{
    $p = get_post($job_id);
    if (!$p || $p->post_type !== 'aio_job' || !in_array($p->post_status, ['publish', 'aio_internal'], true)) return [];
    $job = aio_job_item($p);
    if (empty($job['req'])) return [];
    $w = aio_match_weights();
    $done = array_map('intval', (array) aio_meta($job_id, 'auto_matched', []));
    $hits = [];
    foreach (get_users(['role__in' => ['aio_seeker', 'aio_volunteer'], 'meta_query' => [['key' => 'aio_cv', 'compare' => 'EXISTS'], ['key' => 'aio_otw', 'value' => '1']], 'fields' => 'ID', 'number' => 2000]) as $uid) {
        $uid = (int) $uid;
        $m = aio_match_cv(aio_cv($uid), $job);
        if ($m['score'] < $w['high'] || !$m['eligible']) continue;
        $hits[$uid] = $m['score'];
        if (in_array($uid, $done, true) || $job['internal']) continue;
        aio_notify($uid, "🎯 آگهی جدید «{$job['title']}» با رزومه‌ی شما " . aio_fa((string) $m['score']) . '٪ تطبیق دارد.', $job['url'], 'تطبیق هوشمند آیولب', true, '🎯');
        $done[] = $uid;
    }
    aio_set_meta($job_id, 'auto_matched', array_values(array_unique($done)));
    if ($hits && !aio_meta($job_id, 'auto_emp_notified', 0)) {
        aio_set_meta($job_id, 'auto_emp_notified', 1);
        $emp = (int) $p->post_author;
        $eu = get_userdata($emp);
        aio_notify($emp, '🎯 ' . aio_fa((string) count($hits)) . " نفر با تطبیق بالا برای «{$job['title']}» پیدا شد.", add_query_arg('job', $job_id, aio_page_url('talent')), 'تطبیق هوشمند آیولب', $eu && !aio_is_test_email($eu->user_email), '🎯');
    }
    return $hits;
}

/** با ذخیره‌ی رزومه: کارفرمایان پوزیشن‌هایی که این نفر برایشان تطبیق بالا دارد خبردار می‌شوند (هر زوج فقط یک بار) */
add_action('aio_cv_saved', function ($uid) { wp_schedule_single_event(time() + 5, 'aio_auto_match_cv', [(int) $uid]); });
add_action('aio_auto_match_cv', 'aio_auto_match_cv');
function aio_auto_match_cv(int $uid): array
{
    $cv = aio_cv($uid);
    if (!$cv || !aio_umeta($uid, 'otw', 0)) return [];
    $w = aio_match_weights();
    $u = get_userdata($uid);
    if (!$u || aio_is_test_email($u->user_email)) return []; /* حساب‌های تستی برای کارفرمایان واقعی اعلان نمی‌سازند */
    $out = [];
    $public_hits = 0;
    foreach (get_posts(['post_type' => 'aio_job', 'post_status' => ['publish', 'aio_internal'], 'numberposts' => 500, 'meta_query' => [['key' => '_aio_req_skills', 'compare' => 'EXISTS']]]) as $p) {
        $job = aio_job_item($p);
        if (empty($job['req'])) continue;
        $m = aio_match_cv($cv, $job);
        if ($m['score'] < $w['high'] || !$m['eligible']) continue;
        $done = array_map('intval', (array) aio_meta($p->ID, 'auto_matched', []));
        if (!$job['internal']) $public_hits++;
        if (in_array($uid, $done, true)) continue;
        $done[] = $uid;
        aio_set_meta($p->ID, 'auto_matched', $done);
        $emp = (int) $p->post_author;
        $eu = get_userdata($emp);
        aio_notify($emp, "🎯 رزومه‌ی جدید با " . aio_fa((string) $m['score']) . "٪ تطبیق برای «{$job['title']}»: {$u->display_name}", add_query_arg(['job' => $p->ID], aio_page_url('talent')), 'تطبیق هوشمند آیولب', $eu && !aio_is_test_email($eu->user_email), '🎯');
        $out[$p->ID] = $m['score'];
    }
    if ($public_hits) aio_notify($uid, '🎯 ' . aio_fa((string) $public_hits) . ' آگهی فعال با رزومه‌ی شما تطبیق بالا دارد.', aio_page_url('dashboard', '#matches'), 'تطبیق هوشمند آیولب', false, '🎯');
    return $out;
}
