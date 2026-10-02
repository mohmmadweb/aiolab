<?php
/* ساخت سمت سرور هدر و فوتر (همان خروجی renderHeader/renderFooter دمو) از منوها و «تنظیمات آیولب» */
defined('ABSPATH') || exit;

function aio_logo_html(): string
{
    $logo = (int) aio_opt('logo', 0);
    $mark = $logo ? wp_get_attachment_image($logo, 'medium', false, ['class' => 'logo-mark logo-img', 'alt' => get_bloginfo('name')]) : AIO_LOGO_SVG;
    return '<a href="' . esc_url(home_url('/')) . '" class="logo">' . $mark . '<span>' . esc_html(aio_opt('logo_text_1', 'آیو')) . '<b>' . esc_html(aio_opt('logo_text_2', 'لب')) . '</b></span></a>';
}

/** آیتم‌های منو به صورت درختی */
function aio_menu_tree(string $location): array
{
    $locs = get_nav_menu_locations();
    if (empty($locs[$location])) return [];
    $items = wp_get_nav_menu_items($locs[$location]) ?: [];
    $tree = [];
    $by = [];
    foreach ($items as $it) {
        $icon = '';
        foreach ((array) $it->classes as $c) if (str_starts_with($c, 'icon-')) $icon = substr($c, 5);
        $by[$it->ID] = ['title' => $it->title, 'url' => $it->url, 'desc' => $it->description, 'icon' => $icon, 'parent' => (int) $it->menu_item_parent, 'children' => [], 'target' => $it->target];
    }
    foreach ($by as $id => &$node) {
        if ($node['parent'] && isset($by[$node['parent']])) $by[$node['parent']]['children'][] = &$node;
    }
    unset($node);
    foreach ($by as $id => $node) if (!$node['parent']) $tree[] = $node;
    return $tree;
}

function aio_menu_name(string $location, string $fallback = ''): string
{
    $locs = get_nav_menu_locations();
    $m = !empty($locs[$location]) ? wp_get_nav_menu_object($locs[$location]) : null;
    return $m ? $m->name : $fallback;
}

/** آیا لینک به برگه‌ی فعلی اشاره می‌کند؟ */
function aio_is_current_url(string $url): bool
{
    $path = trim((string) wp_parse_url($url, PHP_URL_PATH), '/');
    $active = aio_active_role();
    $cur = $active === 'home' ? '' : trim((string) wp_parse_url(aio_page_url($active), PHP_URL_PATH), '/');
    return $path === $cur && !str_contains($url, '#');
}

function aio_dash_url(string $role): string
{
    return $role === 'employer' || $role === 'admin' ? aio_page_url('employer') : ($role === 'supplier' ? aio_page_url('advertise') : aio_page_url('dashboard'));
}

