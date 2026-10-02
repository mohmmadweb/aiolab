/* پنل کارفرما — همه‌ی داده‌ها از AIO_ME و عملیات با API */
const NAV_ITEMS = [
  ["overview", "پیشخوان", "home"],
  ["addlab", "ثبت سازمان روی نقشه", "pin"],
  ["orgprofile", "پروفایل و گالری سازمان", "doc"],
  ["products", "محصولات من", "machine"],
  ["post", "ثبت آگهی / پوزیشن", "plus"],
  ["jobs", "آگهی‌های من", "briefcase"],
  ["applicants", "متقاضیان", "users"],
  ["resumes", "بانک رزومه", "search"],
  ["exambuilder", "طراحی آزمون و گواهی", "shield"],
  ["training", "دوره‌های آموزشی من", "grad"],
  ["matching", "تطبیق هوشمند", "path"],
  ["branding", "برند کارفرمایی", "shield"],
  ["hiring", "خدمات استخدام کامل", "users"],
  ["reports", "گزارش بازار کار", "doc"],
  ["orders", "سفارش‌های من", "bookmark"],
  ["pricing", "تعرفه و اشتراک", "chart"]
];
const E = () => ME() || {};

document.addEventListener("DOMContentLoaded", () => {
  const u = requireLogin("employer");
  if (!u) return;
  if (u.role !== "employer") {
    document.querySelector(".dash-main").innerHTML = `<div class="panel"><h2>این پنل ویژه‌ی کارفرمایان است</h2><p>برای ثبت آگهی استخدام با حساب کارفرما وارد شوید یا حساب کارفرمایی بسازید.</p>
      <a class="btn btn-primary" href="${P.register}?role=employer">ساخت حساب کارفرما</a> <a class="btn btn-outline" href="${u.role === "supplier" ? P.advertise : P.dashboard}">پنل من</a></div>`;
    return;
  }
  const nav = document.getElementById("dash-nav");
  nav.querySelectorAll("a").forEach((a, i) => {
    const [sec, label, icon] = NAV_ITEMS[i];
    a.innerHTML = ICONS[icon] + " " + label;
    a.onclick = e => { e.preventDefault(); showSec(sec); history.replaceState(null, "", "#" + sec); };
  });
  nav.querySelector("button").innerHTML = ICONS.logout + " خروج از حساب";

  initAddLab();
  initTalentTools();
  initExamBuilder();
  initEmployerServices();
  renderAll();
  if (location.hash) showSec(location.hash.slice(1));
  window.addEventListener("hashchange", () => showSec(location.hash.slice(1) || "overview"));
});

function renderAll() {
  const me = E();
  document.getElementById("p-avatar").textContent = me.name.charAt(0);
  document.getElementById("p-name").textContent = me.name;
  const verified = (me.labs || []).some(l => l.verified);
  document.getElementById("p-sub").textContent = verified ? "کارفرمای تأییدشده ✔️" : ((me.labs || []).length ? "کارفرما" : "کارفرما — مرکز خود را ثبت کنید");

  const jobs = me.jobs || [], apps = me.applicants || [];
  document.getElementById("st-jobs").textContent = fa(jobs.filter(j => j.wpStatus === "publish").length);
  document.getElementById("st-apps").textContent = fa(apps.length);
  document.getElementById("st-views").textContent = fa(jobs.reduce((s, j) => s + (j.views || 0), 0));
  document.getElementById("st-hired").textContent = fa(apps.filter(a => a.status === "accepted").length);

  const c = me.credits || { job: 0, featured: 0, urgent: 0 };
  document.getElementById("plan-title").textContent = me.planUntil ? `اشتراک ویژه فعال تا ${me.planUntil}` : (me.paidPosting ? "اعتبار آگهی شما" : "ثبت آگهی در دوره‌ی راه‌اندازی رایگان است");
  document.getElementById("plan-bar").style.width = me.planUntil ? "100%" : (me.paidPosting ? Math.min(100, c.job * 10) + "%" : "100%");
  document.getElementById("plan-hint").textContent = `آگهی عادی: ${fa(c.job)} · ویژه: ${fa(c.featured)} · فوری: ${fa(c.urgent)}` + (me.resumeBank ? " · دسترسی بانک رزومه: فعال" : " · بانک رزومه: نیاز به اشتراک");
  const strip = `<span>اعتبار آگهی عادی: ${fa(c.job)}</span><span>ویژه: ${fa(c.featured)}</span><span>فوری: ${fa(c.urgent)}</span>${me.planUntil ? `<span>اشتراک تا ${me.planUntil}</span>` : ""}`;
  document.getElementById("emp-credits").innerHTML = strip;

  /* اطلاعات تماس سازمان اجباری است */
  const missing = (me.labs || []).filter(l => !l.phone || !l.email);
  let warn = document.getElementById("contact-warn");
  if (!warn) { warn = document.createElement("div"); warn.id = "contact-warn"; document.querySelector(".dash-main").prepend(warn); }
  warn.innerHTML = missing.length ? `<div class="notice-box warn" style="margin-bottom:14px">تلفن و ایمیل «${missing.map(l => esc(l.name)).join("، ")}» ناقص است؛ تا کامل نشود ثبت آگهی ممکن نیست. <a href="#orgprofile" onclick="EmpTalent.adapter.setOrgId(${missing[0].id});EmpTalent.orgProfile(document.getElementById('org-profile'));showSec('orgprofile')">تکمیل اطلاعات تماس</a></div>` : "";
  renderMyLabs();
  renderJobs();
  fillJobFilter();
  renderApplicants();
  renderMyExams();
  renderTraining();
  renderEmployerOrders();
}

