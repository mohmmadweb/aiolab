/* داشبورد کارجو / داوطلب — همه‌ی داده‌ها از AIO_ME و ذخیره با API */
const NAV_ITEMS = [
  ["overview", "پیشخوان", "home"],
  ["resume", "رزومه حرفه‌ای من", "doc"],
  ["matches", "پوزیشن‌های مناسب من", "path"],
  ["applications", "درخواست‌های من", "send"],
  ["alerts", "هشدارهای شغلی", "bell"],
  ["courses", "دوره‌های من", "grad"],
  ["certs", "گواهی و خودارزیابی", "shield"],
  ["saved", "آگهی‌های ذخیره‌شده", "bookmark"],
  ["career", "مسیر ارتقاء شغلی", "path"],
  ["services", "خدمات ویژه من", "briefcase"],
  ["subscription", "اشتراک من", "shield"],
  ["orders", "سفارش‌های من", "bookmark"],
  ["notifications", "اعلان‌ها", "bell"]
];
/* رزومه‌ی ساخت‌یافته‌ی کاربر (همان قالب ResumeBuilder) */
function myCv() {
  const me = ME(), c = Object.assign({}, me.cv || {});
  c.name = me.name; c.phone = me.phone || "";
  return c;
}
const hasCv = () => { const c = ME().cv; return !!(c && c.skills && c.skills.length); };

document.addEventListener("DOMContentLoaded", () => {
  const u = requireLogin();
  if (!u) return;
  if (u.role === "employer" || u.role === "supplier") {
    document.querySelector(".dash-main").innerHTML = `<div class="panel"><h2>این داشبورد ویژه‌ی کارجویان است</h2><p>حساب شما «${u.role === "employer" ? "کارفرما" : "تأمین‌کننده"}» است.</p><a class="btn btn-primary" href="${u.role === "employer" ? P.employer : P.advertise}">رفتن به پنل من</a></div>`;
    return;
  }
  const nav = document.getElementById("dash-nav");
  nav.querySelectorAll("a").forEach((a, i) => {
    const [sec, label, icon] = NAV_ITEMS[i];
    a.innerHTML = ICONS[icon] + " " + label;
    a.onclick = e => { e.preventDefault(); showSec(sec); history.replaceState(null, "", "#" + sec); };
  });
  nav.querySelector("button").innerHTML = ICONS.logout + " خروج از حساب";

  ResumeBuilder.mount(document.getElementById("resume-builder"), {
    load: myCv,
    save: async cv => { await API.post("me/cv", { cv }); return myCv(); },
    onSaved: () => { toast("رزومه ذخیره شد ✓ پیشنهادهای شغلی به‌روز شد"); renderAll(); },
    filePanel: () => `<div id="resume-file"></div>
        <input type="file" id="resume-input" accept=".pdf,.doc,.docx" style="display:none" onchange="uploadResume(this)">
        <button type="button" class="btn btn-outline" onclick="document.getElementById('resume-input').click()">📎 بارگذاری فایل (PDF یا Word، حداکثر ۵ مگابایت)</button>`,
    afterDraw: renderResumeFile
  });
  initAlerts();
  renderAll();
  initSeekerServices();
  if (location.hash) showSec(location.hash.slice(1));
  window.addEventListener("hashchange", () => showSec(location.hash.slice(1) || "overview"));
});

