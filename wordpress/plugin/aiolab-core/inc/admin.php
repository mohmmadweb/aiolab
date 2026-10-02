<?php
/* پیشخوان: ستون‌های فهرست، جعبه‌های اطلاعات سفارش/درخواست/گواهی/پیام، ویجت پیشخوان */
defined('ABSPATH') || exit;

add_filter('display_post_states', function ($states, $post) {
    if (get_post_meta($post->ID, '_aio_sample', true)) $states['aio_sample'] = 'نمونه';
    if ($post->post_type === 'page' && ($r = get_post_meta($post->ID, '_aio_page', true))) $states['aio_page'] = 'برگه‌ی سیستمی: ' . $r;
    return $states;
}, 10, 2);

function aio_user_link(int $uid): string
{
    $u = get_userdata($uid);
    if (!$u) return '—';
    return '<a href="' . esc_url(get_edit_user_link($uid)) . '">' . esc_html($u->display_name) . '</a><br><small>' . esc_html($u->user_email) . '</small>';
}

function aio_badge(string $text, string $color = '#0d9488'): string
{
    return '<span style="display:inline-block;padding:2px 8px;border-radius:10px;background:' . esc_attr($color) . '1a;color:' . esc_attr($color) . ';font-weight:600;font-size:12px">' . esc_html($text) . '</span>';
}

const AIO_STATUS_COLORS = ['pending' => '#d97706', 'paid' => '#0d9488', 'processing' => '#0369a1', 'done' => '#059669', 'cancelled' => '#64748b', 'failed' => '#dc2626',
    'sent' => '#0369a1', 'seen' => '#6366f1', 'review' => '#d97706', 'interview' => '#0d9488', 'accepted' => '#059669', 'rejected' => '#dc2626',
    'invited' => '#7c3aed', 'offer' => '#0f766e', 'withdrawn' => '#64748b'];

$aio_cols = [
    'aio_job' => ['lab' => 'مرکز', 'city' => 'شهر', 'apps' => 'درخواست‌ها', 'views' => 'بازدید', 'expires' => 'انقضا'],
    'aio_lab' => ['otype' => 'نوع', 'city' => 'شهر', 'rating' => 'امتیاز', 'verified' => 'تأیید', 'jobs' => 'آگهی فعال'],
    'aio_product' => ['lab' => 'سازمان', 'pcat' => 'دسته', 'price' => 'قیمت'],
    'aio_course' => ['price' => 'قیمت', 'students' => 'فراگیران', 'lessons' => 'درس‌ها'],
    'aio_exam' => ['qs' => 'سؤال', 'takers' => 'شرکت‌کننده', 'price' => 'هزینه'],
    'aio_service' => ['code' => 'کد', 'price' => 'قیمت', 'payer' => 'مخاطب'],
    'aio_order' => ['customer' => 'مشتری', 'amount' => 'مبلغ', 'ostatus' => 'وضعیت', 'gw' => 'روش پرداخت'],
    'aio_application' => ['applicant' => 'متقاضی', 'job' => 'آگهی', 'astatus' => 'وضعیت', 'match' => 'تطبیق'],
    'aio_cert' => ['owner' => 'دارنده', 'ctype' => 'نوع', 'score' => 'نمره', 'code' => 'کد رهگیری'],
    'aio_message' => ['from' => 'فرستنده', 'kind' => 'نوع', 'read' => 'وضعیت'],
    'aio_community' => ['cauthor' => 'نویسنده', 'likes' => 'پسند'],
];
foreach ($aio_cols as $pt => $defs) {
    add_filter("manage_{$pt}_posts_columns", function ($c) use ($defs) {
        $date = $c['date'] ?? null;
        unset($c['date'], $c['author']);
        $c = array_merge($c, $defs);
        if ($date) $c['date'] = $date;
        return $c;
    });
    add_action("manage_{$pt}_posts_custom_column", 'aio_admin_column', 10, 2);
}