function showSec(sec) {
  document.querySelectorAll(".dash-main > section").forEach(s => s.classList.remove("active"));
  const el = document.getElementById("sec-" + sec);
  if (el) el.classList.add("active");
  document.querySelectorAll("#dash-nav a").forEach(a => a.classList.toggle("active", a.dataset.sec === sec));
  window.scrollTo({ top: 0 });
  if (sec === "addlab" && picker && picker.map) setTimeout(() => picker.map.invalidateSize(), 80);
  if (sec === "resumes" || sec === "matching") mountTalent(sec);
}

/* ================== سازمان، محصولات، پوزیشن ساخت‌یافته، مرکز تطبیق ================== */
let posForm = null;
function initTalentTools() {
  EmpTalent.orgProfile(document.getElementById("org-profile"));
  EmpTalent.products(document.getElementById("org-products"));
  posForm = EmpTalent.positionForm(document.getElementById("pos-form"), () => { renderAll(); showSec("jobs"); talentPromise = null; talentMounted = {}; });
}
let talentMounted = {}, talentPromise = null;
async function mountTalent(sec) {
  const host = document.getElementById(sec === "resumes" ? "emp-resumes" : "emp-talent");
  if (!host || talentMounted[sec]) return;
  talentMounted[sec] = true;
  host.innerHTML = '<div class="empty-inline">در حال بارگذاری رزومه‌ها و پوزیشن‌ها…</div>';
  try { await (talentPromise = talentPromise || loadTalent()); }
  catch (e) {
    talentMounted[sec] = false; talentPromise = null;
    host.innerHTML = e.data && e.data.needPlan
      ? `<div class="notice-box warn">جستجوی پیشرفته و تطبیق هوشمند بخشی از <a href="#pricing" onclick="showSec('pricing')">اشتراک بانک رزومه</a> است.</div>`
      : `<div class="notice-box err">${esc(e.message)}</div>`;
    return;
  }
  TalentCenter.mount(host, { tab: sec === "resumes" ? "filter" : undefined, saved: TalentSaved, candActions: talentCandActions });
}

/* پرش و هایلایت فیلد ناقص */
function focusField(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  const box = el.closest(".form-field") || el;
  box.classList.add("field-error");
  setTimeout(() => box.classList.remove("field-error"), 2600);
  if (el.focus && el.tagName !== "DIV") el.focus();
}
function apiFieldError(err, map) { const f = err.data && err.data.field; if (f && map[f]) focusField(map[f]); }

/* ================== ثبت / ویرایش مرکز + نقشه ================== */
let picker = null, pinned = null, editingLab = 0;

function initAddLab() {
  const opt = (id, arr, val, label) => document.getElementById(id).innerHTML =
    arr.map(x => `<option value="${esc(val ? x[val] : x)}">${esc(label ? x[label] : x)}</option>`).join("");
  opt("lb-vertical", AIO_VERTICALS.filter(v => v.active), "id", "name");
  opt("lb-sector", AIO_SECTORS, "id", "name");
  opt("lb-kind", AIO_ORG_KINDS, "id", "name");
  opt("lb-size", AIO_ORG_SIZES);
  bindProvinceCity("lb-prov", "lb-city", () => goToCity(), { mode: "form" });
  document.getElementById("lb-perks").innerHTML = AIO_BENEFITS.map(b => `<button type="button" class="cp" onclick="this.classList.toggle('on')">${esc(b)}</button>`).join("");
  document.getElementById("lb-salary-date").value = new Date().toLocaleDateString("fa-IR");
  picker = renderPickerMap("pick-map", {
    onPick(latlng) {
      pinned = latlng;
      document.getElementById("coord").innerHTML = `مختصات: <b>${latlng.lat.toFixed(5)}</b> , <b>${latlng.lng.toFixed(5)}</b> ✓`;
    }
  });
  const ct = E().centerType;
  if (ct) { const s = document.getElementById("lb-type"); if (![...s.options].some(o => o.value === ct)) s.insertAdjacentHTML("beforeend", `<option>${esc(ct)}</option>`); s.value = ct; }
  if (!(E().labs || []).length) document.getElementById("lb-name").value = E().name || "";
}

