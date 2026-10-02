<?php
get_header();
$p = aio_tpl_page('404');
if ($p) echo aio_page_html($p); // phpcs:ignore
else echo '<section class="section"><div class="container"><h1>صفحه پیدا نشد</h1><p><a href="' . esc_url(home_url('/')) . '">بازگشت به خانه</a></p></div></section>';
get_footer();
