<?php
/* پیکربندی پویا (از «تنظیمات آیولب»): آزمون و گواهی، کانال‌های اطلاع‌رسانی، پیامک و ربات پیام‌رسان */
defined('ABSPATH') || exit;

/* ================================================================
   آزمون و گواهی
   ================================================================ */
function aio_exam_cfg(): array
{
    $d = aio_default_settings();
    $o = fn($k) => aio_opt($k, $d[$k] ?? null);
    $int = fn($k) => (int) aio_en_digits((string) $o($k));
    $valid = [];
    foreach ((array) $o('exam_valid_options') as $x) {
        $name = trim((string) ($x['name'] ?? ''));
        if ($name !== '') $valid[] = ['months' => max(0, (int) aio_en_digits((string) ($x['months'] ?? 0))), 'name' => $name];
    }
    if (!$valid) $valid = $d['exam_valid_options'];
    $badges = array_values(array_filter(array_map('trim', (array) $o('exam_badges')))) ?: $d['exam_badges'];
    $vdef = $int('exam_valid_default');
    if (!in_array($vdef, array_column($valid, 'months'), true)) $vdef = $valid[0]['months'];
    $pmin = max(1, min(100, $int('exam_pass_min')));
    $dmin = max(1, $int('exam_duration_min'));
    $dmax = max($dmin, $int('exam_duration_max'));
    $qmin = max(1, $int('exam_min_questions'));
    $imin = max(1, min(100, $int('exam_invite_min')));
    return [
        'valid' => $valid, 'validDefault' => $vdef, 'badges' => $badges,
        'pass' => ['def' => max($pmin, min(100, $int('exam_pass_default'))), 'min' => $pmin],
        'duration' => ['def' => max($dmin, min($dmax, $int('exam_duration_default'))), 'min' => $dmin, 'max' => $dmax],
        'questions' => ['min' => $qmin, 'max' => max($qmin, $int('exam_max_questions'))],
        'retakeDays' => max(0, $int('exam_retake_days')),
        'autoCert' => ['def' => aio_bool($o('exam_auto_cert_default')), 'edit' => aio_bool($o('exam_auto_cert_editable'))],
        'top' => ['def' => aio_bool($o('exam_top_default')), 'edit' => aio_bool($o('exam_top_editable'))],
        'invite' => ['def' => aio_bool($o('exam_invite_default')), 'edit' => aio_bool($o('exam_invite_editable')),
            'score' => max($imin, min(100, $int('exam_invite_score'))), 'min' => $imin],
        'autoPublish' => aio_bool($o('exam_auto_publish')),
    ];
}

/** گزینه‌های اعتبار گواهی برای فیلد پیشخوان (ماه ← عنوان) */
function aio_exam_valid_options(): array
{
    $out = [];
    foreach (aio_exam_cfg()['valid'] as $v) $out[(string) $v['months']] = $v['name'];
    return $out;
}

/** دامنه‌های مجاز ویدئوی معرفی سازمان */
function aio_video_hosts(): array
{
    $h = array_values(array_filter(array_map(fn($x) => strtolower(preg_replace('#^(https?://)?(www\.)?#', '', trim((string) $x), 1)), (array) aio_opt('video_hosts', ['aparat.com']))));
    return $h ?: ['aparat.com'];
}

/* ================================================================
   کانال‌های اطلاع‌رسانی
   ================================================================ */
const AIO_CH_SITE = 'اعلان سایت', AIO_CH_EMAIL = 'ایمیل', AIO_CH_SMS = 'پیامک', AIO_CH_BOT = 'ربات';

function aio_sms_ready(): bool
{
    $p = (string) aio_opt('sms_provider', '');
    if ($p === 'custom') return (string) aio_opt('sms_custom_url', '') !== '';
    return $p !== '' && (string) aio_opt('sms_api_key', '') !== '';
}
function aio_bot_ready(): bool { return (string) aio_opt('bot_token', '') !== '' && (string) aio_opt('bot_username', '') !== ''; }

