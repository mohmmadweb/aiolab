<?php
/* سئو: عنوان، توضیحات، OG، robots، داده‌ی ساخت‌یافته (سازمان، آگهی شغلی، دوره، بردکرامب) */
defined('ABSPATH') || exit;

const AIO_PARENTS = [
    'jobs' => 'home', 'tpl-job' => 'jobs', 'labs' => 'home', 'tpl-lab' => 'labs', 'companies' => 'home', 'products' => 'companies', 'tpl-product' => 'products', 'talent' => 'employer', 'ranking' => 'labs', 'exams' => 'home', 'tpl-exam' => 'exams',
    'assessment' => 'home', 'mbti' => 'assessment', 'courses' => 'home', 'tpl-course' => 'courses', 'tpl-learn' => 'tpl-course', 'tpl-path' => 'courses',
    'course-builder' => 'courses', 'magazine' => 'home', 'article' => 'magazine', 'community' => 'home', 'faq' => 'home', 'services' => 'home',
    'pricing' => 'services', 'reports' => 'services', 'advertise' => 'services', 'about' => 'home', 'contact' => 'home', 'dashboard' => 'home',
    'employer' => 'home', 'login' => 'home', 'register' => 'home', 'checkout' => 'services', 'verify' => 'exams',
];
const AIO_NOINDEX = ['dashboard', 'employer', 'talent', 'login', 'register', 'checkout', 'course-builder', 'tpl-learn', '404'];

function aio_entity(): ?WP_Post
{
    if ($id = (int) get_query_var('aio_learn')) return get_post($id);
    return is_singular(['aio_job', 'aio_lab', 'aio_course', 'aio_exam', 'aio_path', 'aio_product', 'post']) ? get_queried_object() : null;
}

function aio_seo_desc(): string
{
    $e = aio_entity();
    if ($e) {
        $d = $e->post_type === 'aio_course' ? (string) aio_meta($e->ID, 'subtitle', '') : '';
        $d = $d ?: wp_strip_all_tags($e->post_excerpt ?: $e->post_content);
        if ($e->post_type === 'aio_job') {
            $lab = get_the_title((int) aio_meta($e->ID, 'lab_id', 0));
            $d = $e->post_title . ' — ' . $lab . ' · ' . aio_meta($e->ID, 'city', '') . ' · ' . aio_meta($e->ID, 'salary', '') . '. ' . $d;
        }
        return wp_trim_words($d, 32, '…');
    }
    if (is_page() && ($d = get_post_meta(get_queried_object_id(), '_aio_seo_desc', true))) return (string) $d;
    return (string) aio_opt('seo_description', get_bloginfo('description'));
}

add_filter('pre_get_document_title', function ($t) {
    $site = get_bloginfo('name');
    if (is_front_page() && ($s = get_post_meta((int) get_option('page_on_front'), '_aio_seo_title', true))) return $s;
    if ($id = (int) get_query_var('aio_learn')) return get_the_title($id) . ' | محیط یادگیری | ' . $site;
    if (get_query_var('aio_verify')) return 'استعلام گواهی | ' . $site;
    if (is_page() && ($s = get_post_meta(get_queried_object_id(), '_aio_seo_title', true))) return $s;
    if (is_singular()) return single_post_title('', false) . ' | ' . $site;
    if (is_404()) return 'صفحه پیدا نشد | ' . $site;
    return $t;
});

add_filter('wp_robots', function ($r) {
    if (in_array(aio_current_role(), AIO_NOINDEX, true)) { $r['noindex'] = true; $r['follow'] = true; }
    return $r;
});

function aio_crumbs(): array
{
    $role = aio_current_role();
    $chain = [];
    $e = aio_entity();
    if ($e && $role !== 'tpl-learn') $chain[] = [$e->post_title, get_permalink($e)];
    elseif ($role === 'tpl-learn' && $e) { $chain[] = ['محیط یادگیری', aio_single_url('learn', $e->ID)]; $chain[] = [$e->post_title, get_permalink($e)]; $role = 'tpl-course'; }
    elseif (is_page()) $chain[] = [get_the_title(), get_permalink()];
    $guard = 0;
    while (isset(AIO_PARENTS[$role]) && $guard++ < 6) {
        $role = AIO_PARENTS[$role];
        $pid = aio_page_id($role);
        $chain[] = [$role === 'home' ? 'خانه' : ($pid ? get_the_title($pid) : $role), $role === 'home' ? home_url('/') : aio_page_url($role)];
    }
    return array_reverse($chain);
}