function renderAll() {
  const me = ME(), cv = myCv(), p = AioMatch.profile(cv);
  document.getElementById("p-avatar").textContent = me.name.charAt(0);
  document.getElementById("p-name").textContent = me.name;
  const cur = p.current || p.last;
  document.getElementById("p-sub").textContent = hasCv()
    ? [cur ? TUI.name.role(cur.role) : TUI.name.role((cv.targetRoles || [])[0]), cv.city].filter(Boolean).join(" · ")
    : (me.realRole === "volunteer" ? (me.volStatus || "داوطلب") : "رزومه‌ی آیتمی خود را بسازید");

  let warn = document.getElementById("contact-warn");
  if (!warn) { warn = document.createElement("div"); warn.id = "contact-warn"; document.querySelector(".dash-main").prepend(warn); }
  warn.innerHTML = /^09\d{9}$/.test(me.phone || "") ? "" : `<div class="notice-box warn" style="margin-bottom:14px">شماره موبایل شما ثبت نشده است؛ بدون آن کارفرما نمی‌تواند با شما تماس بگیرد و ارسال درخواست ممکن نیست. <a href="#resume" onclick="showSec('resume')">تکمیل در رزومه</a></div>`;
  document.getElementById("pw-title").textContent = `قدرت پروفایل شما: ${fa(me.strength)}٪`;
  document.getElementById("pw-bar").style.width = me.strength + "%";
  const miss = [];
  if (!(cv.experience || []).length) miss.push("سوابق کاری با تاریخ");
  if ((cv.skills || []).length < 5) miss.push("حداقل ۵ مهارت با سطح");
  if (!(cv.education || []).length) miss.push("تحصیلات");
  if (!(cv.langs || []).length) miss.push("زبان");
  if (!cv.summary) miss.push("خلاصه حرفه‌ای");
  const hint = document.getElementById("ps-hint");
  if (hint) hint.textContent = miss.length ? `برای رسیدن به ۱۰۰٪ اضافه کنید: ${miss.join("، ")}.` : "پروفایل شما کامل است 👏";

  document.getElementById("st-apps").textContent = fa(me.applications.length);
  document.getElementById("st-int").textContent = fa(me.applications.filter(a => a.status === "interview" || a.status === "accepted").length);
  document.getElementById("st-views").textContent = fa(me.profileViews || 0);
  document.getElementById("st-saved").textContent = fa(me.saved.length);

  renderMatches();

  document.getElementById("apps-body").innerHTML = me.applications.length ? [...me.applications].sort((x, y) => (AppUI.needs(y, "seeker") ? 1 : 0) - (AppUI.needs(x, "seeker") ? 1 : 0) || (y.updated || y.ts) - (x.updated || x.ts)).map(a => `
    <tr class="clickable" style="cursor:pointer" onclick="AppUI.open(${a.id}, 'seeker', () => API.get('me').then(renderAll))">
      <td><b>${esc(a.job)}</b>${a.unread ? `<span class="badge-dot">${fa(a.unread)}</span>` : ""}${a.channel === "invite" ? ' <span class="chip sm">دعوت کارفرما</span>' : ""}</td><td>${esc(a.lab)}</td><td>${a.date}</td>
      <td><span class="status ${a.status}">${esc(a.statusText)}</span>${AppUI.needs(a, "seeker") ? `<span class="need-act">${esc(AppUI.needs(a, "seeker"))}</span>` : ""}</td></tr>`).join("")
    : `<tr><td colspan="4"><div class="empty-inline">هنوز درخواستی نفرستاده‌اید. <a href="${P.jobs}">فرصت‌های شغلی</a> را ببینید.</div></td></tr>`;

  const saved = me.saved.map(id => AIO_JOBS.find(j => j.id === id)).filter(Boolean);
  document.getElementById("saved-jobs").innerHTML = saved.length ? saved.map(jobCardHTML).join("")
    : `<div class="empty-inline" style="grid-column:1/-1">آگهی ذخیره‌شده‌ای ندارید. در صفحه‌ی هر آگهی «ذخیره آگهی» را بزنید.</div>`;

  renderOTW();
  initOnboard();
  renderAlerts();
  initCerts();
  renderMyCourses();
  renderCareer();
  renderSeekerOrders();
  renderNotices();
}

