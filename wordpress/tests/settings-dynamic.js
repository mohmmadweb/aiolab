/* تنظیمات پویا از «تنظیمات آیولب»: آزمون و گواهی، کانال‌های هشدار (پیامک/ربات)، سایت‌های مجاز ویدئو
   فقط روی وردپرس محلی (سرویس پیامک و API ربات با یک سرور شبیه‌ساز جایگزین می‌شوند).
   BASE=http://127.0.0.1:8841 node settings-dynamic.js */
const { browser, page, newCtx, wp, check, done, testPhone } = require("./lib");
const BASE = process.env.BASE || "http://127.0.0.1:8841";
const MOCK = "http://wp:8899"; /* نام سرویس وردپرس در شبکه‌ی داکر؛ از کانتینر wp و cli هر دو در دسترس */
if (!BASE.includes("127.0.0.1")) { console.log("این تست فقط روی وردپرس محلی اجرا می‌شود"); process.exit(1); }

/* شبیه‌ساز پیامک/ربات داخل کانتینر وردپرس (کانتینر به میزبان دسترسی ندارد) */
const { execSync } = require("child_process");
const CT = process.env.WP_CONTAINER || "aiolab-local-wp-1";
const hitsNow = () => { try { return execSync(`docker exec ${CT} cat /tmp/aio-mock.log`).toString().trim().split("\n").filter(Boolean).map(l => JSON.parse(l)); } catch (_) { return []; } };
const resetHits = () => execSync(`docker exec ${CT} sh -c ': > /tmp/aio-mock.log'`);
const txt = h => { try { return JSON.stringify(JSON.parse(h.body)) .replace(/\\u[0-9a-f]{4}/gi, m => String.fromCharCode(parseInt(m.slice(2), 16))); } catch (_) { return h.body; } };
const hits = { get length() { return hitsNow().length; }, set length(_) { resetHits(); }, some: f => hitsNow().some(f), find: f => hitsNow().find(f) };
const mock = { close() { try { execSync(`docker exec ${CT} sh -c 'pkill -f "php -S 0.0.0.0:8899" || true'`); } catch (_) {} } };
(async () => {
  execSync(`docker cp ${__dirname}/mock-channels.php ${CT}:/tmp/mock-channels.php`);
  execSync(`docker exec -d ${CT} php -S 0.0.0.0:8899 /tmp/mock-channels.php`);
  execSync("sleep 1"); resetHits();
  wp(`update_option("aio_settings_test_backup", get_option("aio_settings", []), false); echo 1;`);
  const b = await browser();
  const stamp = Date.now(), em = `dyn-e${stamp}@example.com`, sm = `dyn-s${stamp}@mock.local`;
  let examId = 0;
  try {
    const set = obj => wp(`$o = get_option("aio_settings", []); foreach (json_decode('${JSON.stringify(obj).replace(/'/g, "\\'")}', true) as $k => $v) $o[$k] = $v; update_option("aio_settings", $o); do_action("aio_data_changed"); echo 1;`);
    set({
      exam_valid_options: [{ months: 6, name: "شش ماه" }, { months: 0, name: "دائمی" }], exam_valid_default: 6, exam_badges: ["⭐", "🧪"],
      exam_invite_default: 1, exam_invite_editable: 0, exam_invite_score: 80, exam_min_questions: 4, exam_auto_publish: 1,
      exam_duration_default: 25, exam_pass_default: 65,
      ch_sms: 1, sms_provider: "custom", sms_custom_url: MOCK + "/sms?to={to}&text={text}&key={key}", sms_custom_method: "GET", sms_api_key: "K1",
      ch_bot: 1, bot_platform: "bale", bot_label: "ربات بله آیولب", bot_token: "T123", bot_username: "aiolab_test_bot", bot_api_base: MOCK,
      video_hosts: ["aparat.com", "youtube.com"],
    });

    console.log("آزمون و گواهی — فرم کارفرما از تنظیمات");
    const ce = await newCtx(b); const e = await page(ce);
    await e.goto(BASE + "/register/?role=employer", { waitUntil: "networkidle" });
    await e.fill("#name", "آزمایشگاه تنظیمات پویا"); await e.fill("#email", em); await e.fill("#pass", "Test12345!"); await e.fill("#phone", testPhone());
    await Promise.all([e.waitForURL(/employer/, { timeout: 120000 }), e.click(".auth-form button[type=submit]")]);
    await e.waitForTimeout(3000); await e.goto(BASE + "/employer/#exambuilder", { waitUntil: "networkidle" }); await e.waitForTimeout(800);
    const form = await e.evaluate(() => ({
      valid: [...document.querySelectorAll("#eb-valid option")].map(o => o.textContent), validSel: document.getElementById("eb-valid").value,
      badges: [...document.querySelectorAll("#eb-badge option")].map(o => o.textContent),
      dur: document.getElementById("eb-duration").value, pass: document.getElementById("eb-pass").value,
      inviteShown: getComputedStyle(document.getElementById("eb-invite").closest("label")).display !== "none",
      topShown: getComputedStyle(document.getElementById("eb-top").closest("label")).display !== "none",
    }));
    check(form.valid.join("|") === "شش ماه|دائمی" && form.validSel === "6", "گزینه‌های اعتبار گواهی از تنظیمات: " + form.valid.join("، "));
    check(form.badges.join("") === "⭐🧪", "نشان‌ها از تنظیمات");
    check(form.dur === "25" && form.pass === "65", "مدت و حد نصاب پیش‌فرض از تنظیمات");
    check(!form.inviteShown && form.topShown, "گزینه‌ی قفل‌شده (دعوت خودکار) از فرم کارفرما پنهان است");
    await e.fill("#eb-title", "آزمون تنظیمات پویا " + stamp);
    await e.evaluate(() => { ebQs = [0, 1, 2].map(i => ({ q: "سؤال پویا " + (i + 1), options: ["درست", "غلط"], answer: 0 })); });
    await e.click('[onclick="submitExam(this)"]'); await e.waitForTimeout(1200);
    const none = wp(`echo count(get_posts(["post_type"=>"aio_exam","post_status"=>"any","title"=>"آزمون تنظیمات پویا ${stamp}","fields"=>"ids"]));`);
    check(none === "0", "با ۳ سؤال (کمتر از حداقلِ ۴) آزمون ثبت نشد");
    await e.evaluate(() => { ebQs.push({ q: "سؤال پویا ۴", options: ["درست", "غلط"], answer: 0 }); });
    await e.click('[onclick="submitExam(this)"]'); await e.waitForTimeout(2000);
    examId = Number(wp(`$p = get_posts(["post_type"=>"aio_exam","post_status"=>"any","title"=>"آزمون تنظیمات پویا ${stamp}","numberposts"=>1,"fields"=>"ids"]); echo $p[0] ?? 0;`));
    const m = JSON.parse(wp(`echo json_encode(["st"=>get_post_status(${examId}),"v"=>aio_meta(${examId},"cert_valid"),"b"=>aio_meta(${examId},"badge"),"i"=>aio_meta(${examId},"auto_invite"),"s"=>aio_meta(${examId},"invite_score")]);`));
    check(m.st === "publish", "با «انتشار بدون بازبینی»، آزمون مستقیم منتشر شد");
    check(m.v == 6 && m.b === "⭐", "اعتبار ۶ ماه و نشان ⭐ ذخیره شد");
    check(m.i == 1 && m.s == 80, "گزینه‌ی قفل‌شده مقدار پیش‌فرض مدیر را گرفت (دعوت روشن، نمره ۸۰)");
    const adminOpts = wp(`echo json_encode(aio_exam_valid_options());`);
    check(Object.values(JSON.parse(adminOpts)).includes("شش ماه"), "فیلد «اعتبار گواهی» در پیشخوان هم همین گزینه‌ها را دارد");

    console.log("سایت‌های مجاز ویدئو");
    const vids = await e.evaluate(() => AIO_CFG.videoHosts);
    check(vids.includes("youtube.com"), "فهرست سایت‌های ویدئو به صفحه رسید");
    const labId = await e.evaluate(async () => (await API.post("employer/lab", { lab: { name: "آزمایشگاه تنظیمات پویا", provinceId: "tehran", city: "تهران", lat: 35.72, lng: 51.41, avgSalary: 22, phone: "02144445555", email: "hr@dyn.example.com" } })).id);
    const okYt = await e.evaluate(async id => { try { await API.post("employer/org/" + id, { org: { video: "https://www.youtube.com/watch?v=abc" } }); return "ok"; } catch (x) { return x.message; } }, labId);
    const badV = await e.evaluate(async id => { try { await API.post("employer/org/" + id, { org: { video: "https://vimeo.com/123" } }); return "ok"; } catch (x) { return x.message; } }, labId);
    check(okYt === "ok", "لینک یوتیوب (مجاز در تنظیمات) پذیرفته شد");
    check(badV !== "ok", "لینک سایت غیرمجاز رد شد: " + badV);

    console.log("کانال‌های هشدار: پیامک و ربات");
    const cs = await newCtx(b); const s = await page(cs);
    const phone = testPhone();
    await s.goto(BASE + "/register/", { waitUntil: "networkidle" });
    await s.fill("#name", "کارجوی کانال‌ها"); await s.fill("#email", sm); await s.fill("#pass", "Test12345!"); await s.fill("#phone", phone);
    await Promise.all([s.waitForURL(/dashboard/, { timeout: 120000 }), s.click(".auth-form button[type=submit]")]);
    await s.waitForTimeout(3000); await s.goto(BASE + "/dashboard/#alerts", { waitUntil: "networkidle" }); await s.waitForTimeout(800);
    const chs = await s.evaluate(() => [...document.querySelectorAll(".channels input")].map(i => i.value + ":" + i.disabled));
    check(chs.join(",") === "اعلان سایت:false,ایمیل:false,پیامک:false,ربات:false", "کانال‌ها از تنظیمات و بدون «به‌زودی»: " + chs.join(", "));
    check(!/به‌زودی/.test(await s.textContent(".channels")), "هیچ برچسب «به‌زودی» نمانده");
    await s.click("#bot-link button");
    await s.waitForSelector(".aio-modal", { timeout: 30000 }).catch(async () => { throw new Error("مودال ربات باز نشد؛ toast: " + await s.evaluate(() => (document.querySelector(".toast, #toast") || {}).textContent) + " | errors: " + s.errors.join(" ; ")); });
    const code = (await s.textContent(".aio-modal p[dir=ltr]")).trim();
    check(/^\d{6}$/.test(code), "کد اتصال ۶ رقمی ساخته شد: " + code);
    const secret = wp(`echo aio_bot_secret();`);
    hits.length = 0;
    const wh = await s.evaluate(async ([sec, c]) => (await fetch("/wp-json/aio/v1/bot/" + sec, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: { chat: { id: 777001 }, text: "/start " + c } }) })).status, [secret, code]);
    check(wh === 200, "وب‌هوک ربات پیام کد را پذیرفت");
    check(hits.some(h => h.url === "/botT123/sendMessage" && /777001/.test(h.body) && /وصل شد/.test(txt(h))), "ربات پیام «وصل شد» را به همان گفتگو فرستاد");
    const bad = await s.evaluate(async sec => (await fetch("/wp-json/aio/v1/bot/" + sec + "x", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })).status, secret);
    check(bad === 403, "وب‌هوک با کلید اشتباه رد می‌شود");
    await s.click(".aio-modal [data-done]"); await s.waitForTimeout(1200);
    check(/وصل است/.test(await s.textContent("#bot-link")), "داشبورد «ربات وصل است» را نشان می‌دهد");

    hits.length = 0;
    wp(`$u = get_user_by("email","${sm}"); aio_send_alert($u->ID, ["title"=>"هماتولوژی تهران","channels"=>["پیامک","ربات"]], [["url"=>home_url("/jobs/"),"title"=>"کارشناس آزمایشی","labId"=>0,"city"=>"تهران","salary"=>""]]); echo 1;`);
    const sms = hits.find(h => h.url.startsWith("/sms?"));
    check(sms && decodeURIComponent(sms.url).includes("to=" + phone) && /هماتولوژی تهران/.test(decodeURIComponent(sms.url)) && /key=K1/.test(sms.url), "هشدار شغلی به سرویس پیامک فرستاده شد (شماره‌ی کاربر، متن، کلید)");
    check(hits.some(h => h.url === "/botT123/sendMessage" && /777001/.test(h.body) && /هماتولوژی تهران/.test(txt(h))), "هشدار شغلی به ربات هم فرستاده شد");
    hits.length = 0;
    wp(`$u = get_user_by("email","${sm}"); aio_notify($u->ID, "دعوت به مصاحبه آزمایشی", "", "آیولب", true); echo 1;`);
    check(hits.some(h => h.url.startsWith("/sms?") && /مصاحبه/.test(decodeURIComponent(h.url))) && hits.some(h => /sendMessage/.test(h.url) && /مصاحبه/.test(txt(h))), "رویداد مهم استخدام هم پیامک و ربات شد");
    const log = JSON.parse(wp(`echo json_encode(get_option("aio_channel_log", []));`));
    check(log.length > 0 && log[0].ok, "ارسال‌ها در گزارش «آخرین ارسال‌ها» ثبت شد");

    console.log("خاموش کردن کانال از تنظیمات");
    set({ ch_sms: 0 });
    await s.goto(BASE + "/dashboard/?r=2#alerts", { waitUntil: "networkidle" }); await s.waitForTimeout(600);
    const chs2 = await s.evaluate(() => [...document.querySelectorAll(".channels input")].map(i => i.value));
    check(!chs2.includes("پیامک"), "با خاموش کردن پیامک در تنظیمات، این کانال از فرم کارجو حذف شد");
    const errs = [...e.errors, ...s.errors].filter(x => !/employer\/org\/|\/bot\/|status of (422|403)/.test(x)); /* ۴۲۲ ویدئوی غیرمجاز و ۴۰۳ کلید اشتباه عمدی‌اند */
    check(!errs.length, "بدون خطای JS/شبکه‌ی ناخواسته " + errs.slice(0, 3).join(" | "));
  } catch (err) { check(false, "خطای اجرای تست: " + String(err.message).split("\n")[0]); } finally {
    wp(`update_option("aio_settings", get_option("aio_settings_test_backup", [])); delete_option("aio_settings_test_backup"); delete_option("aio_channel_log"); do_action("aio_data_changed"); echo 1;`);
    wp(`require_once ABSPATH."wp-admin/includes/user.php"; foreach (["${em}","${sm}"] as $m) { $u = get_user_by("email",$m); if(!$u) continue; foreach (get_posts(["author"=>$u->ID,"post_type"=>["aio_job","aio_lab","aio_application","aio_exam","aio_cert","aio_product"],"post_status"=>"any","numberposts"=>-1,"fields"=>"ids"]) as $id) wp_delete_post($id,true); wp_delete_user($u->ID); } echo 1;`);
    await b.close(); mock.close();
    done();
  }
})();