add_action('wp_head', function () {
    $desc = aio_seo_desc();
    $title = wp_get_document_title();
    $url = is_singular() || is_front_page() ? (is_front_page() ? home_url('/') : get_permalink()) : home_url(add_query_arg([]));
    if ($id = (int) get_query_var('aio_learn')) $url = aio_single_url('learn', $id);
    $img = '';
    $e = aio_entity();
    if ($e && has_post_thumbnail($e)) $img = get_the_post_thumbnail_url($e, 'large');
    if (!$img && ($og = (int) aio_opt('og_image', 0))) $img = wp_get_attachment_image_url($og, 'large');
    echo '<meta name="description" content="' . esc_attr($desc) . "\">\n";
    echo '<meta name="theme-color" content="#0d9488">' . "\n";
    echo '<meta property="og:type" content="' . ($e ? 'article' : 'website') . '"><meta property="og:site_name" content="' . esc_attr(get_bloginfo('name')) . '"><meta property="og:locale" content="fa_IR">' . "\n";
    echo '<meta property="og:title" content="' . esc_attr($title) . '"><meta property="og:description" content="' . esc_attr($desc) . '"><meta property="og:url" content="' . esc_url($url) . '">' . "\n";
    if ($img) echo '<meta property="og:image" content="' . esc_url($img) . '"><meta name="twitter:card" content="summary_large_image">' . "\n";
    if ($g = aio_opt('google_verification', '')) echo '<meta name="google-site-verification" content="' . esc_attr($g) . '">' . "\n";
    if (!has_site_icon()) {
        echo '<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 48 48\'%3E%3Crect x=\'4\' y=\'4\' width=\'40\' height=\'40\' rx=\'12\' fill=\'%230d9488\'/%3E%3Cpath d=\'M20 12v8.5L13.5 32a4 4 0 0 0 3.5 6h14a4 4 0 0 0 3.5-6L28 20.5V12\' stroke=\'%23fff\' stroke-width=\'2.6\' stroke-linecap=\'round\' stroke-linejoin=\'round\' fill=\'none\'/%3E%3C/svg%3E">' . "\n";
    }
    if (($id = (int) get_query_var('aio_learn')) || get_query_var('aio_verify')) echo '<link rel="canonical" href="' . esc_url($url) . '">' . "\n";

    $ld = [];
    if (is_front_page()) {
        $ld[] = ['@context' => 'https://schema.org', '@type' => 'Organization', 'name' => get_bloginfo('name'), 'url' => home_url('/'),
            'email' => aio_opt('support_email', ''), 'description' => aio_opt('seo_description', '')];
        $ld[] = ['@context' => 'https://schema.org', '@type' => 'WebSite', 'name' => get_bloginfo('name'), 'url' => home_url('/'),
            'potentialAction' => ['@type' => 'SearchAction', 'target' => aio_page_url('jobs') . '?q={search_term_string}', 'query-input' => 'required name=search_term_string']];
    }
    if ($e && $e->post_type === 'aio_job' && $e->post_status === 'publish') {
        $lab = (int) aio_meta($e->ID, 'lab_id', 0);
        $job = ['@context' => 'https://schema.org', '@type' => 'JobPosting', 'title' => $e->post_title, 'description' => wpautop(esc_html(wp_strip_all_tags($e->post_content))),
            'datePosted' => get_post_time('c', true, $e), 'hiringOrganization' => ['@type' => 'Organization', 'name' => get_the_title($lab), 'sameAs' => get_permalink($lab)],
            'jobLocation' => ['@type' => 'Place', 'address' => ['@type' => 'PostalAddress', 'addressLocality' => aio_meta($e->ID, 'city', ''), 'addressRegion' => aio_province_name((string) aio_meta($e->ID, 'province', '')), 'addressCountry' => 'IR']],
            'employmentType' => ['تمام‌وقت' => 'FULL_TIME', 'پاره‌وقت' => 'PART_TIME', 'موقت' => 'TEMPORARY', 'قراردادی' => 'CONTRACTOR', 'کارآموزی' => 'INTERN'][aio_meta($e->ID, 'type', '')] ?? 'OTHER'];
        if ($exp = aio_meta($e->ID, 'expires', '')) $job['validThrough'] = $exp . 'T23:59:59+03:30';
        $min = (float) aio_meta($e->ID, 'salary_min', 0);
        $max = (float) aio_meta($e->ID, 'salary_max', 0);
        if ($min || $max) $job['baseSalary'] = ['@type' => 'MonetaryAmount', 'currency' => 'IRR', 'value' => ['@type' => 'QuantitativeValue', 'minValue' => $min * 10000000, 'maxValue' => ($max ?: $min) * 10000000, 'unitText' => 'MONTH']];
        if (aio_meta($e->ID, 'remote', 0)) $job['jobLocationType'] = 'TELECOMMUTE';
        $ld[] = $job;
    }
    if ($e && $e->post_type === 'aio_product' && $e->post_status === 'publish') {
        $pr = aio_product_item($e);
        $x = ['@context' => 'https://schema.org', '@type' => 'Product', 'name' => $pr['name'], 'description' => wp_trim_words($pr['desc'], 40, '…'),
            'brand' => $pr['brand'] ? ['@type' => 'Brand', 'name' => $pr['brand']] : null, 'model' => $pr['model'] ?: null, 'image' => $pr['img'] ?: null];
        if ($pr['price']) $x['offers'] = ['@type' => 'Offer', 'price' => $pr['price'] * 10, 'priceCurrency' => 'IRR', 'seller' => ['@type' => 'Organization', 'name' => get_the_title($pr['orgId'])]];
        $ld[] = array_filter($x, fn($v) => $v !== null);
    }
    if ($e && $e->post_type === 'aio_lab' && $e->post_status === 'publish') {
        $ex = aio_lab_extra($e->ID);
        $ld[] = array_filter(['@context' => 'https://schema.org', '@type' => $ex['orgType'] === 'company' ? 'Organization' : 'MedicalOrganization', 'name' => $e->post_title,
            'url' => get_permalink($e), 'telephone' => (string) aio_meta($e->ID, 'phone', '') ?: null, 'slogan' => $ex['tagline'] ?: null,
            'address' => ['@type' => 'PostalAddress', 'streetAddress' => (string) aio_meta($e->ID, 'address', ''), 'addressLocality' => (string) aio_meta($e->ID, 'city', ''), 'addressCountry' => 'IR'],
            'sameAs' => array_values(array_filter(array_merge([(string) aio_meta($e->ID, 'website', '')], (array) $ex['socials']))) ?: null]);
    }
    if ($e && $e->post_type === 'aio_course' && $e->post_status === 'publish' && !get_query_var('aio_learn')) {
        $prov = aio_post_by_slug('aio_provider', (string) aio_meta($e->ID, 'provider', ''));
        $ld[] = ['@context' => 'https://schema.org', '@type' => 'Course', 'name' => $e->post_title, 'description' => (string) aio_meta($e->ID, 'subtitle', ''),
            'provider' => ['@type' => 'Organization', 'name' => $prov ? get_the_title($prov) : get_bloginfo('name')], 'inLanguage' => 'fa'];
    }
    $crumbs = aio_crumbs();
    if (count($crumbs) > 1 && !in_array(aio_current_role(), AIO_NOINDEX, true)) {
        $ld[] = ['@context' => 'https://schema.org', '@type' => 'BreadcrumbList', 'itemListElement' => array_map(fn($c, $i) => ['@type' => 'ListItem', 'position' => $i + 1, 'name' => $c[0], 'item' => $c[1]], $crumbs, array_keys($crumbs))];
    }
    foreach ($ld as $x) echo '<script type="application/ld+json">' . aio_json($x) . "</script>\n";
}, 2);

