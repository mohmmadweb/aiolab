/* تست آزمون درس (دوره رایگان دارای آزمون) و آزمون مهارت (تصحیح سمت سرور، گواهی، محدودیت شرکت مجدد) */
const { testPhone, browser, page, check, done, BASE, newCtx, wp } = require("./lib");
(async () => {
  const b = await browser();
  const ctx = await newCtx(b, { viewport: { width: 1280, height: 900 } });
  const p = await page(ctx);
  await p.goto(BASE + "/register/", { waitUntil: "networkidle" });
  await p.fill("#name", "رضا آزمون‌دهنده"); await p.fill("#email", `qz${Date.now()}@example.com`); await p.fill("#pass", "Test12345!"); await p.fill("#phone", testPhone());
  await Promise.all([p.waitForNavigation({ waitUntil: "networkidle" }), p.click(".auth-form button[type=submit]")]);
  const CID = await p.evaluate(() => AIO_COURSES.find(c => !c.price && courseLessons(c).some(l => l.type === "quiz" && l.qCount)).id);
  await p.evaluate(id => API.post("courses/" + id + "/enroll"), CID);
  await p.goto(BASE + "/learn/" + CID + "/", { waitUntil: "networkidle" });
  const qk = await p.evaluate(() => L.find(l => l.type === "quiz" && l.qCount).key);
  await p.evaluate(k => goTo(k), qk); await p.waitForTimeout(1200);
  check(await p.locator("#btn-done").isHidden(), "دکمه تکمیل برای آزمون درس پنهان است");
  const keys = JSON.parse(wp(`echo json_encode(array_map(fn($q)=>(int)$q["correct"]-1, (array)(aio_course_lessons(${CID})["${qk}"]["questions"]??[])));`));
  await p.click('[onclick="submitQuiz(this)"]'); await p.waitForTimeout(1000);
  check(/حداقل ۶۰/.test(await p.locator("#qz-result").textContent()), "آزمون درس بدون پاسخ رد شد");
  const direct = await p.evaluate(async (a) => { try { await API.post("courses/" + a.c + "/progress", { key: a.k, done: true }); return "ok"; } catch (e) { return e.message; } }, { c: CID, k: qk });
  check(/آزمون/.test(direct), "دور زدن آزمون با API ممنوع است");
  for (const [i, a] of keys.entries()) await p.check(`input[name="qz${i}"][value="${a}"]`);
  await p.click('[onclick="submitQuiz(this)"]');
  await p.waitForFunction(() => /قبول/.test((document.getElementById("qz-result") || {}).textContent || ""), null, { timeout: 15000 }).catch(() => {});
  check(/قبول/.test(await p.locator("#qz-result").textContent()), "با پاسخ درست قبول شد");
  await p.waitForFunction(k => MyCourses.get(Number(qs("id"))).done.includes(k), qk, { timeout: 15000 }).catch(() => {});
  check(await p.evaluate(k => MyCourses.get(Number(qs("id"))).done.includes(k), qk), "درس آزمون تکمیل‌شده ثبت شد");
  // آزمون مهارت
  const EX = await p.evaluate(() => AIO_EXAMS[0]);
  check(!("answer" in EX.questions[0]), "پاسخ سؤالات آزمون در داده‌ی عمومی منتشر نمی‌شود");
  await p.goto(EX.url, { waitUntil: "networkidle" });
  await p.click('[onclick="startExam()"]'); await p.waitForTimeout(1200);
  check(await p.locator("#runner").isVisible(), "آزمون شروع شد (سؤالات از سرور)");
  const ekeys = JSON.parse(wp(`echo json_encode(array_map(fn($q)=>(int)$q["correct"]-1, (array)aio_meta(${EX.id},"questions",[])));`));
  for (let i = 0; i < ekeys.length; i++) { await p.evaluate(i => showQ(i), i); await p.evaluate(k => pick(k), ekeys[i]); }
  p.once("dialog", d => d.accept());
  await p.evaluate(() => finishExam(false)); await p.waitForTimeout(1800);
  check((await p.locator("#res-hero").textContent()).includes("قبول شدید"), "با پاسخ‌های درست قبول شد و گواهی صادر شد");
  check(await p.evaluate(id => AIO_ME.certs.some(c => c.type === "exam" && c.refId === id), EX.id), "گواهی آزمون روی رزومه");
  const again = await p.evaluate(async id => { try { await API.post("exams/" + id + "/start"); return "ok"; } catch (e) { return e.message; } }, EX.id);
  check(/روز دیگر/.test(again), "شرکت مجدد پیش از مهلت مجاز نیست: " + again);
  const takers = wp(`echo aio_meta(${EX.id},"takers",0)."|".aio_meta(${EX.id},"passes",0);`);
  check(/^[1-9]\d*\|[1-9]/.test(takers), "آمار شرکت‌کننده/قبولی آزمون به‌روز شد: " + takers);
  check(!p.errors.filter(e => !/40[0-9]|429|422/.test(e)).length, "بدون خطای JS: " + p.errors.join(" | "));
  await b.close();
  done();
})();
