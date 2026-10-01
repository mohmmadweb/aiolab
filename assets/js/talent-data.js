/* ==========================================
   آیولب — مدل داده‌ی ساخت‌یافته‌ی رزومه، پوزیشن و تطبیق
   همه‌ی گزینه‌ها «آیتمی» هستند تا فیلتر و تطبیق دقیق ممکن باشد.
   تاریخ‌ها به‌صورت ISO میلادی ذخیره و شمسی نمایش داده می‌شوند (داده‌ی زنده: سن و سابقه همیشه محاسبه می‌شود).
   ========================================== */

/* سطح مهارت (مشترک رزومه و نیازمندی پوزیشن) */
const AIO_SKILL_LEVELS = [
  { v: 1, name: "آشنایی" }, { v: 2, name: "مقدماتی" }, { v: 3, name: "متوسط" }, { v: 4, name: "پیشرفته" }, { v: 5, name: "خبره" }
];

/* گروه‌های مهارت */
const AIO_SKILL_GROUPS = [
  { id: "technical", name: "مهارت فنی آزمایشگاهی", color: "#0d9488" },
  { id: "device",    name: "دستگاه و تجهیزات",     color: "#6366f1" },
  { id: "software",  name: "نرم‌افزار و داده",       color: "#0ea5e9" },
  { id: "quality",   name: "کیفیت و استاندارد",     color: "#059669" },
  { id: "soft",      name: "مهارت نرم",             color: "#f59e0b" },
  { id: "business",  name: "فروش و بازرگانی",       color: "#8b5cf6" }
];

/* کاتالوگ مهارت‌ها (هر مهارت شناسه‌ی ثابت دارد؛ نام قابل ویرایش است) */
const AIO_SKILLS = [
  /* فنی */
  { id: "venipuncture", name: "نمونه‌گیری وریدی", group: "technical", dept: "sampling" },
  { id: "pediatric-sampling", name: "نمونه‌گیری اطفال و نوزادان", group: "technical", dept: "sampling" },
  { id: "capillary-sampling", name: "نمونه‌گیری مویرگی", group: "technical", dept: "sampling" },
  { id: "reception", name: "پذیرش و جوابدهی", group: "technical", dept: "sampling" },
  { id: "cbc-interp", name: "تفسیر CBC", group: "technical", dept: "hematology" },
  { id: "blood-smear", name: "بررسی لام خون محیطی", group: "technical", dept: "hematology" },
  { id: "coagulation", name: "آزمایش‌های انعقادی", group: "technical", dept: "hematology" },
  { id: "blood-bank", name: "بانک خون و کراس‌مچ", group: "technical", dept: "hematology" },
  { id: "clinical-chem", name: "بیوشیمی روتین", group: "technical", dept: "biochemistry" },
  { id: "electrolytes", name: "الکترولیت و گازهای خونی", group: "technical", dept: "biochemistry" },
  { id: "hormone-assay", name: "آزمایش‌های هورمونی", group: "technical", dept: "biochemistry" },
  { id: "elisa", name: "الایزا", group: "technical", dept: "biochemistry" },
  { id: "calibration", name: "کالیبراسیون دستگاه", group: "technical", dept: "biochemistry" },
  { id: "culture", name: "کشت میکروبی", group: "technical", dept: "microbiology" },
  { id: "antibiogram", name: "آنتی‌بیوگرام", group: "technical", dept: "microbiology" },
  { id: "gram-stain", name: "رنگ‌آمیزی گرم", group: "technical", dept: "microbiology" },
  { id: "media-prep", name: "محیط‌سازی", group: "technical", dept: "microbiology" },
  { id: "bacteria-id", name: "شناسایی باکتری", group: "technical", dept: "microbiology" },
  { id: "parasitology", name: "انگل‌شناسی", group: "technical", dept: "microbiology" },
  { id: "dna-extraction", name: "استخراج DNA/RNA", group: "technical", dept: "genetics" },
  { id: "pcr", name: "Real-Time PCR", group: "technical", dept: "genetics" },
  { id: "ngs", name: "NGS", group: "technical", dept: "genetics" },
  { id: "karyotype", name: "کاریوتایپ", group: "technical", dept: "genetics" },
  { id: "flow-cytometry", name: "فلوسایتومتری", group: "technical", dept: "genetics" },
  { id: "cell-culture", name: "کشت سلول", group: "technical", dept: "genetics" },
  { id: "tissue-processing", name: "پاساژ بافت", group: "technical", dept: "pathology" },
  { id: "microtomy", name: "برش با میکروتوم", group: "technical", dept: "pathology" },
  { id: "he-stain", name: "رنگ‌آمیزی H&E", group: "technical", dept: "pathology" },
  { id: "ihc", name: "ایمونوهیستوشیمی (IHC)", group: "technical", dept: "pathology" },
  { id: "cytology", name: "سیتولوژی", group: "technical", dept: "pathology" },
  { id: "biosafety", name: "ایمنی زیستی و پسماند", group: "technical", dept: "management" },
  { id: "microscopy", name: "کار با میکروسکوپ", group: "technical", dept: "" },
  { id: "emergency-tests", name: "آزمایش‌های اورژانسی", group: "technical", dept: "biochemistry" },
  { id: "method-validation", name: "اعتبارسنجی روش", group: "technical", dept: "qc" },
  { id: "kit-design", name: "طراحی کیت تشخیصی (IVD)", group: "technical", dept: "biochemistry" },
  { id: "device-install", name: "نصب و راه‌اندازی دستگاه", group: "technical", dept: "" },
  { id: "troubleshooting", name: "عیب‌یابی دستگاه", group: "technical", dept: "" },
  /* دستگاه */
  { id: "sysmex-xn", name: "سل‌کانتر Sysmex XN", group: "device", dept: "hematology" },
  { id: "sysmex-kx21", name: "سل‌کانتر Sysmex KX-21", group: "device", dept: "hematology" },
  { id: "mindray-bc", name: "سل‌کانتر Mindray BC", group: "device", dept: "hematology" },
  { id: "bt-3000", name: "اتوآنالایزر BT-3000", group: "device", dept: "biochemistry" },
  { id: "cobas-c311", name: "Roche Cobas c311", group: "device", dept: "biochemistry" },
  { id: "mindray-bs", name: "اتوآنالایزر Mindray BS", group: "device", dept: "biochemistry" },
  { id: "architect", name: "Abbott Architect", group: "device", dept: "biochemistry" },
  { id: "electrolyte-analyzer", name: "الکترولیت آنالایزر", group: "device", dept: "biochemistry" },
  { id: "abg-analyzer", name: "دستگاه گازهای خونی", group: "device", dept: "biochemistry" },
  { id: "elisa-reader", name: "الایزا ریدر و واشر", group: "device", dept: "biochemistry" },
  { id: "vitek2", name: "VITEK 2", group: "device", dept: "microbiology" },
  { id: "bactec", name: "BD BACTEC", group: "device", dept: "microbiology" },
  { id: "rotor-gene", name: "Rotor-Gene Q", group: "device", dept: "genetics" },
  { id: "abi-7500", name: "Applied Biosystems 7500", group: "device", dept: "genetics" },
  { id: "miseq", name: "Illumina MiSeq", group: "device", dept: "genetics" },
  { id: "facs", name: "فلوسایتومتر BD FACS", group: "device", dept: "genetics" },
  { id: "leica-microtome", name: "میکروتوم Leica", group: "device", dept: "pathology" },
  { id: "tissue-processor", name: "دستگاه پاساژ بافت", group: "device", dept: "pathology" },
  { id: "coag-analyzer", name: "دستگاه انعقاد", group: "device", dept: "hematology" },
  /* نرم‌افزار */
  { id: "lis", name: "نرم‌افزار LIS", group: "software", dept: "" },
  { id: "excel", name: "Excel پیشرفته", group: "software", dept: "" },
  { id: "spss", name: "SPSS / تحلیل آماری", group: "software", dept: "" },
  { id: "bioinformatics", name: "بیوانفورماتیک", group: "software", dept: "genetics" },
  { id: "crm", name: "نرم‌افزار CRM", group: "software", dept: "" },
  /* کیفیت */
  { id: "iqc", name: "کنترل کیفیت داخلی (IQC)", group: "quality", dept: "qc" },
  { id: "eqa", name: "کنترل کیفیت خارجی (EQA)", group: "quality", dept: "qc" },
  { id: "westgard", name: "قوانین وستگارد و لوی‌جنینگز", group: "quality", dept: "qc" },
  { id: "iso15189", name: "ISO 15189", group: "quality", dept: "qc" },
  { id: "sop", name: "تدوین SOP و مستندسازی", group: "quality", dept: "qc" },
  { id: "internal-audit", name: "ممیزی داخلی", group: "quality", dept: "qc" },
  { id: "reference-lab-standards", name: "استانداردهای آزمایشگاه مرجع سلامت", group: "quality", dept: "management" },
  /* نرم */
  { id: "teamwork", name: "کار تیمی", group: "soft", dept: "" },
  { id: "patient-communication", name: "ارتباط با مراجع", group: "soft", dept: "" },
  { id: "time-management", name: "مدیریت زمان", group: "soft", dept: "" },
  { id: "problem-solving", name: "حل مسئله", group: "soft", dept: "" },
  { id: "leadership", name: "رهبری و سرپرستی تیم", group: "soft", dept: "management" },
  { id: "training", name: "آموزش کاربر و پرسنل", group: "soft", dept: "" },
  { id: "accuracy", name: "دقت در ثبت اطلاعات", group: "soft", dept: "" },
  /* بازرگانی */
  { id: "b2b-sales", name: "فروش B2B", group: "business", dept: "management" },
  { id: "negotiation", name: "مذاکره", group: "business", dept: "management" },
  { id: "equipment-knowledge", name: "شناخت تجهیزات آزمایشگاهی", group: "business", dept: "" },
  { id: "tender", name: "مناقصه و استعلام", group: "business", dept: "management" }
];

