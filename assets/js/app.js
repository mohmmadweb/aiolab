/* ==========================================
   آیولب — منطق کلاینت (دمو / بدون بک‌اند)
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

/* ---------- Demo auth (localStorage) ---------- */
const Auth = {
  get user() { try { return JSON.parse(localStorage.getItem("aio_user")); } catch { return null; } },
  login(name, role) { localStorage.setItem("aio_user", JSON.stringify({ name, role })); },
  logout() { localStorage.removeItem("aio_user"); location.href = "index.html"; }
};

/* ---------- Header / Footer ---------- */
function renderHeader(active) {
  const u = Auth.user;
  const nav = [
    ["index.html", "خانه"],
    ["jobs.html", "فرصت‌های شغلی"],
    ["dashboard.html#resume", "رزومه حرفه‌ای من"],
    ["labs.html", "آزمایشگاه‌های عضو"],
    ["magazine.html", "در آزمایشگاه چه می‌گذرد؟"],
    ["courses.html", "آموزش و رشد حرفه‌ای"],
    ["community.html", "جامعه آزمایشگاهی"]
  ];
  const navHTML = nav.map(([href, label]) =>
    `<a href="${href}" class="${active === href.split("#")[0] ? "active" : ""}">${label}</a>`).join("");

  const unread = (typeof AIO_MESSAGES !== "undefined") ? AIO_MESSAGES.filter(m => m.unread).length : 0;
  const msgBtn = `
    <div class="msg-wrap">
      <button class="icon-btn" title="پیام‌ها" onclick="toggleMsgs(event)">
        ${ICONS.comment}
        ${unread ? `<span class="badge-count">${unread.toLocaleString("fa-IR")}</span>` : ""}
      </button>
      <div class="msg-menu" id="msg-menu">
        <div class="msg-head">پیام‌ها <a href="dashboard.html#notifications">مشاهده همه</a></div>
        ${(typeof AIO_MESSAGES !== "undefined" ? AIO_MESSAGES : []).map(m => `
          <div class="msg-item ${m.unread ? "unread" : ""}">
            <b>${m.from}</b>
            <p>${m.text}</p>
            <span>${m.time}</span>
          </div>`).join("")}
      </div>
    </div>`;

  let actions;
  if (u) {
    const dash = u.role === "employer" ? "employer.html" : "dashboard.html";
    actions = `
      ${msgBtn}
      <div class="user-chip">
        <button onclick="this.nextElementSibling.classList.toggle('open')">
          <span class="avatar">${u.name.charAt(0)}</span>${u.name}
        </button>
        <div class="user-menu">
          <a href="${dash}">${u.role === "employer" ? "پنل کارفرما" : "داشبورد من"}</a>
          <a href="${dash}#notifications">اعلان‌ها</a>
          <button class="danger" onclick="Auth.logout()">خروج از حساب</button>
        </div>
      </div>`;
  } else {
    actions = `
      <a href="login.html" class="btn btn-ghost">ثبت‌نام / ورود کارجو</a>
      <a href="login.html?role=employer" class="btn btn-outline">ورود آزمایشگاه | ثبت آگهی</a>
      ${msgBtn}`;
  }

  document.getElementById("site-header").innerHTML = `
    <div class="container header-inner">
      <a href="index.html" class="logo">${LOGO_SVG}<span>آیو<b>لب</b></span></a>
      <nav class="main-nav" id="main-nav">${navHTML}</nav>
      <div class="header-actions">${actions}
        <button class="menu-toggle" onclick="document.getElementById('main-nav').classList.toggle('open')">${ICONS.menu}</button>
      </div>
    </div>`;
}

function toggleMsgs(e) {
  e.stopPropagation();
  const u = Auth.user;
  const menu = document.getElementById("msg-menu");
  if (!u) { location.href = "login.html"; return; }
  menu.classList.toggle("open");
}

