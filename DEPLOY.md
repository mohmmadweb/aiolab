# راهنمای استقرار آیولب روی aiolab.ir (GitHub Pages + Cloudflare DNS)

مسیر فعلی: **گیت‌هاب (mohmmadweb/aiolab) ← GitHub Pages ← دامنه aiolab.ir (DNS روی Cloudflare)**

GitHub Pages از شاخه `main` (پوشه ریشه) سایت را منتشر می‌کند و فایل `CNAME` دامنه سفارشی را مشخص می‌کند. هر push روی `main` خودکار منتشر می‌شود.

## گام ۱ — رکوردهای DNS در Cloudflare (یک بار)

در داشبورد Cloudflare → دامنه aiolab.ir → **DNS → Records → Add record** این ۵ رکورد را بسازید:

| Type | Name | Content | Proxy status |
|---|---|---|---|
| A | `@` | `185.199.108.153` | DNS only (ابر خاکستری) |
| A | `@` | `185.199.109.153` | DNS only |
| A | `@` | `185.199.110.153` | DNS only |
| A | `@` | `185.199.111.153` | DNS only |
| CNAME | `www` | `mohmmadweb.github.io` | DNS only |

نکته مهم: Proxy را حتماً **DNS only** (خاکستری) بگذارید تا GitHub بتواند دامنه را تأیید و گواهی HTTPS صادر کند.

## گام ۲ — تأیید دامنه در GitHub Pages

1. ریپو → **Settings → Pages**
2. در بخش Custom domain دکمه **Check again** را بزنید (اگر لازم شد چند دقیقه صبر کنید — انتشار DNS معمولاً سریع است).
3. وقتی تیک سبز «DNS check successful» آمد، گزینه **Enforce HTTPS** را فعال کنید (اگر خاکستری بود، چند دقیقه بعد فعال می‌شود؛ صدور گواهی زمان می‌برد).

## گام ۳ — چرخه کار روزانه

```
ویرایش فایل‌ها  →  git add -A  →  git commit -m "توضیح تغییر"  →  git push
```

هر push روی `main`، در تب **Actions** با workflow خودکار «pages build and deployment» منتشر می‌شود (حدود ۱ دقیقه) و روی aiolab.ir دیده می‌شود.

## ⚠️ نکته درباره پوشه Docs

GitHub Pages کل ریپو را منتشر می‌کند؛ یعنی فایل‌های Word و PowerPoint داخل `Docs/` هم به‌صورت عمومی قابل دانلود هستند (مثلاً `aiolab.ir/Docs/...docx`). اگر نمی‌خواهید اسناد طرح عمومی باشند، پوشه Docs را از ریپو خارج کنید (فایل‌های محلی حذف نمی‌شوند):

```
git rm -r --cached Docs
echo Docs/ >> .gitignore
git add .gitignore && git commit -m "remove Docs from public repo" && git push
```

## عیب‌یابی سریع

| مشکل | راه‌حل |
|---|---|
| DNS check unsuccessful | رکوردهای گام ۱ را چک کنید؛ Proxy باید DNS only باشد؛ چند دقیقه صبر و Check again |
| خطای گواهی/SSL | Enforce HTTPS را بعد از سبزشدن DNS check فعال کنید؛ صدور گواهی تا ۱۵ دقیقه طول می‌کشد |
| تغییرات دیده نمی‌شود | تب Actions ریپو سبز باشد؛ سپس Ctrl+F5 (پاک‌کردن کش مرورگر) |
| صفحه ۴۰۴ گیت‌هاب | فایل CNAME باید در ریشه ریپو باشد و Source روی «Deploy from a branch / main / (root)» |
