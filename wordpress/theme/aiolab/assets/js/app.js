/* ==========================================
   آیولب — منطق کلاینت (نسخه‌ی زنده، متصل به وردپرس)
   داده‌های سایت: /aio-data.js (از پیشخوان)   وضعیت کاربر: AIO_ME   API: AIO_CFG.rest
   ========================================== */

/* ---------- SVG icons ---------- */
const ICONS = {
  flask: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v6L4.5 18a2.5 2.5 0 0 0 2.2 3.7h10.6a2.5 2.5 0 0 0 2.2-3.7L14 8V2"/><path d="M8.5 2h7"/><path d="M7 15h10"/></svg>',
  drop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.7 6.8 9.6a6.5 6.5 0 1 0 10.4 0L12 2.7z"/></svg>',
  microbe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="5.5"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.9 4.9l2.9 2.9M16.2 16.2l2.9 2.9M19.1 4.9l-2.9 2.9M7.8 16.2l-2.9 2.9"/></svg>',
  scope: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18h8"/><path d="M3 22h18"/><path d="M14 22a7 7 0 1 0 0-14h-1"/><path d="M9 14h2"/><path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z"/><path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3"/></svg>',
  syringe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m18 2 4 4"/><path d="m17 7 3-3"/><path d="M19 9 8.7 19.3a2.4 2.4 0 0 1-3.4 0l-.6-.6a2.4 2.4 0 0 1 0-3.4L15 5"/><path d="m9 11 4 4"/><path d="m5 19-3 3"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>',
  dna: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 3c0 6 16 6 16 12M20 3c0 6-16 6-16 12M4 21c0-2 1.3-3.6 3.3-4.7M20 21c0-6-16-6-16-12"/><path d="M7 7h10M7 17h10"/></svg>',
  briefcase: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4-4"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></svg>',
  building: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01"/></svg>',
  doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 3v18h18"/><path d="M7 15v3M12 10v8M17 6v12"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.5-1.5 3-3.3 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.2 1.5 4 3 5.5l7 7z"/></svg>',
  comment: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>',
  bookmark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>',
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  grad: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/></svg>',
  path: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="6" cy="19" r="3"/><circle cx="18" cy="5" r="3"/><path d="M9 19h6.5a3.5 3.5 0 0 0 0-7h-7a3.5 3.5 0 0 1 0-7H15"/></svg>',
  machine: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M6 9h4M6 13h2"/><circle cx="16.5" cy="12" r="2.5"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>',
  filter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 3H2l8 9.5V19l4 2v-8.5z"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/></svg>'
};

const LOGO_SVG = `<svg class="logo-mark" viewBox="0 0 48 48" fill="none">
  <rect x="4" y="4" width="40" height="40" rx="12" fill="#0d9488"/>
  <path d="M20 12v8.5L13.5 32a4 4 0 0 0 3.5 6h14a4 4 0 0 0 3.5-6L28 20.5V12" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <path d="M17.5 12h13" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M16.5 27h15" stroke="#5eead4" stroke-width="2.6" stroke-linecap="round"/>
  <circle cx="22" cy="32" r="1.6" fill="#5eead4"/>
  <circle cx="27" cy="34" r="1.2" fill="#5eead4"/>
</svg>`;

/* ---------- ارتباط با سرور ---------- */
const AIO_CFG_ = window.AIO_CFG || { rest: "/wp-json/aio/v1/", pages: {}, ctx: {} };
const P = new Proxy({}, { get: (_, k) => (AIO_CFG_.pages && AIO_CFG_.pages[k]) || ("/" + String(k) + "/") });

const API = {
  async req(method, path, body, isForm) {
    const opt = { method, credentials: "same-origin", headers: { "X-WP-Nonce": AIO_CFG_.nonce || "" } };
    if (body !== undefined) {
      if (isForm) opt.body = body;
      else { opt.headers["Content-Type"] = "application/json"; opt.body = JSON.stringify(body); }
    }
    let res, j = {};
    try { res = await fetch(AIO_CFG_.rest + path, opt); j = await res.json().catch(() => ({})); }
    catch (e) { const err = new Error("اتصال به سرور برقرار نشد؛ اینترنت را بررسی کنید."); err.data = {}; throw err; }
    if (!res.ok || j.ok === false || j.code) {
      const err = new Error(j.message || "خطایی رخ داد؛ دوباره تلاش کنید.");
      err.status = res.status; err.data = (j.data || {}); throw err;
    }
    if (j.me !== undefined) setMe(j.me);
    return j;
  },
  get: p => API.req("GET", p),
  post: (p, b) => API.req("POST", p, b || {}),
  del: p => API.req("DELETE", p),
  upload: (p, file) => { const f = new FormData(); f.append("file", file); return API.req("POST", p, f, true); }
};