/** کانال‌هایی که کارجو می‌تواند برای هشدار شغلی انتخاب کند */
function aio_channels(): array
{
    $out = [];
    if (aio_bool(aio_opt('ch_site', 1))) $out[] = ['id' => AIO_CH_SITE, 'name' => 'اعلان داخل سایت'];
    if (aio_bool(aio_opt('ch_email', 1))) $out[] = ['id' => AIO_CH_EMAIL, 'name' => 'ایمیل'];
    if (aio_bool(aio_opt('ch_sms', 0)) && aio_sms_ready()) $out[] = ['id' => AIO_CH_SMS, 'name' => 'پیامک'];
    if (aio_bool(aio_opt('ch_bot', 0)) && aio_bot_ready()) $out[] = ['id' => AIO_CH_BOT, 'name' => (string) aio_opt('bot_label', 'ربات بله') ?: 'ربات', 'bot' => true];
    return $out;
}

/** «تلگرام» نام قدیمی کانال ربات در هشدارهای ذخیره‌شده است */
function aio_alert_has(array $channels, string $ch): bool
{
    return in_array($ch, $channels, true) || ($ch === AIO_CH_BOT && in_array('تلگرام', $channels, true));
}

/** ارسال پیامک/ربات برای یک کاربر (اعلان و ایمیل جداگانه ارسال می‌شوند) */
function aio_push_user(int $uid, string $text, bool $sms, bool $bot): void
{
    $u = get_userdata($uid);
    if (!$u || aio_is_test_email((string) $u->user_email)) return;
    if ($sms && aio_sms_ready()) {
        $phone = (string) get_user_meta($uid, 'aio_phone', true);
        if ($phone !== '') aio_sms_send($phone, $text);
    }
    if ($bot && aio_bot_ready()) {
        $chat = (string) get_user_meta($uid, 'aio_bot_chat', true);
        if ($chat !== '') aio_bot_send($chat, $text);
    }
}

/* رویدادهای مهم استخدام (همان‌هایی که ایمیل دارند) */
add_action('aio_important_notice', function (int $uid, string $text) {
    aio_push_user($uid, $text, aio_bool(aio_opt('sms_events', 1)) && aio_bool(aio_opt('ch_sms', 0)), aio_bool(aio_opt('bot_events', 1)) && aio_bool(aio_opt('ch_bot', 0)));
}, 10, 2);

/* ================================================================
   پیامک
   ================================================================ */
function aio_sms_phone(string $p): string
{
    $p = preg_replace('/\D/', '', aio_en_digits($p));
    if (str_starts_with($p, '0098')) $p = substr($p, 4);
    if (str_starts_with($p, '98') && strlen($p) === 12) $p = substr($p, 2);
    if (strlen($p) === 10 && $p[0] === '9') $p = '0' . $p;
    return $p;
}

