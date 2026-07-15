# راهنمای استقرار آیولب روی aiolab.ir (Cloudflare Pages)

مسیر کلی: **گیت‌هاب (mohmmadweb/aiolab) ← GitHub Actions ← Cloudflare Pages ← دامنه aiolab.ir**

استقرار با workflow موجود در `.github/workflows/main.yml` انجام می‌شود: هر push روی `main`، فایل‌های سایت (HTML + assets، بدون پوشه Docs) را با wrangler روی پروژه Pages به نام `aiolab` دیپلوی می‌کند.

## گام ۱ — افزودن دامنه به Cloudflare

1. وارد <https://dash.cloudflare.com> شوید.
2. **Add a domain** (یا Add site) را بزنید و `aiolab.ir` را وارد کنید.
3. پلن **Free** را انتخاب کنید.
4. Cloudflare رکوردهای DNS موجود را اسکن می‌کند؛ ادامه دهید.
5. چون نیم‌سرورها (`arch.ns.cloudflare.com` و `pat.ns.cloudflare.com`) قبلاً روی دامنه تنظیم شده‌اند، بعد از چند دقیقه (تا حداکثر چند ساعت) وضعیت دامنه **Active** می‌شود.

## گام ۲ — ساخت API Token و Secret ها

1. **Account ID:** در داشبورد Cloudflare → صفحه **Workers & Pages** (یا Overview دامنه) → ستون راست، مقدار **Account ID** را کپی کنید.
2. **API Token:** آیکن پروفایل (بالا) → **My Profile → API Tokens → Create Token → Create Custom Token**:
   - Name: `aiolab-pages-deploy`
   - Permissions: `Account → Cloudflare Pages → Edit`
   - **Continue to summary → Create Token** و توکن را کپی کنید (فقط یک بار نمایش داده می‌شود).
3. در گیت‌هاب: ریپوی `aiolab` → **Settings → Secrets and variables → Actions → New repository secret** و دو Secret بسازید:
   - `CLOUDFLARE_API_TOKEN` = توکن مرحله قبل
   - `CLOUDFLARE_ACCOUNT_ID` = شناسه حساب

## گام ۳ — اجرای اولین Deploy

1. در ریپوی گیت‌هاب → تب **Actions** → workflow «Deploy to Cloudflare Pages» → دکمه **Run workflow** (یا آخرین اجرای ناموفق را **Re-run** کنید).
2. اجرای سبز = پروژه `aiolab` در Cloudflare ساخته و سایت روی `aiolab.pages.dev` منتشر شده است.

## گام ۴ — اتصال دامنه aiolab.ir به پروژه Pages

1. داخل پروژه Pages ← تب **Custom domains** ← **Set up a custom domain**
2. `aiolab.ir` را وارد کنید؛ Cloudflare خودش رکورد CNAME لازم را می‌سازد. تأیید کنید.
3. دوباره **Set up a custom domain** را بزنید و این بار `www.aiolab.ir` را هم اضافه کنید.
4. گواهی SSL به‌صورت خودکار صادر می‌شود (چند دقیقه). بعد از آن `https://aiolab.ir` فعال است.

نکته: اگر رکورد A یا CNAME قدیمی برای `@` یا `www` در DNS مانده بود (از هاست قبلی)، در بخش **DNS** حذفش کنید تا با رکورد Pages تداخل نکند.

## گام ۵ — چرخه کار روزانه

```
ویرایش فایل‌ها  →  git add -A  →  git commit -m "توضیح تغییر"  →  git push
```

هر push روی شاخه `main`، به‌صورت خودکار در تب **Actions** گیت‌هاب اجرا و روی aiolab.ir منتشر می‌شود (حدود ۱ دقیقه).

## عیب‌یابی سریع

| مشکل | راه‌حل |
|---|---|
| دامنه Active نمی‌شود | نیم‌سرورها را در پنل ثبت دامنه (ایرنیک/ریسلر) دوباره چک کنید |
| اجرای Actions قرمز است | لاگ همان اجرا را باز کنید؛ معمولاً Secret اشتباه یا ساخته‌نشده است |
| سایت روی pages.dev هست ولی روی aiolab.ir نه | تب Custom domains پروژه Pages را چک کنید؛ رکورد DNS متضاد را حذف کنید |
| تغییرات دیده نمی‌شود | تب Actions سبز باشد؛ سپس Ctrl+F5 (پاک‌کردن کش مرورگر) |
| خطای SSL در دقایق اول | طبیعی است؛ صدور گواهی چند دقیقه طول می‌کشد |