/** اجرای یک عمل با نمایش حالت «در حال ارسال» روی دکمه و پیام خطا */
async function busy(btn, fn) {
  if (btn && btn.classList) btn.classList.add("is-busy");
  try { return await fn(); }
  catch (e) { toast(e.message || "خطا"); throw e; }
  finally { if (btn && btn.classList) btn.classList.remove("is-busy"); }
}

function setMe(me) { window.AIO_ME = me; }
const ME = () => window.AIO_ME || null;

/* ---------- حساب کاربری ---------- */
const Auth = {
  get user() { const m = ME(); return m ? { id: m.id, name: m.name, role: m.role, email: m.email, realRole: m.realRole } : null; },
  logout() { location.href = AIO_CFG_.logout || "/"; }
};

/* ---------- ذخیره‌ی محلی فقط برای ترجیحات ظاهری (نه داده) ---------- */
const Store = {
  get(k, fallback) { try { const v = JSON.parse(localStorage.getItem("aio_" + k)); return v === null ? fallback : v; } catch { return fallback; } },
  set(k, v) { try { localStorage.setItem("aio_" + k, JSON.stringify(v)); } catch {} },
  push(k, v) { const a = Store.get(k, []); a.push(v); Store.set(k, a); return a; }
};

/* گواهی‌ها، هشدارهای شغلی، MBTI و خودارزیابی — همه روی سرور */
const MyCerts  = { all: () => (ME() && ME().certs) || [] };
const MyAlerts = {
  all: () => (ME() && ME().alerts) || [],
  add: a => API.post("me/alerts", { title: a.title || "", filters: a.filters || {}, channels: a.channels || [], freq: a.freq || "خلاصه روزانه" }),
  remove(i) { const a = MyAlerts.all()[i]; return a ? API.del("me/alerts/" + a.id) : Promise.resolve(); }
};
const MyMBTI   = { get: () => ME() ? ME().mbti : null, set: r => API.post("me/mbti", { type: r.type, result: r }) };
const MyAssess = { get: () => ME() ? ME().assess : null, set: r => API.post("me/assess", { result: r }) };
const MyLabs   = { all: () => (ME() && ME().labs) || [] };

/* پیام‌ها و داده‌های شخصی با همان نام‌های دمو */
var AIO_MESSAGES = ((ME() && ME().notices) || []).map(n => ({ from: n.from, text: n.text, time: n.time, unread: n.unread, link: n.link, icon: n.icon }));

/* هدر، فوتر، منو و بردکرامب ساخت‌یافته سمت سرور (قالب وردپرس) ساخته می‌شوند. */

function toggleNavGroup(e, i) {
  e.preventDefault(); e.stopPropagation();
  const g = e.currentTarget.parentElement;
  const open = g.classList.contains("open");
  document.querySelectorAll(".nav-group.open").forEach(x => x.classList.remove("open"));
  if (!open) g.classList.add("open");
  e.currentTarget.setAttribute("aria-expanded", String(!open));
}

function toggleMsgs(e) {
  e.stopPropagation();
  const u = Auth.user;
  const menu = document.getElementById("msg-menu");
  if (!u) { location.href = P.login; return; }
  menu.classList.toggle("open");
  if (menu.classList.contains("open") && menu.querySelector(".msg-item.unread")) {
    API.post("me/notices/read").then(() => { const b = document.querySelector(".msg-wrap .badge-count"); if (b) b.remove(); }).catch(() => {});
  }
}

/* ---------- Helpers ---------- */
const lab = id => AIO_LABS.find(l => l.id === Number(id)) || ((ME() && ME().labs) || []).find(l => l.id === Number(id));
const dept = id => AIO_DEPARTMENTS.find(d => d.id === id);
const qs = key => (key === "id" && AIO_CFG_.ctx && AIO_CFG_.ctx.id) ? String(AIO_CFG_.ctx.id) : new URLSearchParams(location.search).get(key);
const esc = v => String(v == null ? "" : v).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function toast(msg) {
  let t = document.querySelector(".toast");
  if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove("show"), 2600);
}

function timeAgo(days) {
  if (days === 0) return "امروز";
  if (days === 1) return "دیروز";
  return `${days.toLocaleString("fa-IR")} روز پیش`;
}

const fa = n => Number(n).toLocaleString("fa-IR");

/* ستاره‌های امتیاز */
function starsHTML(rating, size) {
  const full = Math.floor(rating), half = rating - full >= 0.5;
  let s = "";
  for (let i = 1; i <= 5; i++) s += `<span class="st ${i <= full ? "on" : (i === full + 1 && half ? "half" : "")}">★</span>`;
  return `<span class="stars ${size || ""}">${s}</span>`;
}

/* امتیاز کل مرکز = میانگین وزنی شاخص‌ها + وزن تعداد نظر */
function labScore(l) {
  const b = l.ratingBreakdown;
  const avg = (b.salary + b.environment + b.learning + b.management + b.worklife) / 5;
  const confidence = Math.min(1, l.ratingCount / 100);      // اعتبار آماری
  const completeness = (l.verified ? .05 : 0) + (l.avgSalary ? .03 : 0);
  return +(avg * (0.85 + 0.15 * confidence) + completeness * 5).toFixed(2);
}

