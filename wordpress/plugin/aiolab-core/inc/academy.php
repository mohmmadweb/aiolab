<?php
/* آکادمی: ثبت‌نام، پیشرفت، آزمون درس‌ها، گواهی پایان دوره */
defined('ABSPATH') || exit;

function aio_course_enrollment(int $uid, int $cid): ?array
{
    $all = (array) aio_umeta($uid, 'courses', []);
    return isset($all[$cid]) ? (array) $all[$cid] : null;
}

function aio_enroll(int $uid, int $cid, bool $paid = false): array
{
    $all = (array) aio_umeta($uid, 'courses', []);
    if (!isset($all[$cid])) {
        $all[$cid] = ['date' => aio_jdate('Y/m/d'), 'done' => [], 'last' => null, 'quiz' => [], 'paid' => $paid, 'ts' => time()];
        aio_set_umeta($uid, 'courses', $all);
        update_user_meta($uid, '_aio_enr_' . $cid, time());
        aio_set_meta($cid, 'enrolled', (int) aio_meta($cid, 'enrolled', 0) + 1);
        do_action('aio_data_changed');
        aio_notify($uid, 'در دوره «' . get_the_title($cid) . '» ثبت‌نام شدید ✓', aio_single_url('learn', $cid), 'آکادمی آیولب', false, '📘');
    } elseif ($paid && empty($all[$cid]['paid'])) {
        $all[$cid]['paid'] = true;
        aio_set_umeta($uid, 'courses', $all);
    }
    return $all[$cid];
}

function aio_unenroll(int $uid, int $cid): void
{
    $all = (array) aio_umeta($uid, 'courses', []);
    if (!isset($all[$cid])) return;
    unset($all[$cid]);
    aio_set_umeta($uid, 'courses', $all);
    delete_user_meta($uid, '_aio_enr_' . $cid);
    aio_set_meta($cid, 'enrolled', max(0, (int) aio_meta($cid, 'enrolled', 0) - 1));
    do_action('aio_data_changed');
}

/** همه‌ی درس‌ها با کلید «ماژول:درس» */
function aio_course_lessons(int $cid): array
{
    $out = [];
    foreach ((array) aio_meta($cid, 'syllabus', []) as $mi => $m) {
        foreach ((array) ($m['lessons'] ?? []) as $li => $l) $out["$mi:$li"] = $l + ['module' => $m['title'] ?? ''];
    }
    return $out;
}

/** آیا کاربر به محتوای دوره دسترسی دارد (ثبت‌نام رایگان یا پرداخت‌شده، یا نویسنده/مدیر) */
function aio_can_learn(int $uid, int $cid): bool
{
    if (!$uid) return false;
    if (user_can($uid, 'edit_post', $cid) || (int) get_post_field('post_author', $cid) === $uid) return true;
    $e = aio_course_enrollment($uid, $cid);
    if (!$e) return false;
    $price = (int) aio_meta($cid, 'price', 0);
    return $price === 0 || !empty($e['paid']);
}

/** علامت‌گذاری درس + صدور گواهی در ۱۰۰٪ */
function aio_mark_lesson(int $uid, int $cid, string $key, bool $done = true): array
{
    $all = (array) aio_umeta($uid, 'courses', []);
    if (!isset($all[$cid])) return [];
    $lessons = aio_course_lessons($cid);
    if (!isset($lessons[$key])) return $all[$cid];
    $set = array_values(array_unique((array) ($all[$cid]['done'] ?? [])));
    if ($done && !in_array($key, $set, true)) $set[] = $key;
    if (!$done) $set = array_values(array_diff($set, [$key]));
    $all[$cid]['done'] = $set;
    $all[$cid]['last'] = $key;
    aio_set_umeta($uid, 'courses', $all);
    $total = count($lessons);
    $valid = count(array_intersect($set, array_keys($lessons)));
    $cert = null;
    if ($total && $valid >= $total && aio_meta($cid, 'cert', 1)) {
        $cert = aio_issue_cert($uid, 'course', $cid, 'گواهی دوره: ' . get_the_title($cid), 100, '🎓');
        aio_check_paths($uid);
    }
    return $all[$cid] + ['certId' => $cert];
}

/** تکمیل همه‌ی دوره‌های یک مسیر → گواهی مسیر */
function aio_check_paths(int $uid): void
{
    $done = [];
    foreach (aio_user_certs($uid) as $c) if ($c['type'] === 'course') $done[] = $c['refId'];
    foreach (get_posts(['post_type' => 'aio_path', 'post_status' => 'publish', 'numberposts' => -1]) as $p) {
        $ids = array_map('intval', (array) aio_meta($p->ID, 'courses', []));
        if ($ids && !array_diff($ids, $done)) {
            aio_issue_cert($uid, 'path', $p->ID, (string) aio_meta($p->ID, 'cert', '') ?: ('گواهی مسیر: ' . $p->post_title), 100, '🏆');
        }
    }
}

/** تصحیح آزمون (درس یا آزمون مهارت) — $questions با فیلد correct از ۱ */
function aio_grade(array $questions, array $answers): array
{
    $n = count($questions);
    $right = 0;
    $key = [];
    foreach (array_values($questions) as $i => $q) {
        $c = max(0, (int) ($q['correct'] ?? 1) - 1);
        $key[] = $c;
        if (isset($answers[$i]) && $answers[$i] !== null && $answers[$i] !== '' && (int) $answers[$i] === $c) $right++;
    }
    return ['score' => $n ? (int) round($right / $n * 100) : 100, 'right' => $right, 'total' => $n, 'key' => $key];
}
