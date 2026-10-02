/* بازبینی ظاهری همه‌ی صفحه‌ها: اسکرین‌شات دسکتاپ و موبایل + بررسی خودکار
   (بیرون‌زدگی افقی، عنصر خارج از صفحه، متن بریده‌شده، فونت، تصویر خراب، خطای JS/شبکه)
   خروجی: $OUT/*.png و $OUT/report.json   — اجرا: BASE=... node visual.js [فیلتر نام] */
const { testPhone, browser, page, BASE, newCtx, wp } = require("./lib");
const fs = require("fs");
const OUT = process.env.OUT || "/tmp/claude-1000/vis";
fs.mkdirSync(OUT, { recursive: true });
const ONLY = process.argv[2] || "";
const VPS = (process.env.VPS || "d,m").split(",");
const SIZE = { d: { width: 1366, height: 900 }, m: { width: 390, height: 844 } };

/* بررسی‌های خودکار داخل صفحه */
function audit() {
  const vw = document.documentElement.clientWidth, issues = [];
  const name = el => (el.id ? "#" + el.id : "") + (el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : "") || el.tagName.toLowerCase();
  const path = el => { const p = []; for (let x = el; x && x !== document.body && p.length < 4; x = x.parentElement) p.unshift(x.tagName.toLowerCase() + name(x).replace(/^[a-z]+/, "")); return p.join(" > "); };
  const scrollerParent = el => { for (let x = el.parentElement; x && x !== document.body; x = x.parentElement) { const cs = getComputedStyle(x); if (/(auto|scroll|hidden)/.test(cs.overflowX) && x.scrollWidth > x.clientWidth + 1) return true; if (cs.position === "fixed") return true; } return false; };
  if (document.documentElement.scrollWidth > vw + 1) issues.push({ type: "page-overflow-x", detail: document.documentElement.scrollWidth + " > " + vw });
  const visible = el => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" && cs.opacity !== "0"; };
  let n = 0;
  for (const el of document.querySelectorAll("body *")) {
    if (n > 25) break;
    if (!visible(el) || el.closest(".leaflet-container,svg,.sl-track,.tp-pop,[aria-hidden=true],.toast,#wpadminbar")) continue;
    const r = el.getBoundingClientRect();
    if ((r.right > vw + 2 || r.left < -2) && !scrollerParent(el)) { issues.push({ type: "outside-viewport", el: path(el), detail: `left ${Math.round(r.left)} right ${Math.round(r.right)} vw ${vw}` }); n++; continue; }
    const cs = getComputedStyle(el);
    if (["BUTTON", "A", "LABEL", "SPAN", "B", "H1", "H2", "H3", "TD", "TH", "SELECT"].includes(el.tagName) && el.children.length === 0 && el.textContent.trim()
        && (cs.overflow === "hidden" || cs.textOverflow === "ellipsis" || cs.whiteSpace === "nowrap") && el.scrollWidth > el.clientWidth + 2) {
      issues.push({ type: "clipped-text", el: path(el), detail: el.textContent.trim().slice(0, 40) }); n++;
    }
  }
  const ff = getComputedStyle(document.body).fontFamily;
  if (!/vazir/i.test(ff)) issues.push({ type: "font", detail: ff });
  else if (document.fonts && !document.fonts.check('16px "Vazirmatn"') && !document.fonts.check("16px Vazirmatn")) issues.push({ type: "font-not-loaded", detail: ff });
  for (const img of document.images) if (img.complete && img.naturalWidth === 0 && img.src && !img.src.startsWith("data:")) issues.push({ type: "broken-image", detail: img.src.slice(0, 120) });
  /* متن انگلیسی/لاتین بیرون از ltr که جهت را خراب کند — فقط شمارش */
  return issues;
}

