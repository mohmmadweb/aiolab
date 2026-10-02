/* تست کامل مسیر کارجو */
const { testPhone, browser, page, check, done, BASE, newCtx, wp } = require("./lib");
(async () => {
  const b = await browser();
  const ctx = await newCtx(b, { viewport: { width: 1280, height: 900 } });
  const email = `seeker${Date.now()}@example.com`;
  const p = await page(ctx);
  await p.goto(BASE + "/register/", { waitUntil: "networkidle" });
  await p.fill("#name", "سارا آزمون"); await p.fill("#email", email); await p.fill("#pass", "Test12345!"); await p.fill("#phone", testPhone());
  await p.selectOption("#prov", "tehran");
  await Promise.all([p.waitForNavigation({ waitUntil: "networkidle" }), p.click(".auth-form button[type=submit]")]);
  check(p.url().includes("/dashboard/"), "ثبت‌نام کارجو → داشبورد");
  check(await p.locator("#ob-steps .ob-step").count() === 4, "چک‌لیست ۴ قدمی نمایش داده شد");
  check((await p.locator("#notifs").textContent()).includes("خوش آمدید"), "اعلان خوش‌آمد ثبت شد");
  // درخواست بدون رزومه → خطا
  const jobUrl = await p.evaluate(() => AIO_JOBS[0].url);
  const jp = await page(ctx);
  await jp.goto(jobUrl, { waitUntil: "networkidle" });
  check(/رزومه‌ی آیتمی/.test(await jp.locator("#j-match").innerText()), "بدون رزومه: دعوت به ساخت رزومه‌ی آیتمی برای دیدن درصد تطبیق");
  await jp.click('[onclick="applyJob()"]'); await jp.click("#ap-send");
  await jp.waitForSelector(".toast.show", { timeout: 30000 });
  check(/رزومه/.test(await jp.locator(".toast").textContent()), "درخواست بدون رزومه → پیام تکمیل رزومه");
  await jp.waitForURL(/dashboard/, { timeout: 30000 });
  // رزومه
  /* رزومه‌ی ساخت‌یافته (رابط کامل در talent.js تست می‌شود؛ این‌جا از API) */
  await p.goto(BASE + "/dashboard/#resume", { waitUntil: "networkidle" });
  await p.evaluate(() => API.post("me/cv", { cv: { name: AIO_ME.name, phone: AIO_ME.phone, gender: "خانم", birth: "1995-04-20", provinceId: "tehran", city: "تهران", targetRoles: ["hematology-tech"],
    experience: [{ orgType: "other", orgName: "آزمایشگاه نمونه", role: "hematology-tech", dept: "hematology", start: "2021-01", end: null, skills: ["blood-smear"] }],
    education: [{ degree: 3, field: "علوم آزمایشگاهی", uni: "u1", start: 2013, end: 2017 }],
    skills: [{ id: "sysmex-xn", lvl: 4 }, { id: "blood-smear", lvl: 4 }, { id: "iqc", lvl: 3 }], summary: "۴ سال سابقه کار با سل‌کانتر" } }));
  await p.goto(BASE + "/dashboard/?r=0#resume", { waitUntil: "networkidle" });
  const me = await p.evaluate(() => AIO_ME);
  check(me.resume.title === "کارشناس هماتولوژی" && me.cv.skills.length === 3 && me.resume.city === "تهران" && me.resume.experience, "رزومه‌ی ساخت‌یافته روی سرور ذخیره شد و نمای قدیمی مشتق شد");
  check(await p.locator("#resume-builder .rb-item").count() === 2, "رزومه‌ساز سوابق و تحصیلات ذخیره‌شده را نشان می‌دهد");
  await p.setInputFiles("#resume-input", "/tmp/claude-1000/resume.pdf"); await p.waitForTimeout(1500);
  check(await p.evaluate(() => !!(AIO_ME.resumeFile && AIO_ME.resumeFile.url)), "فایل رزومه بارگذاری شد");
  // آماده به کار
  await p.click("#otw"); await p.waitForTimeout(900);
  check(await p.evaluate(() => AIO_ME.otw === true), "آماده به کار روشن شد");
  // هشدار شغلی
  await p.goto(BASE + "/dashboard/#alerts", { waitUntil: "networkidle" });
  await p.selectOption("#na-dept", "hematology"); await p.selectOption("#na-prov", "tehran");
  await p.click('[onclick="createAlert()"]'); await p.waitForTimeout(1000);
  check(await p.locator("#alerts-list .alert-item").count() === 1, "هشدار شغلی ساخته شد");
  // درخواست همکاری
  await jp.goto(jobUrl, { waitUntil: "networkidle" });
  await jp.click('[onclick="applyJob()"]'); await jp.fill("#ap-note", "آماده‌ی مصاحبه هستم"); await jp.click("#ap-send"); await jp.waitForTimeout(1200);
  check(await jp.evaluate(() => AIO_ME.applications.length === 1), "درخواست همکاری ثبت شد");
  await jp.click('[onclick="applyJob()"]'); await jp.waitForLoadState("networkidle");
  await jp.goto(jobUrl, { waitUntil: "networkidle" });
  check(/ارسال شده/.test(await jp.locator('[onclick="applyJob()"]').textContent()), "دکمه حالت «درخواست ارسال شده» دارد");
  await jp.click('[onclick="toggleSave()"]'); await jp.waitForTimeout(800);
  check(await jp.evaluate(() => AIO_ME.saved.length === 1), "آگهی ذخیره شد");
  await p.goto(BASE + "/dashboard/?r=1#applications", { waitUntil: "networkidle" });
  check(await p.locator("#apps-body tr").count() === 1 && (await p.locator("#apps-body").textContent()).includes("ارسال‌شده"), "درخواست در داشبورد با وضعیت ارسال‌شده");
  check(await p.locator("#saved-jobs .job-card").count() === 1, "آگهی ذخیره‌شده در داشبورد");
  check(!p.errors.length && !jp.errors.filter(e => !/422/.test(e)).length, "بدون خطای JS: " + [...p.errors, ...jp.errors].join(" | "));
  await b.close();
  console.log("EMAIL=" + email);
  done();
})();
