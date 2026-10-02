<?php
/* صفحه‌ی «تنظیمات آیولب» در پیشخوان — همه‌ی متن‌ها و اطلاعات سراسری سایت */
defined('ABSPATH') || exit;

function aio_default_settings(): array
{
    return [
        'logo_text_1' => 'آیو', 'logo_text_2' => 'لب',
        'footer_about' => 'آیولب، پلتفرم تخصصی کاریابی و توسعه شغلی پرسنل آزمایشگاه‌های تشخیص طبی و پژوهشی ایران. اتصال هوشمند کارجویان و آزمایشگاه‌ها.',
        'copyright' => '© ۱۴۰۵ آیولب — aiolab.ir | تمامی حقوق محفوظ است.',
        'footer_note' => '',
        'show_verticals' => 1, 'show_trust' => 0,
        'support_email' => 'support@aiolab.ir',
        'work_hours' => 'شنبه تا چهارشنبه، ۹ تا ۱۷',
        'job_default_days' => 30, 'paid_job_posting' => 0, 'paid_resume_bank' => 0,
        'review_auto_approve' => 0, 'community_auto_publish' => 1,
        'gateway' => 'manual', 'zarinpal_sandbox' => 1, 'zibal_sandbox' => 1,
        'match_w_skills' => 65, 'match_t_high' => 75, 'match_t_mid' => 55, 'match_t_low' => 30,
        'manual_instructions' => "درگاه پرداخت آنلاین به‌زودی فعال می‌شود.\nسفارش شما ثبت شد؛ کارشناسان آیولب برای هماهنگی پرداخت با شما تماس می‌گیرند.",
        'from_name' => 'آیولب', 'from_email' => 'no-reply@aiolab.ir',
        'cs_enabled' => 1, 'cs_title' => 'آیولب به‌زودی راه‌اندازی می‌شود',
        'cs_text' => 'پلتفرم تخصصی کاریابی و آموزش پرسنل آزمایشگاه‌های تشخیص طبی و پژوهشی ایران در حال آماده‌سازی است.',
        'seo_description' => 'آیولب — پلتفرم تخصصی کاریابی پرسنل آزمایشگاه‌های تشخیص طبی و پژوهشی ایران. جستجوی پیشرفته آگهی، نقشه سراسری مراکز، آزمون مهارت و رزومه‌ساز تخصصی.',
        'app_note' => 'لینک دانلود به‌زودی فعال می‌شود',
    ];
}

