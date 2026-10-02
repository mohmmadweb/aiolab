/* تست فرایند کامل استخدام داخل سایت:
   آگهی ساخت‌یافته ← تطبیق خودکار ← درخواست کارجو ← داشبورد متقاضیان ← دیده‌شدن خودکار ← دعوت به مصاحبه
   ← درخواست تغییر زمان ← زمان جدید ← تأیید ← گفتگو ← پیشنهاد همکاری ← پذیرش ← استخدام
   + دعوت مستقیم از مرکز تطبیق ← پاسخ کارجو ← رد با دلیل   + انصراف کارجو   + پنجره‌ها وسط صفحه */
const { testPhone, browser, page, check, done, BASE, newCtx, wp } = require("./lib");
(async () => {
  const b = await browser();
  const stamp = Date.now();
  const LIVE = !BASE.includes("127.0.0.1");
  /* منتظر پنجره‌ی درخواست؛ اگر خطا داد متن خطا چاپ شود */
  let lastOpen = null;
  const modalReady = async pg => {
    for (let i = 0; i < 4; i++) {
      await pg.waitForSelector("#app-modal.open .tl-body .app-tabs, #app-modal.open .tl-body .notice-box", { timeout: 60000 });
      if (!(await pg.locator("#app-modal .tl-body .notice-box.err").count())) return;
      const txt = await pg.locator("#app-modal .tl-body").innerText();
      /* قطعی لحظه‌ای شبکه‌ی سرور تست ← دوباره باز کن */
      if (!/اتصال به سرور/.test(txt) || !lastOpen) throw new Error("app modal error: " + txt);
      await pg.keyboard.press("Escape"); await pg.waitForTimeout(2000); await lastOpen();
    }
  };

  /* ---------- کارفرما: ثبت‌نام، سازمان، آگهی ساخت‌یافته ---------- */
  const ectx = await newCtx(b);
  const e = await page(ectx);
  e.on("dialog", d => d.accept());
  await e.goto(BASE + "/register/?role=employer", { waitUntil: "networkidle" });
  await e.fill("#name", "آزمایشگاه تست فرایند"); await e.fill("#email", `pemp${stamp}@example.com`); await e.fill("#pass", "Test12345!"); await e.fill("#phone", testPhone());
  await Promise.all([e.waitForNavigation({ waitUntil: "networkidle" }), e.click(".auth-form button[type=submit]")]);
  const noContact = await e.evaluate(() => API.post("employer/lab", { lab: { name: "بدون تماس", provinceId: "tehran", city: "تهران", lat: 35.7, lng: 51.4, avgSalary: 20 } }).then(() => "ok", x => x.message));
  check(/تلفن/.test(noContact), "ثبت سازمان بدون تلفن/ایمیل رد شد");
  const labId = await e.evaluate(async () => (await API.post("employer/lab", { lab: { name: "آزمایشگاه تست فرایند", provinceId: "tehran", city: "تهران", lat: 35.72, lng: 51.41, avgSalary: 22, address: "تهران، خیابان تست، پلاک ۱", phone: "02133334444", email: "hr@lab-flow.example.com" } })).id);
  wp(`wp_update_post(["ID"=>${labId},"post_status"=>"publish"]); do_action("aio_data_changed"); echo 1;`);
  const jobId = await e.evaluate(async lab => (await API.post("employer/job", { job: { title: "کارشناس هماتولوژی تست فرایند", labId: lab, dept: "hematology", provinceId: "tehran", city: "تهران", type: "تمام‌وقت", shift: "صبح",
    salaryMin: 20, salaryMax: 26, desc: "برای بخش هماتولوژی به کارشناس مسلط به سل‌کانتر Sysmex نیازمندیم.", role: "hematology-tech",
    req: { role: "hematology-tech", minExp: 12, skills: [{ id: "sysmex-xn", w: 10, lvl: 4, must: true }, { id: "blood-smear", w: 8, lvl: 3 }] } } })).id, labId);
  /* انتشار توسط مدیر ← تطبیق خودکار */
  const auto = JSON.parse(wp(`wp_update_post(["ID"=>${jobId},"post_status"=>"publish"]); echo json_encode(aio_auto_match_job(${jobId}));`) || "{}");
  check(Object.keys(auto).length >= 1, "تطبیق خودکار پس از انتشار: " + Object.keys(auto).length + " نفر تطبیق بالا");
  const ali = Object.keys(auto)[0];
  const aliNote = wp(`$n = (array) get_user_meta(${ali}, "aio_notices", true); echo $n ? $n[0]["text"] : "";`);
  check(/تطبیق دارد/.test(aliNote), "کارجوی با تطبیق بالا اعلان «آگهی جدید» گرفت");
  await e.goto(BASE + "/employer/?r=1#overview", { waitUntil: "networkidle" });
  check((await e.evaluate(() => AIO_ME.notices.map(n => n.text).join(" "))).includes("تطبیق بالا"), "کارفرما اعلان «N نفر تطبیق بالا» گرفت");

  /* ---------- کارجو: رزومه و درخواست ---------- */
  const sctx = await newCtx(b);
  const s = await page(sctx);
  await s.goto(BASE + "/register/", { waitUntil: "networkidle" });
  await s.fill("#name", "کارجوی تست فرایند " + String(stamp).slice(-4)); await s.fill("#email", `pseek${stamp}@example.com`); await s.fill("#pass", "Test12345!"); await s.fill("#phone", testPhone());
  await Promise.all([s.waitForNavigation({ waitUntil: "networkidle" }), s.click(".auth-form button[type=submit]")]);
  const jobUrl = BASE + "/job/" + jobId + "/";
  const noCv = await s.evaluate(id => API.post("jobs/" + id + "/apply", {}).then(() => "ok", x => x.message), jobId);
  check(/رزومه/.test(noCv), "درخواست بدون رزومه‌ی آیتمی رد شد");
  await s.evaluate(() => API.post("me/cv", { cv: { name: AIO_ME.name, phone: AIO_ME.phone, gender: "خانم", birth: "1994-02-10", provinceId: "tehran", city: "تهران", targetRoles: ["hematology-tech"],
    experience: [{ orgType: "other", orgName: "آزمایشگاه نمونه", role: "hematology-tech", dept: "hematology", start: "2019-03", end: null, skills: [] }],
    education: [{ degree: 3, field: "علوم آزمایشگاهی", uni: "u1", start: 2012, end: 2016 }], skills: [{ id: "sysmex-xn", lvl: 5 }, { id: "blood-smear", lvl: 4 }] } }));
  await s.evaluate(() => API.post("me/otw", { on: true }));
  await s.goto(jobUrl, { waitUntil: "networkidle" });
  await s.click('[onclick="applyJob()"]'); await s.fill("#ap-note", "آماده‌ی مصاحبه هستم"); await s.click("#ap-send");
  await s.waitForFunction(() => AIO_ME.applications.length === 1, null, { timeout: 20000 }).catch(() => {});
  const appId = await s.evaluate(() => AIO_ME.applications[0] && AIO_ME.applications[0].id);
  check(!!appId, "درخواست ثبت شد");

  /* ---------- کارفرما: داشبورد متقاضیان ---------- */
  await e.goto(BASE + "/employer/?r=2#applicants", { waitUntil: "networkidle" });
  check(await e.locator("#ats .ats-kpis").count() === 1 && await e.locator("#ats .ats-bars").count() === 2, "داشبورد متقاضیان: KPI، روند روزانه و توزیع تطبیق");
  check(await e.locator("#ats tr[data-app]").count() === 1 && /بررسی نشده/.test(await e.locator("#ats tr[data-app]").innerText()), "ردیف متقاضی با برچسب «بررسی نشده»");
  lastOpen = () => e.click("#ats tr[data-app]"); await lastOpen();
  await modalReady(e);
  const box = await e.locator("#app-modal .tl-dialog").boundingBox(), vp = e.viewportSize();
  check(box && Math.abs(box.x + box.width / 2 - vp.width / 2) < 20 && box.y >= 0 && box.y + box.height <= vp.height + 1, "پنجره‌ی درخواست وسط صفحه و کامل داخل صفحه است");
  check(/دیده‌شده/.test(await e.locator("#app-modal .cd-head").innerText()), "باز کردن درخواست = «دیده‌شده» خودکار");
  /* دعوت به مصاحبه */
  await e.click('#app-modal [data-act="interview"]');
  await e.selectOption('#app-modal [data-date="iv"] [data-d]', "15");
  const ny = await e.evaluate(() => AioDate.thisJYear() + 1);
  await e.selectOption('#app-modal [data-date="iv"] [data-m]', "2");
  await e.selectOption('#app-modal [data-date="iv"] [data-y]', String(ny));
  await e.selectOption('#app-modal [data-f="time"]', "11:00");
  await e.click('#app-modal [data-act="send-interview"]');
  await e.waitForFunction(() => /دعوت به مصاحبه/.test(document.querySelector("#app-modal .cd-head").innerText), null, { timeout: 20000 }).catch(() => {});
  check(/مصاحبه:/.test(await e.locator("#app-modal").innerText()), "دعوت به مصاحبه با تاریخ، ساعت و نشانی ثبت شد");
  await e.keyboard.press("Escape");

  /* ---------- کارجو: پاسخ به مصاحبه، گفتگو ---------- */
  await s.goto(BASE + "/dashboard/?r=1#applications", { waitUntil: "networkidle" });
  check(/تأیید زمان مصاحبه/.test(await s.locator("#apps-body").innerText()), "کارجو برچسب «اقدام لازم: تأیید زمان مصاحبه» می‌بیند");
  check((await s.evaluate(() => AIO_ME.notices.map(n => n.text).join(" "))).includes("دعوت به مصاحبه"), "اعلان دعوت به مصاحبه به کارجو رسید");
  lastOpen = () => s.click("#apps-body tr.clickable"); await lastOpen();
  await modalReady(s);
  await s.click('#app-modal [data-act="interview:reschedule"]');
  await s.fill('#app-modal [data-f="note"]', "یکشنبه یا دوشنبه بعدازظهر مناسب است");
  await s.click('#app-modal [data-act="confirm-interview:reschedule"]'); await s.waitForTimeout(1500);
  check(/درخواست زمان دیگر/.test(await s.locator("#app-modal").innerText()), "کارجو درخواست تغییر زمان داد");
  await s.click('#app-modal [data-tab="chat"]');
  await s.fill("#app-modal [data-chat]", "سلام، ممنون از دعوت شما.");
  await s.click('#app-modal [data-act="send"]'); await s.waitForTimeout(1500);
  check(await s.locator("#app-modal .chat .msg.me").count() === 1, "پیام کارجو ارسال شد");
  await s.keyboard.press("Escape");

  /* ---------- کارفرما: زمان جدید، پاسخ پیام، پیشنهاد ---------- */
  await e.goto(BASE + "/employer/?r=3#applicants", { waitUntil: "networkidle" });
  const rowTxt = await e.locator("#ats tr[data-app]").innerText();
  check(/درخواست تغییر زمان/.test(rowTxt) && await e.locator("#ats tr[data-app] .badge-dot").count() === 1, "کارفرما «درخواست تغییر زمان» و پیام خوانده‌نشده را می‌بیند");
  lastOpen = () => e.click("#ats tr[data-app]"); await lastOpen();
  await modalReady(e);
  const onChat = await e.locator("#app-modal .chat").count();
  if (!onChat) await e.click('#app-modal [data-tab="chat"]');
  check(/ممنون از دعوت/.test(await e.locator("#app-modal .chat").innerText()), "پیام کارجو در گفتگو" + (onChat ? " (پنجره مستقیم روی گفتگو باز شد)" : ""));
  await e.fill("#app-modal [data-chat]", "حتماً؛ زمان جدید را ارسال کردیم.");
  await e.click('#app-modal [data-act="send"]'); await e.waitForTimeout(1200);
  await e.click('#app-modal [data-tab="status"]');
  await e.click('#app-modal [data-act="interview"]');
  await e.selectOption('#app-modal [data-date="iv"] [data-d]', "16"); await e.selectOption('#app-modal [data-date="iv"] [data-m]', "2"); await e.selectOption('#app-modal [data-date="iv"] [data-y]', String(ny));
  await e.selectOption('#app-modal [data-f="time"]', "15:00");
  await e.click('#app-modal [data-act="send-interview"]'); await e.waitForTimeout(1500);
  await e.keyboard.press("Escape");
  await s.goto(BASE + "/dashboard/?r=2#applications", { waitUntil: "networkidle" });
  lastOpen = () => s.click("#apps-body tr.clickable"); await lastOpen(); await modalReady(s);
  await s.click('#app-modal [data-tab="status"]').catch(() => {});
  await s.click('#app-modal [data-act="interview:confirm"]'); await s.waitForTimeout(1500);
  check(/تأیید شد/.test(await s.locator("#app-modal").innerText()), "کارجو زمان جدید را تأیید کرد");
  await s.keyboard.press("Escape");
  await e.goto(BASE + "/employer/?r=4#applicants", { waitUntil: "networkidle" });
  lastOpen = () => e.click("#ats tr[data-app]"); await lastOpen(); await modalReady(e);
  await e.click('#app-modal [data-tab="status"]').catch(() => {});
  await e.click('#app-modal [data-act="offer"]');
  await e.fill('#app-modal [data-f="salary"]', "24");
  await e.selectOption('#app-modal [data-date="of"] [data-d]', "1"); await e.selectOption('#app-modal [data-date="of"] [data-m]', "3"); await e.selectOption('#app-modal [data-date="of"] [data-y]', String(ny));
  await e.click('#app-modal [data-act="send-offer"]'); await e.waitForTimeout(1500);
  check(/پیشنهاد همکاری:/.test(await e.locator("#app-modal").innerText()), "پیشنهاد همکاری (حقوق و تاریخ شروع) ارسال شد");
  await e.keyboard.press("Escape");
  await s.goto(BASE + "/dashboard/?r=3#applications", { waitUntil: "networkidle" });
  lastOpen = () => s.click("#apps-body tr.clickable"); await lastOpen(); await modalReady(s);
  await s.click('#app-modal [data-tab="status"]').catch(() => {});
  await s.click('#app-modal [data-act="offer:confirm"]'); await s.waitForTimeout(1500);
  check(/تأیید شد/.test(await s.locator("#app-modal .app-card.amber").innerText()), "کارجو پیشنهاد را پذیرفت");
  await s.keyboard.press("Escape");
  await e.goto(BASE + "/employer/?r=5#applicants", { waitUntil: "networkidle" });
  lastOpen = () => e.click("#ats tr[data-app]"); await lastOpen(); await modalReady(e);
  await e.click('#app-modal [data-tab="status"]').catch(() => {});
  await e.click('#app-modal [data-act="accepted"]'); await e.waitForTimeout(1500);
  check(/استخدام شد/.test(await e.locator("#app-modal .cd-head").innerText()), "استخدام قطعی ثبت شد");
  await e.click('#app-modal [data-tab="history"]');
  check(await e.locator("#app-modal .timeline-list li").count() >= 8, "تاریخچه‌ی کامل مراحل: " + await e.locator("#app-modal .timeline-list li").count());
  await e.keyboard.press("Escape");

  /* ---------- دعوت مستقیم از مرکز تطبیق ← پاسخ ← رد با دلیل ---------- */
  const posId = await e.evaluate(async lab => (await API.post("employer/job", { job: { title: "پوزیشن داخلی تست دعوت", labId: lab, dept: "hematology", provinceId: "tehran", city: "تهران", internal: true, clientName: "مشتری تست",
    role: "hematology-tech", req: { role: "hematology-tech", skills: [{ id: "sysmex-xn", w: 10, lvl: 3 }] } } })).id, labId);
  const seekerId = await s.evaluate(() => AIO_ME.id);
  await e.goto(BASE + "/talent/?job=" + posId, { waitUntil: "networkidle" });
  await e.waitForSelector(".tl-pane.on .tl-row", { timeout: 30000 });
  const idx = await e.evaluate(nm => [...document.querySelectorAll(".tl-pane.on .tl-row b")].findIndex(b => b.textContent.includes(nm)), "کارجوی تست فرایند " + String(stamp).slice(-4));
  check(idx >= 0, "کارجوی تست در فهرست نیروهای پوزیشن داخلی هست");
  await e.click(`.tl-pane.on .tl-row >> nth=${Math.max(0, idx)}`);
  await e.waitForSelector("#tl-drawer.open");
  const box2 = await e.locator("#tl-drawer .tl-dialog").boundingBox();
  check(box2 && Math.abs(box2.x + box2.width / 2 - vp.width / 2) < 20 && box2.y >= 0, "پنجره‌ی رزومه در مرکز تطبیق وسط صفحه است");
  await e.click("#tl-drawer button:has-text('دعوت به این پوزیشن')");
  await e.fill("#tl-drawer [data-inv-note]", "مایلید درباره‌ی این پوزیشن گفتگو کنیم؟");
  await e.click("#tl-drawer button:has-text('ارسال دعوت')"); await e.waitForTimeout(1500);
  check(/دعوت ارسال شد/.test(await e.locator("#tl-drawer").innerText()), "دعوت مستقیم ارسال شد");
  await e.keyboard.press("Escape");
  await s.goto(BASE + "/dashboard/?r=4#applications", { waitUntil: "networkidle" });
  check(/پاسخ به دعوت/.test(await s.locator("#apps-body").innerText()), "کارجو دعوت را با برچسب «پاسخ به دعوت» می‌بیند");
  lastOpen = () => s.click("#apps-body tr.clickable >> nth=0"); await lastOpen(); await modalReady(s);
  await s.click('#app-modal [data-act="invite:confirm"]'); await s.waitForTimeout(1500);
  check(/فهرست کوتاه/.test(await s.locator("#app-modal .cd-head").innerText()), "پاسخ مثبت ← فهرست کوتاه");
  await s.keyboard.press("Escape");
  const inv = await e.evaluate(async () => { await API.get("me"); return AIO_ME.applicants.find(a => a.channel === "invite"); });
  await e.goto(BASE + "/employer/?r=6#applicants", { waitUntil: "networkidle" });
  lastOpen = () => e.evaluate(id => AppUI.open(id, "employer"), inv.id); await lastOpen(); await modalReady(e);
  await e.click('#app-modal [data-act="reject"]');
  await e.selectOption('#app-modal [data-f="reason"]', { index: 3 });
  await e.click('#app-modal [data-act="send-reject"]'); await e.waitForTimeout(1500);
  check(/دلیل:/.test(await e.locator("#app-modal").innerText()), "رد با دلیل از فهرست");
  await e.keyboard.press("Escape");
  await s.goto(BASE + "/dashboard/?r=5#applications", { waitUntil: "networkidle" });
  check((await s.evaluate(() => AIO_ME.notices.map(n => n.text).join(" "))).includes("دلیل:"), "دلیل رد به کارجو اعلام شد");

  /* ---------- انصراف کارجو ---------- */
  const other = await s.evaluate(() => (AIO_JOBS.find(j => j.req && !AIO_ME.applications.some(a => a.jobId === j.id)) || {}).id);
  await s.evaluate(id => API.post("jobs/" + id + "/apply", { note: "" }), other);
  const wId = await s.evaluate(id => AIO_ME.applications.find(a => a.jobId === id).id, other);
  await s.goto(BASE + "/dashboard/?r=6#applications", { waitUntil: "networkidle" });
  lastOpen = () => s.evaluate(id => AppUI.open(id, "seeker"), wId); await lastOpen(); await modalReady(s);
  s.once("dialog", d => d.accept());
  await s.click('#app-modal [data-act="withdraw"]');
  await s.click('#app-modal [data-act="confirm-withdraw"]'); await s.waitForTimeout(1500);
  check(/انصراف کارجو/.test(await s.locator("#app-modal .cd-head").innerText()), "انصراف کارجو ثبت شد");
  /* موبایل */
  await s.setViewportSize({ width: 390, height: 800 });
  const mb = await s.locator("#app-modal .tl-dialog").boundingBox();
  check(mb && mb.width <= 391 && mb.x >= -1, "پنجره روی موبایل تمام‌عرض و بدون بیرون‌زدگی");
  check(!s.errors.filter(x => !/42[29]|40[0-3]|ERR_NETWORK_CHANGED/.test(x)).length && !e.errors.filter(x => !/42[29]|40[0-3]|ERR_NETWORK_CHANGED/.test(x)).length, "بدون خطای JS: " + [...s.errors, ...e.errors].join(" | "));

  /* پاک‌سازی */
  wp(`require_once ABSPATH."wp-admin/includes/user.php"; foreach (["pemp${stamp}@example.com","pseek${stamp}@example.com"] as $m) { $u = get_user_by("email",$m); if(!$u) continue; foreach (get_posts(["author"=>$u->ID,"post_type"=>["aio_job","aio_lab","aio_application","aio_product","aio_exam","aio_course","aio_order","aio_cert","aio_message","aio_community","attachment"],"post_status"=>"any","numberposts"=>-1,"fields"=>"ids"]) as $id) wp_delete_post($id,true); wp_delete_user($u->ID); } foreach (get_posts(["post_type"=>"aio_application","post_status"=>"any","numberposts"=>-1,"fields"=>"ids","meta_key"=>"_aio_job_id","meta_value"=>${jobId}]) as $id) wp_delete_post($id,true); do_action("aio_data_changed"); echo 1;`);
  await b.close(); done();
})();
