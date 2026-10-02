<?php
/* صفحه‌ی «به‌زودی» — متن‌ها از «تنظیمات آیولب ← حالت به‌زودی» */
defined('ABSPATH') || exit;
$css = get_template_directory_uri() . '/assets/css/';
?><!DOCTYPE html>
<html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title><?php echo esc_html(aio_opt('cs_title', 'به‌زودی')); ?></title>
<link rel="stylesheet" href="<?php echo esc_url($css . 'fonts.css'); ?>"><link rel="stylesheet" href="<?php echo esc_url($css . 'style.css'); ?>">
<style>body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(160deg,#f0fdfa,#fff 60%)}
.cs{max-width:620px;text-align:center;padding:40px 22px}.cs .logo{justify-content:center;margin-bottom:26px;font-size:30px}
.cs h1{font-size:clamp(24px,4vw,34px);color:var(--navy-900);margin-bottom:14px;line-height:1.6}.cs p{color:var(--navy-600);font-size:16px;line-height:2}
.cs .mail{margin-top:22px;font-size:14px;color:var(--navy-500)}.cs .mail a{color:var(--teal-700)}</style></head>
<body><div class="cs"><?php echo aio_logo_html(); // phpcs:ignore ?>
<h1><?php echo esc_html(aio_opt('cs_title', '')); ?></h1><p><?php echo nl2br(esc_html(aio_opt('cs_text', ''))); ?></p>
<?php if ($e = aio_opt('support_email', '')) echo '<div class="mail">ارتباط با ما: <a href="mailto:' . esc_attr($e) . '">' . esc_html($e) . '</a></div>'; ?>
</div></body></html>