function renderMyLabs() {
  const labs = E().labs || [];
  const box = document.getElementById("my-labs-panel");
  box.style.display = labs.length ? "" : "none";
  box.innerHTML = `<h2>مراکز ثبت‌شده‌ی من</h2>` + labs.map(l => `
    <div class="order-item">
      <span class="oi-code" style="background:${l.color};color:#fff">${l.logo ? `<img src="${l.logo}" alt="" style="width:28px;height:28px;border-radius:6px;object-fit:cover">` : esc(l.name.charAt(0))}</span>
      <div class="oi-body"><b>${esc(l.name)} ${l.verified ? "✔️" : ""}</b><small>${esc(l.type)} · ${esc(l.city)}</small></div>
      <span class="status ${l.status === "publish" ? "active" : "pending"}">${l.status === "publish" ? "منتشرشده" : "در انتظار تأیید"}</span>
      ${l.status === "publish" ? `<a class="btn btn-sm btn-ghost" href="${l.url}" target="_blank">مشاهده</a>` : ""}
      <label class="btn btn-sm btn-outline" style="cursor:pointer">لوگو<input type="file" accept="image/png,image/jpeg,image/webp" hidden onchange="uploadLogo(${l.id}, this)"></label>
      <button class="btn btn-sm btn-primary" onclick="editLab(${l.id})">ویرایش</button>
    </div>`).join("");
}

function editLab(id) {
  const l = (E().labs || []).find(x => x.id === id);
  editingLab = l ? l.id : 0;
  const set = (k, v) => { const el = document.getElementById(k); if (el) el.value = v == null ? "" : v; };
  document.getElementById("lb-form-title").textContent = l ? `ویرایش «${l.name}»` : "اطلاعات مرکز";
  document.getElementById("lb-submit").textContent = l ? "ذخیره تغییرات مرکز" : "ثبت مرکز و ارسال برای تأیید";
  document.getElementById("lb-cancel").style.display = l ? "" : "none";
  if (!l) { ["lb-name", "lb-address", "lb-about", "lb-salary", "lb-phone", "lb-email", "lb-website", "lb-staff", "lb-founded"].forEach(k => set(k, "")); clearPin(); document.querySelectorAll("#lb-perks .cp").forEach(b => b.classList.remove("on")); return; }
  set("lb-name", l.name); set("lb-address", l.address); set("lb-about", l.about); set("lb-salary", l.avgSalary || "");
  set("lb-phone", l.phone); set("lb-email", l.email); set("lb-website", l.website); set("lb-staff", l.staff || ""); set("lb-founded", l.founded || "");
  set("lb-sector", l.sector); set("lb-kind", l.orgKind); set("lb-size", l.size);
  document.querySelectorAll("[name=lb-otype]").forEach(r => r.checked = r.value === (l.orgType || "lab"));
  const t = document.getElementById("lb-type"); if (![...t.options].some(o => o.value === l.type)) t.insertAdjacentHTML("beforeend", `<option>${esc(l.type)}</option>`); t.value = l.type;
  set("lb-prov", l.provinceId); document.getElementById("lb-prov").dispatchEvent(new Event("change")); set("lb-city", l.city);
  document.querySelectorAll("#lb-perks .cp").forEach(b => b.classList.toggle("on", (l.perks || []).includes(b.textContent)));
  if (picker && l.lat) picker.setPin(l.lat, l.lng);
  previewSalary();
  document.getElementById("lb-name").scrollIntoView({ behavior: "smooth", block: "center" });
}