function aio_admin_column($col, $id): void
{
    switch ($col) {
        case 'lab': $l = (int) aio_meta($id, 'lab_id', 0); $el = $l ? (string) get_edit_post_link($l) : ''; echo $l && get_post($l) ? ($el ? '<a href="' . esc_url($el) . '">' . esc_html(get_the_title($l)) . '</a>' : esc_html(get_the_title($l))) : '—'; break;
        case 'city': echo esc_html(aio_meta($id, 'city', '—')); break;
        case 'otype': echo esc_html(aio_lab_extra($id)['orgType'] === 'company' ? 'شرکت' : 'آزمایشگاه'); break;
        case 'pcat': $t = get_the_terms($id, 'aio_product_cat'); echo $t && !is_wp_error($t) ? esc_html($t[0]->name) : '—'; break;
        case 'apps': echo esc_html(aio_fa((new WP_Query(['post_type' => 'aio_application', 'meta_key' => '_aio_job_id', 'meta_value' => $id, 'fields' => 'ids', 'posts_per_page' => 1]))->found_posts)); break;
        case 'views': echo esc_html(aio_fa((int) aio_meta($id, 'views', 0))); break;
        case 'expires': $e = aio_meta($id, 'expires', ''); echo $e ? esc_html(aio_jdate('Y/m/d', strtotime($e))) : '—'; break;
        case 'rating': $r = aio_rating_of($id); echo esc_html(aio_fa($r['rating']) . ' (' . aio_fa($r['count']) . ')'); break;
        case 'verified': echo aio_meta($id, 'verified') ? '✔️' : '—'; break;
        case 'jobs': echo esc_html(aio_fa(count(get_posts(['post_type' => 'aio_job', 'post_status' => 'publish', 'meta_key' => '_aio_lab_id', 'meta_value' => $id, 'fields' => 'ids', 'numberposts' => -1])))); break;
        case 'price': echo esc_html(aio_price_text(aio_meta($id, 'price', in_array(get_post_type($id), ['aio_service', 'aio_product'], true) ? null : 0))); break;
        case 'students': echo esc_html(aio_fa((int) aio_meta($id, 'students_base', 0) + (int) aio_meta($id, 'enrolled', 0))) . ' <small>(واقعی: ' . esc_html(aio_fa((int) aio_meta($id, 'enrolled', 0))) . ')</small>'; break;
        case 'lessons': echo esc_html(aio_fa(count(aio_course_lessons($id)))); break;
        case 'qs': echo esc_html(aio_fa(count((array) aio_meta($id, 'questions', [])))); break;
        case 'takers': echo esc_html(aio_fa((int) aio_meta($id, 'takers', 0))) . ' واقعی'; break;
        case 'code': echo '<code>' . esc_html(aio_meta($id, 'code', '')) . '</code>'; break;
        case 'payer': foreach (aio_list('payers', []) as $p) if (($p['id'] ?? '') === aio_meta($id, 'payer')) echo esc_html($p['name']); break;
        case 'customer': case 'applicant': case 'owner': case 'cauthor': echo aio_user_link((int) get_post_field('post_author', $id)); break;
        case 'amount': echo esc_html(aio_price_text(aio_meta($id, 'amount', 0))); break;
        case 'ostatus': $s = aio_meta($id, 'status', 'pending'); echo aio_badge(AIO_ORDER_STATUSES[$s] ?? $s, AIO_STATUS_COLORS[$s] ?? '#64748b'); break;
        case 'gw': echo esc_html(['manual' => 'دستی', 'zarinpal' => 'زرین‌پال', 'zibal' => 'زیبال'][aio_meta($id, 'gateway', '')] ?? '—'); break;
        case 'job': $j = (int) aio_meta($id, 'job_id', 0); echo $j ? '<a href="' . esc_url(get_edit_post_link($j)) . '">' . esc_html(get_the_title($j)) . '</a>' : '—'; break;
        case 'astatus': $s = aio_meta($id, 'status', 'sent'); echo aio_badge(AIO_APP_STATUSES[$s] ?? $s, AIO_STATUS_COLORS[$s] ?? '#64748b'); break;
        case 'match': echo esc_html(aio_fa((int) aio_meta($id, 'match', 0))) . '٪'; break;
        case 'ctype': echo esc_html(['exam' => 'آزمون', 'course' => 'دوره', 'path' => 'مسیر'][aio_meta($id, 'type', '')] ?? '—'); break;
        case 'score': echo esc_html(aio_fa((int) aio_meta($id, 'score', 0))); break;
        case 'from': echo esc_html(aio_meta($id, 'name', '')) . '<br><small>' . esc_html(aio_meta($id, 'contact', '')) . '</small>'; break;
        case 'kind': echo esc_html(['contact' => 'تماس', 'advertise' => 'همکاری تبلیغاتی', 'consult' => 'مشاوره', 'lab' => 'پیام به مرکز', 'report' => 'گزارش'][aio_meta($id, 'kind', 'contact')] ?? '—'); break;
        case 'read': echo aio_meta($id, 'read') ? 'خوانده‌شده' : aio_badge('جدید', '#d97706'); break;
        case 'likes': echo esc_html(aio_fa((int) aio_meta($id, 'likes_base', 0) + (int) aio_meta($id, 'likes', 0))); break;
    }
}

