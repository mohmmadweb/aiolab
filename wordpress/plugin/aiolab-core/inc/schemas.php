<?php
/* تعریف فیلدهای هر نوع محتوا — منبع واحد برای پیشخوان، API و خروجی داده */
defined('ABSPATH') || exit;

const AIO_ICON_NAMES = ['flask', 'drop', 'microbe', 'scope', 'syringe', 'shield', 'dna', 'briefcase', 'search', 'pin', 'users', 'building', 'doc', 'chart', 'heart', 'comment', 'share', 'bookmark', 'home', 'bell', 'settings', 'plus', 'grad', 'path', 'machine', 'clock', 'filter', 'send'];

function aio_provinces(): array
{
    static $p = null;
    if ($p === null) {
        $p = json_decode((string) file_get_contents(AIO_DIR . 'data/geo.json'), true) ?: [];
    }
    return $p;
}

function aio_province_options(): array
{
    $o = [];
    foreach (aio_provinces() as $p) $o[$p['id']] = $p['name'];
    return $o;
}

function aio_province_name(string $id): string
{
    foreach (aio_provinces() as $p) if ($p['id'] === $id) return $p['name'];
    return '';
}

function aio_province_of_city(string $city): string
{
    foreach (aio_provinces() as $p) if (in_array($city, $p['cities'], true)) return $p['id'];
    return '';
}

function aio_weekday_options(): array
{
    return array_combine(array_map('strval', array_keys(AIO_WEEKDAYS)), AIO_WEEKDAYS);
}

function aio_icon_options(): array
{
    return array_combine(AIO_ICON_NAMES, AIO_ICON_NAMES);
}

/** گرنت‌هایی که پرداخت یک خدمت به کاربر می‌دهد */
function aio_grant_types(): array
{
    return [
        'job_credits'      => 'اعتبار آگهی عادی (تعداد)',
        'featured_credits' => 'اعتبار آگهی ویژه (تعداد)',
        'urgent_credits'   => 'اعتبار آگهی فوری (تعداد)',
        'resume_bank_days' => 'دسترسی بانک رزومه (روز)',
        'plan_days'        => 'اشتراک ویژه (روز)',
    ];
}