function aio_settings_tabs(): array
{
    return [
        'brand' => ['title' => 'برند و فوتر', 'option' => 'aio_settings', 'fields' => [
            'logo'         => ['type' => 'media', 'label' => 'لوگو (اختیاری)', 'desc' => 'اگر خالی باشد لوگوی برداری پیش‌فرض آیولب نمایش داده می‌شود.'],
            'logo_text_1'  => ['type' => 'text', 'label' => 'متن لوگو — بخش اول', 'default' => 'آیو'],
            'logo_text_2'  => ['type' => 'text', 'label' => 'متن لوگو — بخش پررنگ', 'default' => 'لب'],
            'show_verticals' => ['type' => 'bool', 'label' => 'نوار «خانواده آیو» بالای هدر', 'on_label' => 'نمایش داده شود'],
            'footer_about' => ['type' => 'textarea', 'label' => 'متن معرفی فوتر', 'width' => 'full'],
            'copyright'    => ['type' => 'text', 'label' => 'متن کپی‌رایت', 'width' => 'full'],
            'footer_note'  => ['type' => 'text', 'label' => 'متن کوچک سمت چپ فوتر'],
            'footer_cols'  => ['type' => 'heading', 'label' => 'ستون‌های لینک فوتر', 'desc' => 'از «نمایش ← فهرست‌ها» ویرایش می‌شوند (جایگاه‌های فوتر ۱ تا ۳). منوی بالای سایت هم همان‌جاست.'],
        ]],
        'contact' => ['title' => 'اطلاعات تماس', 'option' => 'aio_settings', 'fields' => [
            'support_email' => ['type' => 'email', 'label' => 'ایمیل پشتیبانی'],
            'phone'        => ['type' => 'text', 'label' => 'تلفن ثابت', 'ltr' => true],
            'mobile'       => ['type' => 'text', 'label' => 'موبایل / واتس‌اپ', 'ltr' => true],
            'address'      => ['type' => 'text', 'label' => 'نشانی', 'width' => 'full'],
            'work_hours'   => ['type' => 'text', 'label' => 'ساعات پاسخ‌گویی'],
            'social_h'     => ['type' => 'heading', 'label' => 'شبکه‌های اجتماعی (لینک کامل)'],
            'instagram'    => ['type' => 'url', 'label' => 'اینستاگرام'],
            'telegram'     => ['type' => 'url', 'label' => 'تلگرام'],
            'linkedin'     => ['type' => 'url', 'label' => 'لینکدین'],
            'eitaa'        => ['type' => 'url', 'label' => 'ایتا'],
            'bale'         => ['type' => 'url', 'label' => 'بله'],
            'aparat'       => ['type' => 'url', 'label' => 'آپارات'],
        ]],
        'trust' => ['title' => 'نمادها و اپلیکیشن', 'option' => 'aio_settings', 'fields' => [
            'show_trust'     => ['type' => 'bool', 'label' => 'بخش «اپلیکیشن و نمادها» در فوتر', 'on_label' => 'نمایش داده شود', 'desc' => 'خاموش = این ستون از فوتر حذف می‌شود.'],
            'enamad_html'    => ['type' => 'html', 'label' => 'کد نماد اعتماد (اینماد)', 'desc' => 'کد HTML دریافتی از enamad.ir را این‌جا بگذارید. تا وقتی خالی است، کارت «در حال دریافت» نمایش داده می‌شود.'],
            'samandehi_html' => ['type' => 'html', 'label' => 'کد نشان ساماندهی'],
            'app_android_url' => ['type' => 'url', 'label' => 'لینک اپلیکیشن اندروید'],
            'app_ios_url'    => ['type' => 'url', 'label' => 'لینک نسخه iOS / PWA'],
            'app_note'       => ['type' => 'text', 'label' => 'پیام وقتی لینک اپ خالی است'],
        ]],
        'rules' => ['title' => 'قوانین کسب‌وکار', 'option' => 'aio_settings', 'fields' => [
            'job_default_days' => ['type' => 'number', 'label' => 'اعتبار پیش‌فرض آگهی (روز)'],
            'paid_job_posting' => ['type' => 'bool', 'label' => 'ثبت آگهی نیاز به اعتبار خریداری‌شده دارد', 'on_label' => 'فعال', 'desc' => 'تا وقتی درگاه پرداخت وصل نیست خاموش بماند؛ در این حالت ثبت آگهی رایگان است و فقط تأیید مدیر لازم است.'],
            'paid_resume_bank' => ['type' => 'bool', 'label' => 'بانک رزومه فقط برای دارندگان اشتراک', 'on_label' => 'فعال'],
            'review_auto_approve' => ['type' => 'bool', 'label' => 'نظرات مراکز و دوره‌ها بدون بازبینی منتشر شوند', 'on_label' => 'فعال'],
            'community_auto_publish' => ['type' => 'bool', 'label' => 'پست‌های جامعه بدون بازبینی منتشر شوند', 'on_label' => 'فعال'],
        ]],
        'payment' => ['title' => 'پرداخت', 'option' => 'aio_settings', 'fields' => [
            'gateway' => ['type' => 'select', 'label' => 'روش پرداخت فعال', 'required' => true, 'options' => [
                'manual' => 'دستی (ثبت سفارش و تأیید پرداخت توسط مدیر)', 'zarinpal' => 'درگاه زرین‌پال', 'zibal' => 'درگاه زیبال']],
            'zarinpal_merchant' => ['type' => 'text', 'label' => 'مرچنت کد زرین‌پال', 'ltr' => true],
            'zarinpal_sandbox'  => ['type' => 'bool', 'label' => 'حالت آزمایشی زرین‌پال (Sandbox)', 'on_label' => 'فعال'],
            'zibal_merchant'    => ['type' => 'text', 'label' => 'مرچنت زیبال', 'ltr' => true],
            'zibal_sandbox'     => ['type' => 'bool', 'label' => 'حالت آزمایشی زیبال', 'on_label' => 'فعال'],
            'manual_instructions' => ['type' => 'textarea', 'label' => 'متن راهنمای پرداخت دستی', 'rows' => 4, 'width' => 'full', 'desc' => 'در صفحه‌ی پرداخت، وقتی روش «دستی» فعال است، نمایش داده می‌شود (مثلاً شماره کارت یا شبا).'],
        ]],
        'email' => ['title' => 'ایمیل‌ها', 'option' => 'aio_settings', 'fields' => [
            'from_name'  => ['type' => 'text', 'label' => 'نام فرستنده'],
            'from_email' => ['type' => 'email', 'label' => 'ایمیل فرستنده'],
            'notify_email' => ['type' => 'email', 'label' => 'ایمیل دریافت اعلان‌های مدیریتی', 'desc' => 'خالی = ایمیل مدیر سایت.'],
        ]],
        'soon' => ['title' => 'حالت «به‌زودی»', 'option' => 'aio_settings', 'fields' => [
            'cs_enabled' => ['type' => 'bool', 'label' => 'حالت «به‌زودی» فعال است', 'on_label' => 'بازدیدکنندگان فقط صفحه‌ی «به‌زودی» را می‌بینند', 'desc' => 'مدیران وارد‌شده و کسانی که لینک پیش‌نمایش را باز کنند، سایت کامل را می‌بینند.'],
            'cs_title' => ['type' => 'text', 'label' => 'عنوان', 'width' => 'full'],
            'cs_text' => ['type' => 'textarea', 'label' => 'متن', 'width' => 'full'],
            'cs_preview_key' => ['type' => 'text', 'label' => 'کلید پیش‌نمایش', 'ltr' => true],
        ]],
        'seo' => ['title' => 'سئو', 'option' => 'aio_settings', 'fields' => [
            'seo_description' => ['type' => 'textarea', 'label' => 'توضیحات متای پیش‌فرض', 'width' => 'full'],
            'og_image' => ['type' => 'media', 'label' => 'تصویر اشتراک‌گذاری پیش‌فرض (OG)'],
            'google_verification' => ['type' => 'text', 'label' => 'کد تأیید گوگل سرچ کنسول (content)', 'ltr' => true],
        ]],
        'lists' => ['title' => 'فهرست‌های پایه', 'option' => 'aio_lists', 'fields' => aio_lists_schema()],
        'talent' => ['title' => 'رزومه و سازمان', 'option' => 'aio_lists', 'fields' => aio_talent_lists_schema()],
        'match' => ['title' => 'موتور تطبیق', 'option' => 'aio_settings', 'fields' => [
            'match_h' => ['type' => 'heading', 'label' => 'وزن‌ها و آستانه‌ها', 'desc' => 'امتیاز تطبیق = وزن مهارت‌ها × پوشش وزنی مهارت‌ها + (۱۰۰ − وزن مهارت‌ها) × میانگین سایر معیارها (سابقه، مدرک، رشته، زبان، محل کار، رده…). اگر شرط الزامی (مهارت کلیدی، مدرک الزامی، سن، جنسیت، نظام وظیفه) برآورده نشود، امتیاز حداکثر «آستانه‌ی نامرتبط + ۹» می‌شود.'],
            'match_w_skills' => ['type' => 'number', 'label' => 'وزن مهارت‌ها (درصد)', 'default' => 65],
            'match_t_high' => ['type' => 'number', 'label' => 'آستانه‌ی «تطبیق بالا»', 'default' => 75],
            'match_t_mid' => ['type' => 'number', 'label' => 'آستانه‌ی «تطبیق متوسط»', 'default' => 55],
            'match_t_low' => ['type' => 'number', 'label' => 'آستانه‌ی «نامرتبط» (زیر این عدد)', 'default' => 30],
        ]],
        'tests' => ['title' => 'MBTI و خودارزیابی', 'option' => 'aio_tests', 'fields' => aio_tests_schema()],
        'tools' => ['title' => 'ابزارها', 'option' => null, 'fields' => []],
    ];
}

