/* بازبینی ریسپانسیو: هر صفحه در چند عرض (گوشی کوچک تا دسکتاپ بزرگ)
   بررسی خودکار: اسکرول افقی صفحه، عنصر بیرون از صفحه، متن بریده، دکمه/لینک خیلی کوچک برای لمس، منوی موبایل
   اجرا:  MODE=demo|wp  BASE=...  node responsive.js [فیلتر نام]
   خروجی: $OUT/report.json + اسکرین‌شات‌های عرض‌های SHOT (پیش‌فرض 320,768,1024) */
const { testPhone, browser, page, newCtx, wp } = require("./lib");
const fs = require("fs");
const MODE = process.env.MODE || "demo";
const BASE = process.env.BASE || (MODE === "demo" ? "http://127.0.0.1:8833" : "http://127.0.0.1:8841");
const OUT = process.env.OUT || "/tmp/claude-1000/resp-" + MODE;
fs.mkdirSync(OUT, { recursive: true });
const ONLY = process.argv[2] || "";
const WIDTHS = (process.env.WIDTHS || "320,360,390,414,600,768,834,1024,1280,1440,1920").split(",").map(Number);
const SHOT = (process.env.SHOT || "320,768,1024").split(",").map(Number);

function audit() {
  const vw = document.documentElement.clientWidth, issues = [];
  const nm = el => el.tagName.toLowerCase() + (el.id ? "#" + el.id : "") + (typeof el.className === "string" && el.className.trim() ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : "");
  const path = el => { const p = []; for (let x = el; x && x !== document.body && p.length < 4; x = x.parentElement) p.unshift(nm(x)); return p.join(" > "); };
  const inScroller = el => { for (let x = el.parentElement; x && x !== document.body; x = x.parentElement) { const cs = getComputedStyle(x); if (/(auto|scroll)/.test(cs.overflowX) || (cs.overflowX === "hidden" && x !== document.documentElement)) return true; if (cs.position === "fixed") return true; } return false; };
  const vis = el => { const r = el.getBoundingClientRect(), cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" && +cs.opacity !== 0; };
  if (document.documentElement.scrollWidth > vw + 1) issues.push({ t: "page-scroll-x", d: document.documentElement.scrollWidth + ">" + vw });
  let n = 0;
  for (const el of document.querySelectorAll("body *")) {
    if (n > 12) break;
    if (!vis(el) || el.closest(".leaflet-container,svg,.sl-track,.tp-pop,[aria-hidden=true],.toast,#wpadminbar,.tl-backdrop:not(.open),#app-modal:not(.open)")) continue;
    const r = el.getBoundingClientRect();
    if ((r.right > vw + 1 || r.left < -1) && !inScroller(el)) { issues.push({ t: "outside", el: path(el), d: `${Math.round(r.left)}..${Math.round(r.right)}/${vw}` }); n++; continue; }
    const cs = getComputedStyle(el);
    if (el.children.length === 0 && el.textContent.trim() && /^(BUTTON|A|LABEL|SPAN|B|H1|H2|H3|TD|TH|SMALL|P|STRONG)$/.test(el.tagName)
        && (cs.overflow === "hidden" || cs.textOverflow === "ellipsis" || cs.whiteSpace === "nowrap") && el.scrollWidth > el.clientWidth + 2 && !el.closest(".dash-nav,.tl-tabs,.ats-filters,.view-tabs,.chips-row,.cat-scroll"))
      { issues.push({ t: "clipped", el: path(el), d: el.textContent.trim().slice(0, 40) }); n++; }
  }
  /* دو عنصر متنی هم‌سطح که روی هم افتاده‌اند (فقط فرزندان مستقیم یک سطر flex) */
  for (const row of document.querySelectorAll(".job-meta,.foot,.row,.rv-head,.cd-head,.syllabus-head,.tl-row,.ob-step,.order-item")) {
    const kids = [...row.children].filter(vis);
    for (let i = 0; i < kids.length; i++) for (let j = i + 1; j < kids.length; j++) {
      const a = kids[i].getBoundingClientRect(), b = kids[j].getBoundingClientRect();
      const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left), oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (ox > 4 && oy > 4 && n < 16) { issues.push({ t: "overlap", el: path(row), d: nm(kids[i]) + " / " + nm(kids[j]) }); n++; }
    }
  }
  return issues;
}

