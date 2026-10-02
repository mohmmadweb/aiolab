<?php
/**
 * سفارش و پرداخت
 * - هر سفارش یک پست aio_order است (مدیریت از «خدمات و تعرفه‌ها ← سفارش‌ها»)
 * - روش‌ها: دستی (تأیید مدیر)، زرین‌پال، زیبال — از «تنظیمات آیولب ← پرداخت» انتخاب می‌شود
 * - پس از پرداخت، تحویل خودکار: ثبت‌نام دوره، باز شدن آزمون، اعتبار آگهی، اشتراک
 */
defined('ABSPATH') || exit;

function aio_checkout_url(int $order_id): string
{
    return add_query_arg('order', $order_id, aio_page_url('checkout'));
}

/**
 * ساخت سفارش. $item = ['kind'=>'service|course|exam', 'ref'=>int|string, 'code'=>'R1', 'title'=>..., 'price'=>int|null, 'unit'=>...]
 */
function aio_create_order(int $uid, array $item): int
{
    $id = wp_insert_post(['post_type' => 'aio_order', 'post_status' => 'publish', 'post_author' => $uid, 'post_title' => $item['title']]);
    if (is_wp_error($id)) return 0;
    aio_set_meta($id, 'items', [$item]);
    aio_set_meta($id, 'amount', $item['price'] === null ? 0 : (int) $item['price']);
    aio_set_meta($id, 'number', aio_jdate('ymd') . '-' . $id);
    update_post_meta($id, '_aio_number_en', aio_en_digits(aio_jdate('ymd')) . '-' . $id);
    aio_set_meta($id, 'status', 'pending');
    aio_set_meta($id, 'log', [['t' => time(), 'm' => 'سفارش ثبت شد']]);
    if ($item['price'] === null) {
        aio_order_set_status($id, 'processing', 'درخواست استعلام قیمت — کارشناس تماس می‌گیرد');
        aio_notify_admin('درخواست خدمت توافقی', '<p>«' . esc_html($item['title']) . '» توسط ' . esc_html(get_userdata($uid)->display_name) . ' درخواست شد.</p><p><a class="btn" href="' . esc_url(admin_url('post.php?action=edit&post=' . $id)) . '">مشاهده سفارش</a></p>');
    } elseif ((int) $item['price'] === 0) {
        aio_order_set_status($id, 'paid', 'خدمت رایگان فعال شد');
    } else {
        aio_notify($uid, 'سفارش «' . $item['title'] . '» ثبت شد و در انتظار پرداخت است.', aio_checkout_url($id), 'آیولب', false, '🧾');
    }
    return (int) $id;
}

function aio_order_log(int $id, string $m): void
{
    $log = (array) aio_meta($id, 'log', []);
    $log[] = ['t' => time(), 'm' => $m];
    aio_set_meta($id, 'log', $log);
}

/** تغییر وضعیت سفارش؛ ورود به «پرداخت‌شده» برای اولین بار، تحویل خودکار را اجرا می‌کند */
function aio_order_set_status(int $id, string $status, string $note = ''): void
{
    $old = (string) aio_meta($id, 'status', 'pending');
    aio_set_meta($id, 'status', $status);
    aio_order_log($id, ($note ? $note . ' — ' : '') . 'وضعیت: ' . (AIO_ORDER_STATUSES[$status] ?? $status));
    if (in_array($status, ['paid', 'processing', 'done'], true) && $old === 'pending' && $status !== 'processing') {
        aio_fulfill_order($id);
    }
    if ($status === 'paid' && !aio_meta($id, 'paid_at')) aio_set_meta($id, 'paid_at', time());
}

function aio_fulfill_order(int $id): void
{
    if (aio_meta($id, 'fulfilled')) return;
    aio_set_meta($id, 'fulfilled', 1);
    $uid = (int) get_post_field('post_author', $id);
    $auto = true;
    foreach ((array) aio_meta($id, 'items', []) as $it) {
        switch ($it['kind'] ?? '') {
            case 'course':
                aio_enroll($uid, (int) $it['ref'], true);
                break;
            case 'exam':
                $ex = (array) aio_umeta($uid, 'exams', []);
                $ex[(int) $it['ref']] = array_merge((array) ($ex[(int) $it['ref']] ?? []), ['paid' => true]);
                aio_set_umeta($uid, 'exams', $ex);
                break;
            case 'service':
                $sid = (int) ($it['wp_id'] ?? 0);
                $grants = $sid ? (array) aio_meta($sid, 'grants', []) : [];
                if (!$grants) { $auto = false; break; }
                foreach ($grants as $g) aio_apply_grant($uid, (string) ($g['key'] ?? ''), (int) ($g['value'] ?? 0));
                break;
        }
    }
    $title = get_the_title($id);
    if ($auto) {
        aio_set_meta($id, 'status', 'done');
        aio_order_log($id, 'تحویل خودکار انجام شد');
        aio_notify($uid, "سفارش «{$title}» فعال شد ✓", aio_page_url(aio_user_role($uid) === 'employer' ? 'employer' : 'dashboard', '#orders'), 'آیولب', true, '✅');
    } else {
        aio_notify($uid, "پرداخت سفارش «{$title}» ثبت شد ✓ کارشناسان آیولب برای انجام خدمت با شما تماس می‌گیرند.", aio_page_url(aio_user_role($uid) === 'employer' ? 'employer' : 'dashboard', '#orders'), 'آیولب', true, '✅');
        aio_notify_admin('سفارش پرداخت‌شده نیازمند اقدام', '<p>سفارش «' . esc_html($title) . '» پرداخت شد و نیاز به انجام توسط تیم دارد.</p><p><a class="btn" href="' . esc_url(admin_url('post.php?action=edit&post=' . $id)) . '">مشاهده سفارش</a></p>');
    }
}

