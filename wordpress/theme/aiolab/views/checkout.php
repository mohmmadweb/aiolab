<?php
/* صفحه‌ی پرداخت سفارش (فقط برای صاحب سفارش) */
$oid = (int) ($_GET['order'] ?? 0);
$o = $oid ? get_post($oid) : null;
$mine = $o && $o->post_type === 'aio_order' && ((int) $o->post_author === get_current_user_id() || current_user_can('edit_post', $oid));
?>
<div class="page-head"><div class="container">
  <div class="breadcrumb"><a href="<?php echo esc_url(home_url('/')); ?>">خانه</a> / <a href="<?php echo esc_url(aio_page_url('services')); ?>">خدمات آیولب</a> / پرداخت سفارش</div>
  <h1>پرداخت سفارش</h1>
</div></div>
<section class="section"><div class="container"><div class="detail-layout"><main>
<?php if (!$mine) : ?>
  <div class="panel"><h2>سفارش پیدا نشد</h2><p>این سفارش وجود ندارد یا متعلق به حساب شما نیست.</p>
  <a class="btn btn-outline" href="<?php echo esc_url(aio_page_url('dashboard', '#orders')); ?>">سفارش‌های من</a></div>
<?php else :
    $it = aio_order_item($o);
    $st = $it['status'];
    $back = aio_page_url(in_array(aio_user_role(), ['employer', 'admin'], true) ? 'employer' : (aio_user_role() === 'supplier' ? 'advertise' : 'dashboard'), '#orders');
    if (!empty($_GET['paid'])) echo '<div class="notice-box ok">✅ پرداخت با موفقیت انجام شد' . ($it['refId'] ? ' — کد پیگیری: <b dir="ltr">' . esc_html($it['refId']) . '</b>' : '') . '</div>';
    if (!empty($_GET['fail'])) echo '<div class="notice-box err">' . esc_html(wp_unslash($_GET['fail'])) . '</div>';
?>
  <div class="panel checkout-panel" id="checkout" data-order="<?php echo (int) $oid; ?>">
    <h2>سفارش شماره <?php echo esc_html(aio_fa($it['number'])); ?></h2>
    <div class="side-card" style="box-shadow:none;padding:0;border:0">
      <div class="row"><span>شرح</span><b><?php echo esc_html($it['title']); ?></b></div>
      <?php if ($it['code']) : ?><div class="row"><span>کد خدمت</span><b><?php echo esc_html($it['code']); ?></b></div><?php endif; ?>
      <div class="row"><span>تاریخ ثبت</span><b><?php echo esc_html($it['date']); ?></b></div>
      <div class="row"><span>وضعیت</span><b><span class="status <?php echo esc_attr($st); ?>"><?php echo esc_html($it['statusText']); ?></span></b></div>
      <div class="row"><span>مبلغ قابل پرداخت</span><b class="price-big"><?php echo esc_html(aio_price_text($it['price'], 'رایگان')); ?></b></div>
    </div>
    <?php if ($st === 'pending') : ?>
      <div id="pay-box" style="margin-top:18px">
        <?php if (aio_gateway() === 'manual') : ?>
          <div class="notice-box info"><?php echo nl2br(esc_html((string) aio_opt('manual_instructions', ''))); ?></div>
          <p class="muted" style="margin-top:10px">پس از تأیید پرداخت توسط کارشناسان، خدمت به‌صورت خودکار برای شما فعال می‌شود و اعلان دریافت می‌کنید.</p>
        <?php else : ?>
          <button class="btn btn-primary btn-lg" id="pay-btn" onclick="payOrder(<?php echo (int) $oid; ?>)">پرداخت آنلاین <?php echo esc_html(aio_price_text($it['price'])); ?></button>
        <?php endif; ?>
        <button class="btn btn-ghost" onclick="cancelOrderCheckout(<?php echo (int) $oid; ?>)">لغو سفارش</button>
      </div>
    <?php elseif (in_array($st, ['paid', 'done'], true)) : ?>
      <div class="notice-box ok" style="margin-top:18px">این سفارش پرداخت شده و <?php echo $st === 'done' ? 'فعال است' : 'در صف انجام تیم آیولب است'; ?>.</div>
    <?php elseif ($st === 'processing') : ?>
      <div class="notice-box info" style="margin-top:18px">درخواست شما ثبت شده و کارشناسان آیولب برای هماهنگی (و اعلام قیمت در خدمات توافقی) با شما تماس می‌گیرند.</div>
    <?php endif; ?>
    <a class="btn btn-outline" style="margin-top:18px" href="<?php echo esc_url($back); ?>">بازگشت به سفارش‌های من</a>
  </div>
<?php endif; ?>
</main>
<aside><div class="side-card"><h2 style="font-size:16px;margin-bottom:8px">پشتیبانی پرداخت</h2>
  <p style="font-size:13px;color:var(--navy-500);line-height:2">در صورت هر مشکل در پرداخت با ما در تماس باشید: <?php echo do_shortcode('[aio_opt key="support_email" link="mailto"]'); // phpcs:ignore ?></p>
  <a class="btn btn-outline btn-block btn-sm" href="<?php echo esc_url(aio_page_url('contact')); ?>">تماس با پشتیبانی</a></div></aside>
</div></div></section>
