/* ==========================================
   آیولب — سیستم چندزبانه
   استفاده: <span data-i18n="nav.jobs"></span>
            <input data-i18n-ph="search.q">
            <a data-i18n-title="...">
   افزودن زبان جدید = افزودن یک شیء به AIO_LANGS و یک بلوک به DICT
   ========================================== */

const AIO_LANGS = [
  { id: "fa", name: "فارسی",   code: "FA", dir: "rtl" },
  { id: "en", name: "English", code: "EN", dir: "ltr" },
  { id: "ar", name: "العربية", code: "AR", dir: "rtl" }
];

const DICT = {
  fa: {
    "brand.name": "آیولب",
    "brand.tagline": "پلتفرم تخصصی کاریابی پرسنل آزمایشگاه",

    "nav.home": "خانه",
    "nav.jobs": "فرصت‌های شغلی",
    "nav.resume": "رزومه حرفه‌ای من",
    "nav.labs": "آزمایشگاه‌ها",
    "nav.growth": "رشد حرفه‌ای",
    "nav.content": "جامعه و محتوا",
    "nav.ranking": "رتبه‌بندی مراکز",
    "nav.exams": "آزمون و گواهینامه",
    "nav.assessment": "خودارزیابی",
    "nav.magazine": "در آزمایشگاه چه می‌گذرد؟",
    "nav.courses": "آموزش و رشد حرفه‌ای",
    "nav.community": "جامعه آزمایشگاهی",
    "nav.faq": "سؤالات پرتکرار",

    "act.login": "ورود کارجو",
    "act.employer": "ثبت آگهی استخدام",
    "act.dashboard": "داشبورد من",
    "act.employerPanel": "پنل کارفرما",
    "act.logout": "خروج از حساب",
    "act.notifications": "اعلان‌ها",
    "act.messages": "پیام‌ها",
    "act.seeAll": "مشاهده همه",
    "act.search": "جستجو",
    "act.advanced": "جستجوی پیشرفته",
    "act.filters": "فیلترها",
    "act.clearAll": "حذف همه",
    "act.apply": "اعمال فیلتر",
    "act.start": "شروع کن",
    "act.more": "بیشتر",
    "act.save": "ذخیره",
    "act.back": "بازگشت",

    "hero.title": "مسیر شغلی تو در آزمایشگاه، از همین‌جا شروع می‌شود",
    "hero.sub": "آیولب، پلتفرم تخصصی کاریابی پرسنل آزمایشگاه‌های تشخیص طبی و پژوهشی؛ کارجو رزومه حرفه‌ای می‌سازد، آزمایشگاه نیروی متخصص پیدا می‌کند.",
    "search.q": "عنوان شغلی، مهارت یا نام مرکز…",
    "search.province": "همه استان‌ها",
    "search.city": "همه شهرها",
    "search.dept": "همه بخش‌ها",

    "labs.title": "آزمایشگاه‌ها و مراکز عضو",
    "labs.map": "نمایش روی نقشه",
    "labs.list": "نمایش فهرستی",
    "labs.count": "مرکز ثبت‌شده",

    "exam.title": "آزمون و گواهینامه مهارت",
    "exam.start": "شروع آزمون",
    "exam.pass": "نمره قبولی",
    "exam.duration": "مدت",
    "exam.minutes": "دقیقه",
    "exam.questions": "سؤال",

    "faq.title": "سؤالات پرتکرار",
    "rank.title": "رتبه‌بندی مراکز",
    "rank.rating": "امتیاز کاربران",
    "lab.avgSalary": "میانگین حقوق",
    "lab.millionToman": "میلیون تومان",

    "lang.label": "زبان"
  },

  en: {
    "brand.name": "Aiolab",
    "brand.tagline": "Specialised job platform for laboratory professionals",

    "nav.home": "Home",
    "nav.jobs": "Jobs",
    "nav.resume": "My Resume",
    "nav.labs": "Laboratories",
    "nav.growth": "Professional growth",
    "nav.content": "Community & content",
    "nav.ranking": "Rankings",
    "nav.exams": "Exams & Certificates",
    "nav.assessment": "Self-assessment",
    "nav.magazine": "Magazine",
    "nav.courses": "Learning & Growth",
    "nav.community": "Community",
    "nav.faq": "FAQ",

    "act.login": "Log in",
    "act.employer": "Post a job",
    "act.dashboard": "My dashboard",
    "act.employerPanel": "Employer panel",
    "act.logout": "Log out",
    "act.notifications": "Notifications",
    "act.messages": "Messages",
    "act.seeAll": "See all",
    "act.search": "Search",
    "act.advanced": "Advanced search",
    "act.filters": "Filters",
    "act.clearAll": "Clear all",
    "act.apply": "Apply filters",
    "act.start": "Get started",
    "act.more": "More",
    "act.save": "Save",
    "act.back": "Back",

    "hero.title": "Your laboratory career starts here",
    "hero.sub": "Aiolab connects laboratory professionals with diagnostic and research centres across Iran — build a professional profile, get matched, get hired.",
    "search.q": "Job title, skill or centre name…",
    "search.province": "All provinces",
    "search.city": "All cities",
    "search.dept": "All departments",

    "labs.title": "Member laboratories & centres",
    "labs.map": "Map view",
    "labs.list": "List view",
    "labs.count": "registered centres",

    "exam.title": "Skill exams & certificates",
    "exam.start": "Start exam",
    "exam.pass": "Pass score",
    "exam.duration": "Duration",
    "exam.minutes": "min",
    "exam.questions": "questions",

    "faq.title": "Frequently asked questions",
    "rank.title": "Centre rankings",
    "rank.rating": "User rating",
    "lab.avgSalary": "Average salary",
    "lab.millionToman": "M IRT",

    "lang.label": "Language"
  },

  ar: {
    "brand.name": "آيولاب",
    "brand.tagline": "منصة التوظيف المتخصصة لكوادر المختبرات",

    "nav.home": "الرئيسية",
    "nav.jobs": "الوظائف",
    "nav.resume": "سيرتي الذاتية",
    "nav.labs": "المختبرات",
    "nav.growth": "التطوير المهني",
    "nav.content": "المجتمع والمحتوى",
    "nav.ranking": "تصنيف المراكز",
    "nav.exams": "الاختبارات والشهادات",
    "nav.assessment": "التقييم الذاتي",
    "nav.magazine": "المجلة",
    "nav.courses": "التعليم والتطوير",
    "nav.community": "المجتمع",
    "nav.faq": "الأسئلة الشائعة",

    "act.login": "الدخول",
    "act.employer": "نشر إعلان",
    "act.dashboard": "لوحتي",
    "act.employerPanel": "لوحة صاحب العمل",
    "act.logout": "تسجيل الخروج",
    "act.notifications": "الإشعارات",
    "act.messages": "الرسائل",
    "act.seeAll": "عرض الكل",
    "act.search": "بحث",
    "act.advanced": "بحث متقدم",
    "act.filters": "الفلاتر",
    "act.clearAll": "مسح الكل",
    "act.apply": "تطبيق",
    "act.start": "ابدأ",
    "act.more": "المزيد",
    "act.save": "حفظ",
    "act.back": "رجوع",

    "hero.title": "مسارك المهني في المختبر يبدأ من هنا",
    "hero.sub": "آيولاب منصة متخصصة تربط كوادر المختبرات التشخيصية والبحثية بأصحاب العمل.",
    "search.q": "المسمى الوظيفي أو المهارة أو اسم المركز…",
    "search.province": "كل المحافظات",
    "search.city": "كل المدن",
    "search.dept": "كل الأقسام",

    "labs.title": "المختبرات والمراكز الأعضاء",
    "labs.map": "عرض الخريطة",
    "labs.list": "عرض القائمة",
    "labs.count": "مركز مسجل",

    "exam.title": "اختبارات وشهادات المهارة",
    "exam.start": "بدء الاختبار",
    "exam.pass": "درجة النجاح",
    "exam.duration": "المدة",
    "exam.minutes": "دقيقة",
    "exam.questions": "سؤال",

    "faq.title": "الأسئلة الشائعة",
    "rank.title": "تصنيف المراكز",
    "rank.rating": "تقييم المستخدمين",
    "lab.avgSalary": "متوسط الراتب",
    "lab.millionToman": "مليون تومان",

    "lang.label": "اللغة"
  }
};

