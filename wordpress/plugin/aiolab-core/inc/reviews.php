<?php
/* نظرات و امتیاز مراکز و دوره‌ها — دیدگاه‌های وردپرس با نوع aio_review (مدیریت از «دیدگاه‌ها») */
defined('ABSPATH') || exit;

function aio_add_review(int $post_id, int $uid, array $d): int
{
    $u = get_userdata($uid);
    $approved = aio_opt('review_auto_approve', 0) ? 1 : 0;
    $cid = wp_insert_comment([
        'comment_post_ID' => $post_id, 'user_id' => $uid, 'comment_type' => 'aio_review',
        'comment_author' => $d['name'] ?? ($u ? $u->display_name : 'کاربر'), 'comment_author_email' => $u ? $u->user_email : '',
        'comment_content' => $d['text'] ?? '', 'comment_approved' => $approved, 'comment_author_IP' => aio_client_ip(),
    ]);
    if (!$cid) return 0;
    add_comment_meta($cid, 'aio_stars', (float) $d['stars']);
    foreach (['role', 'title', 'pros', 'cons'] as $k) if (!empty($d[$k])) add_comment_meta($cid, 'aio_' . $k, $d[$k]);
    if (!empty($d['breakdown'])) add_comment_meta($cid, 'aio_breakdown', $d['breakdown']);
    if (!$approved) {
        aio_notify_admin('نظر جدید در انتظار بررسی', '<p>نظر جدیدی برای «' . esc_html(get_the_title($post_id)) . '» ثبت شد.</p><p><a class="btn" href="' . esc_url(admin_url('edit-comments.php?comment_status=moderated')) . '">بررسی نظرات</a></p>');
    }
    return (int) $cid;
}

/* نمایش امتیاز در فهرست دیدگاه‌های پیشخوان */
add_filter('comment_text', function ($text, $comment = null) {
    if (!is_admin() || !$comment || $comment->comment_type !== 'aio_review') return $text;
    $stars = (float) get_comment_meta($comment->comment_ID, 'aio_stars', true);
    $extra = '<p><b>امتیاز:</b> ' . str_repeat('★', (int) round($stars)) . ' (' . esc_html($stars) . ')';
    foreach (['role' => 'نقش', 'pros' => 'نقاط قوت', 'cons' => 'نقاط ضعف'] as $k => $l) {
        $v = get_comment_meta($comment->comment_ID, 'aio_' . $k, true);
        if ($v) $extra .= ' · <b>' . $l . ':</b> ' . esc_html($v);
    }
    $b = get_comment_meta($comment->comment_ID, 'aio_breakdown', true);
    if (is_array($b) && $b) $extra .= '<br><small>' . esc_html(implode(' | ', array_map(fn($k, $v) => "$k: $v", array_keys($b), $b))) . '</small>';
    return $text . $extra . '</p>';
}, 10, 2);

add_filter('admin_comment_types_dropdown', function ($t) {
    $t['aio_review'] = 'نظر و امتیاز آیولب';
    return $t;
});