/* کاتالوگ عناوین شغلی استاندارد */
const AIO_ROLES = [
  { id: "sampling-tech", name: "تکنسین نمونه‌گیری", dept: "sampling" },
  { id: "reception-officer", name: "کارشناس پذیرش و جوابدهی", dept: "sampling" },
  { id: "hematology-tech", name: "کارشناس هماتولوژی", dept: "hematology" },
  { id: "biochem-tech", name: "کارشناس بیوشیمی", dept: "biochemistry" },
  { id: "micro-tech", name: "کارشناس میکروب‌شناسی", dept: "microbiology" },
  { id: "molecular-tech", name: "کارشناس ژنتیک مولکولی", dept: "genetics" },
  { id: "flow-tech", name: "کارشناس فلوسایتومتری", dept: "genetics" },
  { id: "patho-tech", name: "تکنسین پاتولوژی", dept: "pathology" },
  { id: "qc-officer", name: "کارشناس کنترل کیفیت", dept: "qc" },
  { id: "doc-officer", name: "کارشناس مستندسازی", dept: "qc" },
  { id: "lab-tech", name: "تکنسین آزمایشگاه", dept: "biochemistry" },
  { id: "supervisor", name: "سرپرست / سوپروایزر بخش", dept: "management" },
  { id: "technical-manager", name: "مسئول فنی آزمایشگاه", dept: "management" },
  { id: "lab-manager", name: "مدیر آزمایشگاه", dept: "management" },
  { id: "service-engineer", name: "کارشناس پشتیبانی فنی دستگاه", dept: "hematology" },
  { id: "rnd-specialist", name: "کارشناس R&D", dept: "biochemistry" },
  { id: "sales-specialist", name: "کارشناس فروش تجهیزات", dept: "management" },
  { id: "product-specialist", name: "کارشناس محصول (Application)", dept: "management" },
  { id: "intern", name: "کارآموز", dept: "sampling" }
];

/* رده‌ی شغلی (ارشدیت) */
const AIO_SENIORITY = [
  { v: 1, name: "کارآموز" }, { v: 2, name: "تکنسین" }, { v: 3, name: "کارشناس" },
  { v: 4, name: "کارشناس ارشد" }, { v: 5, name: "سرپرست" }, { v: 6, name: "مدیر / مسئول فنی" }
];

/* مقطع تحصیلی (ترتیب‌دار برای «حداقل مدرک») */
const AIO_DEGREE_LEVELS = [
  { v: 1, name: "دیپلم" }, { v: 2, name: "کاردانی" }, { v: 3, name: "کارشناسی" },
  { v: 4, name: "کارشناسی ارشد" }, { v: 5, name: "دکتری" }, { v: 6, name: "دکتری حرفه‌ای / تخصص" }
];

const AIO_UNIVERSITIES = [
  "دانشگاه علوم پزشکی تهران", "دانشگاه علوم پزشکی شهید بهشتی", "دانشگاه علوم پزشکی ایران", "دانشگاه علوم پزشکی مشهد",
  "دانشگاه علوم پزشکی شیراز", "دانشگاه علوم پزشکی اصفهان", "دانشگاه علوم پزشکی تبریز", "دانشگاه علوم پزشکی اهواز",
  "دانشگاه علوم پزشکی کرمان", "دانشگاه علوم پزشکی گیلان", "دانشگاه علوم پزشکی قم", "دانشگاه علوم پزشکی البرز",
  "دانشگاه علوم پزشکی کرمانشاه", "دانشگاه علوم پزشکی همدان", "دانشگاه علوم پزشکی یزد", "دانشگاه تربیت مدرس",
  "دانشگاه تهران", "دانشگاه صنعتی شریف", "دانشگاه صنعتی امیرکبیر", "دانشگاه آزاد اسلامی", "دانشگاه پیام نور",
  "دانشگاه جامع علمی‌کاربردی", "پژوهشگاه ملی مهندسی ژنتیک", "انستیتو پاستور ایران", "دانشگاه خارج از کشور", "سایر"
].map((name, i) => ({ id: "u" + (i + 1), name }));

/* مدارک، پروانه‌ها و گواهی‌های حرفه‌ای (غیر از گواهی‌های خود آیولب) */
const AIO_LICENSES = [
  { id: "tech-manager-license", name: "پروانه مسئول فنی آزمایشگاه" },
  { id: "iso-auditor", name: "ممیز داخلی ISO 15189" },
  { id: "bsl-cert", name: "گواهی ایمنی زیستی (BSL)" },
  { id: "phlebotomy-cert", name: "گواهی فلبوتومی" },
  { id: "bls", name: "BLS / احیای پایه" },
  { id: "gcp", name: "Good Clinical Practice (GCP)" },
  { id: "glp", name: "Good Laboratory Practice (GLP)" },
  { id: "device-vendor-cert", name: "گواهی آموزش کاربری دستگاه از شرکت سازنده" },
  { id: "icdl", name: "ICDL" },
  { id: "ielts", name: "IELTS / TOEFL" },
  { id: "medical-council", name: "شماره نظام پزشکی / نظام پیراپزشکی" }
];