function sectorName(id) { const s = AIO_SECTORS.find(x => x.id === id); return s ? s.name : "—"; }
function orgKindName(id) { const s = AIO_ORG_KINDS.find(x => x.id === id); return s ? s.name : "—"; }

function jobCardHTML(j) {
  const l = lab(j.labId) || { name: "—", color: "#0d9488" }, d = dept(j.dept) || { name: "", bg: "#f1f5f9", color: "#475569" };
  const badge = j.urgent ? '<span class="badge-urgent">فوری</span>' : (j.featured ? '<span class="badge-featured">ویژه</span>' : "");
  return `
    <a class="job-card" href="${j.url}">
      ${badge}
      <div class="top">
        <div class="job-logo" style="background:${l.color}">${l.logo ? `<img src="${l.logo}" alt="">` : l.name.replace("آزمایشگاه ", "").charAt(0)}</div>
        <div>
          <h3>${j.title}</h3>
          <div class="org">${l.name} · ${j.city}</div>
        </div>
      </div>
      <div class="job-meta">
        <span class="chip" style="background:${d.bg};color:${d.color}">${d.name}</span>
        <span class="chip">${j.type}</span>
        <span class="chip">شیفت ${j.shift}</span>
        ${j.remote ? '<span class="chip remote">دورکاری</span>' : ""}
      </div>
      <div class="foot">
        <span class="salary">${j.salary}</span>
        <span class="time">${timeAgo(j.days)}</span>
      </div>
    </a>`;
}

function labCardHTML(l) {
  const count = AIO_JOBS.filter(j => j.labId === l.id).length;
  return `
    <a class="lab-card" href="${l.url}">
      <div class="job-logo" style="background:${l.color}">${l.logo ? `<img src="${l.logo}" alt="">` : l.name.replace("آزمایشگاه ", "").replace("شرکت ", "").charAt(0)}</div>
      <h3>${l.name} ${l.verified ? "✔️" : ""}</h3>
      <p>${l.type} · ${l.city}</p>
      <div class="lc-rate">${starsHTML(l.rating)}<b>${fa(l.rating)}</b><span>(${fa(l.ratingCount)} نظر)</span></div>
      ${l.avgSalary ? `<div class="lc-salary">میانگین حقوق: <b>${fa(l.avgSalary)}</b> میلیون تومان</div>` : ""}
      <span class="open-jobs">${fa(count)} فرصت شغلی فعال</span>
    </a>`;
}

/* ---------- جستجو/فیلتر مشترک ---------- */
/* f = {q, provinceId, city, dept, types[], shifts[], degrees[], genders[], experiences[],
        benefits[], salaryBands[], sectors[], orgKinds[], remote, urgent, featured, postAge, hasExam} */
function filterJobs(f) {
  return AIO_JOBS.filter(j => {
    const l = lab(j.labId) || {};
    if (f.q) {
      const hay = (j.title + " " + (l.name || "") + " " + j.skills.join(" ") + " " + j.desc + " " + j.fieldOfStudy + " " + j.city);
      if (!hay.includes(f.q)) return false;
    }
    if (f.provinceId && j.provinceId !== f.provinceId) return false;
    if (f.city && j.city !== f.city) return false;
    if (f.dept && j.dept !== f.dept) return false;
    if (f.types && f.types.length && !f.types.includes(j.type)) return false;
    if (f.shifts && f.shifts.length && !f.shifts.includes(j.shift)) return false;
    if (f.degrees && f.degrees.length && !f.degrees.includes(j.degree)) return false;
    if (f.fields && f.fields.length && !f.fields.includes(j.fieldOfStudy)) return false;
    if (f.genders && f.genders.length && !f.genders.includes(j.gender) && j.gender !== "فرقی نمی‌کند") return false;
    if (f.experiences && f.experiences.length && !f.experiences.includes(j.experience)) return false;
    if (f.militaries && f.militaries.length && !f.militaries.includes(j.military) && j.military !== "مهم نیست") return false;
    if (f.benefits && f.benefits.length && !f.benefits.every(b => j.benefits.includes(b))) return false;
    if (f.sectors && f.sectors.length && !f.sectors.includes(l.sector)) return false;
    if (f.orgKinds && f.orgKinds.length && !f.orgKinds.includes(l.orgKind)) return false;
    if (f.sizes && f.sizes.length && !f.sizes.includes(l.size)) return false;
    if (f.salaryBands && f.salaryBands.length) {
      const ok = f.salaryBands.some(id => {
        const b = AIO_SALARY_BANDS.find(x => x.id === id);
        return b && j.salaryMax >= b.min && j.salaryMin <= b.max;
      });
      if (!ok) return false;
    }
    if (f.remote && !j.remote) return false;
    if (f.urgent && !j.urgent) return false;
    if (f.featured && !j.featured) return false;
    if (f.verifiedOnly && !l.verified) return false;
    if (f.postAge) { const d = AIO_POST_AGES.find(x => x.id === f.postAge); if (d && j.days > d.days) return false; }
    return true;
  });
}

