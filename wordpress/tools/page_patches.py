"""تغییرات HTML نسخه‌ی زنده نسبت به دمو — قبل از تبدیل لینک‌ها روی هر صفحه اعمال می‌شود.
هر مورد: (متن قدیم یا regex کامپایل‌شده, متن جدید). اگر متن قدیم پیدا نشود، ساخت متوقف می‌شود."""
import re

DEMO_NOTE = re.compile(r'\s*<div class="demo-note">.*?</div>', re.S)

PATCHES = {
    "job": [],
    "login": [
        (DEMO_NOTE, ""),
        ('<input type="text" id="email" placeholder="example@mail.com" required>',
         '<input type="text" id="email" placeholder="example@mail.com" autocomplete="username" dir="ltr" required>'),
        ('<input type="password" id="pass" placeholder="••••••••" required>',
         '<input type="password" id="pass" placeholder="••••••••" autocomplete="current-password" required>'),
        ('<button class="btn btn-primary btn-block btn-lg" type="submit">ورود</button>',
         '<label class="check-item" style="margin:-4px 0 14px"><input type="checkbox" id="remember" checked> مرا به خاطر بسپار</label>\n'
         '      <button class="btn btn-primary btn-block btn-lg" type="submit">ورود</button>\n      <div class="form-msg" id="form-msg"></div>'),
        ('<div class="alt-link">حساب کاربری ندارید؟',
         '<div class="alt-link"><a href="#" onclick="lostPass(event)">رمز عبور را فراموش کرده‌اید؟</a></div>\n      <div class="alt-link">حساب کاربری ندارید؟'),
    ],
    "register": [
        (DEMO_NOTE, ""),
        ('<label>شماره موبایل</label>\n        <input type="tel" id="phone" placeholder="09xxxxxxxxx" required>',
         '<label for="email">ایمیل</label>\n        <input type="email" id="email" placeholder="example@mail.com" autocomplete="email" dir="ltr" required>\n'
         '      </div>\n      <div class="form-field">\n        <label for="phone">شماره موبایل *</label>\n'
         '        <input type="tel" id="phone" placeholder="09xxxxxxxxx" autocomplete="tel" dir="ltr" inputmode="tel" pattern="0?9[0-9]{9}" required>'),
        ('<input type="password" id="pass" placeholder="حداقل ۸ کاراکتر" required>',
         '<input type="password" id="pass" placeholder="حداقل ۸ کاراکتر" autocomplete="new-password" minlength="8" required>'),
        ('<button class="btn btn-primary btn-block btn-lg" type="submit">ثبت‌نام</button>',
         '<button class="btn btn-primary btn-block btn-lg" type="submit">ثبت‌نام</button>\n      <div class="form-msg" id="form-msg"></div>'),
    ],
}


def apply_patches(name, body):
    for old, new in PATCHES.get(name, []):
        if hasattr(old, "subn"):
            body, n = old.subn(new, body)
        else:
            n = body.count(old)
            body = body.replace(old, new)
        if not n:
            raise SystemExit(f"patch not applied on {name}: {str(old)[:70]}")
    return body

PATCHES["dashboard"] = [
    ('<small>هرچه رزومه‌ی آیتمی‌تان کامل‌تر باشد', '<small id="ps-hint">هرچه رزومه‌ی آیتمی‌تان کامل‌تر باشد'),
    ('''        <div class="dash-stat"><b>۴</b><span>درخواست ارسال‌شده</span></div>
        <div class="dash-stat"><b>۱</b><span>دعوت به مصاحبه</span></div>
        <div class="dash-stat"><b>۲۸</b><span>بازدید پروفایل (۳۰ روز)</span> <span class="trend">▲ ۱۲٪</span></div>
        <div class="dash-stat"><b>۳</b><span>آگهی ذخیره‌شده</span></div>''',
     '''        <div class="dash-stat"><b id="st-apps">۰</b><span>درخواست ارسال‌شده</span></div>
        <div class="dash-stat"><b id="st-int">۰</b><span>دعوت به مصاحبه</span></div>
        <div class="dash-stat"><b id="st-views">۰</b><span>بازدید کارفرمایان از رزومه</span></div>
        <div class="dash-stat"><b id="st-saved">۰</b><span>آگهی ذخیره‌شده</span></div>'''),
    (re.compile(r'(<section id="sec-career">\s*<h1 class="dash-title">مسیر ارتقاء شغلی</h1>)\s*<div class="panel">.*?</div>\s*</div>\s*</div>\s*(</section>)', re.S),
     r'\1\n      <div class="panel" id="career-box"></div>\n    \2'),
]