function aio_lists_schema(): array
{
    $simple = fn($label) => ['type' => 'lines', 'label' => $label, 'rows' => 6, 'width' => 'half'];
    $idname = ['id' => ['type' => 'text', 'label' => 'شناسه (لاتین)'], 'name' => ['type' => 'text', 'label' => 'نام']];
    return [
        'h1'            => ['type' => 'heading', 'label' => 'فیلدهای آگهی', 'desc' => 'گزینه‌هایی که در فرم ثبت آگهی، فیلترهای جستجو و رزومه استفاده می‌شوند.'],
        'job_types'     => $simple('نوع همکاری'),
        'shifts'        => $simple('شیفت‌ها'),
        'degrees'       => $simple('مدارک تحصیلی'),
        'fields_study'  => $simple('رشته‌های تحصیلی'),
        'experiences'   => $simple('سابقه کار'),
        'genders'       => $simple('جنسیت'),
        'military'      => $simple('وضعیت سربازی'),
        'benefits'      => $simple('مزایا'),
        'org_sizes'     => $simple('اندازه سازمان'),
        'salary_bands'  => ['type' => 'repeater', 'label' => 'بازه‌های حقوق (میلیون تومان)', 'item_label' => 'بازه', 'title_key' => 'name', 'fields' => $idname + ['min' => ['type' => 'number', 'label' => 'از'], 'max' => ['type' => 'number', 'label' => 'تا']]],
        'post_ages'     => ['type' => 'repeater', 'label' => 'فیلتر تاریخ انتشار', 'item_label' => 'گزینه', 'title_key' => 'name', 'fields' => $idname + ['days' => ['type' => 'number', 'label' => 'روز']]],
        'sectors'       => ['type' => 'repeater', 'label' => 'نوع سازمان', 'item_label' => 'نوع', 'title_key' => 'name', 'fields' => $idname],
        'org_kinds'     => ['type' => 'repeater', 'label' => 'دسته سازمان', 'item_label' => 'دسته', 'title_key' => 'name', 'fields' => $idname],
        'verticals'     => ['type' => 'repeater', 'label' => 'حوزه‌ها (خانواده آیو)', 'item_label' => 'حوزه', 'title_key' => 'name', 'fields' => $idname + [
            'slug' => ['type' => 'text', 'label' => 'نامک برند'], 'en' => ['type' => 'text', 'label' => 'نام انگلیسی'],
            'icon' => ['type' => 'select', 'label' => 'آیکن', 'options' => 'aio_icon_options'], 'color' => ['type' => 'color', 'label' => 'رنگ'],
            'bg' => ['type' => 'color', 'label' => 'زمینه'], 'active' => ['type' => 'bool', 'label' => 'فعال'], 'url' => ['type' => 'url', 'label' => 'لینک (برای حوزه‌های فعال دیگر)']]],
        'h2'            => ['type' => 'heading', 'label' => 'آکادمی و آزمون'],
        'exam_levels'   => $simple('سطح آزمون'),
        'course_levels' => $simple('سطح دوره'),
        'course_langs'  => $simple('زبان دوره'),
        'trending_skills' => $simple('مهارت‌های پرجستجو (کاتالوگ دوره)'),
        'course_formats' => ['type' => 'repeater', 'label' => 'شیوه‌های برگزاری', 'item_label' => 'شیوه', 'title_key' => 'name', 'fields' => $idname + ['short' => ['type' => 'text', 'label' => 'نام کوتاه'], 'desc' => ['type' => 'text', 'label' => 'توضیح']]],
        'course_durations' => ['type' => 'repeater', 'label' => 'بازه‌های مدت دوره (ساعت)', 'item_label' => 'بازه', 'title_key' => 'name', 'fields' => $idname + ['min' => ['type' => 'number', 'label' => 'از'], 'max' => ['type' => 'number', 'label' => 'تا']]],
        'course_types'  => ['type' => 'repeater', 'label' => 'انواع آموزش', 'item_label' => 'نوع', 'title_key' => 'name', 'fields' => $idname + ['desc' => ['type' => 'text', 'label' => 'توضیح']]],
        'lesson_types'  => ['type' => 'repeater', 'label' => 'انواع درس', 'item_label' => 'نوع', 'title_key' => 'name', 'fields' => $idname + ['icon' => ['type' => 'text', 'label' => 'نماد']]],
        'h3'            => ['type' => 'heading', 'label' => 'خدمات'],
        'payers'        => ['type' => 'repeater', 'label' => 'مخاطبان پرداخت', 'item_label' => 'مخاطب', 'title_key' => 'name', 'fields' => $idname + ['short' => ['type' => 'text', 'label' => 'نام کوتاه'], 'icon' => ['type' => 'select', 'label' => 'آیکن', 'options' => 'aio_icon_options'], 'color' => ['type' => 'color', 'label' => 'رنگ'], 'bg' => ['type' => 'color', 'label' => 'زمینه']]],
        'pay_models'    => ['type' => 'repeater', 'label' => 'مدل‌های پرداخت', 'item_label' => 'مدل', 'title_key' => 'name', 'fields' => $idname + ['desc' => ['type' => 'text', 'label' => 'توضیح']]],
        'colors'        => $simple('رنگ‌های پیش‌فرض مراکز جدید'),
    ];
}

