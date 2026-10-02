/* مقایسه‌ی قابلیت‌های دمو و وردپرس: سرتیترها، دکمه‌ها، برچسب‌ها، ستون جدول‌ها و placeholderها در هر صفحه/بخش
   هر موردی که در دمو هست و در وردپرس نیست گزارش می‌شود.
   DEMO=http://127.0.0.1:8833  BASE=http://127.0.0.1:8841  node feature-parity.js [فیلتر] */
const fs = require("fs");
const { browser, page, newCtx, wp, testPhone } = require("./lib");
const DEMO = process.env.DEMO || "http://127.0.0.1:8833", BASE = process.env.BASE || "http://127.0.0.1:8841";
const ONLY = process.argv[2] || "";
const OUT = process.env.OUT || "/tmp/claude-1000/aio-parity.json";

function collect(scope) {
  const root = scope ? document.querySelector(scope) : document.querySelector("main") || document.body;
  if (!root) return [];
  const norm = s => (s || "").replace(/[\d۰-۹٬,.:٪%()+\-–—×«»"'؟?!]/g, "").replace(/\s+/g, " ").trim();
  const vis = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden"; };
  const out = new Set();
  const add = (k, t) => { t = norm(t); if (t && t.length > 1 && t.length < 60) out.add(k + ":" + t); };
  root.querySelectorAll("h1,h2,h3,h4").forEach(e => vis(e) && add("h", e.innerText));
  root.querySelectorAll("button,.btn,a.btn,[role=tab],.tab").forEach(e => vis(e) && add("btn", e.innerText));
  root.querySelectorAll("label,th,legend").forEach(e => vis(e) && add("lbl", e.innerText.split("\n")[0]));
  root.querySelectorAll("input[placeholder],textarea[placeholder]").forEach(e => vis(e) && add("ph", e.placeholder));
  root.querySelectorAll("select").forEach(e => vis(e) && e.options[0] && add("sel", e.options[0].text));
  return [...out];
}

(async () => {
  const b = await browser();
  const stamp = Date.now();
  /* دمو */
  const dG = await newCtx(b), dS = await newCtx(b), dE = await newCtx(b);
  await dS.addInitScript(() => localStorage.setItem("aio_user", JSON.stringify({ name: "سارا رضایی", role: "seeker" })));
  await dE.addInitScript(() => localStorage.setItem("aio_user", JSON.stringify({ name: "آزمایشگاه نور", role: "employer" })));
  /* وردپرس: کاربران تستی محلی */
  const wG = await newCtx(b), wS = await newCtx(b), wE = await newCtx(b);
  for (const [ctx, role, url] of [[wS, "", "dashboard"], [wE, "?role=employer", "employer"]]) {
    const p = await page(ctx);
    await p.goto(BASE + "/register/" + role, { waitUntil: "networkidle" });
    await p.fill("#name", "تست برابری"); await p.fill("#email", `par-${url}${stamp}@example.com`); await p.fill("#pass", "Test12345!"); await p.fill("#phone", testPhone());
    await Promise.all([p.waitForURL(new RegExp(url), { timeout: 120000 }), p.click(".auth-form button[type=submit]")]);
    await p.waitForTimeout(1500);
    if (url === "employer") {
      await p.goto(BASE + "/employer/", { waitUntil: "load" });
      const labId = await p.evaluate(async () => (await API.post("employer/lab", { lab: { name: "آزمایشگاه برابری", orgType: "company", provinceId: "tehran", city: "تهران", lat: 35.72, lng: 51.41, avgSalary: 22, phone: "02144445555", email: "hr@par.example.com" } })).id);
      wp(`wp_update_post(["ID"=>${labId},"post_status"=>"publish"]); echo 1;`);
      const jid = await p.evaluate(async lab => (await API.post("employer/job", { job: { title: "کارشناس هماتولوژی (برابری)", labId: lab, dept: "hematology", provinceId: "tehran", city: "تهران", desc: "برای بخش هماتولوژی به کارشناس مسلط به سل‌کانتر نیازمندیم.", role: "hematology-tech", req: { role: "hematology-tech", skills: [{ id: "sysmex-xn", w: 10, lvl: 4 }] } } })).id, labId);
      wp(`wp_update_post(["ID"=>${jid},"post_status"=>"publish"]); echo 1;`);
    }
    await p.close();
  }
  const ids = JSON.parse(wp(`$d = aio_data(); $lab=0;$co=0; foreach ($d["AIO_LABS"] as $l) { if (!$lab && $l["orgType"]==="lab") $lab=$l["id"]; if (!$co && $l["orgType"]==="company") $co=$l["id"]; } echo json_encode(["job"=>$d["AIO_JOBS"][0]["id"],"lab"=>$lab,"co"=>$co,"course"=>$d["AIO_COURSES"][0]["id"],"exam"=>$d["AIO_EXAMS"][0]["id"],"path"=>$d["AIO_LEARNING_PATHS"][0]["id"]??"","product"=>$d["AIO_PRODUCTS"][0]["id"]??0]);`));
  const P = [
    ["home", "/index.html", "/", 0], ["jobs", "/jobs.html", "/jobs/", 0], ["job", "/job.html?id=1", "/job/" + ids.job + "/", 0],
    ["labs", "/labs.html", "/labs/", 0], ["lab", "/lab.html?id=5", "/lab/" + ids.lab + "/", 0], ["companies", "/companies.html", "/companies/", 0],
    ["products", "/products.html", "/products/", 0], ["product", "/product.html?id=1", "/product/" + ids.product + "/", 0],
    ["ranking", "/ranking.html", "/ranking/", 0], ["exams", "/exams.html", "/exams/", 0], ["exam", "/exam.html?id=1", "/exam/" + ids.exam + "/", 0],
    ["assessment", "/assessment.html", "/assessment/", 0], ["mbti", "/mbti.html", "/mbti/", 0], ["courses", "/courses.html", "/courses/", 0],
    ["course", "/course.html?id=1", "/course/" + ids.course + "/", 0], ["path", "/path.html?id=hematology", "/path/" + ids.path + "/", 0],
    ["learn", "/learn.html?id=1", "/learn/" + ids.course + "/", 1], ["course-builder", "/course-builder.html", "/course-builder/", 2],
    ["magazine", "/magazine.html", "/magazine/", 0], ["community", "/community.html", "/community/", 0], ["faq", "/faq.html", "/faq/", 0],
    ["services", "/services.html", "/services/", 0], ["pricing", "/pricing.html", "/pricing/", 0], ["reports", "/reports.html", "/reports/", 0],
    ["advertise", "/advertise.html", "/advertise/", 0], ["about", "/about.html", "/about/", 0], ["contact", "/contact.html", "/contact/", 0],
    ["login", "/login.html", "/login/", 0], ["register", "/register.html", "/register/", 0], ["talent", "/talent.html", "/talent/", 2],
  ];
  const secs = { dashboard: ["overview", "resume", "matches", "applications", "saved", "alerts", "courses", "certs", "career", "services", "orders", "subscription", "notifications"],
    employer: ["overview", "addlab", "orgprofile", "branding", "products", "post", "jobs", "applicants", "hiring", "resumes", "matching", "exambuilder", "training", "reports", "orders", "pricing"] };
  for (const s of secs.dashboard) P.push(["dashboard#" + s, "/dashboard.html#" + s, "/dashboard/#" + s, 1, "#sec-" + s]);
  for (const s of secs.employer) P.push(["employer#" + s, "/employer.html#" + s, "/employer/#" + s, 2, "#sec-" + s]);
  const report = {};
  for (const [key, du, wu, who, scope] of P) {
    if (ONLY && !key.includes(ONLY)) continue;
    const res = {};
    for (const [side, ctx, url] of [["demo", [dG, dS, dE][who], DEMO + du], ["wp", [wG, wS, wE][who], BASE + wu]]) {
      const p = await page(ctx);
      try {
        await p.goto(url, { waitUntil: "networkidle", timeout: 60000 });
        await p.waitForTimeout(800);
        if (scope) { await p.evaluate(s => { const a = document.querySelector(`[data-sec="${s.slice(5)}"]`); if (a) a.click(); }, scope); await p.waitForTimeout(600); }
        res[side] = await p.evaluate(collect, scope || null);
      } catch (e) { res[side] = ["FATAL:" + e.message.slice(0, 100)]; }
      await p.close();
    }
    const w = new Set(res.wp);
    const missing = res.demo.filter(x => !w.has(x));
    report[key] = { demo: res.demo.length, wp: res.wp.length, missing, extra: res.wp.filter(x => !new Set(res.demo).has(x)) };
    console.log(`${key}: demo ${res.demo.length} / wp ${res.wp.length} — missing ${missing.length}`);
  }
  fs.writeFileSync(OUT, JSON.stringify(report, null, 1));
  wp(`require_once ABSPATH."wp-admin/includes/user.php"; foreach (["par-dashboard${stamp}@example.com","par-employer${stamp}@example.com"] as $m) { $u=get_user_by("email",$m); if ($u) { foreach (get_posts(["author"=>$u->ID,"post_type"=>["aio_job","aio_lab","aio_application","aio_product"],"post_status"=>"any","numberposts"=>-1,"fields"=>"ids"]) as $id) wp_delete_post($id,true); wp_delete_user($u->ID); } } echo 1;`);
  await b.close();
  console.log("→ " + OUT);
})();