function aio_apply_grant(int $uid, string $key, int $value): void
{
    if ($value <= 0) return;
    if (in_array($key, ['job_credits', 'featured_credits', 'urgent_credits'], true)) {
        $c = aio_credits($uid);
        $c[str_replace('_credits', '', $key)] += $value;
        aio_set_umeta($uid, 'credits', $c);
    } elseif (in_array($key, ['resume_bank_days', 'plan_days'], true)) {
        $meta = $key === 'plan_days' ? 'plan_until' : 'resume_bank_until';
        $from = max(time(), (int) aio_umeta($uid, $meta, 0));
        aio_set_umeta($uid, $meta, $from + $value * DAY_IN_SECONDS);
    }
}

/* ---------- درگاه‌ها ---------- */
function aio_gateway(): string
{
    $g = aio_opt('gateway', 'manual');
    if ($g === 'zarinpal' && !aio_opt('zarinpal_merchant') && !aio_opt('zarinpal_sandbox')) return 'manual';
    if ($g === 'zibal' && !aio_opt('zibal_merchant') && !aio_opt('zibal_sandbox')) return 'manual';
    return $g;
}

function aio_pay_callback_url(int $order_id, string $gw): string
{
    return add_query_arg(['aio_pay_cb' => $gw, 'order' => $order_id], home_url('/'));
}

/** شروع پرداخت: ['redirect'=>url] یا ['manual'=>متن] یا ['error'=>متن] */
function aio_pay_start(int $order_id): array
{
    $amount_toman = (int) aio_meta($order_id, 'amount', 0);
    $rial = $amount_toman * 10;
    $gw = aio_gateway();
    $desc = 'آیولب — ' . get_the_title($order_id);
    if ($gw === 'zarinpal') {
        $sandbox = (bool) aio_opt('zarinpal_sandbox', 0);
        $merchant = aio_opt('zarinpal_merchant', '') ?: ($sandbox ? '00000000-0000-0000-0000-000000000000' : '');
        $host = $sandbox ? 'https://sandbox.zarinpal.com' : 'https://payment.zarinpal.com';
        $u = get_userdata((int) get_post_field('post_author', $order_id));
        $res = wp_remote_post($host . '/pg/v4/payment/request.json', ['timeout' => 25, 'headers' => ['Content-Type' => 'application/json', 'Accept' => 'application/json'],
            'body' => wp_json_encode(['merchant_id' => $merchant, 'amount' => $rial, 'description' => $desc, 'callback_url' => aio_pay_callback_url($order_id, 'zarinpal'),
                'metadata' => array_filter(['email' => $u ? $u->user_email : '', 'mobile' => $u ? (string) get_user_meta($u->ID, 'aio_phone', true) : '', 'order_id' => (string) $order_id])])]);
        if (is_wp_error($res)) return ['error' => 'اتصال به زرین‌پال برقرار نشد: ' . $res->get_error_message()];
        $b = json_decode(wp_remote_retrieve_body($res), true);
        $auth = $b['data']['authority'] ?? '';
        if (($b['data']['code'] ?? 0) == 100 && $auth) {
            aio_set_meta($order_id, 'gateway', 'zarinpal');
            aio_set_meta($order_id, 'authority', $auth);
            aio_order_log($order_id, 'انتقال به زرین‌پال');
            return ['redirect' => $host . '/pg/StartPay/' . $auth];
        }
        return ['error' => 'خطای زرین‌پال: ' . wp_json_encode($b['errors'] ?? $b, JSON_UNESCAPED_UNICODE)];
    }
    if ($gw === 'zibal') {
        $merchant = aio_opt('zibal_merchant', '') ?: (aio_opt('zibal_sandbox') ? 'zibal' : '');
        $res = wp_remote_post('https://gateway.zibal.ir/v1/request', ['timeout' => 25, 'headers' => ['Content-Type' => 'application/json'],
            'body' => wp_json_encode(['merchant' => $merchant, 'amount' => $rial, 'callbackUrl' => aio_pay_callback_url($order_id, 'zibal'), 'orderId' => (string) $order_id, 'description' => $desc])]);
        if (is_wp_error($res)) return ['error' => 'اتصال به زیبال برقرار نشد: ' . $res->get_error_message()];
        $b = json_decode(wp_remote_retrieve_body($res), true);
        if (($b['result'] ?? 0) == 100 && !empty($b['trackId'])) {
            aio_set_meta($order_id, 'gateway', 'zibal');
            aio_set_meta($order_id, 'authority', (string) $b['trackId']);
            aio_order_log($order_id, 'انتقال به زیبال');
            return ['redirect' => 'https://gateway.zibal.ir/start/' . $b['trackId']];
        }
        return ['error' => 'خطای زیبال: ' . ($b['message'] ?? 'نامشخص')];
    }
    aio_set_meta($order_id, 'gateway', 'manual');
    return ['manual' => (string) aio_opt('manual_instructions', '')];
}