add_action('restrict_manage_posts', function ($pt) {
    $map = ['aio_order' => AIO_ORDER_STATUSES, 'aio_application' => AIO_APP_STATUSES];
    if (!isset($map[$pt])) return;
    $cur = sanitize_key($_GET['aio_status'] ?? '');
    echo '<select name="aio_status"><option value="">همه‌ی وضعیت‌ها</option>';
    foreach ($map[$pt] as $k => $v) echo '<option value="' . esc_attr($k) . '" ' . selected($cur, $k, false) . '>' . esc_html($v) . '</option>';
    echo '</select>';
});
add_action('pre_get_posts', function ($q) {
    if (!is_admin() || !$q->is_main_query() || empty($_GET['aio_status'])) return;
    if (in_array($q->get('post_type'), ['aio_order', 'aio_application'], true)) {
        $q->set('meta_key', '_aio_status');
        $q->set('meta_value', sanitize_key($_GET['aio_status']));
    }
});

add_action('add_meta_boxes', function () {
    add_meta_box('aio_order_box', 'جزئیات سفارش', 'aio_order_box', 'aio_order', 'normal', 'high');
    add_meta_box('aio_app_box', 'جزئیات درخواست همکاری', 'aio_app_box', 'aio_application', 'normal', 'high');
    add_meta_box('aio_cert_box', 'جزئیات گواهی', 'aio_cert_box', 'aio_cert', 'normal', 'high');
    add_meta_box('aio_msg_box', 'مشخصات فرستنده', 'aio_msg_box', 'aio_message', 'normal', 'high');
    add_meta_box('aio_course_students', 'فراگیران ثبت‌نام‌شده', 'aio_course_students_box', 'aio_course', 'side', 'default');
});

function aio_row(string $k, string $v): string
{
    return '<tr><th style="text-align:right;width:160px;padding:6px 0">' . esc_html($k) . '</th><td>' . $v . '</td></tr>';
}