/* ============ پوزیشن‌های مناسب (موتور تطبیق مشترک با سرور) ============ */
function renderMatches() {
  const box = document.getElementById("my-matches");
  const withReq = AIO_JOBS.filter(j => j.req);
  if (!hasCv()) {
    box.innerHTML = `<div class="empty-inline">ابتدا <a href="#resume" onclick="showSec('resume')">رزومه‌ی آیتمی</a> خود را بسازید تا پوزیشن‌های مناسب با درصد و دلیل تطبیق این‌جا نمایش داده شوند.</div>`;
    document.getElementById("suggested").innerHTML = [...AIO_JOBS].sort((a, b) => a.days - b.days).slice(0, 4).map(jobCardHTML).join("");
    return;
  }
  const cv = myCv(), p = AioMatch.profile(cv);
  const res = AioMatch.jobsFor(cv, withReq);
  const row = x => `<details class="tl-row" style="display:block;cursor:default">
      <summary style="display:grid;grid-template-columns:1fr auto auto;gap:12px;align-items:center;cursor:pointer;list-style:none">
        <div><b>${esc(x.job.title)}</b><small>${esc((lab(x.job.labId) || {}).name || "")} · ${esc(x.job.city)} · ${esc(x.job.salary || "")}</small></div>
        ${TUI.fitBadge(x.m)}${TUI.ring(x.m, 50)}</summary>
      <div style="margin-top:14px">${TUI.breakdown(x.m)}
        <div class="fb-actions"><a class="btn btn-sm btn-primary" href="${x.job.url}">مشاهده و ارسال رزومه</a></div></div></details>`;
  const shown = res.filter(x => x.m.fit !== "none"), hidden = res.length - shown.length;
  box.innerHTML = res.length
    ? `<div class="tl-summary"><div><b>${fa(res.filter(x => x.m.fit === "high").length)}</b><span>تطبیق بالا</span></div><div><b>${fa(res.filter(x => x.m.fit === "mid").length)}</b><span>تطبیق متوسط</span></div>
       <div><b>${fa(res.filter(x => x.m.eligible).length)}</b><span>واجد شرایط الزامی</span></div><div><b>${p.expMonths ? AioDate.durText(p.expMonths) : "—"}</b><span>سابقه‌ی محاسبه‌شده</span></div></div>`
      + shown.map(row).join("") + (hidden ? `<p class="muted" style="margin-top:10px">${fa(hidden)} آگهی دیگر با رزومه‌ی شما ارتباط کمی دارند و نمایش داده نشدند.</p>` : "")
    : '<div class="empty-inline">فعلاً آگهی فعالی با نیازمندی ساخت‌یافته وجود ندارد.</div>';
  const top = shown.slice(0, 4);
  document.getElementById("suggested").innerHTML = top.length ? top.map(x => jobCardHTML(x.job).replace('<div class="foot">', `<div class="foot"><span>${TUI.fitBadge(x.m)}</span>`)).join("")
    : '<div class="empty-inline" style="grid-column:1/-1">فعلاً آگهی مرتبطی با رزومه‌ی شما نیست؛ هشدار شغلی بسازید تا آگهی‌های جدید به شما خبر داده شود.</div>';
}

/* ============ فایل رزومه ============ */
function renderResumeFile() {
  const f = ME().resumeFile, box = document.getElementById("resume-file");
  if (!box) return;
  box.innerHTML = f
    ? `<div class="order-item" style="margin-bottom:12px"><span class="oi-code">📄</span><div class="oi-body"><b>${esc(f.name)}</b><small>همراه درخواست‌ها برای کارفرما ارسال می‌شود</small></div>
       <a class="btn btn-sm btn-outline" href="${f.url}" target="_blank">مشاهده</a><button class="btn btn-sm btn-ghost" onclick="deleteResumeFile(this)">حذف</button></div>` : "";
}
async function uploadResume(inp) {
  const file = inp.files[0]; if (!file) return;
  if (file.size > 5 * 1024 * 1024) { toast("حجم فایل باید کمتر از ۵ مگابایت باشد"); inp.value = ""; return; }
  const btn = inp.nextElementSibling;
  await busy(btn, () => API.upload("me/resume-file", file)).finally(() => inp.value = "");
  toast("فایل رزومه بارگذاری شد ✓");
  renderResumeFile(); renderAll();
}
async function deleteResumeFile(btn) {
  if (!confirm("فایل رزومه حذف شود؟")) return;
  await busy(btn, () => API.del("me/resume-file"));
  renderResumeFile(); renderAll();
}

/* ============ آماده به کار ============ */
function renderOTW() {
  const on = !!ME().otw;
  const b = document.getElementById("otw");
  b.classList.toggle("off", !on);
  b.innerHTML = `<span class="dot"></span> ${on ? "آماده به کار" : "غیرفعال — برای دیده‌شدن روشن کنید"}`;
  b.setAttribute("aria-pressed", String(on));
}
async function toggleOTW() {
  const on = !ME().otw;
  await busy(document.getElementById("otw"), () => API.post("me/otw", { on }));
  toast(on ? "وضعیت آماده‌به‌کار فعال شد ✓ کارفرمایان رزومه شما را در بانک رزومه می‌بینند" : "وضعیت آماده‌به‌کار غیرفعال شد");
  renderOTW(); initOnboard();
}