(async () => {
  const b = await browser();
  const stamp = Date.now();
  const report = {};
  /* ---------- داده‌ی نمونه برای حالت‌های واردشده ---------- */
  const ids = JSON.parse(wp(`$d = aio_data(); $lab = 0; $co = 0; foreach ($d["AIO_LABS"] as $l) { if (!$lab && $l["orgType"]==="lab") $lab = $l["id"]; if (!$co && $l["orgType"]==="company") $co = $l["id"]; }
    echo json_encode(["job"=>$d["AIO_JOBS"][0]["id"], "lab"=>$lab, "co"=>$co, "course"=>$d["AIO_COURSES"][0]["id"], "exam"=>$d["AIO_EXAMS"][0]["id"], "path"=>$d["AIO_LEARNING_PATHS"][0]["id"] ?? "", "product"=>$d["AIO_PRODUCTS"][0]["id"] ?? 0,
      "pages"=>array_values(array_filter(array_map(fn($p)=>["role"=>get_post_meta($p->ID,"_aio_page",true),"url"=>wp_make_link_relative(get_permalink($p))], get_posts(["post_type"=>"page","post_status"=>"publish","numberposts"=>-1])), fn($x)=>$x["role"] && !in_array($x["role"],["dashboard","employer","talent","checkout","verify"]))) ]);`));
  const pub = [...ids.pages.map(p => [p.role, p.url]), ["job", "/job/" + ids.job + "/"], ["lab", "/lab/" + ids.lab + "/"], ["company", "/lab/" + ids.co + "/"],
    ["course", "/course/" + ids.course + "/"], ["exam", "/exam/" + ids.exam + "/"], ["path", "/path/" + ids.path + "/"], ["product", "/product/" + ids.product + "/"], ["notfound", "/no-such-page-xyz/"]];

  async function shoot(ctx, key, url, setup) {
    if (ONLY && !key.includes(ONLY)) return;
    for (const v of VPS) {
      const p = await page(ctx);
      await p.setViewportSize(SIZE[v]);
      try {
        await p.goto(BASE + url, { waitUntil: "networkidle", timeout: 60000 });
        await p.waitForTimeout(700);
        if (setup) await setup(p, v);
        await p.waitForTimeout(400);
        const issues = await p.evaluate(audit);
        const errs = p.errors.filter(x => !/tile\.openstreetmap|google|favicon/.test(x));
        report[key + "@" + v] = { url, issues, errors: errs };
        await p.screenshot({ path: `${OUT}/${key}@${v}.png`, fullPage: !process.env.NOFULL && !/modal|form/.test(key) });
      } catch (err) { report[key + "@" + v] = { url, fatal: String(err.message).slice(0, 200) }; }
      await p.close();
    }
  }

  /* ---------- مهمان ---------- */
  const g = await newCtx(b);
  for (const [k, u] of pub) await shoot(g, "pub-" + k, u);
  await g.close();

  if (ONLY.startsWith("pub")) { fs.writeFileSync(OUT + "/report.json", JSON.stringify(report, null, 1)); const bad = Object.entries(report).filter(([, r]) => r.fatal || (r.issues || []).length || (r.errors || []).length);
    console.log(`${Object.keys(report).length} screenshots, ${bad.length} with findings`); for (const [k, r] of bad) console.log("•", k, r.fatal || "", JSON.stringify((r.issues || []).slice(0, 3)), (r.errors || []).slice(0, 2).join(" | ")); await b.close(); return; }
  /* ---------- کارجو با رزومه و درخواست ---------- */
  const sctx = await newCtx(b);
  const s = await page(sctx);
  await s.goto(BASE + "/register/", { waitUntil: "networkidle" });
  await s.fill("#name", "سارا بازبین"); await s.fill("#email", `vis-s${stamp}@example.com`); await s.fill("#pass", "Test12345!"); await s.fill("#phone", testPhone());
  await Promise.all([s.waitForNavigation({ waitUntil: "networkidle" }), s.click(".auth-form button[type=submit]")]);
  await s.evaluate(() => API.post("me/cv", { cv: { name: AIO_ME.name, phone: AIO_ME.phone, gender: "خانم", birth: "1995-04-20", provinceId: "tehran", city: "تهران", targetRoles: ["hematology-tech"], seniority: 3, availability: "1m", wantTypes: ["تمام‌وقت"], salaryMin: 20, salaryMax: 26,
    experience: [{ orgType: "other", orgName: "آزمایشگاه نمونه", role: "hematology-tech", dept: "hematology", start: "2020-01", end: null, skills: ["blood-smear"] }],
    education: [{ degree: 3, field: "علوم آزمایشگاهی", uni: "u1", start: 2013, end: 2017 }], licenses: [{ id: "glp", issued: "2022-01", expires: null }], langs: [{ id: "en", lvl: 3 }],
    skills: [{ id: "sysmex-xn", lvl: 4 }, { id: "blood-smear", lvl: 4 }, { id: "iqc", lvl: 3 }, { id: "cbc-interp", lvl: 4 }, { id: "lis", lvl: 3 }], summary: "کارشناس هماتولوژی با سابقه‌ی کار با سل‌کانتر" } }));
  await s.evaluate(() => API.post("me/otw", { on: true }));
  const jobForApp = await s.evaluate(() => (AIO_JOBS.find(j => j.req && j.req.role === "hematology-tech") || AIO_JOBS[0]).id);
  await s.evaluate(id => API.post("jobs/" + id + "/apply", { note: "آماده‌ی مصاحبه هستم" }), jobForApp);
  const appId = await s.evaluate(() => AIO_ME.applications[0].id);
  /* کارفرمای نمونه (مدیر) مصاحبه می‌گذارد تا حالت‌های پنجره دیده شوند */
  wp(`wp_set_current_user(1); $r = new WP_REST_Request("POST"); $r->set_param("id", ${appId}); $r->set_param("status", "interview"); $r->set_param("note", "لطفاً مدارک را همراه داشته باشید");
    $r->set_param("interview", ["at" => date("Y-m-d", time()+5*86400)."T10:30", "mode" => "حضوری", "place" => "تهران، خیابان شریعتی، پلاک ۱۲۴۰"]); aio_api_app_action($r);
    $m = new WP_REST_Request("POST"); $m->set_param("id", ${appId}); $m->set_param("text", "سلام؛ لطفاً زمان مصاحبه را تأیید کنید."); aio_api_app_message($m); echo 1;`);
  for (const sec of ["overview", "resume", "matches", "applications", "alerts", "courses", "certs", "saved", "career", "services", "subscription", "orders", "notifications"])
    await shoot(sctx, "seeker-" + sec, "/dashboard/?v=" + sec + "#" + sec);
  await shoot(sctx, "seeker-app-modal", "/dashboard/?v=m#applications", async p => { await p.click("#apps-body tr.clickable"); await p.waitForSelector("#app-modal.open .app-tabs", { timeout: 20000 }); });
  await shoot(sctx, "seeker-app-modal-chat", "/dashboard/?v=c#applications", async p => { await p.click("#apps-body tr.clickable"); await p.waitForSelector("#app-modal.open .app-tabs"); await p.click('#app-modal [data-tab="chat"]'); });
  await shoot(sctx, "seeker-resume-expform", "/dashboard/?v=f#resume", async p => { await p.click("#resume-builder [data-add=exp]"); });
  await shoot(sctx, "seeker-job", "/job/" + jobForApp + "/");
  await shoot(sctx, "seeker-apply-modal", "/job/" + ids.job + "/", async p => { await p.click('[onclick="applyJob()"]'); });

  /* ---------- کارفرما با سازمان، آگهی و متقاضی ---------- */
  const ectx = await newCtx(b);
  const e = await page(ectx);
  await e.goto(BASE + "/register/?role=employer", { waitUntil: "networkidle" });
  await e.fill("#name", "آزمایشگاه بازبین"); await e.fill("#email", `vis-e${stamp}@example.com`); await e.fill("#pass", "Test12345!"); await e.fill("#phone", testPhone());
  await Promise.all([e.waitForNavigation({ waitUntil: "networkidle" }), e.click(".auth-form button[type=submit]")]);
  const labId = await e.evaluate(async () => (await API.post("employer/lab", { lab: { name: "آزمایشگاه بازبین", provinceId: "tehran", city: "تهران", lat: 35.72, lng: 51.41, avgSalary: 22, address: "تهران، خیابان آزادی", phone: "02144445555", email: "hr@vis.example.com" } })).id);
  wp(`wp_update_post(["ID"=>${labId},"post_status"=>"publish"]); echo 1;`);
  const jid = await e.evaluate(async lab => (await API.post("employer/job", { job: { title: "کارشناس هماتولوژی (بازبینی)", labId: lab, dept: "hematology", provinceId: "tehran", city: "تهران", type: "تمام‌وقت", shift: "صبح", salaryMin: 20, salaryMax: 26,
    desc: "برای بخش هماتولوژی به کارشناس مسلط به سل‌کانتر نیازمندیم.", role: "hematology-tech", req: { role: "hematology-tech", minExp: 12, skills: [{ id: "sysmex-xn", w: 10, lvl: 4, must: true }, { id: "blood-smear", w: 7, lvl: 3 }] } } })).id, labId);
  wp(`wp_update_post(["ID"=>${jid},"post_status"=>"publish"]); echo 1;`);
  await s.evaluate(id => API.post("jobs/" + id + "/apply", { note: "" }), jid);
  for (const sec of ["overview", "addlab", "orgprofile", "products", "post", "jobs", "applicants", "resumes", "exambuilder", "training", "matching", "branding", "hiring", "reports", "orders", "pricing"])
    await shoot(ectx, "emp-" + sec, "/employer/?v=" + sec + "#" + sec, sec === "resumes" || sec === "matching" ? async p => { await p.waitForSelector(".tl-tabs", { timeout: 30000 }).catch(() => {}); } : null);
  await shoot(ectx, "emp-app-modal", "/employer/?v=am#applicants", async p => { await p.click("#ats tr[data-app]"); await p.waitForSelector("#app-modal.open .app-tabs", { timeout: 20000 }); });
  await shoot(ectx, "emp-app-modal-resume", "/employer/?v=ar#applicants", async p => { await p.click("#ats tr[data-app]"); await p.waitForSelector("#app-modal.open .app-tabs"); await p.click('#app-modal [data-tab="resume"]'); });
  await shoot(ectx, "emp-app-interview-form", "/employer/?v=af#applicants", async p => { await p.click("#ats tr[data-app]"); await p.waitForSelector("#app-modal.open .app-tabs"); await p.click('#app-modal [data-tab="status"]'); await p.click('#app-modal [data-act="interview"]'); });
  await shoot(ectx, "emp-talent", "/talent/?job=" + jid, async p => { await p.waitForSelector(".tl-tabs", { timeout: 30000 }); });
  await shoot(ectx, "emp-talent-modal", "/talent/?job=" + jid, async p => { await p.waitForSelector(".tl-pane.on .tl-row", { timeout: 30000 }); await p.click(".tl-pane.on .tl-row >> nth=0"); await p.waitForSelector("#tl-drawer.open"); });
  await shoot(ectx, "emp-talent-filter", "/talent/?tab=filter", async p => { await p.waitForSelector(".tl-tabs", { timeout: 30000 }); await p.click(".tl-pane.on [data-preset='0']"); });

  fs.writeFileSync(OUT + "/report.json", JSON.stringify(report, null, 1));
  const bad = Object.entries(report).filter(([, r]) => r.fatal || (r.issues || []).length || (r.errors || []).length);
  console.log(`${Object.keys(report).length} screenshots, ${bad.length} with findings`);
  for (const [k, r] of bad) console.log("•", k, r.fatal || "", JSON.stringify((r.issues || []).slice(0, 4)), (r.errors || []).slice(0, 2).join(" | "));
  /* پاک‌سازی */
  wp(`require_once ABSPATH."wp-admin/includes/user.php"; foreach (["vis-s${stamp}@example.com","vis-e${stamp}@example.com"] as $m) { $u = get_user_by("email",$m); if(!$u) continue; foreach (get_posts(["author"=>$u->ID,"post_type"=>["aio_job","aio_lab","aio_application","aio_product","aio_exam","aio_course","aio_order","aio_cert","aio_message","aio_community","attachment"],"post_status"=>"any","numberposts"=>-1,"fields"=>"ids"]) as $id) wp_delete_post($id,true); wp_delete_user($u->ID); } do_action("aio_data_changed"); echo 1;`);
  await b.close();
})();