function aio_talent_lists_schema(): array
{
    $idname = ['id' => ['type' => 'text', 'label' => 'شناسه (لاتین، ثابت بماند)'], 'name' => ['type' => 'text', 'label' => 'نام']];
    $level = ['id' => ['type' => 'number', 'label' => 'عدد سطح (۱، ۲، …)'], 'name' => ['type' => 'text', 'label' => 'نام']];
    $rep = fn($label, $fields, $desc = '') => ['type' => 'repeater', 'label' => $label, 'item_label' => 'مورد', 'title_key' => 'name', 'fields' => $fields, 'desc' => $desc];
    return [
        'th1' => ['type' => 'heading', 'label' => 'فهرست‌های رزومه‌ی ساخت‌یافته', 'desc' => 'مهارت‌ها، عنوان‌های شغلی، دانشگاه‌ها و مدارک از منوی «رزومه و تطبیق» در پیشخوان مدیریت می‌شوند. شناسه‌ها در رزومه‌ها ذخیره شده‌اند؛ پس از استفاده، شناسه را عوض نکنید (نام را می‌توانید).'],
        'skill_groups'  => $rep('گروه‌های مهارت', $idname + ['color' => ['type' => 'color', 'label' => 'رنگ']]),
        'skill_levels'  => $rep('سطح مهارت', $level, 'عدد بزرگ‌تر = سطح بالاتر.'),
        'seniority'     => $rep('رده‌های شغلی', $level),
        'degree_levels' => $rep('مقاطع تحصیلی', $level),
        'languages'     => $rep('زبان‌های خارجی', $idname),
        'lang_levels'   => $rep('سطح زبان', $level),
        'availability'  => $rep('زمان آمادگی شروع کار', $idname, 'شناسه‌ی «date» یعنی «از تاریخ مشخص» و تاریخ آن از کارجو پرسیده می‌شود.'),
        'th2' => ['type' => 'heading', 'label' => 'سازمان‌ها (آزمایشگاه و شرکت)'],
        'org_types'     => $rep('نوع سازمان', $idname + ['short' => ['type' => 'text', 'label' => 'نام کوتاه']], 'شناسه‌های lab و company صفحه‌های «آزمایشگاه‌ها» و «شرکت‌ها» را تفکیک می‌کنند.'),
        'accreditations' => ['type' => 'lines', 'label' => 'گواهی‌ها و اعتباربخشی‌های سازمانی', 'rows' => 8, 'width' => 'half'],
        'org_services'  => ['type' => 'lines', 'label' => 'خدمات قابل انتخاب برای سازمان‌ها', 'rows' => 12, 'width' => 'half'],
        'th3' => ['type' => 'heading', 'label' => 'فرایند استخدام'],
        'reject_reasons' => ['type' => 'lines', 'label' => 'دلایل رد درخواست (کارفرما از این فهرست انتخاب می‌کند)', 'rows' => 7, 'width' => 'full'],
    ];
}