const I18N = {
  get lang() { return localStorage.getItem("aio_lang") || "fa"; },

  set(langId) {
    localStorage.setItem("aio_lang", langId);
    I18N.apply();
  },

  t(key) {
    const l = I18N.lang;
    return (DICT[l] && DICT[l][key]) || DICT.fa[key] || key;
  },

  apply() {
    const l = I18N.lang;
    const meta = AIO_LANGS.find(x => x.id === l) || AIO_LANGS[0];
    document.documentElement.lang = l;
    document.documentElement.dir = meta.dir;
    document.documentElement.dataset.lang = l;

    document.querySelectorAll("[data-i18n]").forEach(el => {
      const v = I18N.t(el.dataset.i18n);
      if (v) el.textContent = v;
    });
    document.querySelectorAll("[data-i18n-ph]").forEach(el => {
      const v = I18N.t(el.dataset.i18nPh);
      if (v) el.placeholder = v;
    });
    document.querySelectorAll("[data-i18n-title]").forEach(el => {
      const v = I18N.t(el.dataset.i18nTitle);
      if (v) el.title = v;
    });

    /* خود دکمه زبان با data-i18n ساخته نمی‌شود، پس دستی به‌روز می‌شود */
    document.querySelectorAll(".lang-code").forEach(el => { el.textContent = meta.code; });
    document.querySelectorAll(".lang-btn").forEach(el => { el.title = I18N.t("lang.label"); });
    document.querySelectorAll(".lang-menu button").forEach(btn => {
      const code = (btn.querySelector(".lm-code") || {}).textContent;
      btn.classList.toggle("active", code === meta.code);
    });
  },

  switcherHTML() {
    const cur = AIO_LANGS.find(x => x.id === I18N.lang) || AIO_LANGS[0];
    return `<div class="lang-wrap">
      <button class="icon-btn lang-btn" onclick="this.nextElementSibling.classList.toggle('open');event.stopPropagation()" title="${I18N.t("lang.label")}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18"/></svg>
        <span class="lang-code">${cur.code}</span>
      </button>
      <div class="lang-menu">
        ${AIO_LANGS.map(l => `<button class="${l.id === cur.id ? "active" : ""}" onclick="I18N.set('${l.id}')">
            <span class="lm-code">${l.code}</span> ${l.name}</button>`).join("")}
      </div>
    </div>`;
  }
};