function aio_render_header(): void
{
    $u = wp_get_current_user();
    $logged = $u && $u->ID;
    $role = $logged ? aio_user_role($u) : '';
    $nav = '';
    foreach (aio_menu_tree('primary') as $i => $item) {
        if (!$item['children']) {
            $nav .= '<a href="' . esc_url($item['url']) . '" class="nav-link ' . (aio_is_current_url($item['url']) ? 'active' : '') . '">' . esc_html($item['title']) . '</a>';
            continue;
        }
        $on = false;
        $sub = '';
        foreach ($item['children'] as $c) {
            $is = aio_is_current_url($c['url']);
            $on = $on || $is;
            $sub .= '<a href="' . esc_url($c['url']) . '" class="' . ($is ? 'on' : '') . '"><span class="nm-ic">' . aio_icon($c['icon'] ?: 'flask') . '</span>'
                . '<span class="nm-txt"><b>' . esc_html($c['title']) . '</b>' . ($c['desc'] ? '<small>' . esc_html($c['desc']) . '</small>' : '') . '</span></a>';
        }
        $nav .= '<div class="nav-group ' . ($on ? 'active' : '') . '"><button class="nav-link" onclick="toggleNavGroup(event,' . (int) $i . ')" aria-expanded="false"><span>' . esc_html($item['title']) . '</span>'
            . '<svg class="ng-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg></button>'
            . '<div class="nav-menu">' . $sub . '</div></div>';
    }

    $notices = $logged ? array_slice((array) aio_umeta($u->ID, 'notices', []), 0, 6) : [];
    $unread = $logged ? count(array_filter((array) aio_umeta($u->ID, 'notices', []), fn($n) => !empty($n['unread']))) : 0;
    $all_link = $role === 'employer' ? aio_page_url('employer', '#applicants') : aio_page_url('dashboard', '#notifications');
    $msg = '<div class="msg-wrap"><button class="icon-btn" title="پیام‌ها" onclick="toggleMsgs(event)">' . aio_icon('comment')
        . ($unread ? '<span class="badge-count">' . esc_html(aio_fa($unread)) . '</span>' : '') . '</button>'
        . '<div class="msg-menu" id="msg-menu"><div class="msg-head">پیام‌ها <a href="' . esc_url($all_link) . '">مشاهده همه</a></div>';
    foreach ($notices as $n) {
        $msg .= '<div class="msg-item ' . (!empty($n['unread']) ? 'unread' : '') . '"' . (!empty($n['link']) ? ' onclick="location.href=' . esc_attr(wp_json_encode($n['link'])) . '" style="cursor:pointer"' : '') . '><b>' . esc_html($n['from'] ?? '') . '</b><p>' . esc_html($n['text'] ?? '') . '</p><span>' . esc_html($n['time'] ?? '') . '</span></div>';
    }
    if ($logged && !$notices) $msg .= '<div class="msg-item"><p>پیامی ندارید.</p></div>';
    $msg .= '</div></div>';

    $dash = aio_dash_url($role);
    $dash_label = in_array($role, ['employer', 'admin'], true) ? 'پنل کارفرما' : ($role === 'supplier' ? 'پنل تأمین‌کننده' : 'داشبورد من');
    if ($logged) {
        $name = $u->display_name;
        $actions = $msg . '<div class="user-chip"><button onclick="this.nextElementSibling.classList.toggle(\'open\')"><span class="avatar">' . esc_html(mb_substr($name, 0, 1)) . '</span>' . esc_html($name) . '</button>'
            . '<div class="user-menu"><a href="' . esc_url($dash) . '">' . esc_html($dash_label) . '</a>'
            . '<a href="' . esc_url($role === 'employer' ? aio_page_url('employer', '#applicants') : ($role === 'supplier' ? aio_page_url('advertise') : aio_page_url('dashboard', '#notifications'))) . '">' . ($role === 'employer' ? 'متقاضیان جدید' : 'اعلان‌ها') . '</a>'
            . (current_user_can('edit_posts') ? '<a href="' . esc_url(admin_url()) . '">پیشخوان مدیریت</a>' : '')
            . '<button class="danger" onclick="Auth.logout()">خروج از حساب</button></div></div>';
        $mobile = '<div class="nav-cta"><a href="' . esc_url($dash) . '" class="btn btn-primary btn-block">' . esc_html($dash_label) . '</a></div>';
    } else {
        $actions = '<a href="' . esc_url(aio_page_url('login')) . '" class="btn btn-ghost hdr-login">ورود کارجو</a>'
            . '<a href="' . esc_url(aio_page_url('login', '?role=employer')) . '" class="btn btn-primary hdr-emp">ثبت آگهی استخدام</a>' . $msg;
        $mobile = '<div class="nav-cta"><a href="' . esc_url(aio_page_url('login')) . '" class="btn btn-outline btn-block">ورود / ثبت‌نام کارجو</a>'
            . '<a href="' . esc_url(aio_page_url('login', '?role=employer')) . '" class="btn btn-primary btn-block">ورود آزمایشگاه | ثبت آگهی</a></div>';
    }

    $verticals = '';
    if (aio_opt('show_verticals', 1)) {
        $v = aio_list('verticals', []);
        if ($v) {
            $verticals = '<div class="vertical-bar"><div class="container"><span class="vb-label">خانواده آیو</span>';
            foreach ($v as $x) {
                $active = !empty($x['active']);
                $href = $active ? (($x['url'] ?? '') ?: home_url('/')) : aio_page_url('about', '#verticals');
                $verticals .= '<a class="vb-item ' . ($active ? 'active' : 'soon') . '" href="' . esc_url($href) . '" title="' . esc_attr(($x['slug'] ?? '') . ($active ? '' : ' — به‌زودی')) . '"'
                    . ($active ? '' : ' onclick="toast(\'این بخش به‌زودی راه‌اندازی می‌شود\');return false"') . ' style="--vc:' . esc_attr(aio_hex($x['color'] ?? '')) . '">' . esc_html($x['name'] ?? '') . '</a>';
            }
            $verticals .= '</div></div>';
        }
    }

    echo '<header id="site-header" class="site-header">' . $verticals // phpcs:ignore
        . '<div class="container header-inner">' . aio_logo_html()
        . '<nav class="main-nav" id="main-nav">' . $nav . $mobile . '</nav>'
        . '<div class="header-actions">' . $actions . '<button class="menu-toggle" aria-label="منو" onclick="document.getElementById(\'main-nav\').classList.toggle(\'open\')">' . aio_icon('menu') . '</button></div>'
        . '</div></header>';
}