function sortJobs(list, sort) {
  const a = [...list];
  if (sort === "new")      a.sort((x, y) => x.days - y.days);
  if (sort === "urgent")   a.sort((x, y) => y.urgent - x.urgent || x.days - y.days);
  if (sort === "featured") a.sort((x, y) => y.featured - x.featured || x.days - y.days);
  if (sort === "salary")   a.sort((x, y) => y.salaryMax - x.salaryMax);
  if (sort === "rating")   a.sort((x, y) => (lab(y.labId) || {}).rating - (lab(x.labId) || {}).rating);
  return a;
}

/* پر کردن انتخابگر استان/شهر به‌صورت وابسته
   opts.mode = "filter" (پیش‌فرض، «همه استان‌ها») یا "form" (اجباری، «انتخاب کنید»)
   opts.remote = افزودن گزینه دورکاری (پیش‌فرض فقط در حالت filter) */
function bindProvinceCity(provSelId, citySelId, onChange, opts) {
  const ps = document.getElementById(provSelId), cs = document.getElementById(citySelId);
  if (!ps || !cs) return;
  opts = opts || {};
  const form = opts.mode === "form";
  const remote = opts.remote !== undefined ? opts.remote : !form;
  const provPh = form ? "استان را انتخاب کنید" : "همه استان‌ها";
  const cityPh = form ? "ابتدا استان را انتخاب کنید" : "همه شهرها";

  ps.innerHTML = `<option value="">${provPh}</option>` +
    AIO_PROVINCES.map(p => `<option value="${p.id}">${p.name}</option>`).join("");

  function fillCities() {
    const p = provinceById(ps.value);
    // در فرم، تا وقتی استان انتخاب نشده فهرست شهر خالی می‌ماند تا کاربر گمراه نشود
    const cities = p ? p.cities : (form ? [] : AIO_ALL_CITIES);
    cs.innerHTML = `<option value="">${p || !form ? (form ? "شهر را انتخاب کنید" : "همه شهرها") : cityPh}</option>` +
      cities.map(c => `<option value="${c}">${c}</option>`).join("") +
      (remote ? `<option value="${AIO_REMOTE}">${AIO_REMOTE}</option>` : "");
    cs.disabled = form && !p;
  }
  fillCities();
  // onchange (نه addEventListener) تا فراخوانی دوباره‌ی این تابع شنونده تکراری نسازد
  ps.onchange = () => { fillCities(); onChange && onChange(); };
  return { fillCities };
}

/* صفحه‌ی نیازمند ورود: هدایت به ورود و بازگشت به همین‌جا */
function loginUrl(role) {
  const back = location.pathname + location.search + location.hash;
  return P.login + "?redirect=" + encodeURIComponent(back) + (role === "employer" ? "&role=employer" : role === "supplier" ? "&role=supplier" : "");
}
function requireLogin(role) {
  const u = Auth.user;
  if (!u) { location.href = loginUrl(role); return null; }
  return u;
}

/* ==========================================
   خدمات و مدل درآمدی — توابع مشترک
   داده در assets/js/data.js (AIO_SERVICES / AIO_SERVICE_GROUPS)
   ========================================== */

/* قیمت تومان → متن فارسی. 0 = رایگان، null = توافقی */
function priceText(s) {
  if (s.price === 0)    return s.freeLabel || "رایگان";
  if (s.price === null) return s.priceLabel || "استعلام قیمت";
  return fa(s.price) + " تومان";
}

/* عدد بزرگ به شکل خواناتر: ۱٬۰۰۰٬۰۰۰ → ۱ میلیون */
function priceShort(s) {
  if (s.price === 0)    return s.freeLabel || "رایگان";
  if (s.price === null) return s.priceLabel || "استعلام قیمت";
  if (s.price >= 1000000) {
    const m = s.price / 1000000;
    return (Number.isInteger(m) ? fa(m) : fa(+m.toFixed(1))) + " میلیون تومان";
  }
  return fa(s.price) + " تومان";
}

const service      = code => AIO_SERVICES.find(s => s.code === code);
const servicesOf   = groupId => AIO_SERVICES.filter(s => s.group === groupId);
const servicesFor  = payerId => AIO_SERVICES.filter(s => s.payer === payerId);
const groupsFor    = payerId => AIO_SERVICE_GROUPS.filter(g => g.payer === payerId);
const serviceGroup = id => AIO_SERVICE_GROUPS.find(g => g.id === id);
const payerMeta    = id => AIO_PAYERS.find(p => p.id === id);
const payModelName = id => { const m = AIO_PAY_MODELS.find(x => x.id === id); return m ? m.name : "—"; };

