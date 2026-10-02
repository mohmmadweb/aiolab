<?php
/* فهرست نوشته‌ها (دسته‌های مجله، جستجو) */
get_header();
$title = is_category() ? single_cat_title('', false) : (is_search() ? 'جستجو: ' . get_search_query() : 'مجله آیولب');
?>
<div class="page-head"><div class="container">
  <div class="breadcrumb"><a href="<?php echo esc_url(home_url('/')); ?>">خانه</a> / <a href="<?php echo esc_url(aio_page_url('magazine')); ?>">مجله آیولب</a> / <?php echo esc_html($title); ?></div>
  <h1><?php echo esc_html($title); ?></h1>
</div></div>
<section class="section"><div class="container">
  <div class="content-grid">
  <?php if (have_posts()) : while (have_posts()) : the_post(); $a = aio_article_item(get_post()); ?>
    <a class="content-card" href="<?php the_permalink(); ?>">
      <div class="thumb" style="background:<?php echo esc_attr($a['bg']); ?>;color:<?php echo esc_attr($a['color']); ?>"><?php echo $a['thumb'] ? '<img src="' . esc_url($a['thumb']) . '" alt="">' : aio_icon($a['icon']); // phpcs:ignore ?></div>
      <div class="body"><span class="cat"><?php echo esc_html($a['cat']); ?></span><h3><?php the_title(); ?></h3>
        <div class="meta"><?php if ($a['time']) echo '<span>مطالعه ' . esc_html($a['time']) . '</span>'; ?><span><?php echo esc_html($a['date']); ?></span></div></div>
    </a>
  <?php endwhile; else : ?>
    <p>مطلبی پیدا نشد.</p>
  <?php endif; ?>
  </div>
  <div class="pager"><?php the_posts_pagination(['prev_text' => 'قبلی', 'next_text' => 'بعدی']); ?></div>
</div></section>
<?php get_footer();
