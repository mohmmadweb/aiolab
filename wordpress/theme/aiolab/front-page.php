<?php
/* برگه‌های آیولب: محتوای برگه (بلوک‌های HTML قابل ویرایش در پیشخوان) بین هدر و فوتر */
get_header();
while (have_posts()) {
    the_post();
    $role = (string) get_post_meta(get_the_ID(), '_aio_page', true);
    if ($role) {
        echo aio_page_html(get_post()); // phpcs:ignore
        if ($role === 'checkout') get_template_part('views/checkout');
        if ($role === 'verify') get_template_part('views/verify-form');
    } else {
        /* برگه‌های معمولی که مدیر می‌سازد (قوانین، حریم خصوصی و …) */
        echo '<div class="page-head"><div class="container"><div class="breadcrumb"><a href="' . esc_url(home_url('/')) . '">خانه</a> / ' . esc_html(get_the_title()) . '</div><h1>' . esc_html(get_the_title()) . '</h1></div></div>';
        echo '<section class="section"><div class="container"><div class="panel entry-content">';
        the_content();
        echo '</div></div></section>';
    }
}
get_footer();