/** ارسال یک پیامک با سرویس انتخاب‌شده در تنظیمات؛ نتیجه در گزارش آخرین ارسال‌ها ثبت می‌شود */
function aio_sms_send(string $to, string $text): bool
{
    $to = aio_sms_phone($to);
    if (!preg_match('/^09\d{9}$/', $to) || !aio_sms_ready()) return false;
    $p = (string) aio_opt('sms_provider', '');
    $key = trim((string) aio_opt('sms_api_key', ''));
    $from = trim((string) aio_opt('sms_sender', ''));
    $text = wp_strip_all_tags($text) . "\n" . (string) aio_opt('from_name', 'آیولب');
    $json = fn($url, $body, $headers = []) => wp_remote_post($url, ['timeout' => 15, 'headers' => $headers + ['Content-Type' => 'application/json', 'Accept' => 'application/json'], 'body' => wp_json_encode($body)]);
    switch ($p) {
        case 'kavenegar':
            $res = wp_remote_get('https://api.kavenegar.com/v1/' . rawurlencode($key) . '/sms/send.json?' . http_build_query(['receptor' => $to, 'sender' => $from, 'message' => $text]), ['timeout' => 15]);
            break;
        case 'ippanel':
            $res = $json('https://api2.ippanel.com/api/v1/sms/send/webservice/single', ['recipient' => [$to], 'sender' => $from, 'message' => $text], ['apikey' => $key]);
            break;
        case 'smsir':
            $res = $json('https://api.sms.ir/v1/send/bulk', ['lineNumber' => $from, 'messageText' => $text, 'mobiles' => [$to]], ['X-API-KEY' => $key]);
            break;
        case 'melipayamak':
            $res = $json('https://console.melipayamak.com/api/send/simple/' . rawurlencode($key), ['from' => $from, 'to' => $to, 'text' => $text]);
            break;
        default:
            $tpl = (string) aio_opt('sms_custom_url', '');
            $url = strtr($tpl, ['{to}' => rawurlencode($to), '{text}' => rawurlencode($text), '{sender}' => rawurlencode($from), '{key}' => rawurlencode($key)]);
            $res = strtoupper((string) aio_opt('sms_custom_method', 'GET')) === 'POST' ? $json($url, ['to' => $to, 'text' => $text, 'sender' => $from]) : wp_remote_get($url, ['timeout' => 15]);
    }
    $code = is_wp_error($res) ? 0 : (int) wp_remote_retrieve_response_code($res);
    $body = is_wp_error($res) ? $res->get_error_message() : (string) wp_remote_retrieve_body($res);
    $ok = $code >= 200 && $code < 300;
    aio_channel_log('پیامک', $to, $ok, $code . ' ' . mb_substr(wp_strip_all_tags($body), 0, 160));
    return $ok;
}

/** گزارش ۳۰ ارسال آخر پیامک/ربات (برای عیب‌یابی در تب «ابزارها») */
function aio_channel_log(string $ch, string $to, bool $ok, string $info): void
{
    $log = (array) get_option('aio_channel_log', []);
    $mask = strlen($to) > 6 ? substr($to, 0, 4) . '***' . substr($to, -3) : $to;
    array_unshift($log, ['t' => aio_jdate('Y/m/d H:i'), 'ch' => $ch, 'to' => $mask, 'ok' => $ok, 'info' => $info]);
    update_option('aio_channel_log', array_slice($log, 0, 30), false);
}

/* ================================================================
   ربات پیام‌رسان (API سازگار بله/تلگرام)
   ================================================================ */
function aio_bot_api(string $method): string
{
    $base = rtrim((string) aio_opt('bot_api_base', ''), '/');
    if ($base === '') $base = aio_opt('bot_platform', 'bale') === 'telegram' ? 'https://api.telegram.org' : 'https://tapi.bale.ai';
    return $base . '/bot' . trim((string) aio_opt('bot_token', '')) . '/' . $method;
}
function aio_bot_call(string $method, array $args = [])
{
    $res = wp_remote_post(aio_bot_api($method), ['timeout' => 15, 'headers' => ['Content-Type' => 'application/json'], 'body' => wp_json_encode((object) $args)]);
    if (is_wp_error($res)) return $res;
    return json_decode((string) wp_remote_retrieve_body($res), true) ?: ['ok' => false, 'description' => 'HTTP ' . wp_remote_retrieve_response_code($res)];
}
function aio_bot_send(string $chat, string $text): bool
{
    $r = aio_bot_call('sendMessage', ['chat_id' => $chat, 'text' => wp_strip_all_tags($text)]);
    $ok = !is_wp_error($r) && !empty($r['ok']);
    aio_channel_log('ربات', $chat, $ok, is_wp_error($r) ? $r->get_error_message() : (string) ($r['description'] ?? 'ok'));
    return $ok;
}
function aio_bot_link(string $code = ''): string
{
    $u = trim((string) aio_opt('bot_username', ''), "@ \t");
    $host = aio_opt('bot_platform', 'bale') === 'telegram' ? 'https://t.me/' : 'https://ble.ir/';
    return $host . rawurlencode($u) . ($code !== '' ? '?start=' . rawurlencode($code) : '');
}
function aio_bot_secret(): string { return substr(wp_hash('aio-bot-webhook|' . aio_opt('bot_token', '')), 0, 24); }