function goToCity() {
  const p = provinceById(document.getElementById("lb-prov").value);
  if (p && picker) picker.goTo(p.lat, p.lng, 11);
}
function locateMe() {
  if (!navigator.geolocation) { toast("مرورگر شما موقعیت‌یابی را پشتیبانی نمی‌کند"); return; }
  navigator.geolocation.getCurrentPosition(
    pos => { picker.setPin(pos.coords.latitude, pos.coords.longitude); toast("موقعیت فعلی شما روی نقشه پین شد"); },
    () => toast("دسترسی به موقعیت داده نشد"));
}
function clearPin() { if (picker) picker.clear(); pinned = null; document.getElementById("coord").textContent = "مختصات: هنوز انتخاب نشده"; }
function previewSalary() {
  const v = parseFloat(document.getElementById("lb-salary").value);
  const box = document.getElementById("salary-preview");
  if (!v) { document.getElementById("sp-val").textContent = "—"; document.getElementById("sp-cmp").textContent = ""; box.classList.remove("on"); return; }
  box.classList.add("on");
  document.getElementById("sp-val").textContent = fa(v);
  const withSal = AIO_LABS.filter(l => l.avgSalary);
  if (!withSal.length) { document.getElementById("sp-cmp").textContent = ""; return; }
  const market = withSal.reduce((s, l) => s + l.avgSalary, 0) / withSal.length;
  const diff = Math.round((v - market) / market * 100);
  document.getElementById("sp-cmp").innerHTML = diff >= 0
    ? `<i class="up">▲ ${fa(Math.abs(diff))}٪ بالاتر از میانگین بازار (${fa(market.toFixed(1))} م.ت)</i>`
    : `<i class="down">▼ ${fa(Math.abs(diff))}٪ پایین‌تر از میانگین بازار (${fa(market.toFixed(1))} م.ت)</i>`;
}

async function submitLab(btn) {
  const v = id => document.getElementById(id).value.trim();
  if (!v("lb-name")) { toast("نام مرکز را وارد کنید"); focusField("lb-name"); return; }
  if (!v("lb-prov")) { toast("استان مرکز را انتخاب کنید"); focusField("lb-prov"); return; }
  if (!v("lb-city")) { toast("شهر مرکز را انتخاب کنید"); focusField("lb-city"); return; }
  if (!(parseFloat(v("lb-salary")) > 0)) { toast("میانگین حقوق پرداختی را وارد کنید"); focusField("lb-salary"); return; }
  if (!/^0\d{9,10}$/.test(v("lb-phone").replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/[\s-]/g, ""))) { toast("تلفن سازمان را با پیش‌شماره وارد کنید"); focusField("lb-phone"); return; }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v("lb-email"))) { toast("ایمیل سازمان را وارد کنید"); focusField("lb-email"); return; }
  if (!pinned) { toast("لطفاً موقعیت مرکز را روی نقشه پین کنید"); focusField("pick-map"); return; }
  try {
    const r = await busy(btn, () => API.post("employer/lab", { lab: {
      id: editingLab, name: v("lb-name"), orgType: (document.querySelector("[name=lb-otype]:checked") || {}).value || "lab", type: v("lb-type"), sector: v("lb-sector"), orgKind: v("lb-kind"), size: v("lb-size"),
      founded: v("lb-founded"), staff: v("lb-staff"), provinceId: v("lb-prov"), city: v("lb-city"), address: v("lb-address"),
      phone: v("lb-phone"), email: v("lb-email"), website: v("lb-website"), about: v("lb-about"), avgSalary: v("lb-salary"),
      lat: pinned.lat, lng: pinned.lng, perks: [...document.querySelectorAll("#lb-perks .cp.on")].map(b => b.textContent) } }));
    toast(editingLab ? "تغییرات مرکز ذخیره شد ✓" : "مرکز ثبت شد ✓ پس از تأیید کارشناسان، روی نقشه سراسری نمایش داده می‌شود");
    editLab(0);
    renderAll();
    if (!r.id) return;
    EmpTalent.adapter.setOrgId(r.id);
    EmpTalent.orgProfile(document.getElementById("org-profile"));
    EmpTalent.products(document.getElementById("org-products"));
    showSec("orgprofile");
  } catch (err) { apiFieldError(err, { name: "lb-name", prov: "lb-prov", city: "lb-city", map: "pick-map", phone: "lb-phone", email: "lb-email" }); }
}

async function uploadLogo(id, inp) {
  const f = inp.files[0]; if (!f) return;
  if (f.size > 2 * 1024 * 1024) { toast("حجم لوگو باید کمتر از ۲ مگابایت باشد"); return; }
  await busy(inp.parentElement, () => API.upload("employer/lab/" + id + "/logo", f)).finally(() => inp.value = "");
  toast("لوگوی مرکز ذخیره شد ✓"); renderMyLabs();
}

