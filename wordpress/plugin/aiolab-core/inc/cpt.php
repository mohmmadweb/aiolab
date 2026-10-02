<?php
/* انواع نوشته، طبقه‌بندی‌ها و مسیرها */
defined('ABSPATH') || exit;

function aio_cpt_labels(string $one, string $many): array
{
    return [
        'name' => $many, 'singular_name' => $one, 'menu_name' => $many, 'all_items' => $many,
        'add_new' => 'افزودن', 'add_new_item' => "افزودن $one", 'edit_item' => "ویرایش $one",
        'new_item' => "$one جدید", 'view_item' => "مشاهده $one", 'search_items' => "جستجوی $many",
        'not_found' => "$one پیدا نشد", 'not_found_in_trash' => "$one در زباله‌دان نیست",
        'featured_image' => 'تصویر / لوگو', 'set_featured_image' => 'انتخاب تصویر',
        'remove_featured_image' => 'حذف تصویر', 'use_featured_image' => 'استفاده به‌عنوان تصویر',
    ];
}

function aio_register_types(): void
{
    $public_single = ['public' => true, 'show_ui' => true, 'show_in_rest' => true, 'has_archive' => false, 'rewrite' => false, 'query_var' => true, 'map_meta_cap' => true, 'capability_type' => 'post'];
    $private = ['public' => false, 'show_ui' => true, 'show_in_rest' => false, 'has_archive' => false, 'rewrite' => false, 'query_var' => false, 'exclude_from_search' => true, 'publicly_queryable' => false, 'map_meta_cap' => true, 'capability_type' => 'post'];
    $data_only = ['public' => false, 'show_ui' => true, 'show_in_rest' => true, 'has_archive' => false, 'rewrite' => false, 'query_var' => false, 'exclude_from_search' => true, 'publicly_queryable' => false, 'map_meta_cap' => true, 'capability_type' => 'post'];

    register_post_type('aio_job', $public_single + [
        'labels' => aio_cpt_labels('آگهی شغلی', 'آگهی‌های شغلی'), 'menu_icon' => 'dashicons-id-alt', 'menu_position' => 25,
        'supports' => ['title', 'editor', 'author', 'revisions'],
    ]);
    register_post_type('aio_lab', $public_single + [
        'labels' => aio_cpt_labels('مرکز', 'مراکز و آزمایشگاه‌ها'), 'menu_icon' => 'dashicons-building', 'menu_position' => 26,
        'supports' => ['title', 'editor', 'author', 'thumbnail', 'comments', 'revisions'],
    ]);
    register_post_type('aio_exam', $public_single + [
        'labels' => aio_cpt_labels('آزمون', 'آزمون‌های مهارت'), 'menu_icon' => 'dashicons-awards', 'menu_position' => 27,
        'supports' => ['title', 'editor', 'author', 'revisions'],
    ]);
    register_post_type('aio_course', $public_single + [
        'labels' => aio_cpt_labels('دوره', 'دوره‌های آکادمی'), 'menu_icon' => 'dashicons-welcome-learn-more', 'menu_position' => 28,
        'supports' => ['title', 'editor', 'author', 'thumbnail', 'comments', 'revisions'],
    ]);
    register_post_type('aio_path', [
        'public' => true, 'show_ui' => true, 'show_in_rest' => true, 'has_archive' => false, 'query_var' => true,
        'rewrite' => ['slug' => 'path', 'with_front' => false],
        'labels' => aio_cpt_labels('مسیر یادگیری', 'مسیرهای یادگیری'), 'show_in_menu' => 'edit.php?post_type=aio_course',
        'supports' => ['title', 'editor', 'revisions'],
    ]);
    register_post_type('aio_instructor', $data_only + [
        'labels' => aio_cpt_labels('مدرس', 'مدرسان'), 'show_in_menu' => 'edit.php?post_type=aio_course',
        'supports' => ['title', 'editor', 'thumbnail'],
    ]);
    register_post_type('aio_provider', $data_only + [
        'labels' => aio_cpt_labels('ارائه‌دهنده', 'ارائه‌دهندگان'), 'show_in_menu' => 'edit.php?post_type=aio_course',
        'supports' => ['title', 'editor', 'thumbnail'],
    ]);
    register_post_type('aio_service', $data_only + [
        'labels' => aio_cpt_labels('خدمت', 'خدمات و تعرفه‌ها'), 'menu_icon' => 'dashicons-cart', 'menu_position' => 29,
        'supports' => ['title', 'editor', 'page-attributes'],
    ]);
    register_post_type('aio_order', $private + [
        'labels' => aio_cpt_labels('سفارش', 'سفارش‌ها'), 'show_in_menu' => 'edit.php?post_type=aio_service',
        'supports' => ['title'], 'capabilities' => ['create_posts' => 'do_not_allow'],
    ]);
    register_post_type('aio_faq', $data_only + [
        'labels' => aio_cpt_labels('سؤال', 'سؤالات پرتکرار'), 'menu_icon' => 'dashicons-editor-help', 'menu_position' => 31,
        'supports' => ['title', 'editor', 'page-attributes'],
    ]);
    register_post_type('aio_community', $data_only + [
        'labels' => aio_cpt_labels('پست جامعه', 'جامعه آزمایشگاهی'), 'menu_icon' => 'dashicons-groups', 'menu_position' => 32,
        'supports' => ['title', 'editor', 'author', 'comments'],
    ]);
    register_post_type('aio_application', $private + [
        'labels' => aio_cpt_labels('درخواست همکاری', 'درخواست‌های همکاری'), 'show_in_menu' => 'edit.php?post_type=aio_job',
        'supports' => ['title'], 'capabilities' => ['create_posts' => 'do_not_allow'],
    ]);
    register_post_type('aio_cert', $private + [
        'labels' => aio_cpt_labels('گواهی', 'گواهی‌های صادرشده'), 'show_in_menu' => 'edit.php?post_type=aio_exam',
        'supports' => ['title'],
    ]);
    register_post_type('aio_product', $public_single + [
        'labels' => aio_cpt_labels('محصول', 'محصولات سازمان‌ها'), 'menu_icon' => 'dashicons-products', 'menu_position' => 26,
        'supports' => ['title', 'editor', 'author', 'thumbnail', 'revisions'],
    ]);
    register_post_type('aio_message', $private + [
        'labels' => aio_cpt_labels('پیام', 'پیام‌های تماس'), 'menu_icon' => 'dashicons-email-alt', 'menu_position' => 33,
        'supports' => ['title', 'editor'], 'capabilities' => ['create_posts' => 'do_not_allow'],
    ]);

    $tax = fn($one, $many, $extra = []) => $extra + [
        'labels' => ['name' => $many, 'singular_name' => $one, 'menu_name' => $many, 'all_items' => "همه $many",
            'edit_item' => "ویرایش $one", 'add_new_item' => "افزودن $one", 'search_items' => "جستجوی $many", 'not_found' => 'موردی نیست'],
        'public' => false, 'show_ui' => true, 'show_in_rest' => true, 'hierarchical' => true, 'show_admin_column' => true, 'rewrite' => false,
        'meta_box_cb' => 'post_categories_meta_box',
    ];
    register_taxonomy('aio_dept', ['aio_job', 'aio_exam'], $tax('بخش آزمایشگاهی', 'بخش‌های آزمایشگاهی'));
    register_taxonomy('aio_course_cat', ['aio_course'], $tax('دسته آموزشی', 'دسته‌های آموزشی'));
    register_taxonomy('aio_service_group', ['aio_service'], $tax('جریان درآمد', 'گروه‌های خدمات'));
    register_taxonomy('aio_faq_cat', ['aio_faq'], $tax('دسته سؤال', 'دسته‌های سؤال'));
    register_taxonomy('aio_product_cat', ['aio_product'], $tax('دسته محصول', 'دسته‌های محصول'));
    /* کاتالوگ‌های رزومه و تطبیق — فقط از منوی «رزومه و تطبیق» مدیریت می‌شوند */
    $catalog = fn($one, $many) => $tax($one, $many, ['hierarchical' => false, 'show_admin_column' => false, 'meta_box_cb' => false, 'show_in_menu' => false]);
    register_taxonomy('aio_skill', ['aio_job'], $catalog('مهارت / دستگاه', 'مهارت‌ها و دستگاه‌ها'));
    register_taxonomy('aio_role', ['aio_job'], $catalog('عنوان شغلی', 'عنوان‌های شغلی استاندارد'));
    register_taxonomy('aio_university', ['aio_job'], $catalog('دانشگاه / مؤسسه', 'دانشگاه‌ها و مؤسسه‌ها'));
    register_taxonomy('aio_license', ['aio_job'], $catalog('مدرک / پروانه', 'مدارک و پروانه‌ها'));
}
add_action('init', 'aio_register_types', 5);