function aio_order_box(WP_Post $p): void
{
    wp_nonce_field('aio_admin_box', 'aio_admin_nonce');
    $st = aio_meta($p->ID, 'status', 'pending');
    echo '<table class="form-table">';
    echo aio_row('شماره سفارش', esc_html(aio_meta($p->ID, 'number', $p->ID)));
    echo aio_row('مشتری', aio_user_link((int) $p->post_author));
    $phone = get_user_meta((int) $p->post_author, 'aio_phone', true);
    if ($phone) echo aio_row('موبایل', '<span dir="ltr">' . esc_html($phone) . '</span>');
    foreach ((array) aio_meta($p->ID, 'items', []) as $it) {
        echo aio_row('قلم', esc_html(($it['code'] ?? '') . ' — ' . ($it['title'] ?? '') . ' (' . ($it['unit'] ?? '') . ')'));
    }
    echo aio_row('مبلغ', esc_html(aio_price_text(aio_meta($p->ID, 'amount', 0), 'رایگان')));
    echo aio_row('روش پرداخت', esc_html(aio_meta($p->ID, 'gateway', '—')));
    if ($ref = aio_meta($p->ID, 'ref_id')) echo aio_row('کد پیگیری بانک', esc_html($ref));
    echo '<tr><th style="text-align:right">وضعیت</th><td><select name="aio_order_status">';
    foreach (AIO_ORDER_STATUSES as $k => $v) echo '<option value="' . esc_attr($k) . '" ' . selected($st, $k, false) . '>' . esc_html($v) . '</option>';
    echo '</select><p class="description">تغییر از «در انتظار پرداخت» به «پرداخت‌شده»، خدمت را خودکار برای کاربر فعال می‌کند (ثبت‌نام دوره، اعتبار آگهی، اشتراک).</p></td></tr>';
    echo '<tr><th style="text-align:right">یادداشت مدیر</th><td><textarea name="aio_admin_note" rows="3" style="width:100%">' . esc_textarea(aio_meta($p->ID, 'admin_note', '')) . '</textarea></td></tr>';
    echo '</table><h4>تاریخچه</h4><ul>';
    foreach (array_reverse((array) aio_meta($p->ID, 'log', [])) as $l) echo '<li>' . esc_html(aio_jdate('Y/m/d H:i', $l['t']) . ' — ' . $l['m']) . '</li>';
    echo '</ul>';
}

function aio_app_box(WP_Post $p): void
{
    wp_nonce_field('aio_admin_box', 'aio_admin_nonce');
    $uid = (int) $p->post_author;
    $r = aio_resume_public($uid, true);
    $st = aio_meta($p->ID, 'status', 'sent');
    $job = (int) aio_meta($p->ID, 'job_id', 0);
    echo '<table class="form-table">';
    echo aio_row('متقاضی', aio_user_link($uid) . (!empty($r['phone']) ? ' · <span dir="ltr">' . esc_html($r['phone']) . '</span>' : ''));
    echo aio_row('آگهی', $job ? '<a href="' . esc_url(get_permalink($job)) . '" target="_blank">' . esc_html(get_the_title($job)) . '</a>' : '—');
    echo aio_row('عنوان شغلی', esc_html($r['title'] ?? ''));
    echo aio_row('شهر / سابقه / مدرک', esc_html(implode(' · ', array_filter([$r['city'] ?? '', $r['experience'] ?? '', $r['degree'] ?? '']))));
    echo aio_row('مهارت‌ها', esc_html(implode('، ', $r['skills'] ?? [])));
    $cv = aio_cv($uid);
    if ($cv) {
        $mp = aio_match_profile($cv);
        echo aio_row('رزومه‌ی ساخت‌یافته', esc_html('سن ' . ($mp['age'] !== null ? aio_fa((string) $mp['age']) : '—') . ' · سابقه‌ی محاسبه‌شده ' . aio_fa((string) intdiv($mp['expMonths'], 12)) . ' سال و ' . aio_fa((string) ($mp['expMonths'] % 12)) . ' ماه · ' . aio_fa((string) count($cv['skills'] ?? [])) . ' مهارت'));
    }
    echo aio_row('گواهی‌ها', esc_html(implode('، ', $r['certs'] ?? []) ?: '—'));
    if (!empty($r['file'])) echo aio_row('فایل رزومه', '<a href="' . esc_url($r['file']) . '" target="_blank">دانلود</a>');
    echo aio_row('درصد تطبیق', esc_html(aio_fa((int) aio_meta($p->ID, 'match', 0)) . '٪'));
    echo aio_row('یادداشت متقاضی', nl2br(esc_html(aio_meta($p->ID, 'note', '—'))));
    echo '<tr><th style="text-align:right">وضعیت</th><td><select name="aio_app_status">';
    foreach (AIO_APP_STATUSES as $k => $v) echo '<option value="' . esc_attr($k) . '" ' . selected($st, $k, false) . '>' . esc_html($v) . '</option>';
    echo '</select><p class="description">با تغییر وضعیت، به متقاضی اعلان (و برای وضعیت‌های مهم ایمیل) ارسال می‌شود.</p></td></tr></table>';
}

