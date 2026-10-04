/* صفحه‌ی «تنظیمات آیولب» در پیشخوان: تب‌های آزمون و گواهی، پیامک و ربات، ابزارها بدون خطا باز و ذخیره می‌شوند (فقط محلی) */
const { browser, page, newCtx, check, done } = require("./lib");
const BASE = process.env.BASE || "http://127.0.0.1:8841", OUT = process.env.OUT || "/tmp/claude-1000/aio-shots";
(async () => {
  const b = await browser(); const c = await newCtx(b); const p = await page(c);
  await p.goto(BASE + "/wp-login.php", { waitUntil: "load" });
  await p.fill("#user_login", process.env.WP_USER || "admin"); await p.fill("#user_pass", process.env.WP_PASS || "admin123");
  await Promise.all([p.waitForNavigation({ waitUntil: "load" }), p.click("#wp-submit")]);
  for (const tab of ["exams", "notify", "rules", "tools"]) {
    await p.goto(BASE + "/wp-admin/admin.php?page=aio-settings&tab=" + tab, { waitUntil: "load" });
    const body = await p.textContent("#wpbody-content");
    check(!/Fatal error|Warning:|Notice:|Deprecated:/.test(body), `تب ${tab} بدون خطای PHP باز شد`);
    await p.screenshot({ path: `${OUT}/admin-settings-${tab}.png`, fullPage: true });
    if (tab === "exams") {
      check(/گزینه‌های «اعتبار گواهی»/.test(body) && /دعوت خودکار/.test(body) && /بدون بازبینی/.test(body), "تب آزمون و گواهی همه‌ی تنظیمات را دارد");
      await Promise.all([p.waitForNavigation({ waitUntil: "load" }), p.click("#submit")]);
      check(/ذخیره شد/.test(await p.textContent("#wpbody-content")), "ذخیره‌ی تب آزمون و گواهی بدون تغییر مقادیر کار کرد");
    }
    if (tab === "notify") check(/کاوه‌نگار/.test(await p.innerHTML("#wpbody-content")) && /توکن ربات/.test(body), "تب پیامک و ربات سرویس‌دهنده‌ها و تنظیمات ربات را دارد");
    if (tab === "tools") check(/سرویس پیامک تنظیم نشده/.test(body) && /ربات/.test(body), "ابزارها راهنمای راه‌اندازی پیامک/ربات را نشان می‌دهد");
  }
  check(!p.errors.filter(x => !/favicon|404/.test(x)).length, "بدون خطای JS " + p.errors.slice(0, 2).join(" | "));
  await b.close(); done();
})();
