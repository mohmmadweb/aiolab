/* ==========================================
   آیولب — افزوده‌های پرسونای «آموزش»
   نوبت‌های برگزاری (زمان و محل)، جدول دوره‌ها، ثبت‌نام در یک نوبت، پروفایل مدرس/آموزشگاه
   بعد از app.js بارگذاری شود. داده: AIO_COURSES[].sessions (data.js) و پیش‌نویس‌ها (MyCreated)
   ========================================== */

/* «۱۴۰۵/۰۹/۱۵» → 14050915 برای مرتب‌سازی */
function jDateNum(s) { return Number(String(s || "").replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/\D/g, "")) || 99999999; }

/* نوبت‌های یک دوره (دوره‌ی منتشرشده یا پیش‌نویس) */
function courseSessions(c) { return (c && Array.isArray(c.sessions)) ? c.sessions.filter(s => s && (s.city || s.venue || s.start)) : []; }

/* نزدیک‌ترین نوبت‌ها در همه‌ی دوره‌ها → [{ course, session, index }] */
function upcomingSessions(limit, list) {
  const rows = [];
  (list || AIO_COURSES).forEach(c => courseSessions(c).forEach((s, i) => rows.push({ course: c, session: s, index: i })));
  rows.sort((a, b) => jDateNum(a.session.start) - jDateNum(b.session.start));
  return limit ? rows.slice(0, limit) : rows;
}

const sessionEsc = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
function sessionPlace(s) { return s.online ? "آنلاین" : [s.city, s.venue].filter(Boolean).join(" · "); }
function sessionPrice(c, s) { return (s && s.price != null && s.price !== "") ? (Number(s.price) ? fa(s.price) + " تومان" : "رایگان") : coursePrice(c); }
function courseTeachers(c) {
  const names = (c.instructorIds || []).map(i => instructor(i).name).filter(Boolean);
  return { names: names.join("، "), provider: provider(c.providerId).name || "" };
}

/* یک ردیف جدول برای یک نوبت؛ session = null یعنی دوره‌ی خودآموز (آنلاین — هر زمان) */
function sessionRowHTML(c, s, opts) {
  opts = opts || {};
  /* پیش‌نویس‌ها شناسه‌ی رشته‌ای دارند و با ?draft= باز می‌شوند */
  const t = courseTeachers(c), href = opts.href || ((typeof c.id === "string" ? "course.html?draft=" : "course.html?id=") + c.id + (s ? "#sessions" : ""));
  const fmt = courseFormat(c.format).short || "";
  const selfPaced = c.format === "self";
  const place = s ? sessionPlace(s) : (selfPaced ? "آنلاین — هر زمان" : "به‌زودی اعلام می‌شود");
  const when = s ? ([s.days, s.time].filter(Boolean).join(" · ") || "—") : (selfPaced ? "با سرعت خودتان" : "—");
  const start = s ? (s.start || "—") : (selfPaced ? "همین حالا" : "—");
  const seats = s && s.seats ? `<small class="sx-muted">ظرفیت ${fa(s.seats)} نفر</small>` : "";
  return `<tr>
    <td data-l="دوره"><a class="sx-title" href="${href}">${sessionEsc(c.title)}</a><small class="sx-muted">${sessionEsc(courseCat(c.cat).name || "")}</small></td>
    <td data-l="مدرس / ارائه‌دهنده">${sessionEsc(t.names || "—")}<small class="sx-muted">${sessionEsc(t.provider)}</small></td>
    <td data-l="نوع برگزاری"><span class="chip ${s && !s.online ? "teal" : ""}">${sessionEsc(fmt)}</span></td>
    <td data-l="محل">${sessionEsc(place)}${s && s.address ? `<small class="sx-muted">${sessionEsc(s.address)}</small>` : ""}</td>
    <td data-l="روز و ساعت">${sessionEsc(when)}</td>
    <td data-l="تاریخ شروع">${sessionEsc(start)}${seats}</td>
    <td data-l="مبلغ"><b>${sessionPrice(c, s)}</b></td>
    <td class="sx-act">${opts.action || `<a class="btn btn-sm btn-primary" href="${href}">${s ? "ثبت‌نام" : "مشاهده"}</a>`}</td>
  </tr>`;
}

/* جدول کامل: rows = [{ course, session|null, index }] */
function sessionsTableHTML(rows, opts) {
  opts = opts || {};
  if (!rows.length) return `<div class="empty-inline">${opts.empty || "نوبتی برای نمایش وجود ندارد."}</div>`;
  return `<div class="table-wrap sx-table"><table class="data">
    <thead><tr><th>عنوان دوره</th><th>مدرس / ارائه‌دهنده</th><th>نوع برگزاری</th><th>محل (شهر · مکان)</th><th>روز و ساعت</th><th>تاریخ شروع</th><th>مبلغ</th><th></th></tr></thead>
    <tbody>${rows.map(r => sessionRowHTML(r.course, r.session, Object.assign({}, opts, r.action ? { action: r.action } : {}))).join("")}</tbody>
  </table></div>`;
}

/* ثبت‌نام در یک نوبت مشخص (حضوری/زنده) — دمو: رزرو در حافظه‌ی مرورگر + ثبت‌نام در دوره */
const MySessions = {
  all: () => Store.get("session_bookings", []),
  has: (cid, i) => MySessions.all().some(b => b.courseId === Number(cid) && b.index === Number(i)),
  add: b => Store.push("session_bookings", b)
};
function enrollSession(cid, i) {
  const c = course(cid); if (!c) return;
  const s = courseSessions(c)[i]; if (!s) return;
  if (!Auth.user) {
    toast("برای ثبت‌نام ابتدا وارد شوید");
    Store.set("after_login", "course.html?id=" + c.id + "#sessions");
    setTimeout(() => location.href = "login.html", 1100); return;
  }
  if (!MySessions.has(c.id, i)) MySessions.add({ courseId: c.id, index: Number(i), title: c.title, place: sessionPlace(s), start: s.start, days: s.days, time: s.time, date: "امروز" });
  enrollCourse(c.id, false);
  toast(`جای شما در نوبت ${s.start || ""} (${sessionPlace(s)}) رزرو شد ✓`);
}

/* پروفایل مدرس / آموزشگاه — دمو: حافظه‌ی مرورگر */
const TeacherProfile = {
  get: () => Store.get("teacher_profile", null),
  set: p => Store.set("teacher_profile", p)
};