/* ================== ویرایش آگهی / پوزیشن (فرم ساخت‌یافته) ================== */
function editJob(id) {
  showSec("post");
  posForm.load(id);
}

function renderJobs() {
  const jobs = E().jobs || [];
  document.getElementById("jobs-body").innerHTML = jobs.length ? jobs.map(j => `
    <tr>
      <td><b>${j.wpStatus === "publish" ? `<a href="${j.url}" target="_blank">${esc(j.title)}</a>` : esc(j.title)}</b><div class="muted" style="font-size:12px">${esc(j.city)}</div></td><td>${esc(j.plan)}</td>
      <td>${fa(j.views)}</td><td>${j.applicants ? `<a href="#applicants" onclick="AppUI.setJob(${j.id});renderApplicants();showSec('applicants')">${fa(j.applicants)}</a>` : "۰"}</td>
      <td>${j.internal ? "—" : j.expire}</td><td><span class="status ${j.status}">${j.statusText}</span>${j.internal && j.clientName ? `<div class="muted" style="font-size:12px">${esc(j.clientName)}</div>` : ""}</td>
      <td style="white-space:nowrap">
        ${j.req ? `<a class="btn btn-sm btn-outline" href="${P.talent}?job=${j.id}">نیروهای پیشنهادی</a>` : ""}
        <button class="btn btn-sm btn-ghost" onclick="editJob(${j.id})">ویرایش</button>
        ${j.wpStatus === "publish" || j.wpStatus === "aio_internal" ? `<button class="btn btn-sm btn-ghost danger" onclick="jobAction(${j.id},'close',this)">بستن</button>`
          : (j.wpStatus === "aio_expired" || j.wpStatus === "private") ? `<button class="btn btn-sm btn-outline" onclick="jobAction(${j.id},'renew',this)">تمدید</button>` : ""}
      </td>
    </tr>`).join("") : `<tr><td colspan="7"><div class="empty-inline">هنوز آگهی ثبت نکرده‌اید. <a href="#post" onclick="showSec('post')">ثبت اولین آگهی</a></div></td></tr>`;
}
async function jobAction(id, action, btn) {
  if (action === "close" && !confirm("این آگهی بسته شود؟ دیگر در سایت نمایش داده نمی‌شود.")) return;
  await busy(btn, () => API.post("employer/job/" + id + "/status", { action }));
  toast(action === "close" ? "آگهی بسته شد" : "آگهی تمدید شد و پس از تأیید دوباره منتشر می‌شود");
  renderAll();
}

/* ================== متقاضیان (فرایند کامل در applications.js) ================== */
function fillJobFilter() {}
function renderApplicants() {
  AppUI.employer(document.getElementById("ats"));
  const all = E().applicants || [];
  const fresh = [...all].sort((x, y) => (AppUI.needs(y, "employer") ? 1 : 0) - (AppUI.needs(x, "employer") ? 1 : 0) || y.ts - x.ts).slice(0, 5);
  document.getElementById("applicants-mini").innerHTML = fresh.length ? fresh.map(a => `
    <tr class="clickable" style="cursor:pointer" onclick="AppUI.open(${a.id}, 'employer', () => API.get('me').then(renderAll))">
      <td><b>${esc(a.name)}</b>${a.unread ? `<span class="badge-dot">${fa(a.unread)}</span>` : ""}<div style="font-size:12px;color:var(--navy-400)">${esc(a.job)}</div></td>
      <td>${esc(a.city || "—")}</td><td>${TUI.fitBadge({ score: a.match, fit: a.fit || "low" })}</td>
      <td><span class="status ${a.status}">${esc(a.statusText)}</span>${AppUI.needs(a, "employer") ? `<span class="need-act">${esc(AppUI.needs(a, "employer"))}</span>` : ""}</td>
      <td><button class="btn btn-sm btn-outline">مشاهده</button></td></tr>`).join("")
    : `<tr><td colspan="5"><div class="empty-inline">متقاضی جدیدی ندارید.</div></td></tr>`;
}
async function setAppStatus(id, status, el) {
  try { await busy(el, () => API.post("applications/" + id + "/action", { status })); toast("وضعیت درخواست به‌روز و به متقاضی اطلاع داده شد ✓"); renderAll(); }
  catch (e) { renderApplicants(); }
}