function aio_tests_schema(): array
{
    return [
        'mbti_questions' => ['type' => 'repeater', 'label' => 'سؤالات MBTI', 'item_label' => 'سؤال', 'title_key' => 'q', 'fields' => [
            'd' => ['type' => 'select', 'label' => 'بُعد', 'options' => ['EI' => 'EI — برون‌گرایی/درون‌گرایی', 'SN' => 'SN — حسی/شهودی', 'TF' => 'TF — فکری/احساسی', 'JP' => 'JP — قضاوتی/ادراکی']],
            'q' => ['type' => 'text', 'label' => 'سؤال'],
            'a' => ['type' => 'text', 'label' => 'گزینه الف (حرف اول بُعد)'],
            'b' => ['type' => 'text', 'label' => 'گزینه ب (حرف دوم بُعد)'],
        ]],
        'mbti_types' => ['type' => 'repeater', 'label' => 'تیپ‌های شخصیتی', 'item_label' => 'تیپ', 'title_key' => 'code', 'fields' => [
            'code' => ['type' => 'text', 'label' => 'کد (مثلاً ISTJ)'], 'name' => ['type' => 'text', 'label' => 'نام'],
            'short' => ['type' => 'text', 'label' => 'توصیف کوتاه'], 'fit' => ['type' => 'lines', 'label' => 'مشاغل متناسب', 'rows' => 3],
        ]],
        'self_assess' => ['type' => 'repeater', 'label' => 'حوزه‌های خودارزیابی', 'item_label' => 'حوزه', 'title_key' => 'name', 'fields' => [
            'id' => ['type' => 'text', 'label' => 'شناسه (لاتین)'], 'name' => ['type' => 'text', 'label' => 'نام'],
            'icon' => ['type' => 'select', 'label' => 'آیکن', 'options' => 'aio_icon_options'], 'color' => ['type' => 'color', 'label' => 'رنگ'],
            'course_cat' => ['type' => 'text', 'label' => 'دسته دوره‌ی پیشنهادی (شناسه)'],
            'items' => ['type' => 'lines', 'label' => 'گویه‌ها', 'rows' => 4],
        ]],
        'assess_levels' => ['type' => 'repeater', 'label' => 'سطوح پاسخ', 'item_label' => 'سطح', 'title_key' => 'label', 'fields' => [
            'v' => ['type' => 'number', 'label' => 'امتیاز'], 'label' => ['type' => 'text', 'label' => 'برچسب'],
        ]],
    ];
}