/* کارت سرویس — استفاده مشترک در صفحه تعرفه، خدمات، پنل‌ها */
function serviceCardHTML(s, opts) {
  opts = opts || {};
  const g = serviceGroup(s.group) || {};
  const free = s.price === 0;
  return `
    <div class="svc-card ${s.highlight ? "featured" : ""} ${free ? "is-free" : ""}" id="svc-${s.code}">
      ${s.highlight ? '<span class="svc-badge">پیشنهاد آیولب</span>' : ""}
      <div class="svc-head">
        <span class="svc-ic" style="background:${g.bg};color:${g.color}">${ICONS[g.icon] || ICONS.flask}</span>
        <div class="svc-ttl">
          <h3>${s.title}</h3>
          <span class="svc-stream">${s.stream}</span>
        </div>
        ${opts.showCode !== false ? `<span class="svc-code">${s.code}</span>` : ""}
      </div>
      <p class="svc-desc">${s.desc}</p>
      <ul class="svc-feats">${(s.features || []).map(f => `<li>${f}</li>`).join("")}</ul>
      <div class="svc-price ${free ? "free" : ""}">
        <b>${priceShort(s)}</b>
        ${s.price ? `<span class="svc-unit">${s.unit}</span>` : ""}
      </div>
      <div class="svc-meta">
        <span class="chip sm">${payModelName(s.model)}</span>
        <span class="chip sm">${s.priceModel}</span>
        ${s.limited ? '<span class="chip sm warn">ظرفیت محدود</span>' : ""}
      </div>
      ${s.note ? `<p class="svc-note">${s.note}</p>` : ""}
      <button class="btn ${s.highlight ? "btn-primary" : "btn-outline"} btn-block"
              onclick="orderService('${s.code}')">${opts.cta || (free ? "فعال‌سازی" : "سفارش این خدمت")}</button>
    </div>`;
}

/* ردیف فشرده — برای جدول‌ها و پنل‌ها */
function serviceRowHTML(s) {
  return `
    <tr>
      <td><span class="svc-code sm">${s.code}</span></td>
      <td><b>${s.title}</b><br><small class="muted">${s.desc}</small></td>
      <td>${payModelName(s.model)}</td>
      <td>${s.priceModel}</td>
      <td class="ta-c"><b class="${s.price === 0 ? "free-txt" : ""}">${priceShort(s)}</b></td>
      <td><button class="btn btn-sm btn-outline" onclick="orderService('${s.code}')">سفارش</button></td>
    </tr>`;
}

/* سفارش‌ها — روی سرور؛ پرداخت در صفحه‌ی «پرداخت سفارش» */
const MyOrders = {
  all: () => (ME() && ME().orders) || [],
  remove(i) { const o = MyOrders.all()[i]; return o ? API.post("orders/" + o.id + "/cancel") : Promise.resolve(); }
};

function refreshOrderViews() {
  if (typeof renderEmployerOrders === "function") renderEmployerOrders();
  if (typeof renderSeekerOrders   === "function") renderSeekerOrders();
}

async function orderService(code, btn) {
  const s = service(code);
  if (!s) return;
  if (!Auth.user) {
    toast("برای سفارش این خدمت ابتدا وارد شوید");
    setTimeout(() => location.href = loginUrl(s.payer === "lab" ? "employer" : (s.payer === "supplier" ? "supplier" : "")), 1100);
    return;
  }
  btn = btn || (window.event && window.event.target && window.event.target.closest ? window.event.target.closest("button") : null);
  const r = await busy(btn, () => API.post("orders", { code }));
  refreshOrderViews();
  if (r.status === "pending" && r.checkout) {
    toast(r.existing ? "این سفارش قبلاً ثبت شده؛ به صفحه‌ی پرداخت می‌روید" : `«${s.title}» ثبت شد؛ به صفحه‌ی پرداخت می‌روید`);
    setTimeout(() => location.href = r.checkout, 900);
  } else if (r.status === "processing") {
    toast(`درخواست «${s.title}» ثبت شد ✓ کارشناسان آیولب با شما تماس می‌گیرند`);
  } else {
    toast(`«${s.title}» فعال شد ✓`);
  }
  return r;
}


/* ==========================================
   آکادمی آیولب — توابع مشترک دوره‌ها و مسیرهای یادگیری
   داده در assets/js/data.js (AIO_COURSES / AIO_LEARNING_PATHS / …)
   ========================================== */
