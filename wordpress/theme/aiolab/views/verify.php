<?php
/* نتیجه‌ی استعلام گواهی: /verify/{code}/ */
get_header();
$code = strtoupper(sanitize_text_field((string) get_query_var('aio_verify')));
$q = get_posts(['post_type' => 'aio_cert', 'post_status' => 'publish', 'numberposts' => 1, 'meta_key' => '_aio_code', 'meta_value' => $code]);
?>
<div class="page-head"><div class="container">
  <div class="breadcrumb"><a href="<?php echo esc_url(home_url('/')); ?>">خانه</a> / <a href="<?php echo esc_url(aio_page_url('verify')); ?>">استعلام گواهی</a> / <?php echo esc_html($code); ?></div>
  <h1>نتیجه‌ی استعلام گواهی</h1>
</div></div>
<section class="section"><div class="container" style="max-width:720px">
<?php if ($q) : $c = aio_cert_item($q[0]); $u = get_userdata((int) $q[0]->post_author); ?>
  <div class="panel cert-verify ok">
    <div class="cv-badge"><?php echo esc_html($c['badge']); ?></div>
    <h2>✅ این گواهی معتبر است</h2>
    <div class="row"><span>دارنده</span><b><?php echo esc_html($u ? $u->display_name : '—'); ?></b></div>
    <div class="row"><span>عنوان</span><b><?php echo esc_html($c['title']); ?></b></div>
    <div class="row"><span>نمره</span><b><?php echo esc_html(aio_fa($c['score'])); ?> از ۱۰۰</b></div>
    <div class="row"><span>تاریخ صدور</span><b><?php echo esc_html($c['date']); ?></b></div>
    <div class="row"><span>کد رهگیری</span><b dir="ltr"><?php echo esc_html($c['code']); ?></b></div>
  </div>
<?php else : ?>
  <div class="panel cert-verify no"><h2>❌ گواهی با این کد پیدا نشد</h2><p>کد را دوباره بررسی کنید.</p>
  <a class="btn btn-outline" href="<?php echo esc_url(aio_page_url('verify')); ?>">استعلام دوباره</a></div>
<?php endif; ?>
</div></section>
<?php get_footer();