/* بازگشت از درگاه و تأیید تراکنش */
add_action('template_redirect', function () {
    if (empty($_GET['aio_pay_cb']) || empty($_GET['order'])) return;
    $gw = sanitize_key($_GET['aio_pay_cb']);
    $oid = (int) $_GET['order'];
    $order = get_post($oid);
    if (!$order || $order->post_type !== 'aio_order') wp_die('سفارش پیدا نشد.');
    $back = aio_checkout_url($oid);
    if (aio_meta($oid, 'status') !== 'pending') { wp_safe_redirect($back); exit; }
    $rial = (int) aio_meta($oid, 'amount', 0) * 10;
    $ok = false;
    $ref = '';
    $msg = 'پرداخت انجام نشد یا لغو شد.';
    if ($gw === 'zarinpal') {
        $auth = sanitize_text_field(wp_unslash($_GET['Authority'] ?? ''));
        if (($_GET['Status'] ?? '') === 'OK' && $auth && $auth === aio_meta($oid, 'authority')) {
            $sandbox = (bool) aio_opt('zarinpal_sandbox', 0);
            $merchant = aio_opt('zarinpal_merchant', '') ?: ($sandbox ? '00000000-0000-0000-0000-000000000000' : '');
            $host = $sandbox ? 'https://sandbox.zarinpal.com' : 'https://payment.zarinpal.com';
            $res = wp_remote_post($host . '/pg/v4/payment/verify.json', ['timeout' => 25, 'headers' => ['Content-Type' => 'application/json', 'Accept' => 'application/json'],
                'body' => wp_json_encode(['merchant_id' => $merchant, 'amount' => $rial, 'authority' => $auth])]);
            $b = is_wp_error($res) ? [] : json_decode(wp_remote_retrieve_body($res), true);
            $code = $b['data']['code'] ?? 0;
            if (in_array($code, [100, 101], true)) { $ok = true; $ref = (string) ($b['data']['ref_id'] ?? ''); }
            else $msg = 'تأیید تراکنش ناموفق بود (کد ' . ($b['errors']['code'] ?? $code) . ').';
        }
    } elseif ($gw === 'zibal') {
        $track = sanitize_text_field(wp_unslash($_GET['trackId'] ?? ''));
        if (($_GET['success'] ?? '') === '1' && $track && $track === aio_meta($oid, 'authority')) {
            $merchant = aio_opt('zibal_merchant', '') ?: (aio_opt('zibal_sandbox') ? 'zibal' : '');
            $res = wp_remote_post('https://gateway.zibal.ir/v1/verify', ['timeout' => 25, 'headers' => ['Content-Type' => 'application/json'],
                'body' => wp_json_encode(['merchant' => $merchant, 'trackId' => $track])]);
            $b = is_wp_error($res) ? [] : json_decode(wp_remote_retrieve_body($res), true);
            if (in_array((int) ($b['result'] ?? 0), [100, 201], true) && (int) ($b['amount'] ?? $rial) === $rial) { $ok = true; $ref = (string) ($b['refNumber'] ?? $track); }
            else $msg = 'تأیید تراکنش ناموفق بود: ' . ($b['message'] ?? '');
        }
    }
    if ($ok) {
        aio_set_meta($oid, 'ref_id', $ref);
        aio_order_set_status($oid, 'paid', 'پرداخت موفق — کد پیگیری ' . $ref);
        wp_safe_redirect(add_query_arg('paid', 1, $back));
    } else {
        aio_order_log($oid, $msg);
        wp_safe_redirect(add_query_arg('fail', rawurlencode($msg), $back));
    }
    exit;
});