/* نشانی‌های تمیز: /job/12/ ، /lab/3/ ، /course/5/ ، /exam/2/ ، /learn/5/ */
function aio_add_rewrites(): void
{
    foreach (['job' => 'aio_job', 'lab' => 'aio_lab', 'course' => 'aio_course', 'exam' => 'aio_exam', 'product' => 'aio_product'] as $slug => $pt) {
        add_rewrite_rule("^$slug/([0-9]+)/?$", "index.php?post_type=$pt&p=\$matches[1]", 'top');
    }
    add_rewrite_rule('^learn/([0-9]+)/?$', 'index.php?aio_learn=$matches[1]', 'top');
    add_rewrite_rule('^aio-data\.js$', 'index.php?aio_data=1', 'top');
    add_rewrite_rule('^verify/([A-Za-z0-9-]+)/?$', 'index.php?aio_verify=$matches[1]', 'top');
}
add_action('init', 'aio_add_rewrites', 6);

add_filter('query_vars', function ($v) {
    return array_merge($v, ['aio_learn', 'aio_data', 'aio_verify']);
});

add_filter('post_type_link', function ($link, $post) {
    $map = ['aio_job' => 'job', 'aio_lab' => 'lab', 'aio_course' => 'course', 'aio_exam' => 'exam', 'aio_product' => 'product'];
    return isset($map[$post->post_type]) ? aio_single_url($map[$post->post_type], $post->ID) : $link;
}, 10, 2);

