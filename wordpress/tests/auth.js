/* تست ثبت‌نام، خروج، ورود، رمز اشتباه */
const { testPhone, browser, page, check, done, BASE, newCtx, wp } = require("./lib");
(async () => {
  const b = await browser();
  const ctx = await newCtx(b, { viewport: { width: 1280, height: 900 } });
  const email = `t${Date.now()}@example.com`;
  const p = await page(ctx);
  await p.goto(BASE + "/register/?role=volunteer", { waitUntil: "networkidle" });
  check(await p.locator("#rb-volunteer.active").count() === 1, "نقش داوطلب از URL انتخاب شد");
  await p.fill("#name", "کاربر آزمایشی");
  await p.fill("#email", email);
  await p.fill("#phone", "09120000" + String(Date.now()).slice(-3));
  await p.fill("#pass", "short");
  await p.click(".auth-form button[type=submit]");
  await p.waitForTimeout(600);
  check(/۸|8/.test(await p.locator("#form-msg").textContent()) || await p.evaluate(() => !document.querySelector("#pass").checkValidity()), "رمز کوتاه رد شد");
  await p.fill("#pass", "Test12345!");
  await Promise.all([p.waitForNavigation({ waitUntil: "networkidle" }), p.click(".auth-form button[type=submit]")]);
  check(p.url().includes("/dashboard/"), "پس از ثبت‌نام به داشبورد رفت: " + p.url());
  check(await p.evaluate(() => window.AIO_ME && AIO_ME.role === "volunteer" && AIO_ME.email), "AIO_ME نقش داوطلب دارد");
  check(await p.locator("#site-header .user-chip").count() === 1, "هدر حالت واردشده را نشان می‌دهد");
  // تکرار ایمیل
  const p2 = await page(await newCtx(b));
  await p2.goto(BASE + "/register/", { waitUntil: "networkidle" });
  await p2.fill("#name", "تکراری"); await p2.fill("#email", email); await p2.fill("#pass", "Test12345!"); await p2.fill("#phone", testPhone());
  await p2.click(".auth-form button[type=submit]"); await p2.waitForTimeout(800);
  check(/قبلاً/.test(await p2.locator("#form-msg").textContent()), "ایمیل تکراری رد شد");
  // خروج
  await Promise.all([p.waitForURL(u => !/wp-login/.test(String(u)) || true, { waitUntil: "networkidle" }).catch(() => {}), p.evaluate(() => Auth.logout())]);
  await p.waitForTimeout(1500);
  await p.goto(BASE + "/", { waitUntil: "networkidle" });
  check(await p.locator("#site-header .hdr-login").count() === 1, "پس از خروج، دکمه ورود نمایش داده شد");
  // ورود با رمز اشتباه
  await p.goto(BASE + "/login/?redirect=%2Fcourses%2F", { waitUntil: "networkidle" });
  await p.fill("#email", email); await p.fill("#pass", "wrongpass1");
  await p.click(".auth-form button[type=submit]"); await p.waitForTimeout(800);
  check(/درست نیست/.test(await p.locator("#form-msg").textContent()), "رمز اشتباه پیام خطا داد");
  await p.fill("#pass", "Test12345!");
  await Promise.all([p.waitForNavigation({ waitUntil: "networkidle" }), p.click(".auth-form button[type=submit]")]);
  check(p.url().endsWith("/courses/"), "ورود موفق و بازگشت به redirect: " + p.url());
  // صفحه‌ی محافظت‌شده بدون ورود
  const p3 = await page(await newCtx(b));
  await p3.goto(BASE + "/employer/", { waitUntil: "networkidle" });
  check(p3.url().includes("/login/") && p3.url().includes("role=employer"), "پنل کارفرما بدون ورود → صفحه‌ی ورود: " + p3.url());
  const errs = p.errors.filter(e => !/401.*auth\/login|status of 401/.test(e)); /* ۴۰۱ ورود با رمز اشتباه عمدی است */
  check(!errs.length, "بدون خطای JS " + errs.join(" | "));
  await b.close();
  console.log("EMAIL=" + email);
  done();
})();