function aio_cert_box(WP_Post $p): void
{
    $c = aio_cert_item($p);
    echo '<table class="form-table">';
    echo aio_row('دارنده', aio_user_link((int) $p->post_author));
    echo aio_row('نوع', esc_html(['exam' => 'آزمون مهارت', 'course' => 'پایان دوره', 'path' => 'مسیر یادگیری'][$c['type']] ?? $c['type']));
    echo aio_row('نمره', esc_html(aio_fa($c['score'])));
    echo aio_row('کد رهگیری', '<code>' . esc_html($c['code']) . '</code> — <a href="' . esc_url($c['verify']) . '" target="_blank">صفحه‌ی استعلام</a>');
    echo '</table>';
}

function aio_msg_box(WP_Post $p): void
{
    if (!aio_meta($p->ID, 'read')) aio_set_meta($p->ID, 'read', 1);
    echo '<table class="form-table">';
    foreach (['name' => 'نام', 'contact' => 'راه ارتباطی', 'role' => 'نقش', 'topic' => 'موضوع'] as $k => $l) echo aio_row($l, esc_html(aio_meta($p->ID, $k, '—')));
    if ($lab = (int) aio_meta($p->ID, 'lab_id', 0)) echo aio_row('مرکز', esc_html(get_the_title($lab)));
    if ($u = (int) aio_meta($p->ID, 'user_id', 0)) echo aio_row('کاربر', aio_user_link($u));
    echo aio_row('زمان', esc_html(aio_jdate('Y/m/d H:i', get_post_time('U', true, $p))));
    echo '</table><p>متن پیام در ویرایشگر بالا نمایش داده شده است.</p>';
}

function aio_course_students_box(WP_Post $p): void
{
    $users = get_users(['meta_key' => '_aio_enr_' . $p->ID, 'meta_compare' => 'EXISTS', 'number' => 100]);
    if (!$users) { echo '<p>هنوز کسی ثبت‌نام نکرده است.</p>'; return; }
    $total = count(aio_course_lessons($p->ID));
    echo '<ul>';
    foreach ($users as $u) {
        $e = aio_course_enrollment($u->ID, $p->ID);
        $pct = $total ? (int) round(count((array) ($e['done'] ?? [])) / $total * 100) : 0;
        echo '<li><a href="' . esc_url(get_edit_user_link($u->ID)) . '">' . esc_html($u->display_name) . '</a> — ' . esc_html(aio_fa($pct)) . '٪</li>';
    }
    echo '</ul>';
}