async function viewResume(uid, appId) {
  try {
    const r = await API.get("employer/resume/" + uid);
    const x = r.resume;
    if (appId) { const a = (E().applicants || []).find(y => y.id === appId); if (a && a.status === "sent") API.post("employer/application/" + appId, { status: "seen" }).then(() => renderApplicants()).catch(() => {}); }
    const row = (k, v) => v ? `<div class="row"><span>${k}</span><b>${v}</b></div>` : "";
    const app = appId ? (E().applicants || []).find(y => y.id === appId) : null;
    aioModal(`<h2>${esc(x.name)}</h2><p class="muted">${esc(x.title)}${x.volunteer ? " · " + esc(x.volunteer) : ""}</p>
      ${row("شهر", esc(x.city))}${row("سابقه", esc(x.experience))}${row("مدرک", esc([x.degree, x.field].filter(Boolean).join(" — ")))}
      ${row("حقوق موردانتظار", esc(x.salary))}${row("مهارت‌ها", esc((x.skills || []).join("، ")))}${row("دستگاه‌ها", esc((x.devices || []).join("، ")))}
      ${row("گواهی‌ها", esc((x.certs || []).join("، ")))}${row("تیپ شخصیتی", esc(x.mbti))}
      ${row("ایمیل", x.email ? `<a href="mailto:${esc(x.email)}" dir="ltr">${esc(x.email)}</a>` : "")}${row("موبایل", x.phone ? `<a href="tel:${esc(x.phone)}" dir="ltr">${esc(x.phone)}</a>` : "")}
      ${x.summary ? `<p style="margin-top:12px;line-height:2">${esc(x.summary)}</p>` : ""}
      ${app && app.note ? `<div class="notice-box info" style="margin-top:12px"><b>پیام متقاضی:</b> ${esc(app.note)}</div>` : ""}
      <div class="modal-actions">${x.file ? `<a class="btn btn-outline" href="${x.file}" target="_blank">دانلود فایل رزومه</a>` : ""}</div>`);
  } catch (e) { if (e.data && e.data.needPlan) setTimeout(() => showSec("pricing"), 1200); }
}

/* ================== طراحی آزمون ================== */
let ebQs = [];
function initExamBuilder() {
  document.getElementById("eb-dept").innerHTML = AIO_DEPARTMENTS.map(d => `<option value="${d.id}">${d.name}</option>`).join("");
  document.getElementById("eb-level").innerHTML = AIO_EXAM_LEVELS.map(l => `<option>${l}</option>`).join("");
  addQuestion();
}
function renderMyExams() {
  const list = E().myExams || [];
  document.getElementById("eb-mine").innerHTML = list.length ? list.map(e => `
    <tr><td><b>${e.badge} ${e.status === "publish" ? `<a href="${e.url}" target="_blank">${esc(e.title)}</a>` : esc(e.title)}</b></td><td>${esc(e.level)}</td>
      <td>${fa(e.qCount)}</td><td>${fa(e.takers)}</td><td>${fa(e.certIssued)}</td>
      <td><span class="status ${e.status === "publish" ? "active" : "pending"}">${e.status === "publish" ? "منتشرشده" : "در انتظار بازبینی"}</span></td></tr>`).join("")
    : `<tr><td colspan="6"><div class="empty-inline">هنوز آزمونی طراحی نکرده‌اید.</div></td></tr>`;
}
function addQuestion() { ebQs.push({ q: "", options: ["", "", "", ""], answer: 0 }); renderQuestions(); }
function removeQuestion(i) { ebQs.splice(i, 1); renderQuestions(); }
function renderQuestions() {
  document.getElementById("eb-count").textContent = fa(ebQs.length) + " سؤال";
  document.getElementById("eb-questions").innerHTML = ebQs.map((q, i) => `
    <div class="eb-q">
      <div class="ebq-head"><b>سؤال ${fa(i + 1)}</b><button class="btn btn-sm btn-ghost danger" onclick="removeQuestion(${i})">حذف</button></div>
      <input type="text" class="ebq-text" placeholder="متن سؤال…" value="${esc(q.q)}" oninput="ebQs[${i}].q=this.value">
      <div class="ebq-opts">${q.options.map((o, k) => `
        <label class="ebq-opt"><input type="radio" name="ans-${i}" ${q.answer === k ? "checked" : ""} onchange="ebQs[${i}].answer=${k}">
          <input type="text" placeholder="گزینه ${fa(k + 1)}" value="${esc(o)}" oninput="ebQs[${i}].options[${k}]=this.value"></label>`).join("")}</div>
      <small class="ebq-hint">گزینه‌ای که رادیوی آن انتخاب شده، پاسخ صحیح است.</small>
    </div>`).join("");
}
function previewExam() {
  const filled = ebQs.filter(q => q.q.trim());
  if (!filled.length) { toast("حداقل یک سؤال بنویسید"); return; }
  aioModal(`<h2>${esc(document.getElementById("eb-title").value || "پیش‌نمایش آزمون")}</h2>
    <p class="muted">${fa(filled.length)} سؤال · ${fa(document.getElementById("eb-duration").value)} دقیقه · حد نصاب ${fa(document.getElementById("eb-pass").value)}٪</p>
    ${filled.map((q, i) => `<div class="qz-q"><b>${fa(i + 1)}. ${esc(q.q)}</b>${q.options.filter(o => o.trim()).map((o, k) => `<label><input type="radio" disabled ${k === q.answer ? "checked" : ""}> ${esc(o)}</label>`).join("")}</div>`).join("")}`);
}
async function submitExam(btn) {
  const title = document.getElementById("eb-title").value.trim();
  const filled = ebQs.filter(q => q.q.trim() && q.options.filter(o => o.trim()).length >= 2);
  if (!title) { toast("عنوان آزمون را وارد کنید"); focusField("eb-title"); return; }
  if (filled.length < 3) { toast("حداقل ۳ سؤال کامل لازم است (متن سؤال + حداقل ۲ گزینه)"); return; }
  const questions = filled.map(q => {
    const opts = q.options.map((o, k) => [o.trim(), k]).filter(([o]) => o);
    return { q: q.q.trim(), options: opts.map(x => x[0]), answer: Math.max(0, opts.findIndex(x => x[1] === q.answer)) };
  });
  await busy(btn, () => API.post("employer/exam", { exam: { title, dept: document.getElementById("eb-dept").value, level: document.getElementById("eb-level").value,
    duration: Number(document.getElementById("eb-duration").value), passScore: Number(document.getElementById("eb-pass").value),
    desc: document.getElementById("eb-desc").value, badge: document.getElementById("eb-badge").value, questions } }));
  toast(`آزمون «${title}» با ${fa(filled.length)} سؤال برای بازبینی ارسال شد ✓`);
  document.getElementById("eb-title").value = ""; document.getElementById("eb-desc").value = "";
  ebQs = []; addQuestion(); renderMyExams();
}

