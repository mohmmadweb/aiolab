/* تست دموی رزومه‌ی ساخت‌یافته و تطبیق (روی سرور استاتیک محلی) */
const { browser, page, check, done } = require("../lib");
const BASE = process.env.DEMO || "http://127.0.0.1:8833";
(async () => {
  const b = await browser();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, locale: "fa-IR" });
  await ctx.addInitScript(() => { if (!localStorage.getItem("aio_user")) localStorage.setItem("aio_user", JSON.stringify({ name: "مهران تست", role: "seeker" })); });
  const p = await page(ctx);
  await p.goto(BASE + "/dashboard.html#resume", { waitUntil: "networkidle" });
  await p.waitForTimeout(400);
  check(await p.locator("#resume-builder .rb-live").count() === 1, "رزومه‌ساز رندر شد");
  const live = await p.locator("#resume-builder [data-live]").innerText();
  check(/سن: \S+ سال/.test(live) && /سابقه کل/.test(live), "سن و سابقه محاسبه شد: " + live.replace(/\s+/g, " ").slice(0, 120));
  /* افزودن سابقه‌ی جدید */
  await p.click("[data-add=exp]");
  await p.click(".rb-form .tui-picker [data-open] >> nth=0"); await p.click(".tp-pop .tp-opt >> nth=2");
  await p.click(".rb-form .form-field:nth-child(3) [data-open]"); await p.fill(".tp-pop .tp-search", "کنترل کیفیت"); await p.click(".tp-pop .tp-opt >> nth=0");
  await p.selectOption(".rb-form [data-date=start] [data-m]", "1");
  await p.selectOption(".rb-form [data-date=start] [data-y]", "1396");
  await p.selectOption(".rb-form [data-date=end] [data-m]", "12");
  await p.selectOption(".rb-form [data-date=end] [data-y]", "1396");
  await p.click(".rb-form [data-act=ok]");
  await p.waitForTimeout(200);
  check(await p.locator("#resume-builder .rb-item").filter({ hasText: "۱ سال" }).filter({ hasText: "فروردین ۱۳۹۶" }).count() >= 1, "سابقه‌ی یک‌ساله اضافه شد و مدت خودکار محاسبه شد");
  /* سطح مهارت */
  await p.click("#resume-builder [data-lvl='skills:0'] [data-lv='2']");
  /* افزودن مهارت */
  await p.click("#resume-builder .rb-section:nth-of-type(5) .tp-add").catch(() => {});
  await p.fill("#resume-builder [data-f=phone]", "09121234567");
  await p.click("[data-save]");
  await p.waitForTimeout(300);
  const saved = await p.evaluate(() => JSON.parse(localStorage.getItem("aio_resume")));
  check(saved && saved.experience.length === 3 && saved.skills[0].lvl === 2, "رزومه با ساختار آیتمی ذخیره شد");
  check(!("age" in saved) && !("expYears" in saved), "سن/سابقه ذخیره نمی‌شوند (فقط تاریخ‌ها)");
  await p.goto(BASE + "/index.html"); await p.goto(BASE + "/dashboard.html#matches", { waitUntil: "networkidle" });
  const n = await p.locator("#my-matches details").count();
  check(n > 0, "پوزیشن‌های مناسب نمایش داده شد: " + n);
  const first = await p.locator("#my-matches details summary b").first().innerText();
  check(/هماتولوژی/.test(first), "بهترین پیشنهاد: " + first);
  await p.click("#my-matches details summary >> nth=0");
  check(await p.locator("#my-matches .mb-table").first().isVisible(), "جزئیات تطبیق باز می‌شود");
  check(await p.locator("#suggested .fit-badge").count() > 0, "پیشنهادهای پیشخوان با درصد تطبیق");
  await p.screenshot({ path: "/tmp/claude-1000/aio-shots/demo-matches.png", fullPage: false });
  await p.goto(BASE + "/dashboard.html#resume", { waitUntil: "networkidle" });
  await p.screenshot({ path: "/tmp/claude-1000/aio-shots/demo-resume.png", fullPage: true });
  check(!p.errors.length, "بدون خطای JS: " + p.errors.join(" | "));
  await b.close(); done();
})();