const AIO_LANGUAGES = [
  { id: "en", name: "انگلیسی" }, { id: "ar", name: "عربی" }, { id: "de", name: "آلمانی" },
  { id: "fr", name: "فرانسوی" }, { id: "tr", name: "ترکی" }, { id: "ru", name: "روسی" }
];
const AIO_LANG_LEVELS = [
  { v: 1, name: "مبتدی" }, { v: 2, name: "متوسط" }, { v: 3, name: "پیشرفته" }, { v: 4, name: "مسلط" }, { v: 5, name: "بومی" }
];

/* وضعیت تأهل حذف شده (داده‌ی حساس و بی‌ربط به تطبیق) */
const AIO_AVAILABILITY = [
  { id: "now", name: "فوری" }, { id: "2w", name: "ظرف ۲ هفته" }, { id: "1m", name: "ظرف یک ماه" }, { id: "date", name: "از تاریخ مشخص" }
];

/* نوع سازمان: آزمایشگاه یا شرکت (هر دو روی سایت، جدا از هم) */
const AIO_ORG_TYPES = [
  { id: "lab", name: "آزمایشگاه / مرکز تشخیصی و پژوهشی", short: "آزمایشگاه" },
  { id: "company", name: "شرکت (تولید، واردات، توزیع، خدمات)", short: "شرکت" }
];

const AIO_PRODUCT_CATS = [
  { id: "analyzer", name: "دستگاه و آنالایزر", icon: "machine", color: "#6366f1", bg: "#e0e7ff" },
  { id: "reagent", name: "کیت و معرف", icon: "flask", color: "#0d9488", bg: "#ccfbf1" },
  { id: "consumable", name: "مواد مصرفی", icon: "syringe", color: "#f59e0b", bg: "#fef3c7" },
  { id: "equipment", name: "تجهیزات عمومی آزمایشگاه", icon: "scope", color: "#0ea5e9", bg: "#e0f2fe" },
  { id: "software", name: "نرم‌افزار و LIS", icon: "doc", color: "#8b5cf6", bg: "#ede9fe" },
  { id: "service", name: "خدمات فنی و کالیبراسیون", icon: "settings", color: "#f43f5e", bg: "#ffe4e6" }
];

/* اعتباربخشی‌ها و گواهی‌های سازمانی */
const AIO_ACCREDITATIONS = [
  "ISO 15189", "ISO 9001", "ISO 13485", "تأییدیه آزمایشگاه مرجع سلامت", "پروانه بهره‌برداری وزارت بهداشت",
  "نمایندگی رسمی شرکت سازنده", "دانش‌بنیان", "عضو EQA بین‌المللی"
];

/* ---------- تکمیل مراکز موجود: نوع سازمان، گالری، خدمات، ساعات کاری، شبکه‌ها ---------- */
const AIO_ORG_EXTRA = {
  1: { orgType: "lab", tagline: "۲۵ سال تجربه در تشخیص طبی و پاتولوژی", services: ["آزمایش‌های روتین و تخصصی", "پاتولوژی و سیتولوژی", "نمونه‌گیری در منزل", "چکاپ سازمانی"],
       accreditations: ["ISO 15189", "تأییدیه آزمایشگاه مرجع سلامت"], hours: "شنبه تا پنجشنبه ۷ تا ۲۰ · جمعه ۸ تا ۱۲",
       gallery: [{ t: "بخش هماتولوژی", c: "#f43f5e" }, { t: "پذیرش و نمونه‌گیری", c: "#0d9488" }, { t: "بخش پاتولوژی", c: "#0ea5e9" }, { t: "تیم آزمایشگاه", c: "#8b5cf6" }],
       video: "", phone: "021-22220000", website: "https://example.com", socials: { instagram: "#", linkedin: "#" }, branches: 3 },
  2: { orgType: "lab", tagline: "تشخیص مولکولی و ژنتیک پزشکی با NGS", services: ["NGS بالینی", "غربالگری پیش از تولد", "کاریوتایپ", "مشاوره ژنتیک"],
       accreditations: ["ISO 15189", "عضو EQA بین‌المللی"], hours: "شنبه تا چهارشنبه ۸ تا ۱۷",
       gallery: [{ t: "آزمایشگاه NGS", c: "#6366f1" }, { t: "اتاق تمیز PCR", c: "#0ea5e9" }, { t: "بیوانفورماتیک", c: "#0d9488" }], branches: 1 },
  3: { orgType: "lab", services: ["آزمایش‌های بیمارستانی ۲۴ ساعته", "بانک خون", "اورژانس"], accreditations: ["پروانه بهره‌برداری وزارت بهداشت"], hours: "شبانه‌روزی",
       gallery: [{ t: "بخش بیوشیمی", c: "#0d9488" }, { t: "بانک خون", c: "#f43f5e" }] },
  4: { orgType: "lab", services: ["آزمایش‌های روتین", "نمونه‌گیری اطفال", "نمونه‌گیری در منزل"], hours: "همه‌روزه ۶:۳۰ تا ۲۱",
       gallery: [{ t: "سالن پذیرش", c: "#f59e0b" }, { t: "بخش نمونه‌گیری", c: "#0d9488" }] },
  5: { orgType: "company", tagline: "واردکننده و پشتیبان دستگاه‌های هماتولوژی و بیوشیمی", services: ["فروش دستگاه", "نصب و راه‌اندازی", "خدمات پس از فروش", "آموزش کاربری"],
       accreditations: ["نمایندگی رسمی شرکت سازنده", "ISO 13485"], hours: "شنبه تا چهارشنبه ۸ تا ۱۷",
       gallery: [{ t: "دپارتمان فنی", c: "#8b5cf6" }, { t: "انبار قطعات", c: "#6366f1" }, { t: "کارگاه آموزش", c: "#0ea5e9" }], branches: 4 },
  6: { orgType: "lab", services: ["آزمایش‌های روتین و هورمونی", "میکروب‌شناسی"], gallery: [{ t: "بخش میکروب‌شناسی", c: "#8b5cf6" }] },
  7: { orgType: "lab", tagline: "پژوهش سلولی و فلوسایتومتری", services: ["خدمات فلوسایتومتری", "کشت سلول", "پروژه‌های تحقیقاتی"], accreditations: ["عضو EQA بین‌المللی"],
       gallery: [{ t: "آزمایشگاه کشت سلول", c: "#0ea5e9" }, { t: "فلوسایتومتری", c: "#6366f1" }] },
  8: { orgType: "lab", services: ["آزمایش‌های روتین", "کنترل کیفیت"], gallery: [{ t: "بخش فنی", c: "#059669" }] },
  9: { orgType: "lab", tagline: "مرجع کنترل کیفیت استان", services: ["EQA استانی", "آموزش کیفیت", "ممیزی آزمایشگاه‌ها"], accreditations: ["تأییدیه آزمایشگاه مرجع سلامت", "ISO 15189"],
       gallery: [{ t: "واحد کیفیت", c: "#059669" }, { t: "کارگاه آموزشی", c: "#0369a1" }] },
  10: { orgType: "company", tagline: "تولیدکننده دانش‌بنیان کیت‌های تشخیصی", services: ["تولید کیت الایزا", "کیت‌های بیوشیمی", "تولید سفارشی (OEM)"], accreditations: ["ISO 13485", "دانش‌بنیان"],
       gallery: [{ t: "خط تولید", c: "#7c3aed" }, { t: "واحد R&D", c: "#0d9488" }, { t: "کنترل کیفیت محصول", c: "#059669" }], branches: 1 },
  11: { orgType: "company", tagline: "پخش سراسری تجهیزات و مواد مصرفی آزمایشگاهی", services: ["پخش مویرگی", "تأمین مواد مصرفی", "قرارداد سالانه آزمایشگاه‌ها"],
       gallery: [{ t: "مرکز پخش", c: "#f59e0b" }, { t: "ناوگان توزیع", c: "#0ea5e9" }], branches: 6 },
  12: { orgType: "lab", services: ["پژوهش و آموزش", "آزمایش‌های تخصصی دانشگاهی"], gallery: [{ t: "آزمایشگاه آموزشی", c: "#0f766e" }] },
  13: { orgType: "lab", services: ["آزمایش‌های روتین و تخصصی"], gallery: [{ t: "نمای مرکز", c: "#0d9488" }] }
};