/* ================== دوره‌های آموزشی من ================== */
function renderTraining() {
  const list = MyCreated.all();
  const st = { draft: "پیش‌نویس", pending: "در انتظار بازبینی", published: "منتشرشده" };
  const n = k => list.filter(c => c.status === k).length;
  document.getElementById("training-stats").innerHTML = `
    <div class="dash-stat"><b>${fa(list.length)}</b><span>دوره ساخته‌شده</span></div>
    <div class="dash-stat"><b>${fa(n("pending"))}</b><span>در انتظار بازبینی</span></div>
    <div class="dash-stat"><b>${fa(n("published"))}</b><span>منتشرشده</span></div>
    <div class="dash-stat"><b>${fa(n("draft"))}</b><span>پیش‌نویس</span></div>`;
  document.getElementById("my-created").innerHTML = list.length ? list.map(c => {
    const d = draftAsCourse(JSON.parse(JSON.stringify(c))), lessons = d.syllabus.flatMap(m => m.lessons || []);
    return `<div class="created-row">
      <div><b>${esc(c.title || "بدون عنوان")} <span class="status-pill ${c.status}">${st[c.status]}</span></b>
        <small>${esc(courseCat(d.cat).name || "")} · ${esc(d.level)} · ${fa(d.syllabus.length)} ماژول · ${fa(lessons.length)} درس · ${fa(d.hours)} ساعت · ${coursePrice(d)}</small></div>
      <div class="cr-act">
        <a class="btn btn-sm btn-outline" href="${c.url}${c.status === "published" ? "" : "?preview=1"}">${c.status === "published" ? "مشاهده" : "پیش‌نمایش"}</a>
        ${c.status === "published" ? "" : `<a class="btn btn-sm btn-primary" href="${P["course-builder"]}?id=${c.id}">ویرایش</a>
        <button class="btn btn-sm btn-ghost" onclick="deleteCreated(${c.id}, this)">حذف</button>`}
      </div></div>`;
  }).join("") : `<div class="empty-inline">هنوز دوره‌ای نساخته‌اید. با «ساخت دوره جدید» در پنج گام دوره‌تان را بسازید.</div>`;
  document.getElementById("training-rec").innerHTML = sortCourses(AIO_COURSES.filter(c => ["qc", "safety", "management"].includes(c.cat)), "rating").slice(0, 3).map(c => courseCardHTML(c, { compact: true })).join("");
}
async function deleteCreated(id, btn) {
  if (!confirm("این دوره حذف شود؟")) return;
  await busy(btn, () => MyCreated.remove(id));
  renderTraining(); toast("حذف شد");
}

