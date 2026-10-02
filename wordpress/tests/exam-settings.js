/* قابلیت‌های همسان‌شده با دمو: پیش‌نویس ثبت مرکز + تنظیمات گواهی آزمون کارفرما
   (اعتبار گواهی، صدور خودکار، دارندگان گواهی بالای بانک رزومه، دعوت خودکار قبول‌شدگان) */
const { browser, page, newCtx, wp, check, done, testPhone } = require("./lib");
const BASE = process.env.BASE || "http://127.0.0.1:8798";
(async () => {
  const b = await browser();
  const stamp = Date.now(), em = `exs-e${stamp}@example.com`, sm = `exs-s${stamp}@example.com`;
  let examId = 0, jid = 0;
  try {
    /* کارفرما + مرکز + آگهی منتشرشده */
    const ce = await newCtx(b); const e = await page(ce);
    await e.goto(BASE + "/register/?role=employer", { waitUntil: "networkidle" });
    await e.fill("#name", "آزمایشگاه تنظیمات آزمون"); await e.fill("#email", em); await e.fill("#pass", "Test12345!"); await e.fill("#phone", testPhone());
    await Promise.all([e.waitForURL(/employer/, { timeout: 120000 }), e.click(".auth-form button[type=submit]")]);
    await e.waitForTimeout(2500); await e.goto(BASE + "/employer/#addlab", { waitUntil: "networkidle" });

    console.log("پیش‌نویس ثبت مرکز");
    check(await e.isVisible("#lb-draft"), "دکمه‌ی «ذخیره پیش‌نویس» دیده می‌شود");
    await e.fill("#lb-name", "مرکز پیش‌نویس تست"); await e.fill("#lb-address", "خیابان آزمایش، پلاک ۷");
    await e.selectOption("#lb-prov", "tehran"); await e.waitForTimeout(300);
    await e.click("#lb-draft"); await e.waitForTimeout(1500);
    await e.goto(BASE + "/employer/?r=1#addlab", { waitUntil: "networkidle" }); await e.waitForTimeout(800);
    check(await e.inputValue("#lb-name") === "مرکز پیش‌نویس تست", "پس از بارگذاری دوباره، نام از پیش‌نویس برگشت");
    check(await e.inputValue("#lb-address") === "خیابان آزمایش، پلاک ۷", "آدرس از پیش‌نویس برگشت");
    check(await e.inputValue("#lb-prov") === "tehran", "استان از پیش‌نویس برگشت");
    check(/پیش‌نویس/.test(await e.textContent("#lb-draft-note")), "یادداشت «پیش‌نویس بارگذاری شد» نمایش داده شد");
    const labId = await e.evaluate(async () => (await API.post("employer/lab", { lab: { name: "آزمایشگاه تنظیمات آزمون", provinceId: "tehran", city: "تهران", lat: 35.72, lng: 51.41, avgSalary: 22, phone: "02144445555", email: "hr@exs.example.com" } })).id);
    check(wp(`echo get_user_meta(get_user_by("email","${em}")->ID, "aio_lab_draft", true) ? "y" : "n";`) === "n", "با ثبت قطعی مرکز، پیش‌نویس پاک شد");
    wp(`wp_update_post(["ID"=>${labId},"post_status"=>"publish"]); echo 1;`);
    jid = await e.evaluate(async lab => (await API.post("employer/job", { job: { title: "کارشناس هماتولوژی (تست آزمون)", labId: lab, dept: "hematology", provinceId: "tehran", city: "تهران", desc: "برای بخش هماتولوژی به کارشناس مسلط به سل‌کانتر نیازمندیم.", role: "hematology-tech", req: { role: "hematology-tech", skills: [{ id: "sysmex-xn", w: 10, lvl: 4 }] } } })).id, labId);
    wp(`wp_update_post(["ID"=>${jid},"post_status"=>"publish"]); echo 1;`);

    console.log("طراحی آزمون با تنظیمات گواهی");
    await e.goto(BASE + "/employer/?r=2#exambuilder", { waitUntil: "networkidle" }); await e.waitForTimeout(800);
    for (const id of ["eb-valid", "eb-autocert", "eb-top", "eb-invite", "eb-invite-score"]) check(await e.isVisible("#" + id), "فیلد " + id + " وجود دارد");
    await e.fill("#eb-title", "آزمون تنظیمات گواهی " + stamp);
    await e.selectOption("#eb-dept", "hematology").catch(() => {});
    await e.selectOption("#eb-valid", "12");
    await e.check("#eb-invite"); await e.fill("#eb-invite-score", "50");
    await e.evaluate(() => { ebQs = [0, 1, 2].map(i => ({ q: "سؤال آزمایشی شماره " + (i + 1), options: ["گزینه درست", "گزینه غلط"], answer: 0 })); });
    await e.click('[onclick="submitExam(this)"]'); await e.waitForTimeout(2000);
    examId = Number(wp(`$p = get_posts(["post_type"=>"aio_exam","post_status"=>"any","title"=>"آزمون تنظیمات گواهی ${stamp}","numberposts"=>1,"fields"=>"ids"]); echo $p[0] ?? 0;`));
    check(examId > 0, "آزمون ثبت شد");
    const meta = JSON.parse(wp(`echo json_encode(["v"=>aio_meta(${examId},"cert_valid"),"a"=>aio_meta(${examId},"auto_cert"),"t"=>aio_meta(${examId},"holders_top"),"i"=>aio_meta(${examId},"auto_invite"),"s"=>aio_meta(${examId},"invite_score")]);`));
    check(meta.v == 12 && meta.a == 1 && meta.t == 1 && meta.i == 1 && meta.s == 50, "تنظیمات گواهی ذخیره شد " + JSON.stringify(meta));
    wp(`wp_update_post(["ID"=>${examId},"post_status"=>"publish"]); do_action("aio_data_changed"); echo 1;`);

    console.log("کارجو: قبولی ← گواهی با تاریخ اعتبار + دعوت خودکار");
    const cs = await newCtx(b); const s = await page(cs);
    await s.goto(BASE + "/register/", { waitUntil: "networkidle" });
    await s.fill("#name", "کارجوی تست آزمون"); await s.fill("#email", sm); await s.fill("#pass", "Test12345!"); await s.fill("#phone", testPhone());
    await Promise.all([s.waitForURL(/dashboard/, { timeout: 120000 }), s.click(".auth-form button[type=submit]")]);
    await s.waitForTimeout(2500); await s.goto(BASE + "/dashboard/", { waitUntil: "load" });
    await s.evaluate(() => API.post("me/cv", { cv: { name: AIO_ME.name, phone: AIO_ME.phone, gender: "خانم", birth: "1995-04-20", provinceId: "tehran", city: "تهران", targetRoles: ["hematology-tech"],
      experience: [{ orgType: "other", orgName: "آزمایشگاه نمونه", role: "hematology-tech", dept: "hematology", start: "2020-01", end: null, skills: [] }],
      education: [{ degree: 3, field: "علوم آزمایشگاهی", uni: "u1", start: 2013, end: 2017 }], skills: [{ id: "sysmex-xn", lvl: 4 }] } }));
    const res = await s.evaluate(async id => { const st = await API.post("exams/" + id + "/start"); return API.post("exams/" + id + "/submit", { token: st.token, answers: st.questions.map(() => 0) }); }, examId);
    check(res.pass === true && res.score === 100, "قبولی با نمره‌ی ۱۰۰");
    check(res.cert && /\d|[۰-۹]/.test(res.cert.expires || ""), "گواهی صادر شد و تاریخ اعتبار دارد: " + (res.cert && res.cert.expires));
    const inv = wp(`$u = get_user_by("email","${sm}"); $a = get_posts(["post_type"=>"aio_application","author"=>$u->ID,"post_status"=>"publish","meta_key"=>"_aio_job_id","meta_value"=>${jid},"numberposts"=>1]); echo $a ? aio_meta($a[0]->ID,"status")."|".aio_meta($a[0]->ID,"channel") : "none";`);
    check(inv === "invited|invite", "دعوت خودکار به آگهی کارفرما ساخته شد (" + inv + ")");
    await s.goto(BASE + "/dashboard/?r=3#certs", { waitUntil: "networkidle" }); await s.waitForTimeout(600);
    check(/معتبر تا/.test(await s.textContent("#my-certs-dash")), "داشبورد کارجو «معتبر تا» را نشان می‌دهد");
    await s.goto(res.cert.verify, { waitUntil: "networkidle" });
    check(/معتبر تا/.test(await s.textContent("main, body")), "صفحه‌ی استعلام گواهی تاریخ اعتبار را نشان می‌دهد");

    console.log("بانک رزومه‌ی کارفرما: دارنده‌ی گواهی اول");
    const cands = await e.evaluate(async () => (await API.get("talent/candidates")).candidates.map(c => ({ n: c.name, pin: c.pin || "" })));
    check(cands.length > 0 && cands[0].n === "کارجوی تست آزمون" && /گواهی آزمون شما/.test(cands[0].pin), "دارنده‌ی گواهی بالای فهرست و با نشان آمد");
    await e.goto(BASE + "/talent/?job=" + jid, { waitUntil: "networkidle" }); await e.waitForTimeout(1500);
    const first = await e.textContent(".tl-pane.on .tl-row >> nth=0").catch(() => "");
    check(/کارجوی تست آزمون/.test(first) && /گواهی آزمون شما/.test(first), "در مرکز تطبیق، ردیف اول دارنده‌ی گواهی با نشان 🎖 است");
    check(!e.errors.length && !s.errors.length, "بدون خطای JS/شبکه " + [...e.errors, ...s.errors].slice(0, 3).join(" | "));
  } finally {
    wp(`require_once ABSPATH."wp-admin/includes/user.php"; foreach (["${em}","${sm}"] as $m) { $u = get_user_by("email",$m); if(!$u) continue; foreach (get_posts(["author"=>$u->ID,"post_type"=>["aio_job","aio_lab","aio_application","aio_exam","aio_cert","aio_product"],"post_status"=>"any","numberposts"=>-1,"fields"=>"ids"]) as $id) wp_delete_post($id,true); wp_delete_user($u->ID); } foreach (get_posts(["post_type"=>"aio_application","post_status"=>"any","numberposts"=>-1,"fields"=>"ids","meta_key"=>"_aio_job_id","meta_value"=>${jid || 0}]) as $id) wp_delete_post($id,true); do_action("aio_data_changed"); echo 1;`);
    await b.close();
    done();
  }
})();
