<?php
/* اعلان‌های داخل سایت و ایمیل‌ها */
defined('ABSPATH') || exit;

function aio_admin_email(): string
{
    return aio_opt('notify_email', '') ?: get_option('admin_email');
}

/** افزودن اعلان به صندوق کاربر (حداکثر ۶۰ مورد آخر) و در صورت نیاز ایمیل */
function aio_notify(int $uid, string $text, string $link = '', string $from = 'آیولب', bool $email = false, string $icon = '🔔'): void
{
    if (!$uid) return;
    /* اقدام‌های حساب‌های تستی (example.com) برای هیچ‌کس ایمیل نمی‌سازد */
    if ($email && is_user_logged_in() && aio_is_test_email((string) wp_get_current_user()->user_email)) $email = false;
    $list = (array) aio_umeta($uid, 'notices', []);
    array_unshift($list, ['id' => uniqid('n'), 'from' => $from, 'text' => wp_strip_all_tags($text), 'link' => $link, 'icon' => $icon,
        'time' => aio_jdate('Y/m/d H:i'), 'ts' => time(), 'unread' => true]);
    aio_set_umeta($uid, 'notices', array_slice($list, 0, 60));
    if ($email) {
        $u = get_userdata($uid);
        if ($u && is_email($u->user_email) && !aio_is_test_email($u->user_email)) {
            aio_mail($u->user_email, wp_trim_words(wp_strip_all_tags($text), 10, '…'), '<p>' . esc_html($text) . '</p>' . ($link ? '<p><a class="btn" href="' . esc_url($link) . '">مشاهده</a></p>' : ''));
        }
    }
}

/** اعلان به مدیران (ایمیل) */
function aio_notify_admin(string $subject, string $html): void
{
    /* کاربران تستی (example.com) برای مدیر ایمیل نمی‌سازند */
    if (is_user_logged_in() && aio_is_test_email((string) wp_get_current_user()->user_email)) return;
    aio_mail(aio_admin_email(), $subject, $html);
}

/** ایمیل با قالب برند */
function aio_mail(string $to, string $subject, string $body_html): bool
{
    if (aio_is_test_email($to)) return true;
    $name = aio_opt('from_name', 'آیولب');
    $from = aio_opt('from_email', 'no-reply@' . wp_parse_url(home_url(), PHP_URL_HOST));
    $site = esc_url(home_url('/'));
    $html = '<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"></head><body style="margin:0;background:#f1f5f9;font-family:Tahoma,Vazirmatn,sans-serif;direction:rtl">'
        . '<div style="max-width:560px;margin:24px auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e2e8f0">'
        . '<div style="background:#0d9488;color:#fff;padding:18px 24px;font-size:20px;font-weight:bold">' . esc_html($name) . '</div>'
        . '<div style="padding:22px 24px;color:#1e293b;font-size:14px;line-height:2">' . $body_html . '</div>'
        . '<div style="padding:14px 24px;background:#f8fafc;color:#64748b;font-size:12px">این ایمیل از <a href="' . $site . '" style="color:#0d9488">' . esc_html(wp_parse_url(home_url(), PHP_URL_HOST)) . '</a> ارسال شده است.</div>'
        . '</div></body></html>';
    $html = str_replace('class="btn"', 'style="display:inline-block;background:#0d9488;color:#fff;padding:9px 18px;border-radius:8px;text-decoration:none"', $html);
    $headers = ['Content-Type: text/html; charset=UTF-8', 'From: ' . $name . ' <' . $from . '>'];
    return (bool) wp_mail($to, $subject . ' | ' . $name, $html, $headers);
}

/* ایمیل‌های هسته‌ی وردپرس (بازیابی رمز و …) هم با نام آیولب ارسال شوند */
add_filter('wp_mail_from', fn($f) => str_starts_with($f, 'wordpress@') ? aio_opt('from_email', $f) : $f);
add_filter('wp_mail_from_name', fn($n) => $n === 'WordPress' ? aio_opt('from_name', 'آیولب') : $n);

/* اطلاع‌رسانی تغییر وضعیت محتوای ارسالی کاربران */
add_action('transition_post_status', function ($new, $old, $post) {
    if ($new === $old) return;
    $types = ['aio_job' => 'آگهی', 'aio_lab' => 'مرکز', 'aio_course' => 'دوره', 'aio_exam' => 'آزمون'];
    if (!isset($types[$post->post_type])) return;
    $label = $types[$post->post_type];
    $author = (int) $post->post_author;
    if ($new === 'pending' && $old !== 'pending') {
        aio_notify_admin("$label جدید در انتظار بررسی", '<p>' . esc_html($label . ' «' . $post->post_title . '» برای بررسی ارسال شد.') . '</p><p><a class="btn" href="' . esc_url(admin_url('post.php?action=edit&post=' . $post->ID)) . '">بررسی در پیشخوان</a></p>');
    }
    if ($new === 'publish' && in_array($old, ['pending', 'draft'], true) && $author && !user_can($author, 'edit_posts')) {
        aio_notify($author, "$label «{$post->post_title}» تأیید و منتشر شد ✓", get_permalink($post), 'آیولب', true, '✅');
    }
    if ($new === 'publish' && $post->post_type === 'aio_job' && $old !== 'publish') {
        do_action('aio_job_published', $post->ID);
    }
}, 10, 3);

/* فرستنده‌ی پاکت (Return-Path) هم از دامنه‌ی سایت باشد تا SPF/DKIM با From هم‌راستا شوند و جیمیل ایمیل را رد نکند.
   برگشتی‌ها به صندوق پشتیبانی می‌رسند. */
add_action('phpmailer_init', function ($m) {
    $site = (string) wp_parse_url(home_url(), PHP_URL_HOST);
    $bounce = (string) aio_opt('support_email', '');
    if ($bounce && str_ends_with(strtolower($bounce), '@' . strtolower($site)) && str_ends_with(strtolower((string) $m->From), '@' . strtolower($site))) {
        $m->Sender = $bounce;
    }
});