add_action('init', function () {
    $geo_city = ['type' => 'text', 'label' => 'شهر', 'placeholder' => 'مثلاً: تهران'];

    /* ---------------- آگهی شغلی ---------------- */
    AIO_Fields::post_box('aio_job', 'job', 'مشخصات آگهی', [
        'lab_id'        => ['type' => 'post', 'post_type' => 'aio_lab', 'label' => 'مرکز / کارفرما'],
        'vertical'      => ['type' => 'select', 'label' => 'حوزه', 'options' => 'list:verticals', 'default' => 'lab'],
        'province'      => ['type' => 'select', 'label' => 'استان', 'options' => 'aio_province_options'],
        'city'          => $geo_city,
        'type'          => ['type' => 'select', 'label' => 'نوع همکاری', 'options' => 'list:job_types'],
        'shift'         => ['type' => 'select', 'label' => 'شیفت کاری', 'options' => 'list:shifts'],
        'salary'        => ['type' => 'text', 'label' => 'متن حقوق', 'placeholder' => 'مثلاً: ۱۸ تا ۲۴ میلیون تومان'],
        'salary_min'    => ['type' => 'number', 'label' => 'حداقل حقوق (میلیون تومان)'],
        'salary_max'    => ['type' => 'number', 'label' => 'حداکثر حقوق (میلیون تومان)'],
        'experience'    => ['type' => 'select', 'label' => 'سابقه کار', 'options' => 'list:experiences'],
        'degree'        => ['type' => 'select', 'label' => 'مدرک تحصیلی', 'options' => 'list:degrees'],
        'field_of_study' => ['type' => 'select', 'label' => 'رشته تحصیلی', 'options' => 'list:fields_study'],
        'gender'        => ['type' => 'select', 'label' => 'جنسیت', 'options' => 'list:genders'],
        'military'      => ['type' => 'select', 'label' => 'وضعیت سربازی', 'options' => 'list:military'],
        'remote'        => ['type' => 'bool', 'label' => 'دورکاری', 'on_label' => 'امکان دورکاری دارد'],
        'urgent'        => ['type' => 'bool', 'label' => 'فوری', 'on_label' => 'نشان «فوری»'],
        'featured'      => ['type' => 'bool', 'label' => 'ویژه', 'on_label' => 'نشان «ویژه» و نمایش در صفحه اول'],
        'expires'       => ['type' => 'date', 'label' => 'تاریخ انقضا', 'desc' => 'پس از این تاریخ آگهی خودکار «منقضی» می‌شود.'],
        'benefits'      => ['type' => 'multi', 'label' => 'مزایا', 'options' => 'list:benefits'],
        'skills'        => ['type' => 'lines', 'label' => 'مهارت‌های موردنیاز', 'rows' => 4],
        'requirements'  => ['type' => 'lines', 'label' => 'شرایط احراز', 'rows' => 5],
    ]);
    AIO_Fields::post_box('aio_job', 'job_req', 'نیازمندی‌های ساخت‌یافته (موتور تطبیق)', [
        'internal'      => ['type' => 'bool', 'label' => 'پوزیشن داخلی', 'on_label' => 'در سایت نمایش داده نشود؛ فقط برای تطبیق نیرو (مثلاً برای مشتری بیرون از سایت)'],
        'client_name'   => ['type' => 'text', 'label' => 'نام مشتری / سازمان مقصد (پوزیشن داخلی)'],
        'req_role'      => ['type' => 'select', 'label' => 'عنوان شغلی استاندارد', 'options' => 'terms:aio_role'],
        'req_seniority' => ['type' => 'select', 'label' => 'رده شغلی لازم', 'options' => 'list:seniority'],
        'req_min_exp'   => ['type' => 'number', 'label' => 'حداقل سابقه کل (سال)', 'desc' => 'از تاریخ‌های سوابق متقاضی محاسبه می‌شود؛ ۰٫۵ = شش ماه.'],
        'req_exp_dept'  => ['type' => 'number', 'label' => 'حداقل سابقه در بخش همین آگهی (سال)'],
        'req_degree'    => ['type' => 'select', 'label' => 'حداقل مقطع', 'options' => 'list:degree_levels'],
        'req_age_min'   => ['type' => 'number', 'label' => 'حداقل سن (اختیاری)'],
        'req_age_max'   => ['type' => 'number', 'label' => 'حداکثر سن (اختیاری)'],
        'req_fields'    => ['type' => 'multi', 'label' => 'رشته‌های قابل‌قبول', 'options' => 'list:fields_study'],
        'req_licenses'  => ['type' => 'multi', 'label' => 'مدارک / پروانه‌های الزامی', 'options' => 'terms:aio_license'],
        'req_military'  => ['type' => 'multi', 'label' => 'وضعیت نظام وظیفه‌ی قابل‌قبول (آقایان)', 'options' => 'list:military'],
        'req_langs'     => ['type' => 'repeater', 'label' => 'زبان خارجی', 'item_label' => 'زبان', 'fields' => [
            'id'  => ['type' => 'select', 'label' => 'زبان', 'options' => 'list:languages'],
            'lvl' => ['type' => 'select', 'label' => 'حداقل سطح', 'options' => 'list:lang_levels'],
        ]],
        'req_skills'    => ['type' => 'repeater', 'label' => 'مهارت‌ها و دستگاه‌ها', 'item_label' => 'مهارت', 'fields' => [
            'id'   => ['type' => 'select', 'label' => 'مهارت / دستگاه', 'options' => 'terms:aio_skill'],
            'lvl'  => ['type' => 'select', 'label' => 'سطح لازم', 'options' => 'list:skill_levels'],
            'w'    => ['type' => 'number', 'label' => 'وزن (۱ تا ۱۰)'],
            'must' => ['type' => 'bool', 'label' => 'کلیدی (بدون آن واجد شرایط نیست)'],
        ], 'desc' => 'جنسیت از فیلد «جنسیت» بالا خوانده می‌شود.'],
    ]);
    AIO_Fields::post_box('aio_job', 'job_stats', 'آمار آگهی', [
        'views' => ['type' => 'number', 'label' => 'تعداد بازدید'],
        'plan'  => ['type' => 'select', 'label' => 'پلن آگهی', 'options' => ['normal' => 'عادی', 'featured' => 'ویژه', 'urgent' => 'فوری']],
    ], 'side', 'default');

    /* ---------------- مرکز / آزمایشگاه ---------------- */
    AIO_Fields::post_box('aio_lab', 'lab', 'مشخصات مرکز', [
        'type'      => ['type' => 'text', 'label' => 'نوع مرکز', 'placeholder' => 'مثلاً: آزمایشگاه تشخیص طبی'],
        'vertical'  => ['type' => 'select', 'label' => 'حوزه', 'options' => 'list:verticals', 'default' => 'lab'],
        'sector'    => ['type' => 'select', 'label' => 'نوع سازمان', 'options' => 'list:sectors'],
        'org_kind'  => ['type' => 'select', 'label' => 'دسته سازمان', 'options' => 'list:org_kinds'],
        'size'      => ['type' => 'select', 'label' => 'اندازه سازمان', 'options' => 'list:org_sizes'],
        'staff'     => ['type' => 'number', 'label' => 'تعداد پرسنل'],
        'founded'   => ['type' => 'number', 'label' => 'سال تأسیس (شمسی)'],
        'verified'  => ['type' => 'bool', 'label' => 'تأییدشده', 'on_label' => 'نشان «تأییدشده» ✔️'],
        'color'     => ['type' => 'color', 'label' => 'رنگ برند', 'default' => '#0d9488'],
        'perks'     => ['type' => 'multi', 'label' => 'مزایای کاری', 'options' => 'list:benefits'],
        'loc'       => ['type' => 'heading', 'label' => 'موقعیت و تماس'],
        'province'  => ['type' => 'select', 'label' => 'استان', 'options' => 'aio_province_options'],
        'city'      => $geo_city,
        'address'   => ['type' => 'text', 'label' => 'نشانی', 'width' => 'full'],
        'lat'       => ['type' => 'number', 'label' => 'عرض جغرافیایی (lat)'],
        'lng'       => ['type' => 'number', 'label' => 'طول جغرافیایی (lng)'],
        'map'       => ['type' => 'map', 'label' => 'انتخاب روی نقشه', 'desc' => 'روی نقشه کلیک کنید تا مختصات پر شود.'],
        'phone'     => ['type' => 'text', 'label' => 'تلفن *', 'ltr' => true],
        'email'     => ['type' => 'email', 'label' => 'ایمیل سازمان *', 'desc' => 'اطلاع‌رسانی درخواست‌ها و پیام‌ها و نمایش در صفحه‌ی سازمان.'],
        'website'   => ['type' => 'url', 'label' => 'وب‌سایت'],
        'salary_h'  => ['type' => 'heading', 'label' => 'حقوق و امتیاز'],
        'avg_salary' => ['type' => 'number', 'label' => 'میانگین حقوق (میلیون تومان)'],
        'avg_salary_updated' => ['type' => 'text', 'label' => 'تاریخ به‌روزرسانی حقوق', 'placeholder' => '۱۴۰۵/۰۳/۱۲'],
        'rating_base' => ['type' => 'number', 'label' => 'امتیاز پایه (۰ تا ۵)', 'desc' => 'امتیاز سوابق قبلی؛ با نظرات تأییدشده‌ی کاربران ترکیب می‌شود.'],
        'rating_count_base' => ['type' => 'number', 'label' => 'تعداد نظرات پایه'],
        'rb_salary' => ['type' => 'number', 'label' => 'پایه: حقوق و مزایا'],
        'rb_environment' => ['type' => 'number', 'label' => 'پایه: محیط کاری'],
        'rb_learning' => ['type' => 'number', 'label' => 'پایه: یادگیری'],
        'rb_management' => ['type' => 'number', 'label' => 'پایه: مدیریت'],
        'rb_worklife' => ['type' => 'number', 'label' => 'پایه: تعادل کار و زندگی'],
    ]);

    AIO_Fields::post_box('aio_lab', 'lab_profile', 'پروفایل کامل سازمان (گالری، خدمات، ساعات، شبکه‌ها)', [
        'org_type'       => ['type' => 'select', 'label' => 'نوع سازمان', 'options' => 'list:org_types', 'desc' => 'آزمایشگاه‌ها و شرکت‌ها در صفحه‌های جداگانه نمایش داده می‌شوند.'],
        'tagline'        => ['type' => 'text', 'label' => 'شعار / معرفی یک‌خطی', 'width' => 'full'],
        'gallery'        => ['type' => 'gallery', 'label' => 'گالری تصاویر (اسلایدر صفحه‌ی سازمان)'],
        'services'       => ['type' => 'multi', 'label' => 'خدمات', 'options' => 'list:org_services'],
        'accreditations' => ['type' => 'multi', 'label' => 'گواهی‌ها و اعتباربخشی', 'options' => 'list:accreditations'],
        'hours_days'     => ['type' => 'multi', 'label' => 'روزهای کاری', 'options' => 'aio_weekday_options'],
        'hours_from'     => ['type' => 'number', 'label' => 'ساعت شروع'],
        'hours_to'       => ['type' => 'number', 'label' => 'ساعت پایان'],
        'hours_24'       => ['type' => 'bool', 'label' => 'شبانه‌روزی'],
        'branches'       => ['type' => 'number', 'label' => 'تعداد شعب / نمایندگی'],
        'video'          => ['type' => 'url', 'label' => 'ویدئوی معرفی (آپارات)'],
        'social_instagram' => ['type' => 'url', 'label' => 'اینستاگرام'],
        'social_linkedin'  => ['type' => 'url', 'label' => 'لینکدین'],
        'social_telegram'  => ['type' => 'url', 'label' => 'تلگرام'],
        'social_aparat'    => ['type' => 'url', 'label' => 'آپارات'],
    ]);

    /* ---------------- محصول ---------------- */
    AIO_Fields::post_box('aio_product', 'product', 'مشخصات محصول', [
        'lab_id' => ['type' => 'post', 'post_type' => 'aio_lab', 'label' => 'سازمان (شرکت / آزمایشگاه)'],
        'brand'  => ['type' => 'text', 'label' => 'برند'],
        'model'  => ['type' => 'text', 'label' => 'مدل', 'ltr' => true],
        'price'  => ['type' => 'number', 'label' => 'قیمت (تومان)', 'desc' => 'خالی = «استعلام قیمت».'],
        'specs'  => ['type' => 'repeater', 'label' => 'مشخصات فنی', 'item_label' => 'ردیف', 'title_key' => 'k', 'fields' => [
            'k' => ['type' => 'text', 'label' => 'ویژگی'], 'v' => ['type' => 'text', 'label' => 'مقدار'],
        ]],
    ]);

    /* ---------------- آزمون مهارت ---------------- */
    AIO_Fields::post_box('aio_exam', 'exam', 'تنظیمات آزمون', [
        'vertical'    => ['type' => 'select', 'label' => 'حوزه', 'options' => 'list:verticals', 'default' => 'lab'],
        'level'       => ['type' => 'select', 'label' => 'سطح', 'options' => 'list:exam_levels'],
        'author_lab'  => ['type' => 'post', 'post_type' => 'aio_lab', 'label' => 'طراح آزمون (مرکز)'],
        'duration'    => ['type' => 'number', 'label' => 'مدت (دقیقه)', 'default' => 15],
        'pass_score'  => ['type' => 'number', 'label' => 'حد نصاب قبولی (٪)', 'default' => 60],
        'retake_days' => ['type' => 'number', 'label' => 'فاصله‌ی شرکت مجدد (روز)', 'default' => 7],
        'price'       => ['type' => 'number', 'label' => 'هزینه شرکت (تومان)', 'default' => 0, 'desc' => '۰ یعنی رایگان.'],
        'badge'       => ['type' => 'text', 'label' => 'نشان (ایموجی)', 'default' => '🏅'],
        'color'       => ['type' => 'color', 'label' => 'رنگ', 'default' => '#0d9488'],
        'bg'          => ['type' => 'color', 'label' => 'رنگ زمینه', 'default' => '#ccfbf1'],
        'takers_base' => ['type' => 'number', 'label' => 'شرکت‌کنندگان پایه', 'desc' => 'به شمار شرکت‌کنندگان واقعی افزوده می‌شود.'],
        'certs_base'  => ['type' => 'number', 'label' => 'گواهی‌های صادرشده پایه'],
        'auto_cert'   => ['type' => 'bool', 'label' => 'صدور خودکار گواهی', 'default' => 1, 'desc' => 'در صورت قبولی، گواهی صادر و به رزومه افزوده می‌شود.'],
        'cert_valid'  => ['type' => 'select', 'label' => 'اعتبار گواهی', 'options' => 'aio_exam_valid_options', 'default' => '0', 'desc' => 'گزینه‌ها از «تنظیمات آیولب ← آزمون و گواهی».'],
        'holders_top' => ['type' => 'bool', 'label' => 'دارندگان گواهی بالای بانک رزومه‌ی طراح', 'default' => 1],
        'auto_invite' => ['type' => 'bool', 'label' => 'دعوت خودکار به مصاحبه', 'default' => 0, 'desc' => 'قبول‌شدگان با نمره‌ی بالاتر از حد زیر به آخرین آگهی فعال طراح دعوت می‌شوند.'],
        'invite_score'=> ['type' => 'number', 'label' => 'حداقل نمره برای دعوت خودکار (٪)', 'default' => 90],
        'questions'   => ['type' => 'repeater', 'label' => 'سؤالات', 'item_label' => 'سؤال', 'title_key' => 'q', 'fields' => [
            'q'       => ['type' => 'textarea', 'label' => 'متن سؤال', 'rows' => 2],
            'options' => ['type' => 'lines', 'label' => 'گزینه‌ها (هر گزینه یک خط)', 'rows' => 4],
            'correct' => ['type' => 'number', 'label' => 'شماره گزینه‌ی صحیح (از ۱)'],
        ]],
    ]);

    /* ---------------- دوره ---------------- */
    $quiz_q = ['type' => 'repeater', 'label' => 'سؤالات آزمون درس', 'item_label' => 'سؤال', 'title_key' => 'q', 'fields' => [
        'q'       => ['type' => 'textarea', 'label' => 'متن سؤال', 'rows' => 2],
        'options' => ['type' => 'lines', 'label' => 'گزینه‌ها', 'rows' => 4],
        'correct' => ['type' => 'number', 'label' => 'گزینه‌ی صحیح (از ۱)'],
    ]];
    AIO_Fields::post_box('aio_course', 'course', 'مشخصات دوره', [
        'type'        => ['type' => 'select', 'label' => 'نوع', 'options' => ['course' => 'دوره', 'guided' => 'پروژه راهنما'], 'default' => 'course'],
        'subtitle'    => ['type' => 'textarea', 'label' => 'زیرعنوان', 'rows' => 2, 'width' => 'full'],
        'level'       => ['type' => 'select', 'label' => 'سطح', 'options' => 'list:course_levels'],
        'format'      => ['type' => 'select', 'label' => 'شیوه برگزاری', 'options' => 'list:course_formats'],
        'lang'        => ['type' => 'select', 'label' => 'زبان', 'options' => 'list:course_langs'],
        'provider'    => ['type' => 'post', 'post_type' => 'aio_provider', 'key' => 'slug', 'label' => 'ارائه‌دهنده'],
        'instructors' => ['type' => 'posts', 'post_type' => 'aio_instructor', 'key' => 'slug', 'label' => 'مدرسان'],
        'price'       => ['type' => 'number', 'label' => 'قیمت (تومان)', 'desc' => '۰ یعنی رایگان.'],
        'old_price'   => ['type' => 'number', 'label' => 'قیمت قبل از تخفیف'],
        'hours'       => ['type' => 'number', 'label' => 'مدت (ساعت)'],
        'weeks'       => ['type' => 'number', 'label' => 'طول دوره (هفته)'],
        'cert'        => ['type' => 'bool', 'label' => 'گواهی', 'on_label' => 'گواهی پایان دوره صادر می‌شود', 'default' => 1],
        'cert_type'   => ['type' => 'text', 'label' => 'نوع گواهی', 'default' => 'گواهی مهارت آیولب'],
        'updated'     => ['type' => 'text', 'label' => 'آخرین به‌روزرسانی', 'placeholder' => '۱۴۰۵/۰۳'],
        'related_exam' => ['type' => 'post', 'post_type' => 'aio_exam', 'label' => 'آزمون مرتبط'],
        'bestseller'  => ['type' => 'bool', 'label' => 'برچسب «پرفروش»'],
        'is_new'      => ['type' => 'bool', 'label' => 'برچسب «جدید»'],
        'featured'    => ['type' => 'bool', 'label' => 'برچسب «پیشنهاد آیولب»'],
        'next_start'  => ['type' => 'text', 'label' => 'شروع دوره بعدی (برای زنده/حضوری)'],
        'seats'       => ['type' => 'number', 'label' => 'ظرفیت'],
        'skills'      => ['type' => 'lines', 'label' => 'مهارت‌ها'],
        'outcomes'    => ['type' => 'lines', 'label' => 'آنچه یاد می‌گیرید'],
        'prereq'      => ['type' => 'lines', 'label' => 'پیش‌نیازها'],
        'audience'    => ['type' => 'lines', 'label' => 'مخاطبان'],
        'stats_h'     => ['type' => 'heading', 'label' => 'آمار پایه (با آمار واقعی جمع می‌شود)'],
        'students_base' => ['type' => 'number', 'label' => 'فراگیران پایه'],
        'rating_base' => ['type' => 'number', 'label' => 'امتیاز پایه (۰ تا ۵)'],
        'rating_count_base' => ['type' => 'number', 'label' => 'تعداد امتیاز پایه'],
    ]);
    AIO_Fields::post_box('aio_course', 'syllabus', 'سرفصل و محتوای درس‌ها', [
        'syllabus' => ['type' => 'repeater', 'label' => 'ماژول‌ها', 'item_label' => 'ماژول', 'title_key' => 'title', 'fields' => [
            'title'   => ['type' => 'text', 'label' => 'عنوان ماژول'],
            'hours'   => ['type' => 'number', 'label' => 'ساعت'],
            'lessons' => ['type' => 'repeater', 'label' => 'درس‌ها', 'item_label' => 'درس', 'title_key' => 't', 'fields' => [
                't'     => ['type' => 'text', 'label' => 'عنوان درس'],
                'type'  => ['type' => 'select', 'label' => 'نوع', 'options' => 'list:lesson_types'],
                'min'   => ['type' => 'number', 'label' => 'دقیقه'],
                'video' => ['type' => 'url', 'label' => 'نشانی ویدئو (mp4 یا آپارات/یوتیوب)'],
                'body'  => ['type' => 'html', 'label' => 'متن درس (HTML مجاز)', 'rows' => 5],
                'questions' => $quiz_q,
            ]],
        ]],
    ]);
    AIO_Fields::post_box('aio_course', 'course_faq', 'پرسش‌های پرتکرار دوره', [
        'faq' => ['type' => 'repeater', 'label' => 'پرسش‌ها', 'item_label' => 'پرسش', 'title_key' => 'q', 'fields' => [
            'q' => ['type' => 'text', 'label' => 'پرسش'],
            'a' => ['type' => 'textarea', 'label' => 'پاسخ', 'rows' => 3],
        ]],
    ], 'normal', 'default');

    /* ---------------- مسیر یادگیری ---------------- */
    AIO_Fields::post_box('aio_path', 'path', 'مشخصات مسیر', [
        'kind'     => ['type' => 'select', 'label' => 'نوع', 'options' => ['specialization' => 'مسیر تخصصی', 'professional' => 'گواهی حرفه‌ای']],
        'role'     => ['type' => 'text', 'label' => 'نقش شغلی هدف'],
        'level'    => ['type' => 'text', 'label' => 'سطح', 'placeholder' => 'متوسط تا پیشرفته'],
        'courses'  => ['type' => 'posts', 'post_type' => 'aio_course', 'label' => 'دوره‌ها (به ترتیب)'],
        'cert'     => ['type' => 'text', 'label' => 'عنوان گواهی'],
        'related_exam' => ['type' => 'post', 'post_type' => 'aio_exam', 'label' => 'آزمون مرتبط'],
        'icon'     => ['type' => 'select', 'label' => 'آیکن', 'options' => 'aio_icon_options', 'default' => 'path'],
        'color'    => ['type' => 'color', 'label' => 'رنگ'],
        'bg'       => ['type' => 'color', 'label' => 'رنگ زمینه'],
        'students_base' => ['type' => 'number', 'label' => 'فراگیران پایه'],
        'rating'   => ['type' => 'number', 'label' => 'امتیاز'],
        'outcomes' => ['type' => 'lines', 'label' => 'دستاوردها'],
    ]);

    AIO_Fields::post_box('aio_instructor', 'instructor', 'مشخصات مدرس', [
        'title'    => ['type' => 'text', 'label' => 'عنوان / تخصص'],
        'org'      => ['type' => 'text', 'label' => 'سازمان'],
        'color'    => ['type' => 'color', 'label' => 'رنگ'],
        'students' => ['type' => 'number', 'label' => 'تعداد فراگیران'],
        'rating'   => ['type' => 'number', 'label' => 'امتیاز'],
        'courses_count' => ['type' => 'number', 'label' => 'تعداد دوره‌ها'],
    ]);
    AIO_Fields::post_box('aio_provider', 'provider', 'مشخصات ارائه‌دهنده', [
        'kind'   => ['type' => 'text', 'label' => 'نوع', 'placeholder' => 'دانشگاه / مرکز تشخیصی / شرکت'],
        'color'  => ['type' => 'color', 'label' => 'رنگ'],
        'lab_id' => ['type' => 'post', 'post_type' => 'aio_lab', 'label' => 'مرکز مرتبط'],
    ]);

    /* ---------------- خدمت ---------------- */
    AIO_Fields::post_box('aio_service', 'service', 'مشخصات خدمت', [
        'code'        => ['type' => 'text', 'label' => 'کد خدمت', 'ltr' => true, 'placeholder' => 'R1'],
        'stream'      => ['type' => 'text', 'label' => 'جریان درآمد (متن)'],
        'payer'       => ['type' => 'select', 'label' => 'مخاطب پرداخت', 'options' => 'list:payers'],
        'model'       => ['type' => 'select', 'label' => 'مدل پرداخت', 'options' => 'list:pay_models'],
        'priority'    => ['type' => 'number', 'label' => 'اولویت'],
        'price'       => ['type' => 'number', 'label' => 'قیمت (تومان)', 'desc' => 'خالی = توافقی / درصدی ، ۰ = رایگان'],
        'unit'        => ['type' => 'text', 'label' => 'واحد', 'placeholder' => 'هر آگهی'],
        'price_model' => ['type' => 'text', 'label' => 'مدل قیمت‌گذاری'],
        'free_label'  => ['type' => 'text', 'label' => 'برچسب رایگان'],
        'price_label' => ['type' => 'text', 'label' => 'برچسب توافقی'],
        'highlight'   => ['type' => 'bool', 'label' => 'پیشنهاد آیولب'],
        'limited'     => ['type' => 'bool', 'label' => 'ظرفیت محدود'],
        'plan'        => ['type' => 'bool', 'label' => 'اشتراک سالانه (نمایش در جدول پلن‌ها)'],
        'period_days' => ['type' => 'number', 'label' => 'مدت اعتبار (روز)', 'desc' => 'برای خدمات بازه‌ای؛ مثلاً ۳۶۵'],
        'note'        => ['type' => 'text', 'label' => 'یادداشت', 'width' => 'full'],
        'features'    => ['type' => 'lines', 'label' => 'ویژگی‌ها'],
        'grants'      => ['type' => 'repeater', 'label' => 'آنچه پس از پرداخت فعال می‌شود', 'item_label' => 'امتیاز', 'fields' => [
            'key'   => ['type' => 'select', 'label' => 'نوع', 'options' => 'aio_grant_types'],
            'value' => ['type' => 'number', 'label' => 'مقدار'],
        ], 'desc' => 'خدماتی که امتیاز خودکار ندارند، پس از پرداخت برای پیگیری تیم آیولب در «سفارش‌ها» می‌مانند.'],
    ]);

    /* ---------------- جامعه ---------------- */
    AIO_Fields::post_box('aio_community', 'community', 'مشخصات پست', [
        'role'       => ['type' => 'text', 'label' => 'عنوان نویسنده', 'placeholder' => 'کارشناس هماتولوژی'],
        'author_name' => ['type' => 'text', 'label' => 'نام نمایشی نویسنده', 'desc' => 'اگر خالی باشد نام کاربر نویسنده نمایش داده می‌شود.'],
        'color'      => ['type' => 'color', 'label' => 'رنگ آواتار'],
        'likes_base' => ['type' => 'number', 'label' => 'پسندهای پایه'],
    ], 'side', 'default');

    /* ---------------- مقاله‌های مجله ---------------- */
    AIO_Fields::post_box('post', 'article', 'نمایش در مجله آیولب', [
        'read_time' => ['type' => 'text', 'label' => 'زمان مطالعه', 'placeholder' => '۸ دقیقه'],
        'icon'      => ['type' => 'select', 'label' => 'آیکن کارت', 'options' => 'aio_icon_options', 'default' => 'doc'],
        'color'     => ['type' => 'color', 'label' => 'رنگ', 'default' => '#0d9488'],
        'bg'        => ['type' => 'color', 'label' => 'رنگ زمینه', 'default' => '#ccfbf1'],
    ], 'side', 'default');

    /* ---------------- طبقه‌بندی‌ها ---------------- */
    AIO_Fields::term_fields('aio_dept', [
        'en'    => ['type' => 'text', 'label' => 'نام انگلیسی'],
        'icon'  => ['type' => 'select', 'label' => 'آیکن', 'options' => 'aio_icon_options'],
        'color' => ['type' => 'color', 'label' => 'رنگ'],
        'bg'    => ['type' => 'color', 'label' => 'رنگ زمینه'],
        'order' => ['type' => 'number', 'label' => 'ترتیب نمایش'],
    ]);
    AIO_Fields::term_fields('aio_course_cat', [
        'icon'  => ['type' => 'select', 'label' => 'آیکن', 'options' => 'aio_icon_options'],
        'color' => ['type' => 'color', 'label' => 'رنگ'],
        'bg'    => ['type' => 'color', 'label' => 'رنگ زمینه'],
        'order' => ['type' => 'number', 'label' => 'ترتیب نمایش'],
    ]);
    AIO_Fields::term_fields('aio_service_group', [
        'payer' => ['type' => 'select', 'label' => 'مخاطب', 'options' => 'list:payers'],
        'icon'  => ['type' => 'select', 'label' => 'آیکن', 'options' => 'aio_icon_options'],
        'color' => ['type' => 'color', 'label' => 'رنگ'],
        'bg'    => ['type' => 'color', 'label' => 'رنگ زمینه'],
        'order' => ['type' => 'number', 'label' => 'ترتیب نمایش'],
    ]);
    AIO_Fields::term_fields('aio_skill', [
        'group' => ['type' => 'select', 'label' => 'گروه مهارت', 'options' => 'list:skill_groups'],
        'dept'  => ['type' => 'select', 'label' => 'بخش مرتبط (اختیاری)', 'options' => 'terms:aio_dept'],
        'order' => ['type' => 'number', 'label' => 'ترتیب نمایش'],
    ]);
    AIO_Fields::term_fields('aio_role', [
        'dept'  => ['type' => 'select', 'label' => 'بخش', 'options' => 'terms:aio_dept'],
        'order' => ['type' => 'number', 'label' => 'ترتیب نمایش'],
    ]);
    AIO_Fields::term_fields('aio_university', ['order' => ['type' => 'number', 'label' => 'ترتیب نمایش']]);
    AIO_Fields::term_fields('aio_license', ['order' => ['type' => 'number', 'label' => 'ترتیب نمایش']]);
    AIO_Fields::term_fields('aio_product_cat', [
        'icon'  => ['type' => 'select', 'label' => 'آیکن', 'options' => 'aio_icon_options'],
        'color' => ['type' => 'color', 'label' => 'رنگ'],
        'bg'    => ['type' => 'color', 'label' => 'رنگ زمینه'],
        'order' => ['type' => 'number', 'label' => 'ترتیب نمایش'],
    ]);
    AIO_Fields::term_fields('aio_faq_cat', [
        'order' => ['type' => 'number', 'label' => 'ترتیب نمایش'],
    ]);
}, 8);
