# آیولب — نسخه‌ی وردپرس (aiolab.ir)

بازسازی کامل دموی `demo.aiolab.ir` به‌صورت سایت زنده روی وردپرس. ظاهر عین دمو است؛ همه‌ی داده‌ها واقعی و از پیشخوان قابل ویرایش‌اند.

## ساختار

| مسیر | نقش |
|---|---|
| `plugin/aiolab-core/` | افزونه‌ی هسته: انواع محتوا، فیلدها، تنظیمات، REST API، سفارش/پرداخت، اعلان/ایمیل، کران، درون‌ریز |
| `theme/aiolab/` | قالب اختصاصی: هدر/فوتر سمت سرور، سئو، مسیریابی، CSS دمو، JS صفحات |
| `tools/` | `wp.py` (کلاینت Novamira)، `deploy.py` (انتشار)، `build-pages.py` + `page_patches.py` (تبدیل صفحات دمو)، `export-seed.js` |
| `seed/`، `plugin/.../data/` | داده‌های نمونه (`seed.json`)، برگه‌ها (`pages.json`)، منوها (`menus.json`)، استان/شهر (`geo.json`) |
| `local/` | وردپرس محلی با داکر برای تست (پورت 8798، کاربر admin/admin123) |
| `tests/` | تست‌های مرورگری (playwright-core + Chrome محلی) |

## جریان داده
- **داده‌ی عمومی**: `/aio-data.js?v=…` همان ثابت‌های `AIO_*` دمو را از پایگاه داده می‌سازد (کش، بعد از هر ذخیره تازه می‌شود). پاسخ آزمون‌ها و محتوای درس‌ها هرگز در آن نیست.
- **وضعیت کاربر**: `window.AIO_ME` (رزومه، درخواست‌ها، دوره‌ها، سفارش‌ها، اعلان‌ها…) درون‌خطی در هر صفحه.
- **عملیات**: `API.post("…")` در `app.js` → `wp-json/aio/v1/…` (فهرست کامل در `inc/rest.php`). پاسخ‌ها `me` تازه را برمی‌گردانند.
- **برگه‌ها**: متن هر برگه = بلوک‌های «HTML سفارشی» در ویرایشگر؛ عناصر دارای `id` جای داده‌ی زنده‌اند. تک‌صفحه‌ها (آگهی/مرکز/دوره/آزمون/مسیر/محیط یادگیری) از برگه‌های خصوصی `tpl-*` خوانده می‌شوند.
- **نشانی‌ها**: `/job/{id}/` `/lab/{id}/` `/course/{id}/` `/exam/{id}/` `/learn/{id}/` `/path/{slug}/` `/verify/{code}/`.

## کار روزمره
```bash
python3 tools/build-pages.py            # پس از تغییر page_patches.py یا صفحات دمو
python3 tools/deploy.py                 # انتشار افزونه + قالب + همگام‌سازی برگه‌ها (برگه‌های ویرایش‌شده توسط مدیر دست نمی‌خورند)
python3 tools/deploy.py theme           # فقط قالب
python3 tools/wp.py php 'return aio_opt("gateway");'
```
- `deploy.py` نسخه‌ی قبلی را در `wp-content/uploads/aio-deploy/*-prev-*` نگه می‌دارد (۳ نسخه‌ی آخر) — برای بازگشت کافی است پوشه را برگردانید.
- `aio_sync_pages()` فقط برگه‌هایی را به‌روز می‌کند که هش محتوایشان با نسخه‌ی نصب‌شده‌ی قبلی یکی است.

## تست
```bash
cd local && docker compose -p aiolab-local up -d          # وردپرس محلی
cd tests && ./reset-limits.sh && node smoke.js            # همه‌ی برگه‌ها
node seeker.js; node employer.js; node academy.js; node quiz-exam.js; node admin.js; node pay.js
# روی سایت زنده (با کلید پیش‌نمایش):
export BASE=https://aiolab.ir PREVIEW=$(python3 ../tools/wp.py php "return wp_hash(aio_opt('cs_preview_key'));" | python3 -c "import sys,json;print(json.load(sys.stdin)['return'])")
./reset-live-limits.sh && node smoke.js
```
تست‌های زنده کاربر `@example.com` می‌سازند؛ بعد از تست: `python3 tools/wp.py php-file tools/cleanup-test-users.php`

## قواعد
- هیچ متن محتوایی در JS هاردکد نشود؛ یا در برگه (HTML) یا در تنظیمات/انواع محتوا.
- ورودی کاربران غیرمدیر با `aio_clean_text` پاک‌سازی می‌شود (بدون تگ و کوتیشن) چون قالب‌های JS با `innerHTML` رندر می‌کنند.
- نام‌های سراسری `P` (نشانی برگه‌ها)، `API`، `ME`، `esc`، `busy`، `L` (لیفلت) در اسکریپت صفحات دوباره تعریف نشوند.