PATCHES["employer"] = [
    ('<span>کارفرمای تأییدشده ✔️</span>', '<span id="p-sub"></span>'),
    ('''        <div class="dash-stat"><b>۳</b><span>آگهی فعال</span></div>
        <div class="dash-stat"><b>۱۲۲</b><span>درخواست دریافتی</span> <span class="trend">▲ ۱۸٪</span></div>
        <div class="dash-stat"><b>۴٬۶۳۰</b><span>بازدید آگهی‌ها (۳۰ روز)</span></div>
        <div class="dash-stat"><b>۲</b><span>استخدام موفق</span></div>''',
     '''        <div class="dash-stat"><b id="st-jobs">۰</b><span>آگهی فعال</span></div>
        <div class="dash-stat"><b id="st-apps">۰</b><span>درخواست دریافتی</span></div>
        <div class="dash-stat"><b id="st-views">۰</b><span>بازدید آگهی‌ها</span></div>
        <div class="dash-stat"><b id="st-hired">۰</b><span>استخدام موفق</span></div>'''),
    ('''        <b style="font-size:16px">اشتراک فعلی: پلن حرفه‌ای</b>
        <div class="bar"><i style="width:60%"></i></div>
        <small>۶ آگهی از ۱۰ آگهی ماهانه استفاده شده · اعتبار مشاهده رزومه: ۴۴ از ۱۰۰ · تمدید: ۱۴۰۵/۰۴/۲۰</small>''',
     '''        <b style="font-size:16px" id="plan-title">وضعیت حساب</b>
        <div class="bar"><i id="plan-bar" style="width:0%"></i></div>
        <small id="plan-hint"></small>'''),
    ('''      <div class="panel">
        <h2>اطلاعات مرکز</h2>''', '''      <div class="panel" id="my-labs-panel"></div>
      <div class="panel">
        <h2 id="lb-form-title">اطلاعات مرکز</h2>'''),
    ('''          <div class="form-field full"><label>آدرس دقیق</label><input type="text" id="lb-address" placeholder="خیابان، کوچه، پلاک"></div>''',
     '''          <div class="form-field full"><label>آدرس دقیق</label><input type="text" id="lb-address" placeholder="خیابان، کوچه، پلاک"></div>
          <div class="form-field"><label>تلفن سازمان *</label><input type="tel" id="lb-phone" dir="ltr" placeholder="021xxxxxxxx"></div>
          <div class="form-field"><label>ایمیل سازمان *</label><input type="email" id="lb-email" dir="ltr" placeholder="info@example.ir"></div>
          <div class="form-field"><label>وب‌سایت</label><input type="url" id="lb-website" dir="ltr" placeholder="https://"></div>
          <div class="form-field"><label>تعداد پرسنل</label><input type="number" id="lb-staff" min="1"></div>'''),
    ('<input type="text" id="lb-salary-date" value="۱۴۰۵/۰۴/۰۵" readonly>', '<input type="text" id="lb-salary-date" value="" readonly>'),
    ('''        <button class="btn btn-outline" onclick="toast('پیش‌نویس ذخیره شد (دمو)')">ذخیره پیش‌نویس</button>
        <button class="btn btn-primary btn-lg" onclick="submitLab()">ثبت مرکز و ارسال برای تأیید</button>''',
     '''        <small class="muted" id="lb-draft-note" style="margin-inline-end:auto"></small>
        <button class="btn btn-ghost" id="lb-cancel" style="display:none" onclick="editLab(0)">انصراف از ویرایش</button>
        <button class="btn btn-outline" id="lb-draft" onclick="saveLabDraft(this)">ذخیره پیش‌نویس</button>
        <button class="btn btn-primary btn-lg" id="lb-submit" onclick="submitLab(this)">ثبت مرکز و ارسال برای تأیید</button>'''),
    (re.compile(r'<section id="sec-applicants">.*?</section>', re.S),
     '''<section id="sec-applicants">
      <h1 class="dash-title">مدیریت متقاضیان</h1>
      <p class="dash-sub">قیف استخدام: درخواست / دعوت ← دیده‌شده ← فهرست کوتاه ← مصاحبه ← پیشنهاد همکاری ← استخدام. روی هر ردیف بزنید تا رزومه، تطبیق، گفتگو و اقدام‌ها باز شود؛ کارجو در هر مرحله با اعلان و ایمیل باخبر می‌شود.</p>
      <div id="ats"></div>
    </section>'''),
    (re.compile(r'<div class="form-field"><label>اعتبار گواهی</label>\s*<select>.*?</select></div>', re.S),
     '''<div class="form-field"><label>اعتبار گواهی</label>
            <select id="eb-valid"><option value="12">۱ سال</option><option value="24">۲ سال</option><option value="36">۳ سال</option><option value="0">بدون انقضا</option></select></div>'''),
    (re.compile(r'<label class="check-item"><input type="checkbox" checked> صدور خودکار گواهی.*?نمره بالای ۹۰٪</label>', re.S),
     '''<label class="check-item"><input type="checkbox" id="eb-autocert" checked> صدور خودکار گواهی و افزودن به رزومه در صورت قبولی</label>
            <label class="check-item"><input type="checkbox" id="eb-top" checked> نمایش دارندگان گواهی در بالای نتایج بانک رزومه من</label>
            <label class="check-item"><input type="checkbox" id="eb-invite"> ارسال خودکار دعوت‌نامه مصاحبه به قبول‌شدگان با نمره بالای <input type="number" id="eb-invite-score" value="90" min="50" max="100" style="width:64px;display:inline-block;padding:2px 6px" aria-label="حداقل نمره دعوت">٪</label>
            <p class="muted" style="font-size:12.5px">دعوت خودکار برای جدیدترین آگهی فعال شما (ترجیحاً در همان بخش تخصصی) ارسال می‌شود و در «مدیریت متقاضیان» دیده می‌شود.</p>'''),
    ('<button class="btn btn-primary btn-lg" onclick="submitExam()">ارسال برای بازبینی و انتشار</button>',
     '<button class="btn btn-primary btn-lg" onclick="submitExam(this)">ارسال برای بازبینی و انتشار</button>'),
    ('<thead><tr><th>عنوان</th><th>سطح</th><th>سؤال</th><th>شرکت‌کننده</th><th>گواهی صادرشده</th><th>وضعیت</th></tr></thead>',
     '<thead><tr><th>عنوان</th><th>سطح</th><th>سؤال</th><th>شرکت‌کننده</th><th>گواهی صادرشده</th><th>وضعیت</th></tr></thead>'),
    ('<h2>آزمون‌های منتشرشده من</h2>', '<h2>آزمون‌های من</h2>'),
    (re.compile(r'<div class="pricing-grid">.*?(</section>)', re.S),
     r'<div class="credit-strip" id="emp-credits"></div>\n      <div class="pricing-grid" id="emp-plans"></div>\n      <h2 style="font-size:17px;margin:26px 0 14px">بسته‌های آگهی</h2>\n      <div class="svc-grid" id="emp-posting"></div>\n    \1'),
]

