/* تست آکادمی: ثبت‌نام رایگان، درس‌ها، آزمون درس، گواهی، استعلام؛ دوره پولی ← پرداخت دستی ← تأیید مدیر؛ نظر دوره؛ سازنده دوره */
const { testPhone, browser, page, check, done, BASE, newCtx, wp } = require("./lib");
(async () => {
  const b = await browser();
  const ctx = await newCtx(b, { viewport: { width: 1280, height: 900 } });
  const p = await page(ctx);
  await p.goto(BASE + "/register/", { waitUntil: "networkidle" });
  await p.fill("#name", "مینا یادگیرنده"); await p.fill("#email", `learn${Date.now()}@example.com`); await p.fill("#pass", "Test12345!"); await p.fill("#phone", testPhone());
  await Promise.all([p.waitForNavigation({ waitUntil: "networkidle" }), p.click(".auth-form button[type=submit]")]);
  // دوره رایگان کوچک (پروژه راهنما)
  const FREE = await p.evaluate(() => AIO_COURSES.filter(c => !c.price).sort((a, b) => courseLessons(a).length - courseLessons(b).length)[0].id);
  await p.goto(BASE + "/course/" + FREE + "/", { waitUntil: "networkidle" });
  await Promise.all([p.waitForURL(/\/learn\//, { timeout: 15000 }), p.click("#enroll-card .btn-primary")]);
  await p.waitForLoadState("networkidle"); await p.waitForTimeout(800);
  check(p.url().includes("/learn/" + FREE), "ثبت‌نام رایگان → محیط یادگیری");
  check((await p.locator("#l-content").textContent()).length > 20, "محتوای درس از سرور بارگذاری شد");
  const lessons = await p.evaluate(() => L.map(l => ({ key: l.key, type: l.type, q: l.qCount })));
  // کلید پاسخ آزمون‌ها از پیشخوان (فقط برای تست)
  const keys = JSON.parse(wp(`$o=[]; foreach (aio_course_lessons(${FREE}) as $k=>$l) $o[$k]=array_map(fn($q)=>(int)$q["correct"]-1, (array)($l["questions"]??[])); echo json_encode($o);`) || "{}");
  for (const l of lessons) {
    await p.evaluate(k => goTo(k), l.key); await p.waitForTimeout(700);
    if (l.type === "quiz" && l.q) {
      // یک بار غلط، یک بار درست
      await p.click('[onclick="submitQuiz(this)"]'); await p.waitForTimeout(900);
      check(/حداقل ۶۰/.test(await p.locator("#qz-result").textContent()), "آزمون درس بدون پاسخ رد شد");
      for (const [i, a] of (keys[l.key] || []).entries()) await p.check(`input[name="qz${i}"][value="${a}"]`);
      await p.click('[onclick="submitQuiz(this)"]'); await p.waitForTimeout(1500);
      check(/قبول/.test(await p.locator("#qz-result").textContent()), "آزمون درس با پاسخ درست قبول شد (تصحیح سمت سرور)");
    } else {
      await p.click("#btn-done"); await p.waitForTimeout(900);
    }
  }
  await p.waitForTimeout(800);
  const me = await p.evaluate(() => ({ pct: courseProgress(course(Number(qs("id")))).pct, certs: AIO_ME.certs }));
  check(me.pct === 100, "پیشرفت ۱۰۰٪");
  const cert = me.certs.find(c => c.type === "course" && c.refId === FREE);
  check(!!cert, "گواهی پایان دوره صادر شد: " + (cert && cert.code));
  if (cert) {
    const v = await page(await newCtx(b));
    await v.goto(cert.verify, { waitUntil: "networkidle" });
    check((await v.locator(".cert-verify").textContent()).includes("معتبر"), "صفحه‌ی استعلام گواهی، معتبر بودن را تأیید کرد");
    await v.goto(BASE + "/verify/AIO-FAKE1234/", { waitUntil: "networkidle" });
    check((await v.locator(".cert-verify").textContent()).includes("پیدا نشد"), "کد جعلی رد شد");
  }
  // نظر دوره
  await p.goto(BASE + "/course/" + FREE + "/", { waitUntil: "networkidle" });
  await p.click("#cr-stars button >> nth=4"); await p.fill("#cr-text", "دوره‌ی کاربردی و خوبی بود");
  await p.click('[onclick="sendCourseReview(this)"]'); await p.waitForTimeout(1000);
  check((await p.locator("#c-reviews").textContent()).includes("ثبت شد"), "نظر دوره ثبت شد (در انتظار بازبینی)");
  // دوره پولی
  const PAID = await p.evaluate(() => AIO_COURSES.find(c => c.price > 0).id);
  await p.goto(BASE + "/course/" + PAID + "/", { waitUntil: "networkidle" });
  await Promise.all([p.waitForURL(/\/checkout\//, { timeout: 15000 }), p.click("#enroll-card .btn-primary")]);
  await p.waitForLoadState("networkidle");
  check(p.url().includes("/checkout/?order="), "دوره پولی → صفحه‌ی پرداخت سفارش");
  check((await p.locator("#checkout").textContent()).includes("در انتظار پرداخت"), "سفارش در انتظار پرداخت");
  const oid = Number(new URL(p.url()).searchParams.get("order"));
  await p.goto(BASE + "/learn/" + PAID + "/", { waitUntil: "networkidle" });
  check(!p.url().includes("/learn/"), "بدون پرداخت، محیط یادگیری باز نمی‌شود");
  wp(`aio_order_set_status(${oid}, "paid", "تست: تأیید مدیر"); echo "ok";`);
  await p.goto(BASE + "/learn/" + PAID + "/", { waitUntil: "networkidle" }); await p.waitForTimeout(800);
  check(p.url().includes("/learn/" + PAID), "پس از تأیید پرداخت، دسترسی به دوره باز شد");
  await p.goto(BASE + "/dashboard/?y=1#orders", { waitUntil: "networkidle" });
  check((await p.locator("#seeker-orders").textContent()).includes("انجام‌شده"), "سفارش در داشبورد «انجام‌شده» است");
  // سازنده دوره
  await p.goto(BASE + "/course-builder/", { waitUntil: "networkidle" });
  await p.fill('[data-k="title"]', "دوره آزمایشی سازنده"); await p.waitForTimeout(3000);
  const cid = await p.evaluate(() => D.id);
  check(/^\d+$/.test(String(cid)), "پیش‌نویس خودکار روی سرور ذخیره شد: " + cid);
  const st = wp(`echo get_post_status(${Number(cid) || 0}) . "|" . get_the_title(${Number(cid) || 0});`);
  check(st.startsWith("draft|دوره آزمایشی سازنده"), "پیش‌نویس در پیشخوان: " + st);
  check(!p.errors.length, "بدون خطای JS: " + p.errors.join(" | "));
  await b.close();
  done();
})();
