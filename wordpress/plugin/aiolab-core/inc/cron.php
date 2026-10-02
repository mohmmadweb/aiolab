<?php
/* کارهای زمان‌بندی‌شده: انقضای آگهی‌ها، هشدارهای شغلی (آنی/روزانه/هفتگی)، اطلاع به دنبال‌کنندگان مرکز */
defined('ABSPATH') || exit;

function aio_cron_schedule(): void
{
    if (!wp_next_scheduled('aio_daily')) {
        $t = new DateTime('tomorrow 08:00', wp_timezone());
        wp_schedule_event($t->getTimestamp(), 'daily', 'aio_daily');
    }
    if (!wp_next_scheduled('aio_hourly')) wp_schedule_event(time() + 300, 'hourly', 'aio_hourly');
}

/** آیا آگهی با معیارهای هشدار می‌خواند؟ */
function aio_alert_matches(array $f, array $j): bool
{
    if (!empty($f['q'])) {
        $hay = $j['title'] . ' ' . implode(' ', $j['skills']) . ' ' . $j['desc'] . ' ' . $j['fieldOfStudy'];
        if (mb_stripos($hay, $f['q']) === false) return false;
    }
    if (!empty($f['dept']) && $f['dept'] !== $j['dept']) return false;
    if (!empty($f['provinceId']) && $f['provinceId'] !== $j['provinceId'] && !$j['remote']) return false;
    if (!empty($f['city']) && $f['city'] !== $j['city'] && !$j['remote']) return false;
    if (!empty($f['type']) && $f['type'] !== $j['type']) return false;
    if (!empty($f['band'])) {
        foreach (aio_list('salary_bands', []) as $b) {
            if (($b['id'] ?? '') === $f['band'] && $j['salaryMax'] && $j['salaryMax'] < (float) $b['min']) return false;
        }
    }
    return true;
}

/** ارسال یک دسته آگهی به کاربر بر اساس کانال‌های هشدار */
function aio_send_alert(int $uid, array $alert, array $jobs): void
{
    if (!$jobs) return;
    $n = count($jobs);
    $text = aio_fa($n) . ' آگهی جدید مطابق هشدار «' . $alert['title'] . '» منتشر شد.';
    $link = $n === 1 ? $jobs[0]['url'] : aio_page_url('jobs');
    $channels = (array) ($alert['channels'] ?? []);
    if (in_array('اعلان سایت', $channels, true) || !$channels) aio_notify($uid, $text, $link, 'هشدار شغلی من', false, '🔔');
    if (in_array('ایمیل', $channels, true)) {
        $u = get_userdata($uid);
        if ($u && is_email($u->user_email) && !str_ends_with($u->user_email, '.invalid')) {
            $list = '<ul>' . implode('', array_map(fn($j) => '<li><a href="' . esc_url($j['url']) . '">' . esc_html($j['title']) . '</a> — ' . esc_html(get_the_title($j['labId']) . ' · ' . $j['city'] . ' · ' . $j['salary']) . '</li>', array_slice($jobs, 0, 15))) . '</ul>';
            aio_mail($u->user_email, 'آگهی‌های جدید: ' . $alert['title'], '<p>' . esc_html($text) . '</p>' . $list . '<p><a class="btn" href="' . esc_url(aio_page_url('dashboard', '#alerts')) . '">مدیریت هشدارها</a></p>');
        }
    }
}

/** کاربرانی که هشدار دارند */
function aio_alert_users(): array
{
    return get_users(['meta_key' => 'aio_alerts', 'meta_compare' => 'EXISTS', 'fields' => ['ID'], 'number' => 5000]);
}

/* انتشار آگهی → هشدار آنی + اطلاع به دنبال‌کنندگان مرکز */
add_action('aio_job_published', function ($job_id) {
    $p = get_post($job_id);
    if (!$p || $p->post_status !== 'publish') return;
    if (get_post_meta($job_id, '_aio_alerted', true)) return;
    update_post_meta($job_id, '_aio_alerted', time());
    $j = aio_job_item($p);
    foreach (aio_alert_users() as $u) {
        foreach ((array) aio_umeta((int) $u->ID, 'alerts', []) as $a) {
            if (str_starts_with((string) ($a['freq'] ?? ''), 'آنی') && aio_alert_matches((array) $a['filters'], $j)) {
                aio_send_alert((int) $u->ID, $a, [$j]);
                break;
            }
        }
    }
    $lab = (int) $j['labId'];
    if ($lab) {
        foreach (get_users(['meta_key' => 'aio_follows', 'meta_compare' => 'EXISTS', 'fields' => ['ID'], 'number' => 5000]) as $u) {
            if (in_array($lab, array_map('intval', (array) aio_umeta((int) $u->ID, 'follows', [])), true)) {
                aio_notify((int) $u->ID, get_the_title($lab) . ' آگهی جدید منتشر کرد: ' . $j['title'], $j['url'], get_the_title($lab), false, '🏥');
            }
        }
    }
}, 10, 1);

add_action('aio_daily', function () {
    /* ۱) انقضای آگهی‌ها */
    $today = wp_date('Y-m-d');
    foreach (get_posts(['post_type' => 'aio_job', 'post_status' => 'publish', 'numberposts' => -1, 'meta_query' => [['key' => '_aio_expires', 'value' => $today, 'compare' => '<', 'type' => 'DATE'], ['key' => '_aio_expires', 'value' => '', 'compare' => '!=']]]) as $p) {
        wp_update_post(['ID' => $p->ID, 'post_status' => 'aio_expired']);
        $a = (int) $p->post_author;
        if ($a && !user_can($a, 'edit_posts')) aio_notify($a, "آگهی «{$p->post_title}» منقضی شد. برای تمدید از پنل کارفرما اقدام کنید.", aio_page_url('employer', '#jobs'), 'آیولب', true, '⏰');
    }
    /* ۲) هشدارهای روزانه/هفتگی */
    $weekly_day = (int) wp_date('w') === 6; // شنبه
    $since_day = time() - DAY_IN_SECONDS;
    $since_week = time() - WEEK_IN_SECONDS;
    $recent = array_map('aio_job_item', get_posts(['post_type' => 'aio_job', 'post_status' => 'publish', 'numberposts' => 300, 'date_query' => [['after' => '8 days ago']]]));
    foreach (aio_alert_users() as $u) {
        foreach ((array) aio_umeta((int) $u->ID, 'alerts', []) as $a) {
            $freq = (string) ($a['freq'] ?? 'خلاصه روزانه');
            if (str_starts_with($freq, 'آنی')) continue;
            $weekly = str_contains($freq, 'هفتگی');
            if ($weekly && !$weekly_day) continue;
            $since = $weekly ? $since_week : $since_day;
            $match = array_values(array_filter($recent, fn($j) => get_post_time('U', true, $j['id']) >= $since && aio_alert_matches((array) $a['filters'], $j)));
            aio_send_alert((int) $u->ID, $a, $match);
        }
    }
});

/* آگهی‌هایی که مستقیم (بدون گذر از pending) منتشر شده‌اند هم هشدار بگیرند */
add_action('aio_hourly', function () {
    foreach (get_posts(['post_type' => 'aio_job', 'post_status' => 'publish', 'numberposts' => 50, 'date_query' => [['after' => '3 hours ago']],
        'meta_query' => [['key' => '_aio_alerted', 'compare' => 'NOT EXISTS']]]) as $p) {
        if (!get_post_meta($p->ID, '_aio_sample', true)) do_action('aio_job_published', $p->ID);
    }
});