function renderFooter() {
  document.getElementById("site-footer").innerHTML = `
    <div class="container">
      <div class="footer-grid">
        <div>
          <a href="index.html" class="logo">${LOGO_SVG}<span>آیو<b>لب</b></span></a>
          <p>آیولب، پلتفرم تخصصی کاریابی و توسعه شغلی پرسنل آزمایشگاه‌های تشخیص طبی و پژوهشی ایران. اتصال هوشمند کارجویان و آزمایشگاه‌ها.</p>
        </div>
        <div>
          <h4>کارجویان</h4>
          <ul>
            <li><a href="jobs.html">جستجوی فرصت شغلی</a></li>
            <li><a href="dashboard.html">رزومه‌ساز حرفه‌ای</a></li>
            <li><a href="courses.html">دوره‌های آموزشی</a></li>
            <li><a href="magazine.html">راهنمای مسیر شغلی</a></li>
          </ul>
        </div>
        <div>
          <h4>کارفرمایان</h4>
          <ul>
            <li><a href="login.html?role=employer">ثبت آگهی استخدام</a></li>
            <li><a href="employer.html">جستجوی بانک رزومه</a></li>
            <li><a href="employer.html#pricing">تعرفه‌ها و اشتراک</a></li>
            <li><a href="labs.html">برندینگ کارفرمایی</a></li>
          </ul>
        </div>
        <div>
          <h4>آیولب</h4>
          <ul>
            <li><a href="magazine.html">در آزمایشگاه چه می‌گذرد؟</a></li>
            <li><a href="community.html">جامعه آزمایشگاهی</a></li>
            <li><a href="#">درباره ما</a></li>
            <li><a href="#">تماس با ما</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© ۱۴۰۵ آیولب — aiolab.ir | تمامی حقوق محفوظ است.</span>
        <span>نسخه پروتوتایپ (دمو)</span>
      </div>
    </div>`;
}

/* ---------- Helpers ---------- */
const lab = id => AIO_LABS.find(l => l.id === id);
const dept = id => AIO_DEPARTMENTS.find(d => d.id === id);
const qs = key => new URLSearchParams(location.search).get(key);

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

function jobCardHTML(j) {
  const l = lab(j.labId), d = dept(j.dept);
  const badge = j.urgent ? '<span class="badge-urgent">فوری</span>' : (j.featured ? '<span class="badge-featured">ویژه</span>' : "");
  return `
    <a class="job-card" href="job.html?id=${j.id}">
      ${badge}
      <div class="top">
        <div class="job-logo" style="background:${l.color}">${l.name.replace("آزمایشگاه ", "").charAt(0)}</div>
        <div>
          <h3>${j.title}</h3>
          <div class="org">${l.name} · ${j.city}</div>
        </div>
      </div>
      <div class="job-meta">
        <span class="chip" style="background:${d.bg};color:${d.color}">${d.name}</span>
        <span class="chip">${j.type}</span>
        <span class="chip">شیفت ${j.shift}</span>
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
    <a class="lab-card" href="lab.html?id=${l.id}">
      <div class="job-logo" style="background:${l.color}">${l.name.replace("آزمایشگاه ", "").charAt(0)}</div>
      <h3>${l.name} ${l.verified ? "✔️" : ""}</h3>
      <p>${l.type} · ${l.city}</p>
      <span class="open-jobs">${count.toLocaleString("fa-IR")} فرصت شغلی فعال</span>
    </a>`;
}

function requireLogin(role) {
  const u = Auth.user;
  if (!u) { location.href = "login.html" + (role === "employer" ? "?role=employer" : ""); return null; }
  return u;
}

/* ---------- Page bootstrap ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page || "";
  if (document.getElementById("site-header")) renderHeader(page);
  if (document.getElementById("site-footer")) renderFooter();
  document.addEventListener("click", e => {
    document.querySelectorAll(".user-menu.open, .msg-menu.open").forEach(m => {
      if (!m.parentElement.contains(e.target)) m.classList.remove("open");
    });
  });
});
