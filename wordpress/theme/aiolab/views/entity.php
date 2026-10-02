<?php
/* تک‌صفحه‌ی آگهی / مرکز / دوره / آزمون / مسیر / محیط یادگیری — ساختار از برگه‌ی قالب tpl-* */
get_header();
echo aio_page_html(aio_tpl_page(aio_current_role())); // phpcs:ignore
get_footer();