add_action('rest_api_init', function () {
    $user = fn() => is_user_logged_in();
    /* کد اتصال حساب به ربات */
    register_rest_route(AIO_NS, '/me/bot-link', ['methods' => 'POST', 'permission_callback' => $user, 'callback' => function () {
        if (!aio_bot_ready()) return aio_err('ربات هنوز راه‌اندازی نشده است.', 409);
        $uid = get_current_user_id();
        $code = (string) wp_rand(100000, 999999);
        update_user_meta($uid, 'aio_bot_code', $code . '|' . time());
        return aio_ok(['pin' => $code, 'link' => aio_bot_link($code), 'username' => (string) aio_opt('bot_username', '')]);
    }]);
    register_rest_route(AIO_NS, '/me/bot-unlink', ['methods' => 'POST', 'permission_callback' => $user, 'callback' => function () {
        delete_user_meta(get_current_user_id(), 'aio_bot_chat');
        return aio_ok([], true);
    }]);
    /* وب‌هوک ربات: پیام‌رسان به‌روزرسانی‌ها را این‌جا می‌فرستد */
    register_rest_route(AIO_NS, '/bot/(?P<secret>[a-zA-Z0-9]+)', ['methods' => 'POST', 'permission_callback' => '__return_true', 'callback' => function (WP_REST_Request $r) {
        if (!aio_bot_ready() || !hash_equals(aio_bot_secret(), (string) $r['secret'])) return new WP_REST_Response(['ok' => false], 403);
        $msg = (array) ($r->get_json_params()['message'] ?? []);
        $chat = (string) ($msg['chat']['id'] ?? '');
        $text = trim(aio_en_digits((string) ($msg['text'] ?? '')));
        if ($chat === '') return new WP_REST_Response(['ok' => true]);
        if (preg_match('/(\d{6})/', $text, $m)) {
            $users = get_users(['meta_key' => 'aio_bot_code', 'meta_value' => '^' . $m[1] . '\|', 'meta_compare' => 'REGEXP', 'number' => 1]);
            $u = $users[0] ?? null;
            $ts = $u ? (int) explode('|', (string) get_user_meta($u->ID, 'aio_bot_code', true))[1] : 0;
            if ($u && $ts > time() - 30 * MINUTE_IN_SECONDS) {
                update_user_meta($u->ID, 'aio_bot_chat', $chat);
                delete_user_meta($u->ID, 'aio_bot_code');
                aio_bot_send($chat, '✅ حساب «' . $u->display_name . '» در ' . aio_opt('from_name', 'آیولب') . ' به این ربات وصل شد. هشدارهای شغلی و رویدادهای مهم این‌جا ارسال می‌شود.');
                aio_notify($u->ID, '🤖 حساب شما به ' . aio_opt('bot_label', 'ربات') . ' وصل شد.', aio_page_url('dashboard', '#alerts'));
                return new WP_REST_Response(['ok' => true]);
            }
            aio_bot_send($chat, 'کد نامعتبر یا منقضی است. از داشبورد آیولب ← هشدار شغلی، کد تازه بگیرید.');
            return new WP_REST_Response(['ok' => true]);
        }
        aio_bot_send($chat, 'سلام! برای اتصال، در داشبورد ' . aio_opt('from_name', 'آیولب') . ' ← «هشدار شغلی» دکمه‌ی اتصال ربات را بزنید و کد ۶ رقمی را این‌جا بفرستید.');
        return new WP_REST_Response(['ok' => true]);
    }]);
});