/* ---------- محصولات شرکت‌ها و آزمایشگاه‌ها ---------- */
const AIO_PRODUCTS = [
  { id: 1, orgId: 5, cat: "analyzer", name: "سل‌کانتر ۵ پارت Sysmex XN-550", brand: "Sysmex", model: "XN-550", price: null,
    desc: "سل‌کانتر ۵ پارت با فلوسایتومتری فلورسنت، مناسب آزمایشگاه‌های با حجم متوسط؛ همراه با نصب، آموزش و ۲ سال گارانتی.",
    specs: [["ظرفیت", "۶۰ نمونه در ساعت"], ["پارامترها", "۲۴ پارامتر گزارش‌پذیر"], ["حجم نمونه", "۲۵ میکرولیتر"], ["گارانتی", "۲۴ ماه"]], color: "#6366f1" },
  { id: 2, orgId: 5, cat: "analyzer", name: "اتوآنالایزر بیوشیمی Mindray BS-240", brand: "Mindray", model: "BS-240", price: null,
    desc: "اتوآنالایزر رومیزی بیوشیمی با ظرفیت ۲۴۰ تست در ساعت و سیستم خنک‌کننده معرف.",
    specs: [["سرعت", "۲۴۰ تست در ساعت"], ["تعداد معرف", "۴۰ موقعیت"], ["ISE", "اختیاری"]], color: "#0ea5e9" },
  { id: 3, orgId: 5, cat: "service", name: "قرارداد سرویس و نگهداری سالانه", brand: "زیست‌تجهیز", model: "PM-Annual", price: 45000000,
    desc: "سرویس پیشگیرانه فصلی، کالیبراسیون و پشتیبانی تلفنی ۲۴ ساعته برای دستگاه‌های هماتولوژی و بیوشیمی.",
    specs: [["بازدید", "۴ بار در سال"], ["زمان پاسخ", "کمتر از ۲۴ ساعت"]], color: "#f43f5e" },
  { id: 4, orgId: 10, cat: "reagent", name: "کیت الایزا TSH", brand: "پارس‌بیوتک", model: "PB-TSH96", price: 3200000,
    desc: "کیت ۹۶ تستی الایزای TSH با حساسیت بالا و پایداری ۱۸ ماهه.",
    specs: [["تعداد تست", "۹۶"], ["حساسیت", "0.05 µIU/mL"], ["نگهداری", "۲ تا ۸ درجه"]], color: "#0d9488" },
  { id: 5, orgId: 10, cat: "reagent", name: "کیت بیوشیمی قند خون (GOD-PAP)", brand: "پارس‌بیوتک", model: "PB-GLU", price: 850000,
    desc: "معرف آماده‌ی مصرف گلوکز با روش آنزیمی، سازگار با اغلب اتوآنالایزرها.",
    specs: [["حجم", "۴×۵۰ میلی‌لیتر"], ["خطی بودن", "تا ۵۰۰ mg/dL"]], color: "#059669" },
  { id: 6, orgId: 11, cat: "consumable", name: "لوله خلأ EDTA (۱۰۰ عددی)", brand: "آریا‌مد", model: "VT-EDTA-3", price: 420000,
    desc: "لوله خلأ ۳ میلی‌لیتری K2EDTA مناسب CBC؛ ارسال سراسری.",
    specs: [["حجم", "۳ میلی‌لیتر"], ["تعداد", "۱۰۰ عدد"]], color: "#f59e0b" },
  { id: 7, orgId: 11, cat: "equipment", name: "سانتریفیوژ رومیزی ۱۲ شاخه", brand: "Hettich", model: "EBA 200", price: 68000000,
    desc: "سانتریفیوژ رومیزی با حداکثر سرعت ۶۰۰۰ دور و تایمر دیجیتال.",
    specs: [["حداکثر دور", "6000 rpm"], ["ظرفیت", "۱۲ لوله ۱۵ میلی‌لیتری"]], color: "#0ea5e9" },
  { id: 8, orgId: 2, cat: "service", name: "پنل NGS سرطان‌های ارثی", brand: "ژن‌آزما", model: "HCP-50", price: 18000000,
    desc: "بررسی ۵۰ ژن مرتبط با سرطان‌های ارثی با گزارش تفسیری ACMG.",
    specs: [["ژن‌ها", "۵۰"], ["زمان جوابدهی", "۲۱ روز کاری"]], color: "#6366f1" }
];

/* ---------- نیازمندی ساخت‌یافته‌ی پوزیشن‌ها (برای ۱۶ آگهی دمو) ----------
   skills: [{id, w: وزن ۱ تا ۱۰, lvl: سطح لازم, must: الزامی}]
   minExp: حداقل سابقه کل (ماه) · expDept: سابقه در بخش (ماه) · degree: حداقل مقطع · fields: رشته‌های قابل‌قبول
   licenses: مدارک الزامی · langs: [{id, lvl}] · age: [حداقل, حداکثر] · seniority: رده */