const course      = id  => AIO_COURSES.find(c => c.id === Number(id));
const learningPath= id  => AIO_LEARNING_PATHS.find(p => p.id === id);
const courseCat   = id  => AIO_COURSE_CATS.find(c => c.id === id) || {};
const provider    = id  => AIO_PROVIDERS.find(p => p.id === id) || {};
const instructor  = id  => AIO_INSTRUCTORS.find(i => i.id === id) || {};
const courseFormat= id  => AIO_COURSE_FORMATS.find(f => f.id === id) || {};
const coursesOfPath = p => p.courseIds.map(course).filter(Boolean);
const pathsOfCourse = id => AIO_LEARNING_PATHS.filter(p => p.courseIds.includes(Number(id)));

const courseLessons = c => c.syllabus.flatMap((m, mi) => m.lessons.map((l, li) => ({ ...l, key: mi + ":" + li, module: m.title, mi, li })));
const courseCount   = (c, type) => courseLessons(c).filter(l => l.type === type).length;

function coursePrice(c) {
  if (!c.price) return "رایگان";
  return fa(c.price) + " تومان";
}
function ratingHTML(rating, count, size) {
  return `<span class="crs-rating">${starsHTML(rating, size || "sm")}<b>${fa(rating)}</b>${count != null ? `<small>(${fa(count)})</small>` : ""}</span>`;
}
function providerBadgeHTML(pv) {
  return `<span class="crs-prov"><i style="background:${pv.color}">${(pv.name || "").replace("آزمایشگاه ", "").replace("دانشگاه ", "").charAt(0)}</i>${pv.name}</span>`;
}
function courseTypeName(c) { return c.type === "guided" ? "پروژه راهنما" : "دوره"; }

/* ثبت‌نام و پیشرفت — روی سرور (خواندن همگام از AIO_ME، نوشتن با API) */
const MyCourses = {
  all: () => (ME() && ME().courses) || [],
  get: id => MyCourses.all().find(e => e.id === Number(id)),
  isEnrolled: id => !!MyCourses.get(id),
  /* وضعیت جدید از پاسخ سرور (AIO_ME) خوانده می‌شود؛ نتیجه شامل cert (صدور گواهی) است */
  markDone(id, key, done) {
    return API.post("courses/" + id + "/progress", { key, done: done !== false });
  },
  remove(id) { return API.del("courses/" + id + "/enroll"); }
};
const MyWishlist = {
  all: () => (ME() && ME().wishlist) || [],
  has: id => MyWishlist.all().includes(Number(id)),
  toggle(id) {
    const m = ME(); if (!m) return false;
    const i = m.wishlist.indexOf(Number(id)); const on = i < 0;
    on ? m.wishlist.push(Number(id)) : m.wishlist.splice(i, 1);
    API.post("me/wishlist", { course_id: Number(id) }).catch(e => toast(e.message));
    return on;
  }
};

function courseProgress(c) {
  const e = MyCourses.get(c.id);
  const total = courseLessons(c).length;
  const done = e ? e.done.filter(k => courseLessons(c).some(l => l.key === k)).length : 0;
  return { enrolled: !!e, done, total, pct: total ? Math.round(done / total * 100) : 0, last: e ? e.last : null };
}

function pathProgress(p) {
  const list = coursesOfPath(p);
  const pcts = list.map(c => courseProgress(c).pct);
  return { pct: Math.round(pcts.reduce((a, b) => a + b, 0) / Math.max(1, list.length)), started: list.some(c => MyCourses.isEnrolled(c.id)) };
}

/* ثبت‌نام در دوره؛ دوره‌ی پولی → صفحه‌ی پرداخت */
async function enrollCourse(id, goLearn, btn) {
  const c = course(id); if (!c) return;
  if (!Auth.user) {
    toast("برای ثبت‌نام در دوره ابتدا وارد شوید");
    setTimeout(() => location.href = loginUrl(), 1000); return;
  }
  btn = btn || (window.event && window.event.target && window.event.target.closest ? window.event.target.closest("button") : null);
  const r = await busy(btn, () => API.post("courses/" + c.id + "/enroll"));
  if (r.needPay) {
    toast("برای شروع دوره، پرداخت را تکمیل کنید");
    setTimeout(() => location.href = r.checkout, 900); return r;
  }
  if (!r.was) toast(`در «${c.title}» ثبت‌نام شدید ✓`);
  if (typeof renderMyCourses === "function") renderMyCourses();
  if (goLearn !== false) setTimeout(() => location.href = r.learn || ("/learn/" + c.id + "/"), r.was ? 0 : 800);
  return r;
}

