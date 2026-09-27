# راهنمای استقرار آیولب روی demo.aiolab.ir (GitHub Pages + Cloudflare DNS)

مسیر فعلی: **گیت‌هاب (mohmmadweb/aiolab) ← GitHub Pages ← زیردامنه demo.aiolab.ir (DNS روی Cloudflare)**

> **تقسیم دامنه:** `aiolab.ir` و `www.aiolab.ir` به سایت وردپرسی روی هاست (آی‌پی `185.141.133.91`) می‌روند.
> این پروتوتایپ فقط روی `demo.aiolab.ir` منتشر می‌شود و با `noindex` + `robots.txt` از ایندکس گوگل خارج است.

## رکوردهای DNS در Cloudflare

| Type | Name | Content | Proxy |
|---|---|---|---|
| CNAME | `demo` | `mohmmadweb.github.io` | DNS only (خاکستری) |
| A | `@` | `185.141.133.91` | به انتخاب شما |
| A | `www` | `185.141.133.91` | به انتخاب شما |

نکته: رکورد `demo` حتماً باید **DNS only** بماند تا GitHub بتواند گواهی HTTPS صادر کند.

## تنظیم GitHub Pages

ریپو → Settings → Pages → Custom domain = `demo.aiolab.ir` → Save → پس از سبز شدن DNS check، گزینه Enforce HTTPS.
فایل `CNAME` در ریشه‌ی ریپو همین مقدار را دارد و با هر انتشار در خروجی کپی می‌شود.

## چرخه کار روزانه

```
ویرایش فایل‌ها  →  git add -A  →  git commit -m "توضیح"  →  git push
```

هر push روی `main` در تب Actions منتشر می‌شود (حدود یک دقیقه) و روی demo.aiolab.ir دیده می‌شود.

## عیب‌یابی سریع

| مشکل | راه‌حل |
|---|---|
| DNS check unsuccessful | رکورد `demo` باید CNAME به `mohmmadweb.github.io` و DNS only باشد |
| خطای گواهی/SSL | بعد از سبز شدن DNS check، Enforce HTTPS را فعال کنید؛ صدور گواهی تا ۱۵ دقیقه طول می‌کشد |
| تغییرات دیده نمی‌شود | تب Actions سبز باشد، سپس Ctrl+F5 |
| دمو در گوگل دیده می‌شود | `robots.txt` و متا `noindex` باید سر جایشان باشند |
