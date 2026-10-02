/* تست دموی پنل کارفرما: پوزیشن ساخت‌یافته، پروفایل سازمان، محصول، فیلتر AND/OR، تفکیک شرکت/آزمایشگاه */
const { browser, page, check, done } = require("../lib");
const BASE = process.env.DEMO || "http://127.0.0.1:8833";
(async () => {
  const b = await browser();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, locale: "fa-IR" });
  await ctx.addInitScript(() => { if (!localStorage.getItem("aio_user")) localStorage.setItem("aio_user", JSON.stringify({ name: "کارفرما تست", role: "employer" })); });
  const p = await page(ctx);
  p.on("dialog", d => d.accept("فیلتر تست"));
  const pick = async (scope, label, search, nth = 0) => {
    await p.click(`${scope} .form-field:has(> label:text-is("${label}")) [data-open]`);
    if (search) await p.fill(".tp-pop .tp-search", search);
    await p.click(`.tp-pop .tp-opt >> nth=${nth}`);
    await p.waitForTimeout(120);
  };
  await p.goto(BASE + "/employer.html#post", { waitUntil: "networkidle" });
  const F = "#pos-form";
  await pick(F, "عنوان شغلی استاندارد *", "هماتولوژی");
  check((await p.inputValue(F + " [data-d=title]")).includes("هماتولوژی"), "عنوان از عنوان استاندارد پر شد");
  await pick(F, "استان *", "تهران");
  await pick(F, "شهر *", "تهران");
  await p.selectOption(F + " [data-rq=minExp]", "24");
  await p.click(F + " .tp-add:has-text('افزودن مهارت')"); await p.fill(".tp-pop .tp-search", "Sysmex"); await p.click(".tp-pop .tp-opt >> nth=0");
  await p.keyboard.press("Escape"); await p.waitForTimeout(200);
  await p.click(F + " .tp-add:has-text('افزودن مهارت')"); await p.fill(".tp-pop .tp-search", "لام"); await p.click(".tp-pop .tp-opt >> nth=0");
  await p.keyboard.press("Escape"); await p.waitForTimeout(200);
  check(await p.locator(F + " .req-skill").count() === 2, "دو مهارت با سطح و وزن اضافه شد");
  await p.check(F + " [data-sk='0:must']");
  const prev = await p.locator(F + " [data-preview]").innerText();
  check(/تطبیق بالا/.test(prev) && /علی رضایی/.test(prev), "پیش‌نمایش زنده‌ی نیروها: " + prev.replace(/\s+/g, " ").slice(0, 110));
  await p.click(F + " [data-submit]");
  await p.waitForTimeout(300);
  const pos = await p.evaluate(() => JSON.parse(localStorage.getItem("aio_positions") || "[]"));
  check(pos.length === 1 && pos[0].req.skills[0].must && pos[0].req.minExp === 24 && pos[0].req.role === "hematology-tech", "پوزیشن ساخت‌یافته ذخیره شد");
  check(await p.locator("#jobs-body tr").first().innerText().then(t => /واجد شرایط/.test(t)), "در «آگهی‌های من» با تعداد واجد شرایط آمد");

  /* پوزیشن داخلی */
  await p.click("#dash-nav a[data-sec=post]");
  await p.check(F + " [name=pf-vis][value='1']");
  await p.fill(F + " [data-d=orgName]", "بیمارستان مشتری");
  await pick(F, "عنوان شغلی استاندارد *", "کنترل کیفیت");
  await pick(F, "استان *", "اصفهان"); await pick(F, "شهر *", "اصفهان");
  await p.click(F + " .tp-add:has-text('افزودن مهارت')"); await p.fill(".tp-pop .tp-search", "IQC"); await p.click(".tp-pop .tp-opt >> nth=0"); await p.keyboard.press("Escape");
  await p.click(F + " [data-submit]"); await p.waitForTimeout(300);
  const pos2 = await p.evaluate(() => JSON.parse(localStorage.getItem("aio_positions")));
  check(pos2.length === 2 && pos2[1].internal && pos2[1].orgName === "بیمارستان مشتری", "پوزیشن داخلی برای مشتری بیرونی ثبت شد");

  /* مرکز تطبیق با پوزیشن داخلی */
  await p.goto(BASE + "/talent.html?job=" + pos2[1].id, { waitUntil: "networkidle" });
  check(/بیمارستان مشتری/.test(await p.locator(".tl-pane.on .panel").first().innerText()), "تطبیق برای پوزیشن داخلی باز شد");
  const scores = await p.locator(".tl-pane.on .tl-row .mring i").allInnerTexts();
  const nums = scores.map(s => +s.replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace("٪", ""));
  check(nums.length === 12 && nums.every((x, i) => !i || nums[i - 1] >= x), "نیروها به ترتیب امتیاز مرتب شدند: " + nums.join(","));
  await p.click(".tl-pane.on .tl-row >> nth=0");
  check(await p.locator("#tl-drawer.open .mb-table").isVisible(), "پنجره‌ی جزئیات تطبیق (وسط صفحه)");
  await p.keyboard.press("Escape");
  /* فیلتر AND/OR */
  await p.click("[data-tab=filter]");
  await p.click(".tl-pane.on [data-preset='2']"); await p.waitForTimeout(200);
  const r1 = await p.locator(".tl-pane.on [data-res] p").innerText();
  await p.click(".tl-pane.on .fb-group >> nth=0 >> .fb-toggle button >> nth=1");   // AND → OR
  await p.waitForTimeout(200);
  const r2 = await p.locator(".tl-pane.on [data-res] p").innerText();
  const n = s => +s.replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d)).match(/\d+/)[0];
  check(n(r2) > n(r1), `تغییر AND به OR نتایج را بیشتر کرد (${n(r1)} → ${n(r2)})`);
  await p.click(".tl-pane.on [data-builder] > .fb-group > .fb-actions [data-act=addg]"); await p.waitForTimeout(150);
  check(await p.locator(".tl-pane.on .fb-group.nested").count() >= 1, "گروه تودرتو (پرانتز) ساخته شد");
  await p.click(".tl-pane.on [data-save]"); await p.waitForTimeout(200);
  check((await p.evaluate(() => JSON.parse(localStorage.getItem("aio_tl_filters") || "[]"))).length === 1, "فیلتر ذخیره شد");

  /* پروفایل سازمان + گالری */
  await p.goto(BASE + "/employer.html#orgprofile", { waitUntil: "networkidle" });
  await p.fill("#org-profile [data-k=tagline]", "شعار تستی سازمان");
  await p.setInputFiles("#org-profile [data-up]", "/tmp/claude-1000/test-img.jpg");
  await p.waitForTimeout(600);
  check(await p.locator("#org-profile .gal-edit img").count() === 1, "تصویر گالری بارگذاری و کوچک شد");
  await p.click("#org-profile .chips-pick [data-day='5']");
  await p.fill("#org-profile [data-k=website]", "http://bad");
  await p.click("#org-profile [data-save]");
  check(!(await p.evaluate(() => localStorage.getItem("aio_org_1"))), "لینک بدون https رد شد");
  await p.fill("#org-profile [data-k=phone]", "02122220000");
  await p.fill("#org-profile [data-k=email]", "info@noor.example.com");
  await p.fill("#org-profile [data-k=website]", "https://example.org");
  await p.click("#org-profile [data-save]");
  const org = await p.evaluate(() => JSON.parse(localStorage.getItem("aio_org_1")));
  check(org && org.tagline === "شعار تستی سازمان" && org.gallery.length === 5 && /پنجشنبه/.test(org.hours), "پروفایل سازمان ذخیره شد: " + (org && org.hours));
  /* محصول */
  await p.click("#dash-nav a[data-sec=products]");
  await p.click("#org-products [data-new]");
  await p.click("#org-products .form-field:has(> label:text-is('دسته *')) [data-open]"); await p.click(".tp-pop .tp-opt >> nth=1");
  await p.fill("#org-products [data-p=name]", "کیت تستی CRP");
  await p.fill("#org-products [data-p=price]", "1200000");
  await p.fill("#org-products [data-spec='0:0']", "تعداد تست"); await p.fill("#org-products [data-spec='0:1']", "۱۰۰");
  await p.click("#org-products [data-ok]"); await p.waitForTimeout(200);
  check(await p.locator("#org-products .prod-card:has-text('کیت تستی CRP')").count() === 1, "محصول جدید اضافه شد");

  /* صفحه‌ی عمومی */
  await p.goto(BASE + "/lab.html?id=1", { waitUntil: "networkidle" });
  check(/شعار تستی سازمان/.test(await p.locator("#l-sub").innerText()), "شعار در صفحه‌ی عمومی");
  check(await p.locator(".org-slider .sl-item").count() === 5 && await p.locator(".org-slider img").count() === 1, "اسلایدر با تصویر بارگذاری‌شده");
  check(await p.locator("#l-products .prod-card:has-text('کیت تستی CRP')").count() === 1, "محصول در صفحه‌ی سازمان");
  await p.goto(BASE + "/companies.html", { waitUntil: "networkidle" });
  await p.click("[data-view=list]");
  const comps = await p.locator("#lab-grid .lab-card h3").allInnerTexts();
  check(comps.length === 3 && comps.every(t => /شرکت|پخش/.test(t)), "صفحه‌ی شرکت‌ها فقط شرکت‌ها: " + comps.length);
  await p.goto(BASE + "/labs.html", { waitUntil: "networkidle" });
  check(await p.locator("#lab-count").innerText() === "۱۰", "صفحه‌ی آزمایشگاه‌ها بدون شرکت‌ها (۱۰)");
  await p.goto(BASE + "/products.html?cat=reagent", { waitUntil: "networkidle" });
  check(await p.locator("#p-grid .prod-card").count() === 3, "فیلتر دسته‌ی محصولات (۲ نمونه + ۱ جدید)");
  await p.click("#p-grid .prod-card >> nth=0");
  await p.waitForLoadState("networkidle");
  check(await p.locator("#pr-specs tr").count() >= 1, "صفحه‌ی محصول با مشخصات");
  check(!p.errors.length, "بدون خطای JS: " + p.errors.join(" | "));
  await b.close(); done();
})();