const AIO_JOB_REQ = {
  1:  { role: "hematology-tech", seniority: 3, minExp: 12, expDept: 12, degree: 3, fields: ["علوم آزمایشگاهی", "هماتولوژی"],
        skills: [{ id: "sysmex-xn", w: 10, lvl: 4, must: true }, { id: "blood-smear", w: 9, lvl: 4 }, { id: "cbc-interp", w: 8, lvl: 4 }, { id: "iqc", w: 6, lvl: 3 }, { id: "lis", w: 4, lvl: 2 }, { id: "teamwork", w: 3, lvl: 3 }] },
  2:  { role: "sampling-tech", seniority: 2, minExp: 0, degree: 2, fields: ["علوم آزمایشگاهی", "پرستاری"],
        skills: [{ id: "venipuncture", w: 10, lvl: 4, must: true }, { id: "pediatric-sampling", w: 8, lvl: 3 }, { id: "reception", w: 5, lvl: 2 }, { id: "patient-communication", w: 7, lvl: 4 }] },
  3:  { role: "biochem-tech", seniority: 3, minExp: 36, expDept: 24, degree: 3, fields: ["بیوشیمی", "علوم آزمایشگاهی"], gender: "آقا", military: ["پایان خدمت", "معافیت دائم"],
        skills: [{ id: "bt-3000", w: 9, lvl: 4, must: true }, { id: "electrolyte-analyzer", w: 6, lvl: 3 }, { id: "calibration", w: 7, lvl: 3 }, { id: "iqc", w: 6, lvl: 3 }, { id: "emergency-tests", w: 5, lvl: 3 }] },
  4:  { role: "micro-tech", seniority: 3, minExp: 12, degree: 4, fields: ["میکروب‌شناسی"],
        skills: [{ id: "culture", w: 10, lvl: 4, must: true }, { id: "antibiogram", w: 9, lvl: 4 }, { id: "gram-stain", w: 6, lvl: 3 }, { id: "media-prep", w: 5, lvl: 3 }, { id: "bacteria-id", w: 7, lvl: 3 }, { id: "vitek2", w: 4, lvl: 2 }] },
  5:  { role: "molecular-tech", seniority: 3, minExp: 12, degree: 4, fields: ["ژنتیک", "بیوتکنولوژی"], langs: [{ id: "en", lvl: 3 }],
        skills: [{ id: "ngs", w: 10, lvl: 3, must: true }, { id: "pcr", w: 8, lvl: 4 }, { id: "dna-extraction", w: 7, lvl: 4 }, { id: "bioinformatics", w: 6, lvl: 3 }, { id: "miseq", w: 5, lvl: 2 }] },
  6:  { role: "technical-manager", seniority: 6, minExp: 60, degree: 5, fields: ["علوم آزمایشگاهی"], licenses: ["tech-manager-license"],
        skills: [{ id: "iso15189", w: 10, lvl: 4, must: true }, { id: "reference-lab-standards", w: 9, lvl: 4 }, { id: "leadership", w: 8, lvl: 4 }, { id: "internal-audit", w: 6, lvl: 3 }, { id: "iqc", w: 6, lvl: 4 }] },
  7:  { role: "service-engineer", seniority: 3, minExp: 12, degree: 3, fields: ["مهندسی پزشکی"], gender: "آقا", military: ["پایان خدمت", "معافیت دائم"],
        skills: [{ id: "device-install", w: 9, lvl: 3, must: true }, { id: "troubleshooting", w: 10, lvl: 4 }, { id: "sysmex-xn", w: 7, lvl: 3 }, { id: "training", w: 6, lvl: 3 }] },
  8:  { role: "qc-officer", seniority: 3, minExp: 36, degree: 3, fields: ["علوم آزمایشگاهی"],
        skills: [{ id: "iqc", w: 10, lvl: 4, must: true }, { id: "eqa", w: 8, lvl: 4 }, { id: "westgard", w: 9, lvl: 4 }, { id: "sop", w: 6, lvl: 3 }] },
  9:  { role: "lab-tech", seniority: 2, minExp: 0, degree: 2, fields: ["علوم آزمایشگاهی"], gender: "آقا", military: ["پایان خدمت", "معافیت دائم"],
        skills: [{ id: "emergency-tests", w: 9, lvl: 3 }, { id: "electrolytes", w: 8, lvl: 3 }, { id: "coagulation", w: 7, lvl: 3 }] },
  10: { role: "flow-tech", seniority: 3, minExp: 0, degree: 4, fields: ["ایمونولوژی", "بیوتکنولوژی"],
        skills: [{ id: "flow-cytometry", w: 10, lvl: 3, must: true }, { id: "cell-culture", w: 8, lvl: 3 }, { id: "facs", w: 6, lvl: 2 }] },
  11: { role: "reception-officer", seniority: 2, minExp: 0, degree: 2, gender: "خانم",
        skills: [{ id: "lis", w: 9, lvl: 3, must: true }, { id: "reception", w: 9, lvl: 3 }, { id: "patient-communication", w: 8, lvl: 3 }, { id: "accuracy", w: 6, lvl: 3 }] },
  12: { role: "patho-tech", seniority: 3, minExp: 12, degree: 3, fields: ["علوم آزمایشگاهی"],
        skills: [{ id: "tissue-processing", w: 9, lvl: 4, must: true }, { id: "microtomy", w: 9, lvl: 4 }, { id: "he-stain", w: 8, lvl: 3 }, { id: "ihc", w: 5, lvl: 2 }] },
  13: { role: "rnd-specialist", seniority: 4, minExp: 36, degree: 4, fields: ["بیوتکنولوژی", "بیوشیمی"], military: ["پایان خدمت", "معافیت دائم"], langs: [{ id: "en", lvl: 3 }],
        skills: [{ id: "elisa", w: 9, lvl: 4, must: true }, { id: "kit-design", w: 10, lvl: 3 }, { id: "method-validation", w: 8, lvl: 4 }, { id: "sop", w: 5, lvl: 3 }] },
  14: { role: "sales-specialist", seniority: 3, minExp: 12, degree: 3, military: ["پایان خدمت", "معافیت دائم"],
        skills: [{ id: "b2b-sales", w: 10, lvl: 3, must: true }, { id: "equipment-knowledge", w: 8, lvl: 3 }, { id: "negotiation", w: 8, lvl: 3 }, { id: "crm", w: 4, lvl: 2 }] },
  15: { role: "intern", seniority: 1, minExp: 0, degree: 3, fields: ["علوم آزمایشگاهی"], age: [18, 28],
        skills: [{ id: "biosafety", w: 8, lvl: 2 }, { id: "microscopy", w: 7, lvl: 2 }, { id: "accuracy", w: 6, lvl: 2 }] },
  16: { role: "doc-officer", seniority: 3, minExp: 12, degree: 3, fields: ["علوم آزمایشگاهی"],
        skills: [{ id: "iso15189", w: 9, lvl: 3, must: true }, { id: "sop", w: 10, lvl: 4 }, { id: "internal-audit", w: 7, lvl: 3 }, { id: "excel", w: 6, lvl: 3 }] }
};

/* پوزیشن‌های داخلی (آگهی عمومی ندارند؛ فقط برای تطبیق — مثلاً برای مشتری بیرون از سایت) */
const AIO_POSITIONS_INTERNAL = [
  { id: 901, title: "سوپروایزر شیفت شب — بیمارستان خصوصی (مشتری خارج از سایت)", orgName: "بیمارستان خصوصی — تهران", city: "تهران", provinceId: "tehran", dept: "management", internal: true,
    req: { role: "supervisor", seniority: 5, minExp: 48, degree: 3, fields: ["علوم آزمایشگاهی"],
           skills: [{ id: "leadership", w: 10, lvl: 4, must: true }, { id: "emergency-tests", w: 8, lvl: 4 }, { id: "iqc", w: 7, lvl: 3 }, { id: "cbc-interp", w: 6, lvl: 3 }] } },
  { id: 902, title: "کارشناس اپلیکیشن دستگاه‌های مولکولی (شرکت واردکننده)", orgName: "شرکت واردکننده — اصفهان", city: "اصفهان", provinceId: "isfahan", dept: "genetics", internal: true,
    req: { role: "product-specialist", seniority: 3, minExp: 24, degree: 4, fields: ["ژنتیک", "بیوتکنولوژی"], langs: [{ id: "en", lvl: 3 }],
           skills: [{ id: "pcr", w: 10, lvl: 4, must: true }, { id: "training", w: 8, lvl: 3 }, { id: "troubleshooting", w: 6, lvl: 3 }, { id: "rotor-gene", w: 5, lvl: 3 }] } }
];

/* ---------- کارجویان نمونه با رزومه‌ی کاملاً ساخت‌یافته ----------
   birth و تاریخ‌های سابقه ISO میلادی؛ سن و سابقه همیشه از روی همین‌ها محاسبه می‌شود. */