/* ============ چک‌لیست بعد از ثبت‌نام ============ */
function initOnboard() {
  const me = ME();
  const steps = [
    { t: "رزومه‌ی آیتمی‌ات را بساز", d: "سوابق با تاریخ، مهارت‌ها با سطح و مدارک — رزومه‌ی بالای ۷۰٪ در تطبیق هوشمند و جستجوی کارفرما بالاتر دیده می‌شود.",
      done: hasCv() && me.strength >= 70, act: "رفتن به رزومه", go: "showSec('resume')" },
    { t: "«آماده به کار» را روشن کن", d: "تا در بانک رزومه کارفرمایان دیده شوی و در آگهی‌های فوری اولویت بگیری.",
      done: !!me.otw, act: "فعال کردن", go: "toggleOTW()" },
    { t: "هشدار شغلی بساز", d: "تا آگهی‌های جدید مطابق معیارت خودکار به تو خبر داده شود.",
      done: MyAlerts.all().length > 0, act: "ساخت هشدار", go: "showSec('alerts')" },
    { t: "آزمون مهارت بده", d: "نشان تأییدشده روی رزومه، شانس دعوت به مصاحبه را چند برابر می‌کند.",
      done: MyCerts.all().some(c => c.type === "exam"), act: "مشاهده آزمون‌ها", go: `location.href='${P.exams}'` }
  ];
  const done = steps.filter(s => s.done).length;
  const pct = Math.round(done / steps.length * 100);
  document.getElementById("ob-progress").textContent = `${fa(done)} از ${fa(steps.length)} قدم انجام شده`;
  document.getElementById("ob-pct").textContent = fa(pct) + "٪";
  document.getElementById("ob-steps").innerHTML = steps.map((s, i) => `
    <div class="ob-step ${s.done ? "done" : ""}">
      <span class="ob-num">${s.done ? "✓" : fa(i + 1)}</span>
      <div class="ob-body"><b>${s.t}</b><p>${s.d}</p></div>
      ${s.done ? '<span class="ob-tag">انجام شد</span>' : `<button class="btn btn-sm btn-primary" onclick="${s.go}">${s.act}</button>`}
    </div>`).join("");
  document.getElementById("onboard").classList.toggle("all-done", done === steps.length);
}

/* ============ هشدارهای شغلی ============ */
function initAlerts() {
  document.getElementById("na-dept").insertAdjacentHTML("beforeend", AIO_DEPARTMENTS.map(d => `<option value="${d.id}">${d.name}</option>`).join(""));
  document.getElementById("na-type").insertAdjacentHTML("beforeend", AIO_JOB_TYPES.map(t => `<option>${t}</option>`).join(""));
  document.getElementById("na-band").insertAdjacentHTML("beforeend", AIO_SALARY_BANDS.map(b => `<option value="${b.id}">${b.name}</option>`).join(""));
  bindProvinceCity("na-prov", "na-city");
  /* کانال‌های فعال: ایمیل و اعلان سایت؛ پیامک و تلگرام بعداً */
  document.querySelectorAll(".channels input").forEach(c => {
    if (c.value === "پیامک" || c.value === "تلگرام") { c.checked = false; c.disabled = true; c.parentElement.title = "به‌زودی"; c.parentElement.style.opacity = ".5"; c.parentElement.insertAdjacentHTML("beforeend", " <small>(به‌زودی)</small>"); }
  });
}
async function createAlert() {
  const d = document.getElementById("na-dept").value, pr = document.getElementById("na-prov").value, city = document.getElementById("na-city").value;
  const q = document.getElementById("na-q").value.trim(), type = document.getElementById("na-type").value, band = document.getElementById("na-band").value;
  const channels = [...document.querySelectorAll(".channels input:checked")].map(c => c.value);
  if (!channels.length) { toast("حداقل یک کانال اطلاع‌رسانی انتخاب کنید"); return; }
  const title = [q, d ? dept(d).name : "", city || (pr ? provinceById(pr).name : "سراسر کشور"), type].filter(Boolean).join(" · ");
  const btn = document.querySelector('[onclick="createAlert()"]');
  await busy(btn, () => MyAlerts.add({ title, filters: { q, dept: d, provinceId: pr, city: city === AIO_REMOTE ? "" : city, type, band }, channels, freq: document.getElementById("na-freq").value }));
  document.getElementById("na-q").value = "";
  renderAlerts(); initOnboard();
  toast("هشدار شغلی ساخته شد ✓");
}
function alertToFilters(f) {
  f = f || {};
  return { q: f.q, dept: f.dept, provinceId: f.provinceId, city: f.city, types: f.type ? [f.type] : (f.types || []), salaryBands: f.band ? [f.band] : (f.salaryBands || []) };
}
function alertUrl(f) {
  const p = new URLSearchParams();
  ["q", "dept", "city", "type", "band"].forEach(k => { if (f && f[k]) p.set(k, f[k]); });
  if (f && f.provinceId) p.set("prov", f.provinceId);
  return P.jobs + (p.toString() ? "?" + p : "");
}
function renderAlerts() {
  const list = MyAlerts.all();
  document.getElementById("alerts-list").innerHTML = list.length ? list.map((a, i) => `
    <div class="alert-item">
      <span class="ai-ic">🔔</span>
      <div class="ai-body"><b>${esc(a.title)}</b>
        <div class="ai-meta"><span>کانال: ${(a.channels || []).join("، ")}</span><span>${esc(a.freq || "")}</span>
          <span class="ai-match">${fa(filterJobs(alertToFilters(a.filters)).length)} آگهی فعال مطابق</span><span>ساخته‌شده: ${a.created || ""}</span></div></div>
      <a class="btn btn-sm btn-outline" href="${alertUrl(a.filters)}">مشاهده نتایج</a>
      <button class="btn btn-sm btn-ghost danger" onclick="removeAlert(${i}, this)">حذف</button>
    </div>`).join("") : `<div class="empty-inline">هنوز هشداری نساخته‌اید. با ساخت هشدار، دیگر لازم نیست هر روز سایت را چک کنید.</div>`;
}
async function removeAlert(i, btn) {
  if (!confirm("این هشدار حذف شود؟")) return;
  await busy(btn, () => MyAlerts.remove(i));
  renderAlerts(); initOnboard(); toast("هشدار حذف شد");
}