/* ================== خدمات، اشتراک و سفارش‌ها ================== */
function initEmployerServices() {
  document.getElementById("emp-matching").innerHTML = servicesOf("matching").map(x => serviceCardHTML(x)).join("");
  document.getElementById("emp-branding").innerHTML = servicesOf("branding").map(x => serviceCardHTML(x)).join("");
  document.getElementById("emp-hiring").innerHTML = servicesOf("hiring").map(x => serviceCardHTML(x)).join("");
  document.getElementById("emp-reports").innerHTML = servicesOf("report").map(x => serviceCardHTML(x, { cta: "دریافت گزارش" })).join("");
  document.getElementById("emp-posting").innerHTML = servicesOf("posting").map(x => serviceCardHTML(x)).join("");
  document.getElementById("emp-plans").innerHTML = AIO_SERVICES.filter(x => x.plan && x.payer === "lab").map(x => `
    <div class="price-card ${x.highlight ? "featured" : ""}">
      ${x.highlight ? '<span class="plan-badge">پیشنهاد آیولب</span>' : ""}
      <h3>${esc(x.title.replace("اشتراک سالانه ", ""))}</h3>
      <div class="price">${x.price ? fa(x.price) : "رایگان"}</div><div class="per">تومان / ${esc(x.unit || "سالانه")}</div>
      <ul>${(x.features || []).map(f => `<li>${esc(f)}</li>`).join("")}</ul>
      <button class="btn ${x.highlight ? "btn-primary" : "btn-outline"} btn-block" onclick="orderService('${x.code}', this)">انتخاب پلن</button>
    </div>`).join("") + `
    <div class="price-card"><h3>سازمانی</h3><div class="price">تماس بگیرید</div><div class="per">ویژه بیمارستان‌ها و زنجیره‌ای‌ها</div>
      <ul><li>آگهی نامحدود</li><li>دسترسی کامل بانک رزومه</li><li>معرفی نیروی گزینش‌شده</li><li>مدیر حساب اختصاصی</li></ul>
      <button class="btn btn-outline btn-block" onclick="requestConsult(this)">درخواست مشاوره</button></div>`;
}
async function requestConsult(btn) {
  const me = E();
  await busy(btn, () => API.post("contact", { kind: "consult", name: me.name, contact: me.phone || me.email, topic: "اشتراک سازمانی کارفرما", message: "درخواست مشاوره برای اشتراک سازمانی از پنل کارفرما.", role: "employer" }));
  toast("درخواست مشاوره ثبت شد ✓ کارشناسان ما با شما تماس می‌گیرند");
}
function renderEmployerOrders() {
  const box = document.getElementById("emp-orders");
  if (!box) return;
  const list = MyOrders.all();
  box.innerHTML = list.length ? list.map((o, i) => `
    <div class="order-item">
      <span class="oi-code">${esc(o.code)}</span>
      <div class="oi-body"><b>${esc(o.title)}</b><small>${esc(o.unit)} · ثبت: ${o.date} · شماره ${fa(o.number)}</small></div>
      <span class="status ${o.status}">${o.statusText}</span>
      <span class="oi-price">${o.price === 0 ? "رایگان" : fa(o.price) + " تومان"}</span>
      ${o.status === "pending" ? `<a class="btn btn-sm btn-primary" href="${o.payUrl}">پرداخت</a><button class="btn btn-sm btn-ghost" onclick="cancelOrder(${i}, this)">لغو</button>` : ""}
    </div>`).join("")
    : `<p class="muted">هنوز سفارشی ثبت نکرده‌اید. از بخش‌های <a href="#matching" onclick="showSec('matching')">تطبیق هوشمند</a>،
       <a href="#branding" onclick="showSec('branding')">برند کارفرمایی</a> یا <a href="#hiring" onclick="showSec('hiring')">استخدام کامل</a> شروع کنید.</p>`;
  renderAllLite();
}
function renderAllLite() {
  const c = (E().credits) || {};
  const strip = `<span>اعتبار آگهی عادی: ${fa(c.job || 0)}</span><span>ویژه: ${fa(c.featured || 0)}</span><span>فوری: ${fa(c.urgent || 0)}</span>`;
  const el = document.getElementById("emp-credits"); if (el) el.innerHTML = strip;
}
async function cancelOrder(i, btn) {
  if (!confirm("این سفارش لغو شود؟")) return;
  await busy(btn, () => MyOrders.remove(i));
  renderEmployerOrders(); toast("سفارش لغو شد");
}