const AIO_CANDIDATES = [
  { id: 101, name: "علی رضایی", gender: "آقا", birth: "1994-06-12", provinceId: "tehran", city: "تهران", relocate: false, military: "پایان خدمت",
    targetRoles: ["hematology-tech", "supervisor"], seniority: 3, wantTypes: ["تمام‌وقت"], wantShifts: ["صبح", "صبح و عصر"], salaryMin: 20, salaryMax: 26, availability: "1m", otw: true,
    experience: [
      { orgType: "lab", orgId: 1, orgName: "آزمایشگاه پاتوبیولوژی نور", role: "hematology-tech", dept: "hematology", type: "تمام‌وقت", city: "تهران", start: "2020-04", end: null, skills: ["sysmex-xn", "blood-smear", "cbc-interp", "iqc"] },
      { orgType: "lab", orgId: 13, orgName: "آزمایشگاه تخصصی سینا", role: "lab-tech", dept: "biochemistry", type: "تمام‌وقت", city: "قم", start: "2018-02", end: "2020-03", skills: ["clinical-chem", "bt-3000"] }],
    education: [{ degree: 3, field: "علوم آزمایشگاهی", uni: "u1", start: 2013, end: 2017 }],
    skills: [{ id: "sysmex-xn", lvl: 5 }, { id: "blood-smear", lvl: 4 }, { id: "cbc-interp", lvl: 4 }, { id: "iqc", lvl: 3 }, { id: "lis", lvl: 3 }, { id: "teamwork", lvl: 4 }, { id: "bt-3000", lvl: 3 }, { id: "clinical-chem", lvl: 3 }],
    licenses: [{ id: "bsl-cert", issued: "2021-05", expires: "2027-05" }], langs: [{ id: "en", lvl: 2 }], mbti: "ISTJ", certs: ["آزمون تخصصی هماتولوژی"], updated: "2026-09-20",
    summary: "کارشناس هماتولوژی با تجربه‌ی کار مستقل با سری Sysmex XN و تفسیر لام." },
  { id: 102, name: "نگار احمدی", gender: "خانم", birth: "1996-01-25", provinceId: "tehran", city: "تهران", relocate: true, provinces: ["alborz"], military: "",
    targetRoles: ["qc-officer", "doc-officer"], seniority: 3, wantTypes: ["تمام‌وقت", "دورکاری"], wantShifts: ["صبح"], salaryMin: 18, salaryMax: 24, availability: "now", otw: true,
    experience: [{ orgType: "lab", orgId: 9, orgName: "آزمایشگاه مرجع سلامت استان البرز", role: "qc-officer", dept: "qc", type: "تمام‌وقت", city: "کرج", start: "2021-09", end: null, skills: ["iqc", "eqa", "westgard", "sop"] },
                 { orgType: "lab", orgId: 1, orgName: "آزمایشگاه پاتوبیولوژی نور", role: "biochem-tech", dept: "biochemistry", type: "پاره‌وقت", city: "تهران", start: "2019-10", end: "2021-08", skills: ["clinical-chem"] }],
    education: [{ degree: 3, field: "علوم آزمایشگاهی", uni: "u2", start: 2014, end: 2018 }],
    skills: [{ id: "iqc", lvl: 5 }, { id: "eqa", lvl: 4 }, { id: "westgard", lvl: 5 }, { id: "sop", lvl: 4 }, { id: "iso15189", lvl: 3 }, { id: "internal-audit", lvl: 3 }, { id: "excel", lvl: 4 }],
    licenses: [{ id: "iso-auditor", issued: "2023-02", expires: null }], langs: [{ id: "en", lvl: 3 }], mbti: "ESFJ", certs: ["آزمون کنترل کیفیت آزمایشگاه بالینی"], updated: "2026-09-25" },
  { id: 103, name: "حسین موسوی", gender: "آقا", birth: "1990-11-03", provinceId: "alborz", city: "کرج", relocate: true, provinces: ["tehran"], military: "پایان خدمت",
    targetRoles: ["biochem-tech", "lab-tech"], seniority: 3, wantTypes: ["تمام‌وقت", "شیفتی"], wantShifts: ["شب", "چرخشی"], salaryMin: 18, salaryMax: 25, availability: "2w", otw: true,
    experience: [{ orgType: "lab", orgId: 3, orgName: "آزمایشگاه بیمارستان پارس", role: "biochem-tech", dept: "biochemistry", type: "شیفتی", city: "شیراز", start: "2016-05", end: "2022-12", skills: ["bt-3000", "electrolyte-analyzer", "emergency-tests", "calibration"] },
                 { orgType: "other", orgName: "آزمایشگاه بیمارستان امام کرج", role: "lab-tech", dept: "biochemistry", type: "شیفتی", city: "کرج", start: "2023-03", end: null, skills: ["electrolytes", "coagulation", "emergency-tests"] }],
    education: [{ degree: 2, field: "علوم آزمایشگاهی", uni: "u21", start: 2010, end: 2012 }, { degree: 3, field: "علوم آزمایشگاهی", uni: "u20", start: 2013, end: 2015 }],
    skills: [{ id: "bt-3000", lvl: 5 }, { id: "electrolyte-analyzer", lvl: 4 }, { id: "calibration", lvl: 4 }, { id: "iqc", lvl: 3 }, { id: "emergency-tests", lvl: 5 }, { id: "electrolytes", lvl: 4 }, { id: "coagulation", lvl: 3 }],
    licenses: [], langs: [], mbti: "ISTP", certs: [], updated: "2026-08-30" },
  { id: 104, name: "فاطمه نوری", gender: "خانم", birth: "1998-08-19", provinceId: "tehran", city: "تهران", relocate: false, military: "",
    targetRoles: ["molecular-tech", "flow-tech"], seniority: 3, wantTypes: ["تمام‌وقت"], wantShifts: ["صبح"], salaryMin: 22, salaryMax: 30, availability: "now", otw: true,
    experience: [{ orgType: "lab", orgId: 2, orgName: "مرکز ژنتیک پزشکی ژن‌آزما", role: "molecular-tech", dept: "genetics", type: "تمام‌وقت", city: "تهران", start: "2023-01", end: null, skills: ["ngs", "pcr", "dna-extraction", "miseq"] }],
    education: [{ degree: 3, field: "بیوتکنولوژی", uni: "u5", start: 2016, end: 2020 }, { degree: 4, field: "ژنتیک", uni: "u16", start: 2020, end: 2022 }],
    skills: [{ id: "ngs", lvl: 4 }, { id: "pcr", lvl: 4 }, { id: "dna-extraction", lvl: 5 }, { id: "bioinformatics", lvl: 3 }, { id: "miseq", lvl: 3 }, { id: "flow-cytometry", lvl: 2 }],
    licenses: [{ id: "glp", issued: "2022-06", expires: null }], langs: [{ id: "en", lvl: 4 }], mbti: "INTJ", certs: [], updated: "2026-09-28" },
  { id: 105, name: "مریم کریمی", gender: "خانم", birth: "2003-03-30", provinceId: "isfahan", city: "اصفهان", relocate: true, provinces: ["tehran", "fars"], military: "",
    targetRoles: ["intern", "sampling-tech"], seniority: 1, wantTypes: ["کارآموزی", "پاره‌وقت"], wantShifts: ["صبح", "عصر"], salaryMin: 8, salaryMax: 12, availability: "now", otw: true, volunteer: "دانشجوی سال آخر",
    experience: [], education: [{ degree: 3, field: "علوم آزمایشگاهی", uni: "u6", start: 2022, end: null }],
    skills: [{ id: "biosafety", lvl: 3 }, { id: "microscopy", lvl: 3 }, { id: "accuracy", lvl: 3 }, { id: "venipuncture", lvl: 2 }, { id: "excel", lvl: 2 }],
    licenses: [{ id: "bls", issued: "2025-11", expires: "2027-11" }], langs: [{ id: "en", lvl: 2 }], mbti: "ENFP", certs: ["آزمون ایمنی و بیوسیفتی آزمایشگاه"], updated: "2026-09-29" },
  { id: 106, name: "رضا کاظمی", gender: "آقا", birth: "1984-02-14", provinceId: "alborz", city: "کرج", relocate: true, provinces: ["tehran"], military: "پایان خدمت",
    targetRoles: ["technical-manager", "supervisor", "lab-manager"], seniority: 6, wantTypes: ["تمام‌وقت"], wantShifts: ["صبح"], salaryMin: 45, salaryMax: 60, availability: "1m", otw: true,
    experience: [{ orgType: "lab", orgId: 9, orgName: "آزمایشگاه مرجع سلامت استان البرز", role: "supervisor", dept: "management", type: "تمام‌وقت", city: "کرج", start: "2015-03", end: null, skills: ["leadership", "iso15189", "internal-audit", "iqc"] },
                 { orgType: "lab", orgId: 1, orgName: "آزمایشگاه پاتوبیولوژی نور", role: "biochem-tech", dept: "biochemistry", type: "تمام‌وقت", city: "تهران", start: "2009-09", end: "2015-02", skills: ["clinical-chem", "iqc"] }],
    education: [{ degree: 3, field: "علوم آزمایشگاهی", uni: "u3", start: 2003, end: 2007 }, { degree: 5, field: "علوم آزمایشگاهی", uni: "u1", start: 2010, end: 2015 }],
    skills: [{ id: "iso15189", lvl: 5 }, { id: "reference-lab-standards", lvl: 5 }, { id: "leadership", lvl: 5 }, { id: "internal-audit", lvl: 5 }, { id: "iqc", lvl: 5 }, { id: "westgard", lvl: 4 }, { id: "training", lvl: 4 }],
    licenses: [{ id: "tech-manager-license", issued: "2016-01", expires: null }, { id: "iso-auditor", issued: "2017-04", expires: null }], langs: [{ id: "en", lvl: 3 }], mbti: "ESTJ", certs: [], updated: "2026-09-10" },
  { id: 107, name: "امیر حسینی", gender: "آقا", birth: "1993-09-08", provinceId: "tehran", city: "تهران", relocate: true, provinces: ["isfahan", "khorasan-razavi"], military: "پایان خدمت",
    targetRoles: ["service-engineer", "product-specialist", "sales-specialist"], seniority: 3, wantTypes: ["تمام‌وقت"], wantShifts: ["صبح و عصر"], salaryMin: 25, salaryMax: 35, availability: "2w", otw: true,
    experience: [{ orgType: "company", orgId: 5, orgName: "شرکت تجهیزات آزمایشگاهی زیست‌تجهیز", role: "service-engineer", dept: "hematology", type: "تمام‌وقت", city: "تهران", start: "2019-06", end: null, skills: ["device-install", "troubleshooting", "sysmex-xn", "training"] }],
    education: [{ degree: 3, field: "مهندسی پزشکی", uni: "u19", start: 2012, end: 2016 }],
    skills: [{ id: "device-install", lvl: 5 }, { id: "troubleshooting", lvl: 5 }, { id: "sysmex-xn", lvl: 4 }, { id: "mindray-bc", lvl: 3 }, { id: "training", lvl: 4 }, { id: "equipment-knowledge", lvl: 5 }, { id: "negotiation", lvl: 2 }],
    licenses: [{ id: "device-vendor-cert", issued: "2020-02", expires: null }], langs: [{ id: "en", lvl: 3 }], mbti: "ISTP", certs: [], updated: "2026-09-15" },
  { id: 108, name: "سمیرا تقوی", gender: "خانم", birth: "1992-12-01", provinceId: "khorasan-razavi", city: "مشهد", relocate: false, military: "",
    targetRoles: ["sampling-tech", "reception-officer"], seniority: 2, wantTypes: ["تمام‌وقت", "پاره‌وقت"], wantShifts: ["صبح و عصر", "صبح"], salaryMin: 12, salaryMax: 16, availability: "now", otw: true,
    experience: [{ orgType: "lab", orgId: 4, orgName: "آزمایشگاه دانش مشهد", role: "sampling-tech", dept: "sampling", type: "تمام‌وقت", city: "مشهد", start: "2017-07", end: null, skills: ["venipuncture", "pediatric-sampling", "reception"] }],
    education: [{ degree: 2, field: "علوم آزمایشگاهی", uni: "u4", start: 2012, end: 2014 }],
    skills: [{ id: "venipuncture", lvl: 5 }, { id: "pediatric-sampling", lvl: 5 }, { id: "capillary-sampling", lvl: 4 }, { id: "reception", lvl: 4 }, { id: "patient-communication", lvl: 5 }, { id: "lis", lvl: 3 }, { id: "accuracy", lvl: 4 }],
    licenses: [{ id: "phlebotomy-cert", issued: "2018-03", expires: null }], langs: [], mbti: "ISFJ", certs: [], updated: "2026-09-22" },
  { id: 109, name: "کیان باقری", gender: "آقا", birth: "1995-04-21", provinceId: "isfahan", city: "اصفهان", relocate: false, military: "پایان خدمت",
    targetRoles: ["rnd-specialist", "biochem-tech"], seniority: 4, wantTypes: ["تمام‌وقت"], wantShifts: ["صبح"], salaryMin: 28, salaryMax: 36, availability: "1m", otw: false,
    experience: [{ orgType: "company", orgId: 10, orgName: "شرکت تولیدی کیت‌های تشخیصی پارس‌بیوتک", role: "rnd-specialist", dept: "biochemistry", type: "تمام‌وقت", city: "اصفهان", start: "2021-01", end: null, skills: ["elisa", "kit-design", "method-validation"] },
                 { orgType: "lab", orgId: 6, orgName: "آزمایشگاه رازی اصفهان", role: "biochem-tech", dept: "biochemistry", type: "تمام‌وقت", city: "اصفهان", start: "2019-02", end: "2020-12", skills: ["clinical-chem", "hormone-assay"] }],
    education: [{ degree: 4, field: "بیوتکنولوژی", uni: "u6", start: 2017, end: 2019 }],
    skills: [{ id: "elisa", lvl: 5 }, { id: "kit-design", lvl: 4 }, { id: "method-validation", lvl: 4 }, { id: "sop", lvl: 3 }, { id: "hormone-assay", lvl: 4 }, { id: "spss", lvl: 3 }],
    licenses: [{ id: "glp", issued: "2021-06", expires: null }], langs: [{ id: "en", lvl: 3 }], mbti: "INTP", certs: [], updated: "2026-07-30" },
  { id: 110, name: "زهرا محمدی", gender: "خانم", birth: "1997-07-11", provinceId: "fars", city: "شیراز", relocate: true, provinces: ["tehran"], military: "",
    targetRoles: ["micro-tech", "patho-tech"], seniority: 3, wantTypes: ["تمام‌وقت"], wantShifts: ["صبح"], salaryMin: 18, salaryMax: 23, availability: "now", otw: true,
    experience: [{ orgType: "lab", orgId: 12, orgName: "آزمایشگاه دانشگاه علوم پزشکی شیراز", role: "micro-tech", dept: "microbiology", type: "تمام‌وقت", city: "شیراز", start: "2022-02", end: null, skills: ["culture", "antibiogram", "gram-stain", "bacteria-id"] }],
    education: [{ degree: 3, field: "علوم آزمایشگاهی", uni: "u5", start: 2015, end: 2019 }, { degree: 4, field: "میکروب‌شناسی", uni: "u5", start: 2019, end: 2021 }],
    skills: [{ id: "culture", lvl: 4 }, { id: "antibiogram", lvl: 4 }, { id: "gram-stain", lvl: 5 }, { id: "media-prep", lvl: 4 }, { id: "bacteria-id", lvl: 4 }, { id: "vitek2", lvl: 3 }, { id: "tissue-processing", lvl: 2 }],
    licenses: [{ id: "bsl-cert", issued: "2022-03", expires: "2025-03" }], langs: [{ id: "en", lvl: 3 }], mbti: "INFJ", certs: [], updated: "2026-09-26" },
  { id: 111, name: "پارسا ملکی", gender: "آقا", birth: "1999-10-05", provinceId: "alborz", city: "کرج", relocate: true, provinces: ["tehran"], military: "پایان خدمت",
    targetRoles: ["sales-specialist", "product-specialist"], seniority: 3, wantTypes: ["تمام‌وقت"], wantShifts: ["صبح و عصر"], salaryMin: 20, salaryMax: 40, availability: "now", otw: true,
    experience: [{ orgType: "company", orgId: 11, orgName: "پخش سراسری تجهیزات آریا‌مد", role: "sales-specialist", dept: "management", type: "تمام‌وقت", city: "مشهد", start: "2024-03", end: null, skills: ["b2b-sales", "negotiation", "crm"] }],
    education: [{ degree: 3, field: "علوم آزمایشگاهی", uni: "u12", start: 2018, end: 2022 }],
    skills: [{ id: "b2b-sales", lvl: 4 }, { id: "negotiation", lvl: 4 }, { id: "equipment-knowledge", lvl: 3 }, { id: "crm", lvl: 3 }, { id: "tender", lvl: 2 }],
    licenses: [], langs: [{ id: "en", lvl: 2 }, { id: "ar", lvl: 2 }], mbti: "ENTP", certs: [], updated: "2026-09-27" },
  { id: 112, name: "شیدا کاویانی", gender: "خانم", birth: "1991-05-17", provinceId: "tehran", city: "تهران", relocate: false, military: "",
    targetRoles: ["patho-tech"], seniority: 4, wantTypes: ["تمام‌وقت", "پاره‌وقت"], wantShifts: ["صبح"], salaryMin: 20, salaryMax: 27, availability: "date", availableFrom: "2026-11-01", otw: true,
    experience: [{ orgType: "lab", orgId: 1, orgName: "آزمایشگاه پاتوبیولوژی نور", role: "patho-tech", dept: "pathology", type: "تمام‌وقت", city: "تهران", start: "2014-09", end: "2025-06", skills: ["tissue-processing", "microtomy", "he-stain", "ihc"] }],
    education: [{ degree: 3, field: "علوم آزمایشگاهی", uni: "u3", start: 2009, end: 2013 }],
    skills: [{ id: "tissue-processing", lvl: 5 }, { id: "microtomy", lvl: 5 }, { id: "he-stain", lvl: 5 }, { id: "ihc", lvl: 4 }, { id: "cytology", lvl: 3 }, { id: "leica-microtome", lvl: 5 }],
    licenses: [], langs: [{ id: "en", lvl: 2 }], mbti: "ISFP", certs: [], updated: "2026-09-05" }
];