/* ============ گواهی، MBTI، خودارزیابی ============ */
function initCerts() {
  const certs = MyCerts.all();
  document.getElementById("my-certs-dash").innerHTML = certs.length
    ? `<div class="cert-grid">${certs.map(c => `
        <div class="cert-card">
          <div class="cc-badge">${c.badge || "🎖️"}</div>
          <b>${esc(c.title)}</b>
          <span class="cc-score">نمره: ${fa(c.score)}٪</span>
          <span class="cc-code">کد: <a href="${c.verify}" target="_blank" dir="ltr">${c.code}</a></span>
          <span class="cc-date">تاریخ صدور: ${c.date}</span>
          ${c.expires ? `<span class="cc-date" ${c.expired ? 'style="color:#be123c"' : ""}>${c.expired ? "منقضی شده در" : "معتبر تا"}: ${esc(c.expires)}</span>` : ""}
        </div>`).join("")}</div>`
    : `<div class="empty-inline">هنوز گواهی مهارتی ندارید. آزمون‌های آیولب توسط کارفرمایان طراحی می‌شوند و گواهی آن‌ها مستقیم روی رزومه شما می‌نشیند.</div>`;
  const m = MyMBTI.get(), T = m && AIO_MBTI_TYPES[m.type];
  document.getElementById("mbti-dash").innerHTML = T
    ? `<div class="mbti-mini"><div class="mm-type">${m.type}</div>
         <div><b>${T.name}</b><p>${T.short}</p><div class="fit-chips">${T.fit.map(f => `<span>${f}</span>`).join("")}</div>
         <label class="check-item" style="margin-top:8px"><input type="checkbox" ${ME().mbtiPublic ? "checked" : ""} onchange="setMbtiPublic(this)"> نمایش تیپ شخصیتی به کارفرمایان</label></div>
         <a class="btn btn-sm btn-outline" href="${P.mbti}">آزمون مجدد</a></div>`
    : `<div class="empty-inline">تست MBTI را نداده‌اید. <a href="${P.mbti}">همین حالا شرکت کنید</a> — ۵ دقیقه.</div>`;
  const a = MyAssess.get();
  document.getElementById("assess-dash").innerHTML = a && a.groups
    ? `<div class="assess-mini"><div class="am-score"><b>${fa(a.overall)}٪</b><span>امتیاز کلی</span></div>
         <div class="skill-bars">${a.groups.map(g => `<div class="sb-row"><span class="sb-name">${esc(g.name)}</span>
             <div class="sb-track"><i style="width:${g.pct}%;background:${g.color}"></i></div><b class="sb-val">${fa(g.pct)}٪</b></div>`).join("")}</div>
         <a class="btn btn-sm btn-outline" href="${P.assessment}">ارزیابی مجدد</a></div>`
    : `<div class="empty-inline">هنوز خودارزیابی نکرده‌اید. <a href="${P.assessment}">شروع خودارزیابی</a> — نتیجه به نقشه مهارت و شکاف تا شغل هدف تبدیل می‌شود.</div>`;
}
async function setMbtiPublic(cb) {
  await API.post("me/mbti-public", { on: cb.checked }).catch(e => { toast(e.message); cb.checked = !cb.checked; });
  toast(cb.checked ? "تیپ شخصیتی شما برای کارفرمایان نمایش داده می‌شود" : "تیپ شخصیتی شما مخفی شد");
}

