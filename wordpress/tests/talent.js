/* تست رزومه‌ی ساخت‌یافته، تطبیق، سازمان/محصول و مرکز تطبیق روی وردپرس
   ۱) کارجو: ساخت رزومه‌ی آیتمی ← ذخیره روی سرور ← پیشنهاد پوزیشن ← صفحه‌ی آگهی
   ۲) همسانی موتور تطبیق PHP و JS برای همه‌ی رزومه‌ها × پوزیشن‌ها
   ۳) کارفرما: پروفایل سازمان + گالری، محصول، پوزیشن ساخت‌یافته (عمومی و داخلی)، مرکز تطبیق
   ۴) صفحه‌های عمومی: شرکت‌ها/آزمایشگاه‌ها جدا، محصولات، پوزیشن داخلی پنهان
   ۵) امنیت: کارجو به مرکز تطبیق دسترسی ندارد؛ شناسه‌های نامعتبر رزومه حذف می‌شوند */
const { testPhone, browser, page, check, done, BASE, newCtx, wp } = require("./lib");
const fs = require("fs");
const IMG = "/tmp/claude-1000/test-img.jpg";
const PART = process.env.PART || "all";
const on = n => PART === "all" || PART === n;


(async () => {
  const b = await browser();
  const stamp = Date.now();

  if (on("1")) {
  /* ---------------- ۱) کارجو ---------------- */
  const sctx = await newCtx(b);
  const s = await page(sctx);
  await s.goto(BASE + "/register/", { waitUntil: "networkidle" });
  await s.fill("#name", "کارجوی تست تطبیق"); await s.fill("#email", `seek${stamp}@example.com`); await s.fill("#pass", "Test12345!"); await s.fill("#phone", testPhone());
  if (await s.locator("#prov").count()) await s.selectOption("#prov", "tehran");
  await Promise.all([s.waitForNavigation({ waitUntil: "networkidle" }), s.click(".auth-form button[type=submit]")]);
  await s.goto(BASE + "/dashboard/#resume", { waitUntil: "networkidle" });
  await s.waitForTimeout(500);
  check(await s.locator("#resume-builder .rb-live").count() === 1, "رزومه‌ساز آیتمی در داشبورد وردپرس");
  const pick = async (label, search, nth = 0) => {
    await s.click(`#resume-builder .form-field:has(> label:text-is("${label}")) [data-open]`);
    if (search) await s.fill(".tp-pop .tp-search", search);
    await s.click(`.tp-pop .tp-opt >> nth=${nth}`);
    await s.keyboard.press("Escape");
    await s.waitForTimeout(150);
  };
  await pick("جنسیت *", "آقا");
  await s.selectOption("#resume-builder [data-date=birth] [data-d]", "10");
  await s.selectOption("#resume-builder [data-date=birth] [data-m]", "3");
  await s.selectOption("#resume-builder [data-date=birth] [data-y]", "1372");
  await pick("استان محل سکونت *", "تهران");
  await pick("شهر *", "تهران");
  await s.click('#resume-builder .form-field:has(> label:text-is("عنوان‌های شغلی موردنظر *")) [data-open]');
  await s.fill(".tp-pop .tp-search", "هماتولوژی"); await s.click(".tp-pop .tp-opt >> nth=0"); await s.keyboard.press("Escape");
  /* سابقه با تاریخ */
  await s.click("#resume-builder [data-add=exp]");
  await s.click('.rb-form .form-field:has(> label:text-is("نام محل کار *")) [data-open]'); await s.click(".tp-pop .tp-opt >> nth=0");
  await s.click('.rb-form .form-field:has(> label:text-is("عنوان شغلی *")) [data-open]'); await s.fill(".tp-pop .tp-search", "هماتولوژی"); await s.click(".tp-pop .tp-opt >> nth=0");
  await s.waitForTimeout(150);
  await s.selectOption(".rb-form [data-date=start] [data-m]", "1"); await s.selectOption(".rb-form [data-date=start] [data-y]", "1399");
  await s.check(".rb-form [data-c=current]");
  await s.click(".rb-form [data-act=ok]"); await s.waitForTimeout(200);
  check(await s.locator("#resume-builder .rb-item").count() === 1, "سابقه با تاریخ شروع و «تا اکنون» اضافه شد");
  /* مهارت‌ها */
  for (const q of ["Sysmex XN", "لام خون", "تفسیر CBC"]) {
    await s.click("#resume-builder .tp-add:has-text('افزودن مهارت')"); await s.fill(".tp-pop .tp-search", q); await s.click(".tp-pop .tp-opt >> nth=0"); await s.keyboard.press("Escape"); await s.waitForTimeout(150);
  }
  await s.click("#resume-builder [data-lvl='skills:0'] [data-lv='5']");
  await s.click("#resume-builder [data-lvl='skills:1'] [data-lv='4']");
  await s.click("#resume-builder [data-lvl='skills:2'] [data-lv='4']");
  await s.click("#resume-builder [data-save]");
  await s.waitForTimeout(1500);
  const me = await s.evaluate(() => AIO_ME);
  check(me.cv && me.cv.skills.length === 3 && me.cv.skills[0].lvl === 5 && /^\d{4}-\d{2}-\d{2}$/.test(me.cv.birth), "رزومه‌ی ساخت‌یافته روی سرور ذخیره شد");
  check(!("age" in me.cv) && me.cv.experience[0].end === null && /^\d{4}-\d{2}$/.test(me.cv.experience[0].start), "سن ذخیره نمی‌شود؛ سابقه فقط تاریخ است");
  check(/هماتولوژی/.test(me.resume.title) && me.resume.city === "تهران", "نمای قدیمی رزومه (عنوان/شهر) از رزومه‌ی آیتمی مشتق شد: " + me.resume.title);
  check(/^09\d{9}$/.test(me.phone), "شماره موبایل (اجباری) از ثبت‌نام در رزومه آمد و ذخیره شد");
  await s.goto(BASE + "/dashboard/?r=1#matches", { waitUntil: "networkidle" });
  const firstMatch = await s.locator("#my-matches details summary b").first().innerText().catch(() => "");
  check(/هماتولوژی/.test(firstMatch), "بهترین پوزیشن پیشنهادی: " + firstMatch);
  check(await s.locator("#suggested .fit-badge").count() > 0, "پیشنهادهای پیشخوان با درصد تطبیق");
  /* اعتبارسنجی سمت سرور: شناسه‌ی جعلی حذف می‌شود */
  const bad = await s.evaluate(async () => {
    const c = Object.assign({}, AIO_ME.cv, { name: AIO_ME.name, phone: AIO_ME.phone, skills: [...AIO_ME.cv.skills, { id: "fake-skill-xyz", lvl: 9 }], targetRoles: [...AIO_ME.cv.targetRoles, "fake-role"] });
    await API.post("me/cv", { cv: c }); return AIO_ME.cv;
  });
  check(bad.skills.length === 3 && !bad.targetRoles.includes("fake-role"), "شناسه‌های نامعتبر توسط سرور حذف شدند");
  const denied = await s.evaluate(() => API.get("talent/candidates").then(() => "ok", e => e.status));
  check(denied === 403 || denied === 401, "کارجو به فهرست رزومه‌ها دسترسی ندارد (" + denied + ")");
  s.errors.length = 0; /* خطای ۴۰۳ بالا عمدی بود */
  /* صفحه‌ی آگهی */
  const hemJob = await s.evaluate(() => (AIO_JOBS.find(j => j.req && j.req.role === "hematology-tech") || {}).url);
  await s.goto(hemJob, { waitUntil: "networkidle" });
  check(!(await s.locator("#p-req").isHidden()) && await s.locator("#j-req tr").count() > 3, "صفحه‌ی آگهی: نیازمندی‌های ساخت‌یافته");
  check(await s.locator("#j-match .mb-table").count() === 1 && await s.locator("#match-box").isVisible(), "صفحه‌ی آگهی: جزئیات تطبیق با رزومه‌ی کاربر");
  check(!s.errors.length, "کارجو بدون خطای JS: " + s.errors.join(" | "));
  await sctx.close();

  }
  /* ---------------- ۲) همسانی موتور PHP و JS ---------------- */
  /* روی سایت زنده رمز مدیر در دسترس تست نیست؛ بخش‌های مدیر فقط محلی اجرا می‌شوند */
  const ADMIN = BASE.includes("127.0.0.1") ? ["admin", "admin123"] : (process.env.ADMIN_PASS ? [process.env.ADMIN_USER || "admin", process.env.ADMIN_PASS] : null);
  const actx = await newCtx(b);
  const a = await page(actx);
  if (ADMIN) {
    await a.goto(BASE + "/wp-login.php", { waitUntil: "networkidle" });
    await a.fill("#user_login", ADMIN[0]); await a.fill("#user_pass", ADMIN[1]);
    await Promise.all([a.waitForNavigation(), a.click("#wp-submit")]);
  }
  if (on("1") && ADMIN) {
  await a.goto(BASE + "/talent/", { waitUntil: "networkidle" });
  await a.waitForSelector(".tl-tabs", { timeout: 20000 });
  const js = await a.evaluate(() => {
    const out = {};
    aioCandidates().forEach(c => aioPositions().forEach(j => { out[c.id + ":" + j.id] = AioMatch.score(c, j).score; }));
    return out;
  });
  const php = JSON.parse(wp(`$o=[]; foreach (get_users(["meta_key"=>"aio_cv","meta_compare"=>"EXISTS","fields"=>"ID","number"=>500]) as $u) { $c = aio_talent_candidate((int)$u); if(!$c) continue; foreach (aio_talent_positions(1) as $j) $o[$u.":".$j["id"]] = aio_match_cv($c, $j)["score"]; } echo json_encode($o);`));
  const keys = Object.keys(js).filter(k => k in php);
  const diff = keys.filter(k => js[k] !== php[k]);
  check(keys.length >= 100 && !diff.length, `موتور PHP و JS برای ${keys.length} زوج یکسان است` + (diff.length ? " — اختلاف: " + diff.slice(0, 5).map(k => `${k} js=${js[k]} php=${php[k]}`).join(", ") : ""));

  /* مدیر: مرکز تطبیق */
  const rows = await a.locator(".tl-pane.on .tl-row").count();
  check(rows >= 12, "مرکز تطبیق: نیروها برای پوزیشن رتبه‌بندی شدند (" + rows + ")");
  await a.click("[data-tab=filter]");
  await a.click(".tl-pane.on [data-preset='1']"); await a.waitForTimeout(300);
  a.once("dialog", d => d.accept("فیلتر تست وردپرس"));
  await a.click(".tl-pane.on [data-save]"); await a.waitForTimeout(1200);
  check((await a.evaluate(() => AIO_ME.talentFilters.length)) >= 1, "فیلتر AND/OR روی سرور ذخیره شد");
  await a.click("[data-tab=bycand]"); await a.waitForTimeout(300);
  check(await a.locator(".tl-pane.on .tl-row").count() >= 10, "پوزیشن‌های مناسب یک نفر (شامل پوزیشن‌های داخلی)");

  }
  /* ---------------- ۳) کارفرما ---------------- */
  if (on("2")) {
  const ectx = await newCtx(b);
  const e = await page(ectx);
  e.on("dialog", d => d.accept());
  await e.goto(BASE + "/register/?role=employer", { waitUntil: "networkidle" });
  await e.fill("#name", "شرکت تست تجهیزات"); await e.fill("#email", `emp${stamp}@example.com`); await e.fill("#pass", "Test12345!"); await e.fill("#phone", testPhone());
  if (await e.locator("#prov").count()) await e.selectOption("#prov", "tehran");
  await Promise.all([e.waitForNavigation({ waitUntil: "networkidle" }), e.click(".auth-form button[type=submit]")]);
  const labId = await e.evaluate(async () => (await API.post("employer/lab", { lab: { name: "شرکت تست تجهیزات", orgType: "company", provinceId: "tehran", city: "تهران", lat: 35.7, lng: 51.4, avgSalary: 20, about: "شرکت واردکننده‌ی تجهیزات آزمایشگاهی", phone: "02122220000", email: "info@test-co.example.com" } })).id);
  check(labId > 0 && (await e.evaluate(id => AIO_ME.labs.find(l => l.id === id).orgType, labId)) === "company", "سازمان از نوع «شرکت» ثبت شد");
  wp(`wp_update_post(["ID"=>${labId},"post_status"=>"publish"]); aio_set_meta(${labId},"verified",1); do_action("aio_data_changed");`);
  await e.goto(BASE + "/employer/?r=1#orgprofile", { waitUntil: "networkidle" });
  await e.fill("#org-profile [data-k=tagline]", "واردکننده‌ی رسمی دستگاه‌های هماتولوژی");
  await e.setInputFiles("#org-profile [data-up]", IMG);
  check(await e.waitForSelector("#org-profile .gal-edit img", { timeout: 20000 }).then(() => true, () => false), "تصویر گالری روی سرور بارگذاری شد");
  await e.click('#org-profile .form-field:has(> label:text-is("خدمات")) [data-open]'); await e.click(".tp-pop .tp-opt >> nth=0"); await e.keyboard.press("Escape");
  await e.click("#org-profile .chips-pick [data-day='5']");
  await e.fill("#org-profile [data-k=website]", "https://example.org");
  await e.click("#org-profile [data-save]"); await e.waitForTimeout(1500);
  const org = await e.evaluate(id => AIO_ME.labs.find(l => l.id === id), labId);
  check(org.tagline.includes("واردکننده") && org.gallery.length === 1 && org.gallery[0].img && org.services.length === 1 && /پنجشنبه/.test(org.hours), "پروفایل سازمان ذخیره شد: " + org.hours);
  /* محصول */
  await e.click("#dash-nav a[data-sec=products]");
  await e.click("#org-products [data-new]");
  await e.click('#org-products .form-field:has(> label:text-is("دسته *")) [data-open]'); await e.click(".tp-pop .tp-opt >> nth=0");
  await e.fill("#org-products [data-p=name]", "سل‌کانتر تست TX-100");
  await e.fill("#org-products [data-p=price]", "950000000");
  await e.fill("#org-products [data-spec='0:0']", "ظرفیت"); await e.fill("#org-products [data-spec='0:1']", "۶۰ نمونه در ساعت");
  await e.setInputFiles("#org-products [data-pimg]", IMG);
  await e.waitForSelector("#org-products .chip.teal:has-text('تصویر دارد')", { timeout: 20000 }).catch(() => {});
  await e.click("#org-products [data-ok]"); await e.waitForTimeout(1500);
  const prod = await e.evaluate(() => AIO_ME.products[0]);
  check(prod && prod.status === "publish" && prod.img && prod.specs.length === 1 && prod.price === 950000000, "محصول با تصویر و مشخصات منتشر شد (سازمان تأییدشده)");
  /* پوزیشن داخلی ساخت‌یافته */
  await e.click("#dash-nav a[data-sec=post]");
  await e.check("#pos-form [name=pf-vis][value='1']");
  await e.fill("#pos-form [data-d=orgName]", "بیمارستان مشتری تست");
  const pk = async (label, q) => { await e.click(`#pos-form .form-field:has(> label:text-is("${label}")) [data-open]`); if (q) await e.fill(".tp-pop .tp-search", q); await e.click(".tp-pop .tp-opt >> nth=0"); await e.keyboard.press("Escape"); await e.waitForTimeout(150); };
  await pk("عنوان شغلی استاندارد *", "هماتولوژی");
  await pk("استان *", "تهران"); await pk("شهر *", "تهران");
  await e.selectOption("#pos-form [data-rq=minExp]", "24");
  await e.click("#pos-form .tp-add:has-text('افزودن مهارت')"); await e.fill(".tp-pop .tp-search", "Sysmex"); await e.click(".tp-pop .tp-opt >> nth=0"); await e.keyboard.press("Escape");
  await e.waitForTimeout(200);
  await e.check("#pos-form [data-sk='0:must']");
  check(/تطبیق بالا/.test(await e.locator("#pos-form [data-preview]").innerText()), "پیش‌نمایش زنده‌ی نیروهای واجد شرایط (از سرور)");
  await e.click("#pos-form [data-submit]"); await e.waitForTimeout(2000);
  const pos = await e.evaluate(() => AIO_ME.jobs.find(j => j.internal));
  check(pos && pos.wpStatus === "aio_internal" && pos.clientName === "بیمارستان مشتری تست" && pos.req.skills[0].must && pos.req.minExp === 24, "پوزیشن داخلی با نیازمندی ساخت‌یافته ثبت شد");
  /* پوزیشن عمومی */
  await e.click("#dash-nav a[data-sec=post]");
  await pk("عنوان شغلی استاندارد *", "فروش");
  await pk("استان *", "تهران"); await pk("شهر *", "تهران");
  await e.click("#pos-form .tp-add:has-text('افزودن مهارت')"); await e.fill(".tp-pop .tp-search", "فروش"); await e.click(".tp-pop .tp-opt >> nth=0"); await e.keyboard.press("Escape");
  await e.fill("#pos-form [data-d=desc]", "کارشناس فروش تجهیزات آزمایشگاهی برای بازار تهران با آشنایی کامل به دستگاه‌ها.");
  await e.click("#pos-form [data-submit]"); await e.waitForTimeout(2000);
  const pub = await e.evaluate(() => AIO_ME.jobs.find(j => !j.internal));
  check(pub && pub.wpStatus === "pending" && pub.req && pub.experience, "آگهی عمومی ساخت‌یافته در انتظار تأیید ثبت شد");
  await e.goto(BASE + "/talent/?job=" + pos.id, { waitUntil: "networkidle" });
  await e.waitForSelector(".tl-tabs", { timeout: 20000 });
  const empPos = await e.evaluate(() => aioPositions().map(p => p.id));
  check(empPos.length === 2 && empPos.includes(pos.id), "کارفرما فقط پوزیشن‌های خودش را می‌بیند");
  check(/بیمارستان مشتری تست/.test(await e.locator(".tl-pane.on .panel").first().innerText()), "مرکز تطبیق برای پوزیشن داخلی");
  await e.click(".tl-pane.on .tl-row >> nth=0"); await e.waitForTimeout(300);
  await e.click("#tl-drawer button:has-text('رزومه‌ی کامل')"); await e.waitForTimeout(1500);
  check(/موبایل/.test(await e.locator("#tl-drawer").innerText()), "مشاهده‌ی رزومه‌ی کامل و اطلاعات تماس از مرکز تطبیق");
  check(!e.errors.length, "کارفرما بدون خطای JS: " + e.errors.join(" | "));
  await ectx.close();

  /* ---------------- ۴) صفحه‌های عمومی ---------------- */
  const g = await page(await newCtx(b));
  await g.goto(BASE + "/companies/", { waitUntil: "networkidle" });
  await g.click("[data-view=list]");
  const comps = await g.locator("#lab-grid .lab-card h3").allInnerTexts();
  check(comps.length >= 4 && comps.some(t => t.includes("شرکت تست تجهیزات")), "صفحه‌ی شرکت‌ها: " + comps.length + " شرکت");
  await g.goto(BASE + "/labs/", { waitUntil: "networkidle" });
  await g.click("[data-view=list]");
  const labNames = await g.locator("#lab-grid .lab-card h3").allInnerTexts();
  const expectLabs = await g.evaluate(() => AIO_LABS.filter(l => l.orgType === "lab").length);
  check(labNames.length === expectLabs && !labNames.some(t => /شرکت|پخش/.test(t)), "صفحه‌ی آزمایشگاه‌ها بدون شرکت‌ها: " + labNames.length);
  await g.goto(BASE + "/products/", { waitUntil: "networkidle" });
  const nProd = await g.evaluate(() => AIO_PRODUCTS.length);
  check(await g.locator("#p-grid .prod-card").count() === nProd && nProd >= 9 && await g.locator("#p-grid .prod-card:has-text('TX-100')").count() === 1, "کاتالوگ محصولات شامل محصول جدید: " + nProd);
  await g.click("#p-grid .prod-card:has-text('TX-100')"); await g.waitForLoadState("networkidle");
  check(/\/product\/\d+\//.test(g.url()) && await g.locator("#pr-specs tr").count() === 1 && await g.locator("#pr-media img").count() === 1, "صفحه‌ی محصول با تصویر و مشخصات");
  check((await g.content()).includes('"@type":"Product"'), "داده‌ی ساخت‌یافته‌ی Product");
  await g.goto(org.url, { waitUntil: "networkidle" });
  check(await g.locator(".org-slider img").count() === 1 && /واردکننده/.test(await g.locator("#l-sub").innerText()) && await g.locator("#l-products .prod-card").count() === 1, "صفحه‌ی شرکت: اسلایدر، شعار و محصولات");
  check(/شرکت‌ها/.test(await g.locator(".breadcrumb").innerText()), "بردکرامب صفحه‌ی شرکت → «شرکت‌ها»");
  const internalVisible = await g.evaluate(id => AIO_JOBS.some(j => j.id === id), pos.id);
  const r404 = await (await g.request.get(BASE + "/job/" + pos.id + "/")).status();
  check(!internalVisible && r404 === 404, "پوزیشن داخلی در سایت عمومی دیده نمی‌شود (" + r404 + ")");
  check(!g.errors.length, "صفحه‌های عمومی بدون خطای JS: " + g.errors.join(" | "));

  /* ---------------- ۵) پیشخوان ---------------- */
  await a.close();
  const ad = await page(actx);
  if (ADMIN) {
  for (const [u, t] of [["/wp-admin/admin.php?page=aio-talent", "رزومه و تطبیق"], ["/wp-admin/edit-tags.php?taxonomy=aio_skill&post_type=aio_job", "گروه مهارت"],
    ["/wp-admin/admin.php?page=aio-settings&tab=talent", "سطح مهارت"], ["/wp-admin/admin.php?page=aio-settings&tab=match", "وزن مهارت‌ها"],
    ["/wp-admin/post.php?post=" + pos.id + "&action=edit", "نیازمندی‌های ساخت‌یافته"], ["/wp-admin/post.php?post=" + labId + "&action=edit", "گالری تصاویر"],
    ["/wp-admin/edit.php?post_type=aio_product", "سل‌کانتر تست"]]) {
    const r = await ad.goto(BASE + u, { waitUntil: "domcontentloaded" });
    check(r.status() === 200 && (await ad.content()).includes(t), "پیشخوان: " + u.replace("/wp-admin/", ""));
  }
  }
  if (BASE.includes("127.0.0.1")) {
    const log = wp(`echo @file_get_contents(WP_CONTENT_DIR . "/debug.log") ?: "";`);
    check(!/Fatal|Warning|Notice/.test(log), "debug.log بدون خطای PHP" + (log ? ": " + log.slice(0, 400) : ""));
  }

  }
  /* پاک‌سازی کاربران و محتوای تست */
  wp(`foreach (["seek${stamp}@example.com","emp${stamp}@example.com"] as $m) { $u = get_user_by("email",$m); if(!$u) continue; foreach (get_posts(["author"=>$u->ID,"post_type"=>["aio_job","aio_lab","aio_application","aio_product","aio_exam","aio_course","aio_order","aio_cert","aio_message","aio_community","attachment"],"post_status"=>"any","numberposts"=>-1,"fields"=>"ids"]) as $id) wp_delete_post($id,true); require_once ABSPATH."wp-admin/includes/user.php"; wp_delete_user($u->ID); } do_action("aio_data_changed");`);
  await b.close(); done();
})();