add_action('save_post', function ($id, $post) {
    if (!isset($_POST['aio_admin_nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['aio_admin_nonce'])), 'aio_admin_box')) return;
    if (!current_user_can('edit_post', $id)) return;
    if ($post->post_type === 'aio_order' && isset($_POST['aio_order_status'])) {
        $new = sanitize_key($_POST['aio_order_status']);
        if (isset(AIO_ORDER_STATUSES[$new]) && $new !== aio_meta($id, 'status')) aio_order_set_status($id, $new, 'تغییر توسط مدیر');
        aio_set_meta($id, 'admin_note', sanitize_textarea_field(wp_unslash($_POST['aio_admin_note'] ?? '')));
    }
    if ($post->post_type === 'aio_application' && isset($_POST['aio_app_status'])) {
        $new = sanitize_key($_POST['aio_app_status']);
        $old = aio_meta($id, 'status', 'sent');
        if (isset(AIO_APP_STATUSES[$new]) && $new !== $old) {
            aio_set_meta($id, 'status', $new);
            $job = get_the_title((int) aio_meta($id, 'job_id', 0));
            aio_notify((int) $post->post_author, 'وضعیت درخواست شما برای «' . $job . '»: ' . AIO_APP_STATUSES[$new], aio_page_url('dashboard', '#applications'), 'آیولب', in_array($new, ['interview', 'accepted', 'rejected'], true));
        }
    }
}, 20, 2);

function aio_pending_counts(): array
{
    $c = fn($pt) => (int) (wp_count_posts($pt)->pending ?? 0);
    $orders = (int) (new WP_Query(['post_type' => 'aio_order', 'meta_query' => [['key' => '_aio_status', 'value' => ['paid', 'processing'], 'compare' => 'IN']], 'fields' => 'ids', 'posts_per_page' => 1]))->found_posts;
    $msgs = (int) (new WP_Query(['post_type' => 'aio_message', 'meta_key' => '_aio_read', 'meta_value' => '0', 'fields' => 'ids', 'posts_per_page' => 1]))->found_posts;
    return [
        'aio_job' => ['آگهی در انتظار تأیید', $c('aio_job'), admin_url('edit.php?post_status=pending&post_type=aio_job')],
        'aio_lab' => ['مرکز در انتظار تأیید', $c('aio_lab'), admin_url('edit.php?post_status=pending&post_type=aio_lab')],
        'aio_course' => ['دوره در انتظار بازبینی', $c('aio_course'), admin_url('edit.php?post_status=pending&post_type=aio_course')],
        'aio_exam' => ['آزمون در انتظار بازبینی', $c('aio_exam'), admin_url('edit.php?post_status=pending&post_type=aio_exam')],
        'aio_community' => ['پست جامعه در انتظار', $c('aio_community'), admin_url('edit.php?post_status=pending&post_type=aio_community')],
        'reviews' => ['نظر در انتظار بررسی', (int) wp_count_comments()->moderated, admin_url('edit-comments.php?comment_status=moderated')],
        'orders' => ['سفارش نیازمند اقدام', $orders, admin_url('edit.php?post_type=aio_order&aio_status=paid')],
        'messages' => ['پیام خوانده‌نشده', $msgs, admin_url('edit.php?post_type=aio_message')],
    ];
}

add_action('wp_dashboard_setup', function () {
    wp_add_dashboard_widget('aio_overview', 'آیولب — کارهای در انتظار', function () {
        echo '<table class="widefat striped"><tbody>';
        foreach (aio_pending_counts() as [$label, $n, $url]) {
            echo '<tr><td>' . esc_html($label) . '</td><td style="width:60px;text-align:center"><a href="' . esc_url($url) . '"><b>' . esc_html(aio_fa($n)) . '</b></a></td></tr>';
        }
        echo '</tbody></table>';
        $users = count_users();
        echo '<p style="margin-top:12px">کاربران: ';
        foreach (['aio_seeker' => 'کارجو', 'aio_volunteer' => 'داوطلب', 'aio_employer' => 'کارفرما', 'aio_supplier' => 'تأمین‌کننده'] as $r => $l) {
            echo esc_html($l . ' ' . aio_fa($users['avail_roles'][$r] ?? 0)) . ' · ';
        }
        echo '</p><p><a class="button button-primary" href="' . esc_url(admin_url('admin.php?page=aio-settings')) . '">تنظیمات آیولب</a> <a class="button" href="' . esc_url(home_url('/')) . '" target="_blank">مشاهده سایت</a></p>';
    });
});

add_action('admin_menu', function () {
    global $menu;
    $counts = aio_pending_counts();
    $bubble = fn($n) => ' <span class="awaiting-mod"><span class="pending-count">' . (int) $n . '</span></span>';
    foreach ($menu as $i => $m) {
        $slug = $m[2] ?? '';
        foreach (['aio_job', 'aio_lab', 'aio_course', 'aio_exam', 'aio_community'] as $pt) {
            if ($slug === "edit.php?post_type=$pt" && $counts[$pt][1] > 0) $menu[$i][0] .= $bubble($counts[$pt][1]);
        }
        if ($slug === 'edit.php?post_type=aio_message' && $counts['messages'][1] > 0) $menu[$i][0] .= $bubble($counts['messages'][1]);
        if ($slug === 'edit.php?post_type=aio_service' && $counts['orders'][1] > 0) $menu[$i][0] .= $bubble($counts['orders'][1]);
    }
}, 999);

/* منوی «رزومه و تطبیق»: کاتالوگ‌ها + تنظیمات + مرکز تطبیق */
add_action('admin_menu', function () {
    add_menu_page('رزومه و تطبیق', 'رزومه و تطبیق', 'manage_categories', 'aio-talent', function () {
        $c = fn($tax) => (int) wp_count_terms(['taxonomy' => $tax, 'hide_empty' => false]);
        $cv = count(get_users(['meta_key' => 'aio_cv', 'meta_compare' => 'EXISTS', 'fields' => 'ID', 'number' => 5000]));
        $internal = (int) (wp_count_posts('aio_job')->aio_internal ?? 0);
        echo '<div class="wrap"><h1>رزومه و تطبیق</h1><p>همه‌ی فهرست‌هایی که کارجو و کارفرما از آن‌ها انتخاب می‌کنند (به‌جای متن آزاد) این‌جا مدیریت می‌شوند.</p><div class="aio-tools">';
        $card = fn($t, $d, $url, $btn) => '<div class="card"><h2>' . esc_html($t) . '</h2><p>' . esc_html($d) . '</p><a class="button button-primary" href="' . esc_url($url) . '">' . esc_html($btn) . '</a></div>';
        echo $card('مهارت‌ها و دستگاه‌ها', aio_fa($c('aio_skill')) . ' مورد — با گروه و بخش مرتبط', admin_url('edit-tags.php?taxonomy=aio_skill&post_type=aio_job'), 'مدیریت مهارت‌ها');
        echo $card('عنوان‌های شغلی استاندارد', aio_fa($c('aio_role')) . ' مورد', admin_url('edit-tags.php?taxonomy=aio_role&post_type=aio_job'), 'مدیریت عنوان‌ها');
        echo $card('دانشگاه‌ها و مؤسسه‌ها', aio_fa($c('aio_university')) . ' مورد', admin_url('edit-tags.php?taxonomy=aio_university&post_type=aio_job'), 'مدیریت دانشگاه‌ها');
        echo $card('مدارک و پروانه‌ها', aio_fa($c('aio_license')) . ' مورد', admin_url('edit-tags.php?taxonomy=aio_license&post_type=aio_job'), 'مدیریت مدارک');
        echo $card('فهرست‌های رزومه و سازمان', 'سطح مهارت، رده، مقطع، زبان، آمادگی، نوع سازمان، اعتباربخشی، خدمات', admin_url('admin.php?page=aio-settings&tab=talent'), 'ویرایش فهرست‌ها');
        echo $card('موتور تطبیق', 'وزن مهارت‌ها و آستانه‌های بالا/متوسط/نامرتبط', admin_url('admin.php?page=aio-settings&tab=match'), 'تنظیم وزن‌ها');
        echo $card('مرکز تطبیق', aio_fa($cv) . ' رزومه‌ی ساخت‌یافته · ' . aio_fa($internal) . ' پوزیشن داخلی', aio_page_url('talent'), 'باز کردن مرکز تطبیق');
        echo $card('پوزیشن داخلی جدید', 'پوزیشن برای مشتری بیرون از سایت؛ در سایت نمایش داده نمی‌شود', admin_url('post-new.php?post_type=aio_job'), 'افزودن پوزیشن');
        echo '</div></div>';
    }, 'dashicons-networking', 27);
    foreach (['aio_skill' => 'مهارت‌ها و دستگاه‌ها', 'aio_role' => 'عنوان‌های شغلی', 'aio_university' => 'دانشگاه‌ها', 'aio_license' => 'مدارک و پروانه‌ها'] as $tax => $label) {
        add_submenu_page('aio-talent', $label, $label, 'manage_categories', 'edit-tags.php?taxonomy=' . $tax . '&post_type=aio_job');
    }
});
/* هنگام ویرایش کاتالوگ‌ها منوی «رزومه و تطبیق» باز بماند */
add_filter('parent_file', function ($pf) {
    $s = get_current_screen();
    return ($s && in_array($s->taxonomy, ['aio_skill', 'aio_role', 'aio_university', 'aio_license'], true)) ? 'aio-talent' : $pf;
});
add_filter('submenu_file', function ($sf) {
    $s = get_current_screen();
    return ($s && in_array($s->taxonomy, ['aio_skill', 'aio_role', 'aio_university', 'aio_license'], true)) ? 'edit-tags.php?taxonomy=' . $s->taxonomy . '&post_type=aio_job' : $sf;
});

add_action('admin_notices', function () {
    $s = get_current_screen();
    if (!$s || $s->base !== 'post' || $s->post_type !== 'page') return;
    $id = (int) ($_GET['post'] ?? 0);
    if (!$id || !get_post_meta($id, '_aio_page', true)) return;
    echo '<div class="notice notice-info"><p><b>راهنما:</b> هر بخش این برگه یک بلوک «HTML سفارشی» است؛ متن‌ها را مستقیم ویرایش کنید. عنصرهایی که <code>id</code> دارند (مثلاً <code>id="featured-jobs"</code>) جای داده‌های زنده‌اند؛ آن‌ها را حذف نکنید. داده‌ها (آگهی، مرکز، دوره، خدمت…) از منوهای خودشان در پیشخوان ویرایش می‌شوند.</p></div>';
});

add_action('edit_user_profile', 'aio_user_profile_box');
add_action('show_user_profile', 'aio_user_profile_box');
function aio_user_profile_box(WP_User $u): void
{
    $r = aio_resume_public($u->ID, true);
    echo '<h2>اطلاعات آیولب</h2><table class="form-table">';
    echo aio_row('نقش', esc_html(aio_role_label(aio_user_role($u))));
    echo aio_row('موبایل', '<span dir="ltr">' . esc_html((string) get_user_meta($u->ID, 'aio_phone', true)) . '</span>');
    echo aio_row('عنوان شغلی', esc_html($r['title'] ?? ''));
    echo aio_row('آماده به کار', !empty($r['otw']) ? 'بله' : 'خیر');
    echo aio_row('مهارت‌ها', esc_html(implode('، ', $r['skills'] ?? [])));
    $cv = aio_cv($u->ID);
    if ($cv) {
        $p = aio_match_profile($cv);
        echo aio_row('رزومه‌ی ساخت‌یافته', esc_html('سن ' . ($p['age'] !== null ? aio_fa((string) $p['age']) : '—') . ' · سابقه‌ی محاسبه‌شده ' . aio_fa((string) intdiv($p['expMonths'], 12)) . ' سال و ' . aio_fa((string) ($p['expMonths'] % 12)) . ' ماه · ' . aio_fa((string) count($cv['experience'] ?? [])) . ' سابقه · ' . aio_fa((string) count($cv['skills'] ?? [])) . ' مهارت · تکمیل ' . aio_fa((string) aio_cv_completeness($cv, $u->display_name)) . '٪'));
        echo aio_row('مشاهده در مرکز تطبیق', '<a href="' . esc_url(add_query_arg(['tab' => 'bycand', 'cand' => $u->ID], aio_page_url('talent'))) . '" target="_blank">پوزیشن‌های مناسب این فرد</a>');
    }
    echo aio_row('گواهی‌ها', esc_html(implode('، ', $r['certs'] ?? []) ?: '—'));
    $c = aio_credits($u->ID);
    echo aio_row('اعتبار آگهی', esc_html('عادی ' . aio_fa($c['job']) . ' · ویژه ' . aio_fa($c['featured']) . ' · فوری ' . aio_fa($c['urgent'])));
    $courses = (array) aio_umeta($u->ID, 'courses', []);
    echo aio_row('دوره‌ها', esc_html(implode('، ', array_map('get_the_title', array_keys($courses))) ?: '—'));
    echo '</table>';
}
