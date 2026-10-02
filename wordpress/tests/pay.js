/* تست پرداخت با Sandbox زرین‌پال: سفارش ← درگاه ← بازگشت ← تأیید ← فعال‌سازی خودکار */
const { testPhone, browser, page, check, done, BASE, newCtx } = require("./lib");
(async () => {
  const b = await browser(); const ctx = await newCtx(b); const p = await page(ctx);
  await p.goto(BASE + "/register/?role=employer", { waitUntil: "networkidle" });
  await p.fill("#name", "مرکز تست پرداخت"); await p.fill("#email", `pay${Date.now()}@example.com`); await p.fill("#pass", "Test12345!"); await p.fill("#phone", testPhone());
  await Promise.all([p.waitForNavigation({ waitUntil: "networkidle" }), p.click(".auth-form button[type=submit]")]);
  const r = await p.evaluate(() => API.post("orders", { code: "R3" }));
  check(r.status === "pending" && r.checkout, "سفارش بسته ۵ آگهی ثبت شد");
  await p.goto(r.checkout, { waitUntil: "networkidle" });
  await Promise.all([p.waitForURL(/zarinpal/, { timeout: 60000 }), p.click("#pay-btn")]);
  check(/sandbox\.zarinpal\.com\/pg\/StartPay/.test(p.url()), "انتقال به درگاه زرین‌پال (sandbox): " + p.url().slice(0, 70));
  await p.waitForLoadState("networkidle");
  const btns = await p.evaluate(() => [...document.querySelectorAll("button, a, input[type=submit]")].map(x => (x.innerText || x.value || "").trim()).filter(Boolean).slice(0, 12));
  console.log("   gateway buttons:", btns.join(" | "));
  const ok = p.locator("button, a, input[type=submit]").filter({ hasText: /موفق|پرداخت|Success|Pay/i }).first();
  await Promise.all([p.waitForURL(u => u.toString().startsWith(BASE), { timeout: 90000 }), ok.click()]);
  await p.waitForLoadState("networkidle");
  check(p.url().includes("paid=1"), "بازگشت از درگاه با پرداخت موفق: " + p.url().slice(0, 90));
  const me = await p.evaluate(() => AIO_ME);
  check(me.credits.job === 5, "۵ اعتبار آگهی خودکار اضافه شد: " + JSON.stringify(me.credits));
  check(me.orders[0].status === "done" && me.orders[0].refId, "سفارش «انجام‌شده» با کد پیگیری بانک: " + me.orders[0].refId);
  await b.close(); done();
})();
