<?php
/* پاک‌سازی کاربران تست (@example.com) و داده‌هایشان — اجرا: python3 tools/wp.py php-file tools/cleanup-test-users.php */
require_once ABSPATH . 'wp-admin/includes/user.php';
/* هرگز مدیر/ویرایشگر یا کاربر شماره‌ی ۱ را حذف نکن — فقط کارجو/کارفرما/داوطلب/تأمین‌کننده‌ی تستی */
$ids = array_map('intval', get_users(['search' => '*@example.com', 'search_columns' => ['user_email'], 'fields' => 'ID',
    'role__in' => ['aio_seeker', 'aio_employer', 'aio_volunteer', 'aio_supplier', 'subscriber']]));
$ids = array_values(array_filter($ids, fn($id) => $id !== 1 && !user_can($id, 'edit_posts')));
if (!$ids) return 'no test users';
$types = ['aio_job', 'aio_lab', 'aio_exam', 'aio_course', 'aio_application', 'aio_order', 'aio_cert', 'aio_community', 'aio_message', 'aio_product', 'attachment'];
$n = 0;
foreach (get_posts(['post_type' => $types, 'post_status' => 'any', 'author__in' => $ids, 'numberposts' => -1, 'fields' => 'ids']) as $pid) { wp_delete_post($pid, true); $n++; }
foreach (get_posts(['post_type' => 'aio_application', 'post_status' => 'any', 'numberposts' => -1, 'fields' => 'ids', 'meta_query' => [['key' => '_aio_employer_id', 'value' => $ids, 'compare' => 'IN']]]) as $pid) { wp_delete_post($pid, true); $n++; }
foreach (get_comments(['author__in' => $ids]) as $cm) wp_delete_comment($cm->comment_ID, true);
foreach ($ids as $uid) wp_delete_user($uid); /* محتوای باقی‌مانده‌ی کاربر تستی هم حذف شود (مدیرها بالا کنار گذاشته شده‌اند) */
do_action('aio_data_changed');
return ['users_removed' => count($ids), 'posts_removed' => $n];