/* نامک پست‌هایی که با شناسه آدرس‌دهی می‌شوند اهمیتی ندارد؛ از نامک فارسی طولانی جلوگیری شود */
add_filter('wp_insert_post_data', function ($data, $arr) {
    if (in_array($data['post_type'], ['aio_job', 'aio_lab', 'aio_exam', 'aio_course', 'aio_application', 'aio_order', 'aio_cert', 'aio_message', 'aio_community', 'aio_product'], true)
        && !empty($arr['ID']) && ($data['post_name'] === '' || preg_match('/%[0-9a-f]{2}/i', $data['post_name']))) {
        $data['post_name'] = (string) $arr['ID'];
    }
    return $data;
}, 10, 2);

/* نویسنده‌ی پیش‌نویس دوره/آگهی/مرکز بتواند پیش‌نمایش آن را ببیند (کاربران عادی دسترسی ویرایش ندارند) */
add_filter('posts_results', function ($posts, $q) {
    if (!empty($posts) || !$q->is_main_query() || is_admin() || !is_user_logged_in()) return $posts;
    $pt = $q->get('post_type');
    $id = (int) $q->get('p');
    if ($id && in_array($pt, ['aio_course', 'aio_job', 'aio_lab', 'aio_exam', 'aio_product'], true)) {
        $p = get_post($id);
        if ($p && $p->post_type === $pt && in_array($p->post_status, ['draft', 'pending'], true)
            && (int) $p->post_author === get_current_user_id()) {
            return [$p];
        }
    }
    return $posts;
}, 10, 2);

/* وضعیت «منقضی» برای آگهی‌ها */
add_action('init', function () {
    register_post_status('aio_expired', [
        'label' => 'منقضی‌شده', 'public' => false, 'internal' => false, 'protected' => true,
        'show_in_admin_all_list' => true, 'show_in_admin_status_list' => true,
        'label_count' => _n_noop('منقضی‌شده <span class="count">(%s)</span>', 'منقضی‌شده <span class="count">(%s)</span>'),
    ]);
});