/* خدمات قابل ارائه‌ی سازمان‌ها (آیتمی؛ مدیر سازمان از همین فهرست انتخاب می‌کند) */
const AIO_ORG_SERVICES = [
  "آزمایش‌های روتین", "آزمایش‌های روتین و تخصصی", "آزمایش‌های روتین و هورمونی", "آزمایش‌های بیمارستانی ۲۴ ساعته", "پاتولوژی و سیتولوژی",
  "میکروب‌شناسی", "بانک خون", "اورژانس", "نمونه‌گیری در منزل", "نمونه‌گیری اطفال", "چکاپ سازمانی", "NGS بالینی", "غربالگری پیش از تولد",
  "کاریوتایپ", "مشاوره ژنتیک", "خدمات فلوسایتومتری", "کشت سلول", "پروژه‌های تحقیقاتی", "پژوهش و آموزش", "آزمایش‌های تخصصی دانشگاهی",
  "کنترل کیفیت", "EQA استانی", "آموزش کیفیت", "ممیزی آزمایشگاه‌ها", "فروش دستگاه", "نصب و راه‌اندازی", "خدمات پس از فروش", "آموزش کاربری",
  "تولید کیت الایزا", "کیت‌های بیوشیمی", "تولید سفارشی (OEM)", "پخش مویرگی", "تأمین مواد مصرفی", "قرارداد سالانه آزمایشگاه‌ها", "کالیبراسیون تجهیزات"
];
const AIO_WEEKDAYS = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];
const AIO_SOCIALS = [["website", "وب‌سایت"], ["instagram", "اینستاگرام"], ["linkedin", "لینکدین"], ["telegram", "تلگرام"], ["aparat", "آپارات"]];

