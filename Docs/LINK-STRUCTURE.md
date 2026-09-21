# ساختار لینک‌دهی آیولب

منبع حقیقت واحد: `AIO_SITEMAP` در `assets/js/app.js`.
فوتر (`AIO_FOOTER`)، بردکرامب ساخت‌یافته (`injectBreadcrumbLD`)، `sitemap.xml` و صفحه ۴۰۴ همگی از همین نقشه می‌خوانند.

## سلسله‌مراتب صفحات

```
index.html
├── jobs.html ──────────── job.html?id=
├── labs.html ──────────── lab.html?id=
│   └── ranking.html
├── exams.html ─────────── exam.html?id=
├── assessment.html ────── mbti.html
├── courses.html (آکادمی)
│   ├── course.html?id= | ?draft= ── learn.html?id=[&lesson=m:l]
│   ├── courses.html#paths ───────── path.html?id=
│   └── course-builder.html[?id=][&step=]
├── services.html ──────── pricing.html · reports.html · advertise.html
├── magazine.html · community.html · faq.html
├── about.html · contact.html
├── dashboard.html#<section>   (کارجو)
├── employer.html#<section>    (کارفرما)
└── login.html?role= · register.html?role= · 404.html
```

## قرارداد پارامترهای URL

| صفحه | پارامترها |
|---|---|
| `jobs.html` | `q` `prov` `city` `dept` `type` `shift` `benefit` `remote=1` `urgent=1` |
| `job.html` | `id` (شناسه آگهی) |
| `lab.html` | `id` (شناسه مرکز) |
| `exam.html` | `id` (شناسه آزمون) |
| `courses.html` | `cat` `q` `skill` `level` `type=course\|guided` `free=1` + انکر `#paths` `#catalog` `#instructors` `#business` `#faq` |
| `course.html` | `id` (دوره منتشرشده) یا `draft` (پیش‌نویس کاربر) |
| `learn.html` | `id` + `lesson=<ماژول>:<درس>` |
| `path.html` | `id` (شناسه متنی مسیر، مثل `hematology-pro`) |
| `course-builder.html` | `id` (ویرایش پیش‌نویس) + `step=1..5` |
| `services.html` / `pricing.html` | انکر `#<groupId>` از `AIO_SERVICE_GROUPS` |
| `dashboard.html` | انکر `#overview #resume #applications #alerts #courses #certs #saved #career #services #subscription #orders #notifications` |
| `employer.html` | انکر `#overview #addlab #post #jobs #applicants #resumes #exambuilder #training #matching #branding #hiring #reports #orders #pricing` |
| `login.html` / `register.html` | `role=employer\|supplier\|volunteer` |
| `index.html` | انکر `#categories #featured #map #onboarding #alerts #labs #services #academy #magazine #faq #employers` |

## قواعد

1. **هیچ `href="#"` در سایت نیست.** هر لینک مقصد واقعی دارد؛ اگر قابلیتی هنوز فعال نیست، لینک به نزدیک‌ترین صفحه‌ی مرتبط می‌رود و `toast` توضیح می‌دهد.
2. **بردکرامب** روی همه‌ی صفحات به‌جز خانه و ۴۰۴؛ صفحات دینامیک عنوان برگ را از داده می‌گیرند و `injectBreadcrumbLD(title)` را صدا می‌زنند.
3. **افزودن صفحه‌ی جدید:** یک سطر به `AIO_SITEMAP` (با `parent`)، در صورت نیاز یک سطر به `AIO_FOOTER`، سپس `python3 tools/build-sitemap.py` برای بازسازی `sitemap.xml`.
4. **بازگشت بعد از ورود:** `Store.set("after_login", "<url>")` پیش از هدایت به `login.html`؛ ورود همه‌ی نقش‌ها به همان آدرس برمی‌گردد.
5. **`data-page`** هر صفحه نام صفحه‌ی *والد در منو* است تا آیتم منو فعال (active) شود — مثلاً `course.html` و `learn.html` مقدار `courses.html` دارند.
6. **noindex:** `learn.html`، `course-builder.html`، `404.html`؛ در `robots.txt` هم `dashboard.html` و `employer.html` disallow شده‌اند.