/* کارت دوره — الگوی کارت Coursera: ارائه‌دهنده، عنوان، مهارت‌ها، امتیاز، سطح · نوع · مدت */
function courseCardHTML(c, opts) {
  opts = opts || {};
  const cat = courseCat(c.cat), pv = provider(c.providerId), pr = courseProgress(c);
  const tag = c.bestseller ? '<span class="crs-tag hot">پرفروش</span>'
            : c.isNew ? '<span class="crs-tag new">جدید</span>'
            : c.featured ? '<span class="crs-tag">پیشنهاد آیولب</span>' : "";
  return `
    <a class="course-card ${c.type === "guided" ? "guided" : ""}" href="${opts.href || c.url || "/course/" + c.id + "/"}">
      <div class="cc-thumb" style="background:linear-gradient(135deg,${cat.bg},#fff 70%);color:${cat.color}">
        ${ICONS[cat.icon] || ICONS.grad}
        ${tag}
        ${!c.price ? '<span class="crs-free">رایگان</span>' : ""}
      </div>
      <div class="cc-body">
        ${providerBadgeHTML(pv)}
        <h3>${c.title}</h3>
        ${opts.compact ? "" : `<p class="cc-skills"><b>مهارت‌ها:</b> ${c.skills.slice(0, 4).join("، ")}</p>`}
        <div class="cc-rating">${ratingHTML(c.rating, c.ratingCount)}<span>${fa(c.students)} فراگیر</span></div>
        <div class="cc-meta">${c.level} · ${courseTypeName(c)} · ${fa(c.hours)} ساعت · ${courseFormat(c.format).short}</div>
        ${pr.enrolled ? `<div class="cc-progress"><i style="width:${pr.pct}%"></i></div><small class="cc-pct">${fa(pr.pct)}٪ تکمیل شده</small>`
                      : `<div class="cc-price ${!c.price ? "free" : ""}">${coursePrice(c)}${c.oldPrice ? `<s>${fa(c.oldPrice)}</s>` : ""}</div>`}
      </div>
    </a>`;
}

/* کارت مسیر یادگیری (Specialization / گواهی حرفه‌ای) */
function pathCardHTML(p) {
  const list = coursesOfPath(p), hours = list.reduce((s, c) => s + c.hours, 0), pr = pathProgress(p);
  const kind = p.kind === "professional" ? "گواهی حرفه‌ای" : "مسیر تخصصی";
  return `
    <a class="path-card" href="${p.url || "/path/" + p.id + "/"}" style="--pc:${p.color};--pbg:${p.bg}">
      <div class="pc-head">
        <span class="pc-ic">${ICONS[p.icon] || ICONS.path}</span>
        <span class="pc-kind">${kind}</span>
      </div>
      <h3>${p.title}</h3>
      <p>${p.desc}</p>
      <div class="pc-courses">${list.map((c, i) => `<span><b>${fa(i + 1)}</b>${c.title}</span>`).join("")}</div>
      <div class="pc-meta">
        <span>${fa(list.length)} دوره</span><span>${fa(hours)} ساعت</span><span>${p.level}</span>
        ${ratingHTML(p.rating, null)}
      </div>
      ${pr.started ? `<div class="cc-progress"><i style="width:${pr.pct}%"></i></div><small class="cc-pct">${fa(pr.pct)}٪ مسیر طی شده</small>` : `<span class="pc-role">🎯 ${p.role}</span>`}
    </a>`;
}

/* فیلتر مشترک کاتالوگ — f = {q, cat, level[], format[], duration[], price, lang[], cert, rating, provider[], type[]} */
function filterCourses(f) {
  f = f || {};
  return AIO_COURSES.filter(c => {
    if (f.q) {
      const hay = [c.title, c.subtitle, c.skills.join(" "), courseCat(c.cat).name, provider(c.providerId).name,
                   c.instructorIds.map(i => instructor(i).name).join(" ")].join(" ");
      if (!hay.includes(f.q)) return false;
    }
    if (f.cat && c.cat !== f.cat) return false;
    if (f.type && f.type.length && !f.type.includes(c.type)) return false;
    if (f.level && f.level.length && !f.level.includes(c.level)) return false;
    if (f.format && f.format.length && !f.format.includes(c.format)) return false;
    if (f.lang && f.lang.length && !f.lang.includes(c.lang)) return false;
    if (f.provider && f.provider.length && !f.provider.includes(c.providerId)) return false;
    if (f.duration && f.duration.length && !f.duration.some(id => { const d = AIO_COURSE_DURATIONS.find(x => x.id === id); return d && c.hours >= d.min && c.hours < d.max; })) return false;
    if (f.price === "free" && c.price) return false;
    if (f.price === "paid" && !c.price) return false;
    if (f.cert && !c.cert) return false;
    if (f.rating && c.rating < f.rating) return false;
    if (f.skill && !c.skills.some(s => s.includes(f.skill)) && !c.title.includes(f.skill)) return false;
    return true;
  });
}
function sortCourses(list, sort) {
  const a = [...list];
  if (sort === "popular") a.sort((x, y) => y.students - x.students);
  if (sort === "rating")  a.sort((x, y) => y.rating - x.rating || y.ratingCount - x.ratingCount);
  if (sort === "new")     a.sort((x, y) => y.updated.localeCompare(x.updated, "fa") || y.id - x.id);
  if (sort === "cheap")   a.sort((x, y) => x.price - y.price);
  if (sort === "short")   a.sort((x, y) => x.hours - y.hours);
  return a;
}