PATCHES["lab"] = [
    ('''<button class="btn btn-outline" onclick="toast('دنبال شد ✓ از این پس آگهی‌های جدید این مجموعه را در اعلان‌ها می‌بینید')">+ دنبال کردن</button>''',
     '''<button class="btn btn-outline" id="follow-btn" onclick="followLab(this)">+ دنبال کردن</button>'''),
    ('''onclick="location.href='ranking.html'">مشاهده در جدول رتبه‌بندی</button>''',
     '''onclick="location.href='ranking.html'">مشاهده در جدول رتبه‌بندی</button>
      <button class="btn btn-primary" id="rate-btn" onclick="rateThisLab()">ثبت امتیاز و نظر</button>'''),
]
PATCHES["ranking"] = [
    ('''    <div id="rm-stars"></div>''', '''    <div class="form-field"><label>نسبت شما با این مرکز</label><select id="rm-role"><option>پرسنل فعلی</option><option>پرسنل پیشین</option><option>کارآموز</option><option>متقاضی مصاحبه‌شده</option></select></div>
    <div id="rm-stars"></div>'''),
    ('''<button class="btn btn-primary" onclick="submitRate()">ثبت نظر ناشناس</button>''', '''<button class="btn btn-primary" onclick="submitRate(this)">ثبت نظر ناشناس</button>'''),
]

