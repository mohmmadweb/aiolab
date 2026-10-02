/* تست کامل مسیر کارفرما: ثبت‌نام → ثبت مرکز روی نقشه → ثبت آگهی → تأیید مدیر → درخواست کارجو → مدیریت متقاضی → آزمون → بانک رزومه */
const { testPhone, browser, page, check, done, BASE, newCtx, wp } = require("./lib");
(async () => {
  const b = await browser();
  const ctx = await newCtx(b, { viewport: { width: 1280, height: 900 } });
  const email = `emp${Date.now()}@example.com`;
  const p = await page(ctx);
  await p.goto(BASE + "/register/?role=employer", { waitUntil: "networkidle" });
  await p.fill("#name", "آزمایشگاه تست پارس"); await p.fill("#email", email); await p.fill("#pass", "Test12345!"); await p.fill("#phone", testPhone());
  await p.selectOption("#prov", "isfahan");
  await Promise.all([p.waitForNavigation({ waitUntil: "networkidle" }), p.click(".auth-form button[type=submit]")]);
  check(p.url().includes("/employer/"), "ثبت‌نام کارفرما → پنل کارفرما");
  await p.goto(BASE + "/employer/#orgprofile", { waitUntil: "networkidle" });
  check((await p.locator("#org-profile").textContent()).includes("ابتدا سازمان"), "بدون سازمان، پیام «ابتدا سازمان خود را ثبت کنید»");
  // ثبت مرکز
  await p.goto(BASE + "/employer/?x=1#addlab", { waitUntil: "networkidle" });
  await p.fill("#lb-name", "آزمایشگاه تست پارس");
  await p.selectOption("#lb-prov", "isfahan"); await p.selectOption("#lb-city", "اصفهان");
  await p.click('[onclick="submitLab(this)"]'); await p.waitForTimeout(500);
  check(/میانگین حقوق/.test(await p.locator(".toast").textContent()), "اعتبارسنجی: میانگین حقوق لازم است");
  await p.fill("#lb-salary", "19.5"); await p.fill("#lb-address", "خیابان چهارباغ"); await p.fill("#lb-phone", "03132220000"); await p.fill("#lb-email", "info@lab-test.example.com");
  await p.click('[onclick="submitLab(this)"]'); await p.waitForTimeout(500);
  check(/نقشه/.test(await p.locator(".toast").textContent()), "اعتبارسنجی: پین روی نقشه لازم است");
  await p.evaluate(() => picker.setPin(32.6546, 51.668));
  await p.click("#lb-perks .cp >> nth=0");
  await p.click('[onclick="submitLab(this)"]'); await p.waitForTimeout(1500);
  const labs = await p.evaluate(() => AIO_ME.labs);
  check(labs.length === 1 && labs[0].status === "pending" && Math.abs(labs[0].lat - 32.6546) < 0.001, "مرکز با وضعیت «در انتظار تأیید» و مختصات ثبت شد");
  // ثبت آگهی (فرم ساخت‌یافته)
  await p.goto(BASE + "/employer/?x=2#post", { waitUntil: "networkidle" });
  const pk = async (label, q) => { await p.click(`#pos-form .form-field:has(> label:text-is("${label}")) [data-open]`); if (q) await p.fill(".tp-pop .tp-search", q); await p.click(".tp-pop .tp-opt >> nth=0"); await p.keyboard.press("Escape"); await p.waitForTimeout(150); };
  await pk("عنوان شغلی استاندارد *", "بیوشیمی");
  await p.fill("#pos-form [data-d=title]", "کارشناس بیوشیمی شیفت عصر");
  await pk("استان *", "اصفهان"); await pk("شهر *", "اصفهان");
  await p.fill("#pos-form [data-d=salaryMin]", "15"); await p.fill("#pos-form [data-d=salaryMax]", "20");
  await p.fill("#pos-form [data-d=desc]", "برای بخش بیوشیمی شیفت عصر به کارشناس مسلط به اتوآنالایزر نیازمندیم.");
  await p.selectOption("#pos-form [data-rq=minExp]", "12");
  await p.click("#pos-form .tp-add:has-text('افزودن مهارت')"); await p.fill(".tp-pop .tp-search", "BT-3000"); await p.click(".tp-pop .tp-opt >> nth=0"); await p.keyboard.press("Escape");
  await p.click("#pos-form [data-submit]"); await p.waitForTimeout(1500); console.log("   toast:", await p.locator(".toast").textContent().catch(()=>""));
  const jobs = await p.evaluate(() => AIO_ME.jobs);
  check(jobs.length === 1 && jobs[0].wpStatus === "pending" && jobs[0].salary.includes("۱۵"), "آگهی در انتظار تأیید ثبت شد");
  // تأیید مدیر (پیشخوان)
  const jid = jobs[0].id, lid = labs[0].id;
  wp(`wp_update_post(["ID"=>${lid},"post_status"=>"publish"]); wp_update_post(["ID"=>${jid},"post_status"=>"publish"]); echo "ok";`);
  const pub = await page(await newCtx(b));
  await pub.goto(BASE + "/job/" + jid + "/", { waitUntil: "networkidle" });
  check((await pub.locator("#j-title").textContent()).includes("بیوشیمی شیفت عصر"), "آگهی پس از تأیید مدیر در سایت منتشر شد");
  await pub.goto(BASE + "/jobs/?q=" + encodeURIComponent("شیفت عصر"), { waitUntil: "networkidle" });
  check(await pub.locator("#job-list .job-card").count() >= 1, "آگهی در جستجوی فرصت‌ها پیدا شد");
  const notices = await (async () => { await p.goto(BASE + "/employer/?x=3", { waitUntil: "networkidle" }); return p.evaluate(() => AIO_ME.notices.map(n => n.text).join(" | ")); })();
  check(notices.includes("تأیید و منتشر شد"), "اعلان انتشار به کارفرما رسید");
  // درخواست یک کارجو
  const sctx = await newCtx(b);
  const s = await page(sctx);
  await s.goto(BASE + "/register/", { waitUntil: "networkidle" });
  await s.fill("#name", "حامد متقاضی"); await s.fill("#email", "app" + Date.now() + "@example.com"); await s.fill("#pass", "Test12345!"); await s.fill("#phone", testPhone());
  await Promise.all([s.waitForNavigation({ waitUntil: "networkidle" }), s.click(".auth-form button[type=submit]")]);
  await s.evaluate(() => API.post("me/cv", { cv: { name: AIO_ME.name, phone: AIO_ME.phone, gender: "آقا", military: "پایان خدمت", birth: "1993-05-01", provinceId: "isfahan", city: "اصفهان", targetRoles: ["biochem-tech"],
    experience: [{ orgType: "other", orgName: "آزمایشگاه نمونه", role: "biochem-tech", dept: "biochemistry", start: "2020-01", end: null, skills: ["bt-3000"] }],
    skills: [{ id: "bt-3000", lvl: 4 }, { id: "iqc", lvl: 3 }] } }));
  await s.goto(BASE + "/job/" + jid + "/", { waitUntil: "networkidle" });
  await s.click('[onclick="applyJob()"]'); await s.click("#ap-send"); await s.waitForTimeout(1200);
  // مدیریت متقاضی (داشبورد متقاضیان + پنجره‌ی درخواست؛ جزئیات کامل در pipeline.js)
  await p.goto(BASE + "/employer/?x=4#applicants", { waitUntil: "networkidle" });
  check(await p.locator("#ats tr[data-app]").count() === 1 && (await p.locator("#ats").textContent()).includes("حامد"), "متقاضی در داشبورد متقاضیان نمایش داده شد");
  const match = await p.evaluate(() => AIO_ME.applicants[0].match);
  check(match >= 80, "درصد تطبیق واقعی (موتور ساخت‌یافته) محاسبه شد: " + match);
  await p.click("#ats tr[data-app]"); await p.waitForSelector("#app-modal.open .app-tabs", { timeout: 20000 });
  check((await p.locator("#app-modal").textContent()).includes("@example.com"), "پنجره‌ی درخواست با اطلاعات تماس باز شد");
  const appId = await p.evaluate(() => AIO_ME.applicants[0].id);
  await p.evaluate(id => API.post("applications/" + id + "/action", { status: "interview", note: "شنبه ساعت ۱۰", interview: { at: new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10) + "T10:00", mode: "حضوری", place: "اصفهان، خیابان چهارباغ" } }), appId);
  await p.keyboard.press("Escape");
  check(await p.evaluate(async () => { await API.get("me"); return AIO_ME.applicants[0].status === "interview"; }), "وضعیت به «دعوت به مصاحبه» تغییر کرد");
  await s.goto(BASE + "/dashboard/?x=1#applications", { waitUntil: "networkidle" });
  check((await s.locator("#apps-body").textContent()).includes("دعوت به مصاحبه"), "کارجو وضعیت جدید را در داشبورد می‌بیند");
  check((await s.evaluate(() => AIO_ME.notices.map(n => n.text).join(" "))).includes("دعوت به مصاحبه"), "اعلان دعوت به کارجو رسید");
  // آزمون
  await p.goto(BASE + "/employer/?x=5#exambuilder", { waitUntil: "networkidle" });
  await p.fill("#eb-title", "آزمون تست بیوشیمی پایه");
  for (let i = 0; i < 3; i++) {
    if (i) await p.click('[onclick="addQuestion()"]');
    await p.fill(`.eb-q >> nth=${i} >> .ebq-text`, "سؤال شماره " + (i + 1));
    for (let k = 0; k < 3; k++) await p.fill(`.eb-q >> nth=${i} >> .ebq-opt input[type=text] >> nth=${k}`, "گزینه " + (k + 1));
  }
  await p.click('[onclick="submitExam(this)"]'); await p.waitForTimeout(1500);
  check(await p.evaluate(() => AIO_ME.myExams.length === 1 && AIO_ME.myExams[0].status === "pending"), "آزمون برای بازبینی ثبت شد");
  // بانک رزومه
  await p.goto(BASE + "/employer/?x=6#resumes", { waitUntil: "networkidle" });
  await p.waitForSelector("#emp-resumes .tl-tabs", { timeout: 20000 });
  await p.click("#emp-resumes [data-preset='1']"); await p.waitForTimeout(400);
  const nres = await p.locator("#emp-resumes .tl-pane.on [data-res] .tl-row").count();
  check(nres >= 3, "بانک رزومه (فیلتر AND/OR) کارجویان آماده‌به‌کار را نشان می‌دهد: " + nres);
  // بستن آگهی
  await p.goto(BASE + "/employer/?x=7#jobs", { waitUntil: "networkidle" });
  p.once("dialog", d => d.accept());
  await p.click('#jobs-body [onclick^="jobAction"]'); await p.waitForTimeout(1500);
  check(await p.evaluate(() => AIO_ME.jobs[0].wpStatus === "private"), "آگهی بسته شد");
  check(!p.errors.filter(e => !/42[29]|40[0-3]/.test(e)).length, "بدون خطای JS: " + p.errors.join(" | "));
  await b.close();
  done();
})();