/* ============ دوره‌های من ============ */
function renderMyCourses() {
  const box = document.getElementById("my-courses");
  if (!box) return;
  const list = MyCourses.all().map(e => course(e.id)).filter(Boolean);
  box.innerHTML = list.length ? list.map(c => {
    const pr = courseProgress(c), cat = courseCat(c.cat), e = MyCourses.get(c.id);
    return `<div class="my-course">
      <div class="mc-ic" style="background:${cat.bg};color:${cat.color}">${ICONS[cat.icon] || ICONS.grad}</div>
      <div><b>${esc(c.title)}</b>
        <small>${esc(provider(c.providerId).name || "")} · ${fa(pr.done)} از ${fa(pr.total)} درس · ${pr.pct === 100 ? "تکمیل شده 🎓" : "در حال یادگیری"}</small>
        <div class="cc-progress"><i style="width:${pr.pct}%"></i></div></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <a class="btn btn-sm btn-primary" href="/learn/${c.id}/">${pr.pct === 100 ? "مرور" : pr.pct ? "ادامه" : "شروع"}</a>
        ${c.price ? "" : `<button class="btn btn-sm btn-ghost" onclick="dropCourse(${c.id}, this)">حذف</button>`}
      </div></div>`;
  }).join("")
  : `<div class="empty-inline">هنوز در دوره‌ای ثبت‌نام نکرده‌اید. <a href="${P.courses}">آکادمی آیولب</a> را ببینید.</div>`;

  const created = MyCreated.all(), st = { draft: "پیش‌نویس", pending: "در انتظار بازبینی", published: "منتشرشده" };
  document.getElementById("my-created").innerHTML = created.length ? created.map(c => `
    <div class="created-row"><div><b>${esc(c.title || "بدون عنوان")} <span class="status-pill ${c.status}">${st[c.status]}</span></b><small>${esc(courseCat(c.cat).name || "بدون دسته")} · ${fa((c.syllabus || []).length)} ماژول</small></div>
      <div class="cr-act"><a class="btn btn-sm btn-outline" href="${c.url}${c.status === "published" ? "" : "?preview=1"}">${c.status === "published" ? "مشاهده" : "پیش‌نمایش"}</a>${c.status === "published" ? "" : `<a class="btn btn-sm btn-primary" href="${P["course-builder"]}?id=${c.id}">ویرایش</a>`}</div></div>`).join("")
    : `<div class="empty-inline">هنوز دوره‌ای نساخته‌اید.</div>`;

  const wl = MyWishlist.all().map(course).filter(Boolean);
  document.getElementById("my-wishlist").innerHTML = wl.length ? wl.map(c => courseCardHTML(c, { compact: true })).join("")
    : `<div class="empty-inline" style="grid-column:1/-1">دوره‌ای را نشان نکرده‌اید.</div>`;

  /* پیشنهاد: حوزه‌های ضعیف خودارزیابی → دسته دوره؛ در غیر این صورت بخش تخصصی رزومه */
  const a = MyAssess.get(), r = ME().resume || {};
  const catOf = id => ((AIO_SELF_ASSESS.find(g => g.id === id) || {}).course_cat) || "";
  let cats = a && a.groups ? [...a.groups].sort((x, y) => x.pct - y.pct).slice(0, 2).map(g => catOf(g.id)).filter(Boolean) : [];
  if (!cats.length) cats = [r.dept || "qc", "qc"];
  const enrolled = new Set(MyCourses.all().map(e => e.id));
  let rec = sortCourses(AIO_COURSES.filter(c => cats.includes(c.cat) && !enrolled.has(c.id)), "rating").slice(0, 3);
  if (rec.length < 3) rec = rec.concat(sortCourses(AIO_COURSES.filter(c => !enrolled.has(c.id) && !rec.includes(c)), "popular").slice(0, 3 - rec.length));
  document.getElementById("rec-courses").innerHTML = rec.map(c => courseCardHTML(c, { compact: true })).join("");
}
async function dropCourse(id, btn) {
  if (!confirm("این دوره از فهرست شما حذف شود؟ پیشرفت ثبت‌شده هم پاک می‌شود.")) return;
  await busy(btn, () => MyCourses.remove(id));
  renderMyCourses(); toast("دوره از فهرست شما حذف شد");
}

