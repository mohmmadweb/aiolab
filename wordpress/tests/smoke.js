/* دود‌تست: همه‌ی برگه‌ها بدون خطای JS باز شوند و بخش‌های پویا پر شوند */
const { browser, page, check, done, BASE, SHOTS } = require("./lib");
const PAGES = (process.env.PAGES || "/,/jobs/,/labs/,/ranking/,/exams/,/assessment/,/mbti/,/courses/,/magazine/,/community/,/faq/,/services/,/pricing/,/reports/,/advertise/,/about/,/contact/,/login/,/register/,/verify-certificate/").split(",");
(async () => {
  const b = await browser();
  const ctx = await b.newContext({ viewport: { width: 1366, height: 900 }, locale: "fa-IR" });
  if (process.env.PREVIEW) await ctx.addCookies([{ name: "aio_preview", value: process.env.PREVIEW, url: BASE }]);
  for (const u of PAGES) {
    const p = await page(ctx);
    await p.goto(BASE + u, { waitUntil: "networkidle" }).catch(e => p.errors.push("nav: " + e.message));
    await p.waitForTimeout(400);
    const info = await p.evaluate(() => ({ title: document.title, h1: (document.querySelector("h1") || {}).textContent, empties: [...document.querySelectorAll("[id]")].filter(e => /grid|list|body|jobs|labs|courses|paths|articles|faq|services|posts|home-|cat-/.test(e.id) && !e.children.length && !e.textContent.trim()).map(e => e.id), hdr: !!document.querySelector("#site-header .logo"), ftr: !!document.querySelector("#site-footer .footer-grid") }));
    check(!p.errors.length && info.hdr && info.ftr, `${u} — ${info.title} ${p.errors.length ? "\n      " + p.errors.slice(0, 5).join("\n      ") : ""}${info.empties.length ? "  [خالی: " + info.empties.join(",") + "]" : ""}`);
    await p.screenshot({ path: `${SHOTS}/${(u.replace(/\//g, "_") || "home")}.png`, fullPage: !!process.env.FULL });
    await p.close();
  }
  await b.close();
  done();
})();
