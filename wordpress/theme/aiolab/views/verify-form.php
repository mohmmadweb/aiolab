<?php /* فرم استعلام گواهی */ ?>
<div class="page-head"><div class="container">
  <div class="breadcrumb"><a href="<?php echo esc_url(home_url('/')); ?>">خانه</a> / <a href="<?php echo esc_url(aio_page_url('exams')); ?>">آزمون و گواهینامه</a> / استعلام گواهی</div>
  <h1>استعلام گواهی آیولب</h1>
  <p>کد رهگیری درج‌شده روی گواهی را وارد کنید تا اصالت آن بررسی شود.</p>
</div></div>
<section class="section"><div class="container" style="max-width:640px">
  <form class="panel" onsubmit="event.preventDefault();var c=this.code.value.trim();if(c)location.href='<?php echo esc_js(home_url('/verify/')); ?>'+encodeURIComponent(c)+'/'">
    <div class="form-field"><label for="vc">کد رهگیری گواهی</label><input id="vc" name="code" dir="ltr" placeholder="AIO-XXXXXXXX" required></div>
    <button class="btn btn-primary" type="submit">استعلام</button>
  </form>
</div></section>