/* ============ مسیر ارتقاء شغلی (از روی رزومه، دوره‌ها و گواهی‌ها) ============ */
function renderCareer() {
  const me = ME(), r = me.resume || {};
  const certs = MyCerts.all();
  const pathScore = p => coursesOfPath(p).filter(c => c.cat === r.dept).length * 2 + (p.relatedExamId && (AIO_EXAMS.find(e => e.id === p.relatedExamId) || {}).dept === r.dept ? 1 : 0);
  let path = me.realRole === "volunteer" ? learningPath("starter") : null;
  if (!path) path = [...AIO_LEARNING_PATHS].sort((a, b) => pathScore(b) - pathScore(a))[0];
  const box = document.getElementById("career-box");
  if (!path) { box.innerHTML = `<p>با تکمیل رزومه، مسیر ارتقاء پیشنهادی شما این‌جا ساخته می‌شود.</p>`; return; }
  const row = (bg, ic, t, d, act) => `<div style="display:flex;gap:12px;align-items:center;background:${bg};border-radius:10px;padding:14px 16px">
      <span style="font-size:20px">${ic}</span><div style="flex:1"><b style="font-size:14px">${t}</b><div style="font-size:12.5px;color:var(--navy-500)">${d}</div></div>${act || ""}</div>`;
  const rows = [];
  rows.push(me.strength >= 70 ? row("var(--teal-50)", "✅", "رزومه تخصصی — کامل", `قدرت پروفایل ${fa(me.strength)}٪`)
    : row("var(--amber-100)", "📝", "تکمیل رزومه تخصصی", `قدرت فعلی ${fa(me.strength)}٪ — حداقل ۷۰٪ لازم است`, `<button class="btn btn-sm btn-outline" onclick="showSec('resume')">تکمیل رزومه</button>`));
  coursesOfPath(path).forEach(c => {
    const pr = courseProgress(c);
    if (pr.pct === 100) rows.push(row("var(--teal-50)", "✅", `دوره «${esc(c.title)}» — گذرانده‌اید`, `${fa(c.hours)} ساعت · گواهی روی رزومه`));
    else if (pr.enrolled) rows.push(row("var(--sky-100)", "📘", `دوره «${esc(c.title)}» — در حال یادگیری`, `${fa(pr.pct)}٪ تکمیل`, `<a href="/learn/${c.id}/" class="btn btn-sm btn-outline">ادامه</a>`));
    else rows.push(row("var(--amber-100)", "📘", `دوره «${esc(c.title)}» — پیشنهادی`, `${fa(c.hours)} ساعت${c.cert ? " · دارای گواهی" : ""} · ${c.price ? fa(c.price) + " تومان" : "رایگان"}`, `<a href="${c.url}" class="btn btn-sm btn-outline">مشاهده دوره</a>`));
  });
  if (path.relatedExamId) {
    const ex = AIO_EXAMS.find(e => e.id === path.relatedExamId);
    if (ex) rows.push(certs.some(c => c.type === "exam" && c.refId === ex.id)
      ? row("var(--teal-50)", "🏅", `آزمون «${esc(ex.title)}» — قبول شده‌اید`, "نشان مهارت روی رزومه")
      : row("var(--violet-100)", "🏅", `آزمون «${esc(ex.title)}» — پیشنهادی`, "دریافت نشان تخصصی برای پروفایل", `<a href="${ex.url}" class="btn btn-sm btn-outline">شرکت در آزمون</a>`));
  }
  const done = rows.filter(x => x.includes("✅") || x.includes("قبول شده")).length;
  box.innerHTML = `<h2>شغل هدف: ${esc(path.role)} 🎯</h2>
    <p>بر اساس رزومه‌ی شما، مسیر «<a href="${path.url}">${esc(path.title)}</a>» پیشنهاد می‌شود — ${fa(done)} از ${fa(rows.length)} گام انجام شده:</p>
    <div style="margin-top:18px;display:flex;flex-direction:column;gap:12px">${rows.join("")}</div>
    <a class="btn btn-outline" style="margin-top:16px" href="${P.courses}#paths">همه‌ی مسیرهای یادگیری</a>`;
}

