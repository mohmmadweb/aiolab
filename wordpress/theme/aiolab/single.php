<?php
/* مقاله‌ی مجله */
get_header();
while (have_posts()) : the_post(); $a = aio_article_item(get_post());
?>
<div class="page-head"><div class="container">
  <div class="breadcrumb"><a href="<?php echo esc_url(home_url('/')); ?>">خانه</a> / <a href="<?php echo esc_url(aio_page_url('magazine')); ?>">مجله آیولب</a> / <?php the_title(); ?></div>
  <h1><?php the_title(); ?></h1>
  <p><span class="chip" style="background:<?php echo esc_attr($a['bg']); ?>;color:<?php echo esc_attr($a['color']); ?>"><?php echo esc_html($a['cat']); ?></span>
     <?php if ($a['time']) echo ' · مطالعه ' . esc_html($a['time']); ?> · <?php echo esc_html(aio_jdate('j F Y', get_post_time('U', true))); ?></p>
</div></div>
<div class="container detail-layout">
  <main>
    <article class="panel entry-content">
      <?php if (has_post_thumbnail()) the_post_thumbnail('large', ['class' => 'entry-thumb']); ?>
      <?php the_content(); ?>
    </article>
  </main>
  <aside>
    <div class="side-card">
      <h2 style="font-size:16px;margin-bottom:10px">مطالب دیگر</h2>
      <?php foreach (get_posts(['numberposts' => 5, 'post__not_in' => [get_the_ID()]]) as $o) : ?>
        <div class="row"><a href="<?php echo esc_url(get_permalink($o)); ?>"><?php echo esc_html($o->post_title); ?></a></div>
      <?php endforeach; ?>
      <a class="btn btn-outline btn-block" style="margin-top:14px" href="<?php echo esc_url(aio_page_url('magazine')); ?>">همه مطالب مجله</a>
    </div>
    <div class="side-card" style="margin-top:16px">
      <b>دنبال فرصت شغلی هستید؟</b>
      <p style="font-size:13px;color:var(--navy-500);margin:8px 0 12px">آگهی‌های استخدام آزمایشگاه‌ها را با فیلترهای تخصصی جستجو کنید.</p>
      <a class="btn btn-primary btn-block" href="<?php echo esc_url(aio_page_url('jobs')); ?>">فرصت‌های شغلی</a>
    </div>
  </aside>
</div>
<?php endwhile; get_footer();