/* منوی موبایل: دکمه‌ی همبرگر باز شود و منو داخل صفحه باشد */
async function checkMenu(p) {
  const btn = p.locator(".menu-toggle, .nav-toggle, button[aria-label*='منو'], .hamburger").first();
  if (!(await btn.count()) || !(await btn.isVisible())) return { t: "menu-toggle-missing" };
  await btn.click(); await p.waitForTimeout(400);
  const r = await p.evaluate(() => {
    const nav = [...document.querySelectorAll("#main-nav, .main-nav, header nav")].find(n => n.getBoundingClientRect().height > 40 && getComputedStyle(n).display !== "none");
    if (!nav) return "no-visible-nav";
    const b = nav.getBoundingClientRect(); const vw = document.documentElement.clientWidth;
    return b.left < -1 || b.right > vw + 1 ? `nav-outside ${Math.round(b.left)}..${Math.round(b.right)}` : "";
  });
  await btn.click().catch(() => {});
  return r ? { t: "menu", d: r } : null;
}

(async () => {
  const b = await browser();
  const report = {};
  const pages = [];
  let ctxGuest, ctxSeeker, ctxEmp, cleanup = null;
  if (MODE === "demo") {
    const htmls = fs.readdirSync(__dirname + "/../..").filter(f => f.endsWith(".html") && !["404.html"].includes(f));
    const dyn = { "job.html": "?id=1", "lab.html": "?id=5", "course.html": "?id=1", "exam.html": "?id=1", "path.html": "?id=hematology", "learn.html": "?id=1", "product.html": "?id=1" };
    ctxGuest = await newCtx(b);
    ctxSeeker = await newCtx(b); await ctxSeeker.addInitScript(() => localStorage.setItem("aio_user", JSON.stringify({ name: "سارا رضایی", role: "seeker" })));
    ctxEmp = await newCtx(b); await ctxEmp.addInitScript(() => localStorage.setItem("aio_user", JSON.stringify({ name: "آزمایشگاه نور", role: "employer" })));
    for (const h of htmls) {
      const k = h.replace(".html", "");
      const ctx = k === "dashboard" || k === "learn" || k === "course-builder" ? ctxSeeker : k === "employer" || k === "talent" ? ctxEmp : ctxGuest;
      pages.push([k, "/" + h + (dyn[h] || ""), ctx]);
    }
    for (const s of ["resume", "matches", "applications", "alerts", "certs"]) pages.push(["dashboard-" + s, "/dashboard.html#" + s, ctxSeeker]);
    for (const s of ["post", "orgprofile", "products", "applicants", "resumes", "matching"]) pages.push(["employer-" + s, "/employer.html#" + s, ctxEmp]);
    pages.push(["talent-modal", "/talent.html", ctxEmp, async p => { await p.waitForSelector(".tl-pane.on .tl-row", { timeout: 20000 }); await p.click(".tl-pane.on .tl-row >> nth=0"); await p.waitForSelector("#tl-drawer.open"); }]);
  } else {
    const stamp = Date.now();
    const ids = JSON.parse(wp(`$d = aio_data(); $lab = 0; $co = 0; foreach ($d["AIO_LABS"] as $l) { if (!$lab && $l["orgType"]==="lab") $lab = $l["id"]; if (!$co && $l["orgType"]==="company") $co = $l["id"]; }
      echo json_encode(["job"=>$d["AIO_JOBS"][0]["id"], "lab"=>$lab, "co"=>$co, "course"=>$d["AIO_COURSES"][0]["id"], "exam"=>$d["AIO_EXAMS"][0]["id"], "path"=>$d["AIO_LEARNING_PATHS"][0]["id"] ?? "", "product"=>$d["AIO_PRODUCTS"][0]["id"] ?? 0,
        "pages"=>array_values(array_filter(array_map(fn($p)=>["role"=>get_post_meta($p->ID,"_aio_page",true),"url"=>wp_make_link_relative(get_permalink($p))], get_posts(["post_type"=>"page","post_status"=>"publish","numberposts"=>-1])), fn($x)=>$x["role"] && !in_array($x["role"],["dashboard","employer","talent","checkout","verify"]))) ]);`));
    ctxGuest = await newCtx(b);
    for (const p of ids.pages) pages.push([p.role, p.url, ctxGuest]);
    for (const [k, u] of [["job", "/job/" + ids.job + "/"], ["lab", "/lab/" + ids.lab + "/"], ["company", "/lab/" + ids.co + "/"], ["course", "/course/" + ids.course + "/"], ["exam", "/exam/" + ids.exam + "/"], ["path", "/path/" + ids.path + "/"], ["product", "/product/" + ids.product + "/"]]) pages.push([k, u, ctxGuest]);
    /* کارجو و کارفرمای تستی (پس از پایان حذف می‌شوند) */
    ctxSeeker = await newCtx(b); const s = await page(ctxSeeker);
    await s.goto(BASE + "/register/", { waitUntil: "networkidle" });
    await s.fill("#name", "سارا ریسپانسیو"); await s.fill("#email", `resp-s${stamp}@example.com`); await s.fill("#pass", "Test12345!"); await s.fill("#phone", testPhone());
    await Promise.all([s.waitForURL(/dashboard/, { timeout: 120000 }), s.click(".auth-form button[type=submit]")]);
    await s.waitForTimeout(3000); await s.goto(BASE + "/dashboard/", { waitUntil: "load", timeout: 120000 });
    await s.evaluate(() => API.post("me/cv", { cv: { name: AIO_ME.name, phone: AIO_ME.phone, gender: "خانم", birth: "1995-04-20", provinceId: "tehran", city: "تهران", targetRoles: ["hematology-tech"],
      experience: [{ orgType: "other", orgName: "آزمایشگاه نمونه", role: "hematology-tech", dept: "hematology", start: "2020-01", end: null, skills: [] }],
      education: [{ degree: 3, field: "علوم آزمایشگاهی", uni: "u1", start: 2013, end: 2017 }], skills: [{ id: "sysmex-xn", lvl: 4 }, { id: "blood-smear", lvl: 4 }] } }));
    const jobForApp = await s.evaluate(() => (AIO_JOBS.find(j => j.req && j.req.role === "hematology-tech") || AIO_JOBS[0]).id);
    await s.evaluate(id => API.post("jobs/" + id + "/apply", { note: "" }), jobForApp);
    await s.close();
    ctxEmp = await newCtx(b); const e = await page(ctxEmp);
    await e.goto(BASE + "/register/?role=employer", { waitUntil: "networkidle" });
    await e.fill("#name", "آزمایشگاه ریسپانسیو"); await e.fill("#email", `resp-e${stamp}@example.com`); await e.fill("#pass", "Test12345!"); await e.fill("#phone", testPhone());
    await Promise.all([e.waitForURL(/employer/, { timeout: 120000 }), e.click(".auth-form button[type=submit]")]);
    await e.waitForTimeout(3000); await e.goto(BASE + "/employer/", { waitUntil: "load", timeout: 120000 });
    const labId = await e.evaluate(async () => (await API.post("employer/lab", { lab: { name: "آزمایشگاه ریسپانسیو", provinceId: "tehran", city: "تهران", lat: 35.72, lng: 51.41, avgSalary: 22, phone: "02144445555", email: "hr@resp.example.com" } })).id);
    wp(`wp_update_post(["ID"=>${labId},"post_status"=>"publish"]); echo 1;`);
    const jid = await e.evaluate(async lab => (await API.post("employer/job", { job: { title: "کارشناس هماتولوژی (ریسپانسیو)", labId: lab, dept: "hematology", provinceId: "tehran", city: "تهران", desc: "برای بخش هماتولوژی به کارشناس مسلط به سل‌کانتر نیازمندیم.",
      role: "hematology-tech", req: { role: "hematology-tech", skills: [{ id: "sysmex-xn", w: 10, lvl: 4 }] } } })).id, labId);
    wp(`wp_update_post(["ID"=>${jid},"post_status"=>"publish"]); echo 1;`);
    const ctxS2 = ctxSeeker; const s2 = await page(ctxS2); await s2.goto(BASE + "/dashboard/", { waitUntil: "networkidle" }); await s2.evaluate(id => API.post("jobs/" + id + "/apply", { note: "" }), jid); await s2.close();
    await e.close();
    for (const sec of ["overview", "resume", "matches", "applications", "alerts", "courses", "certs", "career", "notifications"]) pages.push(["seeker-" + sec, "/dashboard/?v=" + sec + "#" + sec, ctxSeeker]);
    pages.push(["seeker-app-modal", "/dashboard/?v=m#applications", ctxSeeker, async p => { await p.click("#apps-body tr.clickable"); await p.waitForSelector("#app-modal.open .app-tabs", { timeout: 30000 }); }]);
    for (const sec of ["overview", "addlab", "orgprofile", "products", "post", "jobs", "applicants", "resumes", "matching", "exambuilder", "pricing"]) pages.push(["emp-" + sec, "/employer/?v=" + sec + "#" + sec, ctxEmp, sec === "resumes" || sec === "matching" ? async p => { await p.waitForSelector(".tl-tabs", { timeout: 30000 }).catch(() => {}); } : null]);
    pages.push(["emp-app-modal", "/employer/?v=am#applicants", ctxEmp, async p => { await p.click("#ats tr[data-app]"); await p.waitForSelector("#app-modal.open .app-tabs", { timeout: 30000 }); }]);
    pages.push(["emp-talent-modal", "/talent/?job=" + jid, ctxEmp, async p => { await p.waitForSelector(".tl-pane.on .tl-row", { timeout: 30000 }); await p.click(".tl-pane.on .tl-row >> nth=0"); await p.waitForSelector("#tl-drawer.open"); }]);
    cleanup = () => wp(`require_once ABSPATH."wp-admin/includes/user.php"; foreach (["resp-s${stamp}@example.com","resp-e${stamp}@example.com"] as $m) { $u = get_user_by("email",$m); if(!$u) continue; foreach (get_posts(["author"=>$u->ID,"post_type"=>["aio_job","aio_lab","aio_application","aio_product","attachment"],"post_status"=>"any","numberposts"=>-1,"fields"=>"ids"]) as $id) wp_delete_post($id,true); wp_delete_user($u->ID); } foreach (get_posts(["post_type"=>"aio_application","post_status"=>"any","numberposts"=>-1,"fields"=>"ids","meta_key"=>"_aio_job_id","meta_value"=>${jid}]) as $id) wp_delete_post($id,true); do_action("aio_data_changed"); echo 1;`);
  }

  for (const [key, url, ctx, setup] of pages) {
    if (ONLY && !key.includes(ONLY)) continue;
    const p = await page(ctx);
    for (const w of WIDTHS) {
      await p.setViewportSize({ width: w, height: w < 700 ? 800 : 900 });
      try {
        /* نشانی یکتا برای هر عرض تا صفحه واقعاً از نو بارگذاری شود (پنجره‌ی باز عرض قبلی نماند) */
        const [pathq, hash] = url.split("#");
        await p.goto(BASE + pathq + (pathq.includes("?") ? "&" : "?") + "vw=" + w + (hash ? "#" + hash : ""), { waitUntil: "networkidle", timeout: 60000 });
        await p.waitForTimeout(500);
        if (setup) await setup(p);
        await p.waitForTimeout(250);
        const issues = await p.evaluate(audit);
        if (w <= 768 && !setup) { const m = await checkMenu(p).catch(err => ({ t: "menu-error", d: err.message.slice(0, 80) })); if (m) issues.push(m); }
        report[`${key}@${w}`] = { url, issues };
        if (SHOT.includes(w)) await p.screenshot({ path: `${OUT}/${key}@${w}.png`, fullPage: !setup });
      } catch (err) { report[`${key}@${w}`] = { url, fatal: String(err.message).slice(0, 160) }; }
    }
    report[key + "@js"] = { errors: p.errors.filter(x => !/tile\.openstreetmap|favicon|404/.test(x)) };
    await p.close();
  }
  if (cleanup) cleanup();
  fs.writeFileSync(OUT + "/report.json", JSON.stringify(report, null, 1));
  const bad = Object.entries(report).filter(([, r]) => r.fatal || (r.issues || []).length || (r.errors || []).length);
  console.log(`${pages.length} pages × ${WIDTHS.length} widths — ${bad.length} with findings`);
  for (const [k, r] of bad) console.log("•", k, r.fatal || "", JSON.stringify((r.issues || []).slice(0, 3)), (r.errors || []).slice(0, 2).join(" | "));
  await b.close();
})();