/* برگه‌های noindex و قالب در نقشه‌ی سایت وردپرس (wp-sitemap.xml) نیایند */
add_filter('wp_sitemaps_posts_query_args', function ($args, $post_type) {
    if ($post_type !== 'page') return $args;
    $exclude = get_posts(['post_type' => 'page', 'post_status' => 'any', 'numberposts' => -1, 'fields' => 'ids', 'meta_query' => [['key' => '_aio_page', 'value' => AIO_NOINDEX, 'compare' => 'IN']]]);
    $exclude = array_merge($exclude, get_posts(['post_type' => 'page', 'post_status' => 'any', 'numberposts' => -1, 'fields' => 'ids', 'meta_query' => [['key' => '_aio_page', 'value' => 'tpl-', 'compare' => 'LIKE']]]));
    $args['post__not_in'] = array_merge($args['post__not_in'] ?? [], $exclude, [(int) aio_page_id('checkout'), (int) aio_page_id('verify')]);
    return $args;
}, 10, 2);
add_filter('wp_sitemaps_taxonomies', fn($t) => array_diff_key($t, array_flip(['aio_dept', 'aio_course_cat', 'aio_service_group', 'aio_faq_cat', 'aio_product_cat', 'aio_skill', 'aio_role', 'aio_university', 'aio_license', 'post_tag'])));
add_filter('wp_sitemaps_add_provider', fn($p, $name) => $name === 'users' ? false : $p, 10, 2);