add_action('admin_menu', function () {
    add_menu_page('تنظیمات آیولب', 'تنظیمات آیولب', 'manage_options', 'aio-settings', 'aio_settings_page', 'dashicons-admin-generic', 3);
});

function aio_settings_page(): void
{
    $tabs = aio_settings_tabs();
    $tab = isset($_GET['tab']) && isset($tabs[$_GET['tab']]) ? sanitize_key($_GET['tab']) : 'brand';
    $def = $tabs[$tab];
    echo '<div class="wrap aio-settings"><h1>تنظیمات آیولب</h1>';
    if (!empty($_GET['saved'])) echo '<div class="notice notice-success is-dismissible"><p>ذخیره شد.</p></div>';
    if (!empty($_GET['msg'])) echo '<div class="notice notice-info is-dismissible"><p>' . esc_html(wp_unslash($_GET['msg'])) . '</p></div>';
    echo '<nav class="nav-tab-wrapper">';
    foreach ($tabs as $k => $t) {
        echo '<a class="nav-tab ' . ($k === $tab ? 'nav-tab-active' : '') . '" href="' . esc_url(admin_url('admin.php?page=aio-settings&tab=' . $k)) . '">' . esc_html($t['title']) . '</a>';
    }
    echo '</nav>';

    if ($tab === 'tools') {
        aio_settings_tools();
        echo '</div>';
        return;
    }
    $values = get_option($def['option'], []);
    if ($tab === 'soon') {
        $key = aio_opt('cs_preview_key');
        if ($key) echo '<p class="aio-preview-link">لینک پیش‌نمایش برای همکاران: <code dir="ltr">' . esc_html(home_url('/?preview=' . $key)) . '</code></p>';
    }
    echo '<form method="post" action="' . esc_url(admin_url('admin-post.php')) . '">';
    wp_nonce_field('aio_settings_' . $tab);
    echo '<input type="hidden" name="action" value="aio_save_settings"><input type="hidden" name="tab" value="' . esc_attr($tab) . '">';
    echo '<div class="aio-fields aio-settings-fields">';
    foreach ($def['fields'] as $key => $f) {
        $v = $values[$key] ?? ($f['default'] ?? '');
        echo AIO_Fields::render('aio[' . $key . ']', $key, $f, $v); // phpcs:ignore
    }
    echo '</div>';
    submit_button('ذخیره تغییرات');
    echo '</form></div>';
}

add_action('admin_post_aio_save_settings', function () {
    $tabs = aio_settings_tabs();
    $tab = sanitize_key($_POST['tab'] ?? '');
    if (!isset($tabs[$tab]) || !current_user_can('manage_options')) wp_die('دسترسی ندارید.');
    check_admin_referer('aio_settings_' . $tab);
    $def = $tabs[$tab];
    $opt = get_option($def['option'], []);
    if (!is_array($opt)) $opt = [];
    $in = $_POST['aio'] ?? []; // phpcs:ignore — sanitized per field
    foreach ($def['fields'] as $key => $f) {
        if (in_array($f['type'] ?? '', ['heading', 'map'], true)) continue;
        $opt[$key] = AIO_Fields::sanitize($f, $in[$key] ?? null);
    }
    update_option($def['option'], $opt);
    /* خاموش کردن «به‌زودی» = باز شدن سایت برای موتورهای جستجو (و برعکس) */
    if ($tab === 'soon') update_option('blog_public', empty($opt['cs_enabled']) ? '1' : '0');
    do_action('aio_data_changed');
    wp_safe_redirect(admin_url('admin.php?page=aio-settings&tab=' . $tab . '&saved=1'));
    exit;
});