PATCHES["course-builder"] = [
    ('<span class="status-pill draft" id="b-status">پیش‌نویس</span>', '<span class="status-pill draft" id="b-status">پیش‌نویس</span> <small id="b-save-state" class="muted"></small>'),
]


def _stat(ic, bg, fg, n, t):
    return (f'      <div class="stat-card"><div class="ic" style="background:{bg};color:{fg}">[aio_icon name="{ic}"]</div>'
            f'<div><b>{n}</b><span>{t}</span></div></div>\n')


def _step(i, t, d):
    return f'      <div class="step-card"><div class="num">{i}</div><h3>{t}</h3><p>{d}</p></div>\n'


PATCHES["advertise"] = [
    ('<div class="stats-strip flat" id="ad-stats"></div>',
     '<div class="stats-strip flat" id="ad-stats">\n'
     + _stat("users", "#ede9fe", "#6d28d9", "+۸٬۵۰۰", "کارجوی متخصص آزمایشگاه")
     + _stat("building", "#ccfbf1", "#0f766e", "+۴۶۰", "آزمایشگاه و مرکز عضو")
     + _stat("pin", "#e0f2fe", "#0369a1", '[aio_count type="provinces"]', "استان تحت پوشش")
     + _stat("chart", "#fef3c7", "#92400e", "۱۰۰٪", "مخاطب تخصصی، بدون هدررفت")
     + '    </div>'),
    ('<div class="steps-grid four" id="why-grid"></div>',
     '<div class="steps-grid four" id="why-grid">\n'
     + _step("۱", "مخاطب کاملاً هدفمند", "بازدیدکننده آیولب کارشناس، مسئول فنی یا مدیر آزمایشگاه است — همان کسی که با دستگاه شما کار می‌کند یا آن را می‌خرد.")
     + _step("۲", "گزارش شفاف عملکرد", "تعداد نمایش، کلیک و مسیر ورود کاربران را در پایان هر دوره دریافت می‌کنید.")
     + _step("۳", "قالب‌های متنوع", "از بنر ساده تا رپورتاژ اختصاصی و اسپانسری پادکست؛ متناسب با بودجه و هدف شما.")
     + _step("۴", "اعتبار محتوایی", "تبلیغ شما در کنار محتوای تخصصی و مورد اعتماد جامعه آزمایشگاهی نمایش داده می‌شود.")
     + '    </div>'),
]
PATCHES["reports"] = [
    ('<div class="steps-grid four" id="rep-topics"></div>',
     '<div class="steps-grid four" id="rep-topics">\n'
     + _step("۱", "حقوق و دستمزد", "میانگین، کمینه و بیشینه حقوق به تفکیک تخصص، سابقه، شیفت و استان.")
     + _step("۲", "عرضه و تقاضا", "نسبت تعداد کارجو به فرصت شغلی در هر تخصص؛ کدام رشته اشباع است و کدام کمبود نیرو دارد.")
     + _step("۳", "نرخ استخدام", "میانگین زمان پرشدن هر آگهی و نرخ موفقیت جذب در آزمایشگاه‌ها و دانشگاه‌ها.")
     + _step("۴", "روند مهارت‌ها", "مهارت‌ها و دستگاه‌هایی که تقاضا برایشان در حال رشد یا افول است.")
     + '    </div>'),
]

PATCHES["job"].append(("onclick=\"toast('آگهی در نشان‌شده‌ها ذخیره شد ✓')\"", 'onclick="toggleSave()"'))
PATCHES["pricing"] = [("onclick=\"toast('کارشناسان ما با شما تماس می‌گیرند (دمو)')\"", 'onclick="requestEnterprise(this)"')]
