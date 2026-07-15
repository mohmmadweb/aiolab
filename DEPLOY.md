# راهنمای استقرار آیولب روی aiolab.ir (Cloudflare Pages)

مسیر کلی: **گیت‌هاب (mohmmadweb/aiolab) ← Cloudflare Pages ← دامنه aiolab.ir**

با این تنظیم، هر بار که تغییری push شود، حداکثر ظرف ۱ تا ۲ دقیقه روی aiolab.ir دیده می‌شود.

## گام ۱ — افزودن دامنه به Cloudflare

1. وارد <https://dash.cloudflare.com> شوید.
2. **Add a domain** (یا Add site) را بزنید و `aiolab.ir` را وارد کنید.
3. پلن **Free** را انتخاب کنید.
4. Cloudflare رکوردهای DNS موجود را اسکن می‌کند؛ ادامه دهید.
5. چون نیم‌سرورها (`arch.ns.cloudflare.com` و `pat.ns.cloudflare.com`) قبلاً روی دامنه تنظیم شده‌اند، بعد از چند دقیقه (تا حداکثر چند ساعت) وضعیت دامنه **Active** می‌شود.

## گام ۲ — ساخت پروژه Cloudflare Pages و اتصال به گیت‌هاب

1. در داشبورد Cloudflare از منوی کناری: **Workers & Pages → Create → Pages → Connect to Git**
2. با دکمه **Connect GitHub** حساب `mohmmadweb` را وصل کنید و به ریپوی `aiolab` دسترسی بدهید.
3. ریپوی **mohmmadweb/aiolab** را انتخاب کنید.
4. تنظیمات Build:
   - **Project name:** `aiolab`
   - **Production branch:** `main`
   - **Framework preset:** `None`
   - **Build command:** خالی بگذارید (سایت استاتیک است)
   - **Build output directory:** `/` (ریشه ریپو)
5. **Save and Deploy** را بزنید. بعد از حدود یک دقیقه سایت روی آدرس پیش‌فرض `aiolab.pages.dev` بالا می‌آید.

## گام ۳ — اتصال دامنه aiolab.ir به پروژه Pages

1. داخل پروژه Pages ← تب **Custom domains** ← **Set up a custom domain**
2. `aiolab.ir` را وارد کنید؛ Cloudflare خودش رکورد CNAME لازم را می‌سازد. تأیید کنید.
3. دوباره **Set up a custom domain** را بزنید و این بار `www.aiolab.ir` را هم اضافه کنید.
4. گواهی SSL به‌صورت خودکار صادر می‌شود (چند دقیقه). بعد از آن `https://aiolab.ir` فعال است.

نکته: اگر رکورد A یا CNAME قدیمی برای `@` یا `www` در DNS مانده بود (از هاست قبلی)، در بخش **DNS** حذفش کنید تا با رکورد Pages تداخل نکند.

## گام ۴ — چرخه کار روزانه

```
ویرایش فایل‌ها  →  git add -A  →  git commit -m "توضیح تغییر"  →  git push
```

هر push روی شاخه `main`، به‌صورت خودکار Deploy جدید می‌سازد. وضعیت هر Deploy در تب **Deployments** پروژه Pages دیده می‌شود.

نکته کاربردی: هر Pull Request یا branch دیگر هم یک **Preview URL** جداگانه می‌گیرد؛ یعنی می‌توانید تغییرات آزمایشی را قبل از انتشار روی دامنه اصلی ببینید.

## عیب‌یابی سریع

| مشکل | راه‌حل |
|---|---|
| دامنه Active نمی‌شود | نیم‌سرورها را در پنل ثبت دامنه (ایرنیک/ریسلر) دوباره چک کنید |
| سایت روی pages.dev هست ولی روی aiolab.ir نه | تب Custom domains را چک کنید؛ رکورد DNS متضاد را حذف کنید |
| تغییرات دیده نمی‌شود | تب Deployments را ببینید که Deploy موفق بوده؛ سپس Ctrl+F5 (پاک‌کردن کش مرورگر) |
| خطای SSL در دقایق اول | طبیعی است؛ صدور گواهی چند دقیقه طول می‌کشد |