function aio_settings_tools(): void
{
    $sample = (int) (new WP_Query(['post_type' => 'any', 'post_status' => 'any', 'meta_key' => '_aio_sample', 'meta_value' => '1', 'fields' => 'ids', 'posts_per_page' => 1]))->found_posts;
    $action = fn($a, $label, $cls = 'button', $confirm = '') => '<form method="post" action="' . esc_url(admin_url('admin-post.php')) . '" style="display:inline-block;margin:0 0 8px 8px"'
        . ($confirm ? ' onsubmit="return confirm(\'' . esc_js($confirm) . '\')"' : '') . '>'
        . wp_nonce_field('aio_tool_' . $a, '_wpnonce', true, false) . '<input type="hidden" name="action" value="aio_tool"><input type="hidden" name="tool" value="' . esc_attr($a) . '">'
        . '<button class="' . esc_attr($cls) . '">' . esc_html($label) . '</button></form>';
    echo '<div class="aio-tools">';
    echo '<div class="card"><h2>داده‌های نمونه</h2><p>تعداد محتوای نمونه‌ی فعلی: <b>' . esc_html(aio_fa($sample)) . '</b> مورد (آگهی، مرکز، دوره، آزمون و …). هر محتوای نمونه در فهرست‌ها با برچسب «نمونه» مشخص است و مثل بقیه قابل ویرایش است.</p>';
    echo $action('import', 'درون‌ریزی / تکمیل داده‌های نمونه', 'button');
    echo $action('delete_sample', 'حذف همه‌ی داده‌های نمونه', 'button button-link-delete', 'همه‌ی محتواهای برچسب‌خورده به‌عنوان «نمونه» به زباله‌دان منتقل می‌شوند. ادامه می‌دهید؟');
    echo '</div>';
    echo '<div class="card"><h2>کش داده‌ها</h2><p>داده‌های سایت پس از هر ذخیره خودکار تازه می‌شوند. اگر تغییری دیده نشد، این دکمه را بزنید.</p>' . $action('flush', 'پاک‌سازی کش داده‌ها') . '</div>';
    echo '<div class="card"><h2>ایمیل آزمایشی</h2><p>یک ایمیل آزمایشی به ' . esc_html(aio_admin_email()) . ' ارسال می‌شود.</p>' . $action('test_email', 'ارسال ایمیل آزمایشی') . '</div>';
    echo '</div>';
}

add_action('admin_post_aio_tool', function () {
    $tool = sanitize_key($_POST['tool'] ?? '');
    if (!current_user_can('manage_options')) wp_die('دسترسی ندارید.');
    check_admin_referer('aio_tool_' . $tool);
    $msg = '';
    switch ($tool) {
        case 'import':
            $r = aio_import_all();
            $msg = 'درون‌ریزی انجام شد: ' . implode('، ', array_map(fn($k, $v) => "$k: $v", array_keys($r), $r));
            break;
        case 'delete_sample':
            $n = aio_delete_sample();
            $msg = aio_fa($n) . ' مورد نمونه به زباله‌دان منتقل شد.';
            break;
        case 'flush':
            do_action('aio_data_changed');
            $msg = 'کش پاک شد.';
            break;
        case 'test_email':
            $ok = aio_mail(aio_admin_email(), 'ایمیل آزمایشی آیولب', '<p>اگر این ایمیل را می‌بینید، ارسال ایمیل از سایت درست کار می‌کند.</p>');
            $msg = $ok ? 'ایمیل ارسال شد؛ صندوق ورودی (و پوشه‌ی اسپم) را بررسی کنید.' : 'ارسال ایمیل ناموفق بود.';
            break;
    }
    wp_safe_redirect(admin_url('admin.php?page=aio-settings&tab=tools&msg=' . rawurlencode($msg)));
    exit;
});