function aio_render_footer(): void
{
    $cols = '';
    foreach (['footer_1' => 'کارجویان', 'footer_2' => 'کارفرمایان', 'footer_3' => 'آیولب'] as $loc => $fb) {
        $items = aio_menu_tree($loc);
        if (!$items) continue;
        $cols .= '<div><h4>' . esc_html(aio_menu_name($loc, $fb)) . '</h4><ul>';
        foreach ($items as $it) $cols .= '<li><a href="' . esc_url($it['url']) . '">' . esc_html($it['title']) . '</a></li>';
        $cols .= '</ul></div>';
    }
    $note = esc_js((string) aio_opt('app_note', 'لینک دانلود به‌زودی فعال می‌شود'));
    $app = function ($url, $ic, $title, $sub) use ($note) {
        return $url ? '<a href="' . esc_url($url) . '" class="app-badge" target="_blank" rel="noopener"><span>' . $ic . '</span><div><b>' . $title . '</b><small>' . $sub . '</small></div></a>'
            : '<a href="' . esc_url(aio_page_url('contact')) . '" onclick="toast(\'' . $note . '\');return false" class="app-badge"><span>' . $ic . '</span><div><b>' . $title . '</b><small>' . $sub . '</small></div></a>';
    };
    $enamad = (string) aio_opt('enamad_html', '');
    $saman = (string) aio_opt('samandehi_html', '');
    $trust = ($enamad ? '<div class="trust-code">' . $enamad . '</div>' : '<a href="' . esc_url(aio_page_url('about')) . '" class="enamad" onclick="toast(\'نماد اعتماد پس از تکمیل فرآیند ثبت، اینجا فعال می‌شود\');return false" title="نماد اعتماد الکترونیکی"><span class="en-mark">e</span><div><b>نماد اعتماد الکترونیکی</b><small>e-namad · در حال دریافت</small></div></a>')
        . ($saman ? '<div class="trust-code">' . $saman . '</div>' : '<a href="' . esc_url(aio_page_url('about')) . '" class="enamad samandehi" onclick="toast(\'مجوز ساماندهی در حال دریافت است\');return false" title="ساماندهی"><span class="en-mark">✓</span><div><b>ساماندهی رسانه‌های دیجیتال</b><small>در حال دریافت</small></div></a>');
    $social = '';
    foreach (['instagram' => 'اینستاگرام', 'telegram' => 'تلگرام', 'linkedin' => 'لینکدین', 'eitaa' => 'ایتا', 'bale' => 'بله', 'aparat' => 'آپارات'] as $k => $l) {
        if ($u = aio_opt($k, '')) $social .= '<a href="' . esc_url($u) . '" target="_blank" rel="noopener">' . esc_html($l) . '</a>';
    }
    $contact = '';
    if ($e = aio_opt('support_email', '')) $contact .= '<a href="mailto:' . esc_attr($e) . '" dir="ltr">' . esc_html($e) . '</a>';
    if ($p = aio_opt('phone', '')) $contact .= '<a href="tel:' . esc_attr(preg_replace('/[^0-9+]/', '', aio_en_digits($p))) . '" dir="ltr">' . esc_html($p) . '</a>';

    echo '<footer id="site-footer" class="site-footer"><div class="container"><div class="footer-grid"><div>' . aio_logo_html() // phpcs:ignore
        . '<p>' . esc_html(aio_opt('footer_about', '')) . '</p>'
        . ($contact ? '<div class="footer-contact">' . $contact . '</div>' : '')
        . ($social ? '<div class="footer-social">' . $social . '</div>' : '') . '</div>'
        . $cols
        . (aio_opt('show_trust', 0) ? '<div class="footer-trust"><h4>اپلیکیشن و نمادها</h4><div class="app-badges">'
        . $app(aio_opt('app_android_url', ''), '📱', 'اپلیکیشن اندروید', 'دریافت از کافه‌بازار') . $app(aio_opt('app_ios_url', ''), '🍏', 'نسخه iOS', 'نصب مستقیم (PWA)')
        . '</div><div class="trust-badges">' . $trust . '</div></div>' : '') . '</div>'
        . '<div class="footer-bottom"><span>' . esc_html(aio_opt('copyright', '')) . '</span>' . (aio_opt('footer_note', '') ? '<span>' . esc_html(aio_opt('footer_note', '')) . '</span>' : '') . '</div>'
        . '</div></footer>';
}