/* ---------- دوره‌های ساخته‌شده توسط کاربر (سازنده دوره) — روی سرور ----------
   هر آیتم: پیش‌نویس سازنده + id (شناسه‌ی وردپرس)، status (draft|pending|published) */
const MyCreated = {
  all: () => (ME() && ME().created) || [],
  get: id => MyCreated.all().find(c => String(c.id) === String(id)),
  async save(c, submit) {
    const id = /^\d+$/.test(String(c.id || "")) ? Number(c.id) : 0;
    const r = await API.post("builder", { id, draft: c, submit: !!submit });
    c.id = r.id; c.status = r.status;
    return c;
  },
  remove(id) { return API.del("builder/" + id); }
};
/* پیش‌نویس را به شکل قابل نمایش برای courseCardHTML / course.html درمی‌آورد
   (ارائه‌دهنده و مدرسان سفارشی به‌صورت موقت به فهرست‌های سراسری اضافه می‌شوند) */
function draftAsCourse(d) {
  if (!d) return null;
  if (d.providerId === "mine" && !AIO_PROVIDERS.some(p => p.id === "mine"))
    AIO_PROVIDERS.push({ id: "mine", name: d.providerName || "مرکز من", kind: "مرکز عضو", color: "#0d9488", labId: null, about: "ارائه‌دهنده‌ی این دوره؛ عضو آیولب." });
  else if (d.providerId === "mine") AIO_PROVIDERS.find(p => p.id === "mine").name = d.providerName || "مرکز من";
  (d.newInstructors || []).forEach((n, i) => {
    const id = "n" + i, ex = AIO_INSTRUCTORS.find(x => x.id === id);
    const obj = { id, name: n.name || "مدرس", title: n.title || "", org: d.providerName || "", color: "#0f766e", students: 0, rating: 5, courses: 1, bio: n.bio || "" };
    ex ? Object.assign(ex, obj) : AIO_INSTRUCTORS.push(obj);
  });
  const lessons = (d.syllabus || []).flatMap(m => m.lessons || []);
  const mins = lessons.reduce((s, l) => s + (Number(l.min) || 0), 0);
  return Object.assign({
    type: "course", level: "مقدماتی", format: "self", lang: "فارسی", cat: "soft", providerId: "aiolab",
    instructorIds: [], price: 0, weeks: 1, cert: true, certType: "گواهی مهارت آیولب", rating: 5, ratingCount: 0, students: 0,
    updated: "۱۴۰۵/۰۶", skills: [], outcomes: [], prereq: [], audience: [], syllabus: [], faq: [], reviews: []
  }, d, {
    hours: d.hours || +(mins / 60).toFixed(1),
    instructorIds: [...(d.instructorIds || []), ...(d.newInstructors || []).map((_, i) => "n" + i)],
    syllabus: (d.syllabus || []).map(m => ({ ...m, hours: m.hours || +((m.lessons || []).reduce((s, l) => s + (Number(l.min) || 0), 0) / 60).toFixed(1) }))
  });
}

/* ---------- Page bootstrap ---------- */
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll('a[target="_blank"]:not([rel])').forEach(a => a.rel = "noopener");
  document.addEventListener("click", e => {
    document.querySelectorAll(".user-menu.open, .msg-menu.open, .nav-group.open").forEach(m => {
      if (!m.contains(e.target) && !m.parentElement.contains(e.target)) {
        m.classList.remove("open");
        const b = m.querySelector(":scope > .nav-link"); if (b) b.setAttribute("aria-expanded", "false");
      }
    });
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") document.querySelectorAll(".user-menu.open, .msg-menu.open, .nav-group.open, .main-nav.open").forEach(m => m.classList.remove("open"));
  });
  /* وقتی پوینتر از کل گروه بیرون رفت، حالت open کلیکی هم بسته شود تا منو معلق نماند */
  document.querySelectorAll(".nav-group").forEach(g => g.addEventListener("mouseleave", () => {
    if (window.innerWidth > 1080) { g.classList.remove("open"); g.querySelector(".nav-link").setAttribute("aria-expanded", "false"); }
  }));
});

/* مودال ساده برای نمایش جزئیات (رزومه، پیام، تأیید) */
function aioModal(html, opts) {
  opts = opts || {};
  const m = document.createElement("div");
  m.className = "aio-modal";
  m.innerHTML = `<div class="modal" role="dialog" aria-modal="true"><button class="x" aria-label="بستن">✕</button>${html}</div>`;
  const close = () => { m.remove(); document.removeEventListener("keydown", onKey); if (opts.onClose) opts.onClose(); };
  const onKey = e => { if (e.key === "Escape") close(); };
  m.addEventListener("click", e => { if (e.target === m || e.target.closest(".x")) close(); });
  document.addEventListener("keydown", onKey);
  document.body.appendChild(m);
  m.close = close;
  return m;
}