/* نیازمندی ساخت‌یافته روی آگهی‌های دمو */
AIO_JOBS.forEach(j => { if (AIO_JOB_REQ[j.id]) j.req = AIO_JOB_REQ[j.id]; });

/* ---------- دسترسی یکپارچه (داده‌ی نمونه + ویرایش‌های کاربر در حافظه‌ی دمو) ---------- */
const _st = (k, d) => { try { const v = JSON.parse(localStorage.getItem("aio_" + k)); return v == null ? d : v; } catch { return d; } };
/* سازمان کامل = پروفایل پایه + تکمیلی + ویرایش‌های مدیر سازمان */
function orgFull(id) {
  const base = AIO_LABS.find(l => l.id === +id);
  if (!base) return null;
  return Object.assign({}, base, AIO_ORG_EXTRA[base.id] || {}, _st("org_" + base.id, {}));
}
const orgsOfType = t => AIO_LABS.map(l => orgFull(l.id)).filter(o => (o.orgType || "lab") === t);
/* محصولات = نمونه‌ها + افزوده‌ها؛ حذف/ویرایش با شناسه */
function aioProducts() {
  const mine = _st("products", []), gone = _st("products_deleted", []);
  const ids = new Set(mine.map(p => p.id));
  return [...AIO_PRODUCTS.filter(p => !ids.has(p.id) && !gone.includes(p.id)), ...mine.filter(p => !gone.includes(p.id))];
}
/* پوزیشن‌ها: آگهی‌های عمومی + پوزیشن‌های داخلی + پوزیشن‌های تعریف‌شده در پنل کارفرما */
function aioPositions() {
  const pub = AIO_JOBS.filter(j => j.req).map(j => Object.assign({}, j, { orgName: (AIO_LABS.find(l => l.id === j.labId) || {}).name }));
  return [...pub, ...AIO_POSITIONS_INTERNAL, ..._st("positions", [])];
}
/* کارجویان: نمونه‌ها + رزومه‌ی ساخت‌یافته‌ی کاربر فعلی (اگر ذخیره کرده باشد) */
function aioCandidates() {
  const me = _st("resume", null);
  return me && me.name ? [...AIO_CANDIDATES, Object.assign({ id: 100, color: "#0f766e", self: true }, me)] : AIO_CANDIDATES;
}