/* ============ خدمات، اشتراک، سفارش‌ها ============ */
function initSeekerServices() {
  const groups = groupsFor("seeker");
  document.getElementById("seeker-services").innerHTML = groups.map(g => {
    const list = servicesOf(g.id);
    if (!list.length) return "";
    return `<div class="svc-group" id="sg-${g.id}"><div class="svc-group-head">
        <span class="gh-ic" style="background:${g.bg};color:${g.color}">${ICONS[g.icon] || ICONS.flask}</span>
        <div><h2>${g.name}</h2><p>${g.desc}</p></div></div>
        <div class="svc-grid">${list.map(x => serviceCardHTML(x)).join("")}</div></div>`;
  }).join("");
  const me = ME();
  document.getElementById("seeker-plans").innerHTML = (me.planUntil ? `<div class="notice-box ok" style="grid-column:1/-1">اشتراک شما تا ${me.planUntil} فعال است.</div>` : "") +
    AIO_SERVICES.filter(x => x.plan && x.payer === "seeker").map(x => `
      <div class="price-card ${x.highlight ? "featured" : ""}">
        ${x.highlight ? '<span class="plan-badge">پیشنهاد آیولب</span>' : ""}
        <h3>${x.title.replace("اشتراک سالانه ", "")}</h3>
        <div class="price">${x.price ? fa(x.price) : "رایگان"}</div><div class="per">تومان / سالانه</div>
        <ul>${x.features.map(f => `<li>${f}</li>`).join("")}</ul>
        <button class="btn ${x.highlight ? "btn-primary" : "btn-outline"} btn-block" onclick="orderService('${x.code}', this)">انتخاب این اشتراک</button>
      </div>`).join("");
}
function renderSeekerOrders() {
  const box = document.getElementById("seeker-orders");
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
    : `<p class="muted">هنوز سفارشی ثبت نکرده‌اید. از بخش <a href="#services" onclick="showSec('services')">خدمات ویژه من</a> شروع کنید.</p>`;
}
async function cancelOrder(i, btn) {
  if (!confirm("این سفارش لغو شود؟")) return;
  await busy(btn, () => MyOrders.remove(i));
  renderSeekerOrders(); toast("سفارش لغو شد");
}

/* ============ اعلان‌ها ============ */
function renderNotices() {
  const list = ME().notices || [];
  document.getElementById("notifs").innerHTML = list.length ? list.map(n => `
    <div style="display:flex;gap:14px;align-items:flex-start;padding:14px 22px;border-bottom:1px solid var(--navy-100);${n.unread ? "background:var(--teal-50)" : ""}">
      <span style="font-size:20px">${n.icon || "🔔"}</span>
      <div style="flex:1"><div style="font-size:14px;color:var(--navy-800)">${n.link ? `<a href="${n.link}">${esc(n.text)}</a>` : esc(n.text)}</div>
      <div style="font-size:12px;color:var(--navy-400);margin-top:3px">${esc(n.from)} · ${n.time}</div></div>
    </div>`).join("") : `<div class="empty-state"><b>اعلانی ندارید</b>وضعیت درخواست‌ها، هشدارهای شغلی و پیام‌ها این‌جا نمایش داده می‌شود.</div>`;
}

function showSec(sec) {
  document.querySelectorAll(".dash-main > section").forEach(s => s.classList.remove("active"));
  const el = document.getElementById("sec-" + sec);
  if (el) el.classList.add("active");
  document.querySelectorAll("#dash-nav a").forEach(a => a.classList.toggle("active", a.dataset.sec === sec));
  window.scrollTo({ top: 0 });
  if (sec === "notifications" && (ME().notices || []).some(n => n.unread)) API.post("me/notices/read").catch(() => {});
}
