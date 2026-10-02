<?php
/* نقش‌های کاربری و محدودیت دسترسی به پیشخوان */
defined('ABSPATH') || exit;

function aio_register_roles(): void
{
    $roles = [
        'aio_seeker'    => 'کارجو',
        'aio_volunteer' => 'داوطلب',
        'aio_employer'  => 'کارفرما',
        'aio_supplier'  => 'تأمین‌کننده',
    ];
    foreach ($roles as $slug => $label) {
        if (!get_role($slug)) add_role($slug, $label, ['read' => true]);
    }
}

/* کاربران غیرمدیر به پیشخوان وردپرس راه ندارند؛ به پنل خودشان هدایت می‌شوند */
add_action('admin_init', function () {
    if (wp_doing_ajax() || !is_user_logged_in()) return;
    if (current_user_can('edit_posts')) return;
    $role = aio_user_role();
    $to = $role === 'employer' ? aio_page_url('employer') : ($role === 'supplier' ? aio_page_url('advertise') : aio_page_url('dashboard'));
    wp_safe_redirect($to);
    exit;
});

add_filter('show_admin_bar', function ($show) {
    return current_user_can('edit_posts') ? $show : false;
});

/* ثبت‌نام پیش‌فرض وردپرس بسته؛ ثبت‌نام فقط از فرم آیولب */
add_filter('option_users_can_register', '__return_zero');

/* بعد از ورود از wp-login.php، کاربران عادی به پنل خودشان بروند */
add_filter('login_redirect', function ($redirect_to, $requested, $user) {
    if (is_wp_error($user) || !$user) return $redirect_to;
    if (user_can($user, 'edit_posts')) return $redirect_to ?: admin_url();
    $role = aio_user_role($user);
    if ($requested && strpos($requested, 'wp-admin') === false) return $requested;
    return $role === 'employer' ? aio_page_url('employer') : ($role === 'supplier' ? aio_page_url('advertise') : aio_page_url('dashboard'));
}, 10, 3);

/* ستون نقش آیولب و تلفن در فهرست کاربران */
add_filter('manage_users_columns', function ($c) {
    $c['aio_phone'] = 'موبایل';
    $c['aio_reg'] = 'تاریخ عضویت';
    return $c;
});
add_filter('manage_users_custom_column', function ($v, $col, $uid) {
    if ($col === 'aio_phone') return esc_html(get_user_meta($uid, 'aio_phone', true));
    if ($col === 'aio_reg') {
        $u = get_userdata($uid);
        return $u ? esc_html(aio_jdate('Y/m/d', strtotime($u->user_registered . ' UTC'))) : '';
    }
    return $v;
}, 10, 3);
