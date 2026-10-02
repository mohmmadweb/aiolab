let C;
const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5L20 7"/></svg>';

document.addEventListener("DOMContentLoaded", () => {
  C = course(qs("id"));
  const draft = C ? null : MyCreated.get(qs("id"));
  if (draft) C = draftAsCourse(JSON.parse(JSON.stringify(draft)));
  if (!C) { document.querySelector(".crs-hero .container").innerHTML = `<h1>این دوره در دسترس نیست</h1><a class="btn btn-primary" href="${P.courses}">آکادمی آیولب</a>`; return; }
  if (draft) {
    C.draftStatus = draft.status;
    C.subtitle = C.subtitle || "—";
    document.querySelector(".crs-hero .container").insertAdjacentHTML("afterbegin",
      `<div class="draft-banner">👁 <b>پیش‌نمایش دوره منتشرنشده</b> — وضعیت: ${{ draft: "پیش‌نویس", pending: "در انتظار بازبینی", published: "منتشرشده" }[draft.status]} ·
       ${draft.status === "published" ? "" : `<a href="${P["course-builder"]}?id=${draft.id}">بازگشت به ویرایش</a>`}</div>`);
  }
  const cat = courseCat(C.cat), pv = provider(C.providerId);

  document.getElementById("bc-cat").textContent = cat.name;
  document.getElementById("bc-cat").href = P.courses + "?cat=" + C.cat;
  document.getElementById("bc-title").textContent = C.title;
  document.getElementById("c-prov").innerHTML = providerBadgeHTML(pv) + (C.type === "guided" ? ' <span class="chip sky">پروژه راهنما</span>' : "");
  document.getElementById("c-title").textContent = C.title;
  document.getElementById("c-sub").textContent = C.subtitle;
  document.getElementById("c-by").innerHTML = "مدرس: " + C.instructorIds.map(id => {
    const i = instructor(id);
    return `<span class="av" style="background:${i.color}">${i.name.replace("دکتر ", "").replace("مهندس ", "").charAt(0)}</span><b>${i.name}</b>`;
  }).join("<span>،</span>");

  const lessons = courseLessons(C);
  document.getElementById("c-stats").innerHTML = `
    <div><b>${fa(C.syllabus.length)} ماژول</b><span>${fa(lessons.length)} درس · ${fa(courseCount(C, "quiz"))} آزمون</span></div>
    <div><b>★ ${fa(C.rating)}</b><span>${fa(C.ratingCount)} نظر</span></div>
    <div><b>سطح ${C.level}</b><span>${C.prereq.length ? "با پیش‌نیاز" : "بدون پیش‌نیاز"}</span></div>
    <div><b>${fa(C.hours)} ساعت</b><span>حدود ${fa(C.weeks)} هفته با ${fa(Math.max(1, Math.round(C.hours / C.weeks)))} ساعت در هفته</span></div>
    <div><b>${courseFormat(C.format).name}</b><span>${courseFormat(C.format).desc}</span></div>`;

  document.getElementById("c-outcomes").innerHTML = C.outcomes.map(o => `<li>${esc(o)}</li>`).join("");
  if (C.about && C.about.replace(/<[^>]+>/g, "").trim()) {
    const host = document.getElementById("c-outcomes").closest(".panel, section, div");
    if (host) host.insertAdjacentHTML("beforebegin", `<div class="panel entry-content" id="c-about"><h2>درباره‌ی این دوره</h2>${C.about}</div>`);
  }
  document.getElementById("c-skills").innerHTML = C.skills.map(s => `<span>${s}</span>`).join("");
  document.getElementById("c-details").innerHTML = [
    ["shield", C.cert ? C.certType : "بدون گواهی", C.cert ? "قابل افزودن به رزومه و استعلام کارفرما" : "دوره‌ی آزاد"],
    ["doc", fa(courseCount(C, "quiz")) + " آزمون + " + fa(courseCount(C, "lab") + courseCount(C, "project")) + " تمرین/پروژه", "ارزیابی در طول دوره"],
    ["comment", C.lang, "زبان تدریس"],
    ["clock", C.nextStart ? "شروع: " + C.nextStart : "دسترسی دائمی", C.nextStart ? (C.seats ? "ظرفیت " + fa(C.seats) + " نفر" : "ثبت‌نام باز") : "هر زمان شروع کنید"],
    ["users", fa(C.students) + " فراگیر", "تا کنون ثبت‌نام کرده‌اند"],
    ["chart", "به‌روزرسانی " + C.updated, "محتوا مطابق آخرین استانداردها"]
  ].map(([ic, b, s]) => `<div><span class="dg-ic">${ICONS[ic]}</span><div><b>${b}</b><span>${s}</span></div></div>`).join("");
  document.getElementById("c-audience").innerHTML = C.audience.map(a => `<li>${a}</li>`).join("") || "<li>همه علاقه‌مندان</li>";
  document.getElementById("c-prereq").innerHTML = C.prereq.map(a => `<li>${a}</li>`).join("") || "<li>این دوره پیش‌نیاز ندارد.</li>";

  renderSyllabus();

  document.getElementById("c-instructors").innerHTML = C.instructorIds.map(id => {
    const i = instructor(id);
    return `<div class="instr-row">
      <div class="avatar" style="background:${i.color}">${i.photo ? `<img src="${i.photo}" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover">` : (i.name || "؟").replace("دکتر ", "").replace("مهندس ", "").charAt(0)}</div>
      <div><b>${i.name}</b><span>${i.title} · ${i.org}</span><p>${i.bio}</p>
        <div class="im"><span>★ ${fa(i.rating)} امتیاز مدرس</span><span>${fa(i.students)} فراگیر</span><span>${fa(i.courses)} دوره</span></div></div>
    </div>`;
  }).join("");
  document.getElementById("c-provider").innerHTML = `
    <div class="prov-box">
      <span class="pl" style="background:${pv.color}">${pv.name.replace("آزمایشگاه ", "").replace("دانشگاه ", "").charAt(0)}</span>
      <div><b>${pv.name} <span class="chip sm">${pv.kind}</span></b><p>${pv.about}</p>
        ${pv.labId ? `<a href="/lab/${pv.labId}/" class="btn btn-sm btn-outline" style="margin-top:8px">پروفایل مرکز</a>` : ""}</div>
    </div>`;

  renderReviews();

  document.getElementById("c-faq").innerHTML = (C.faq && C.faq.length ? C.faq : [
    { q: "بعد از ثبت‌نام چطور به دوره دسترسی دارم؟", a: "از داشبورد → «دوره‌های من» یا همین صفحه، دکمه «ادامه یادگیری» شما را به محیط یادگیری می‌برد و پیشرفت‌تان ذخیره می‌شود." },
    { q: "گواهی چه زمانی صادر می‌شود؟", a: C.cert ? "به‌محض تکمیل ۱۰۰٪ درس‌ها و آزمون‌ها، گواهی با کد رهگیری صادر و به رزومه شما اضافه می‌شود." : "این دوره گواهی ندارد و برای یادگیری آزاد طراحی شده است." }
  ]).map((f, i) => `<details class="faq-item" ${i === 0 ? "open" : ""}><summary>${f.q}</summary><div class="fa-body">${f.a}</div></details>`).join("");

  const related = AIO_COURSES.filter(x => x.id !== C.id && (x.cat === C.cat || x.providerId === C.providerId)).slice(0, 3);
  document.getElementById("c-related").innerHTML = related.map(x => courseCardHTML(x, { compact: true })).join("");

  renderEnroll();

  document.querySelectorAll(".crs-tabs a").forEach(a => a.onclick = e => {
    e.preventDefault(); document.querySelectorAll(".crs-tabs a").forEach(x => x.classList.remove("on")); a.classList.add("on");
    document.querySelector(a.getAttribute("href")).scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

function renderSyllabus() {
  const pr = courseProgress(C), e = MyCourses.get(C.id);
  const lessons = courseLessons(C);
  document.getElementById("c-syl-title").textContent = `این دوره ${fa(C.syllabus.length)} ماژول دارد`;
  document.getElementById("c-syl-sub").textContent = `${fa(lessons.length)} درس · ${fa(C.hours)} ساعت · ${fa(courseCount(C, "video"))} ویدئو، ${fa(courseCount(C, "reading"))} مطالعه، ${fa(courseCount(C, "lab") + courseCount(C, "project"))} تمرین و پروژه، ${fa(courseCount(C, "quiz"))} آزمون`;
  document.getElementById("c-syllabus").innerHTML = C.syllabus.map((m, mi) => `
    <details class="mod" ${mi === 0 ? "open" : ""}>
      <summary>
        <span class="mn">${fa(mi + 1)}</span>
        <span class="mt"><b>${m.title}</b><small>${fa(m.lessons.length)} درس · ${fa(m.hours)} ساعت</small></span>
        <span class="caret">▾</span>
      </summary>
      ${m.lessons.map((l, li) => {
        const key = mi + ":" + li, done = e && e.done.includes(key), lt = AIO_LESSON_TYPES[l.type];
        return `<div class="lesson ${done ? "done" : ""}">
          <span class="li">${done ? "✓" : lt.icon}</span>
          <span class="lt">${l.t}</span>
          <span class="ld">${lt.name} · ${fa(l.min)} دقیقه</span>
        </div>`;
      }).join("")}
    </details>`).join("");
}
function toggleAllMods() {
  const mods = [...document.querySelectorAll("#c-syllabus .mod")];
  const anyClosed = mods.some(m => !m.open);
  mods.forEach(m => m.open = anyClosed);
}

function renderReviews() {
  const revs = C.reviews || [];
  /* توزیع ستاره‌ها از روی نظرات ثبت‌شده */
  const dist = [5, 4, 3, 2, 1].map(s => ({ s, p: revs.length ? Math.round(revs.filter(r => Math.round(r.stars) === s).length / revs.length * 100) : 0 }));
  document.getElementById("c-rev-summary").innerHTML = `
    <div class="big"><b>${fa(C.rating)}</b>${starsHTML(C.rating, "lg")}<span>از ${fa(C.ratingCount)} نظر</span></div>
    <div class="rev-bars">${dist.map(d => `<div><span>${fa(d.s)} ستاره</span><i><b style="width:${d.p}%"></b></i><span>${fa(d.p)}٪</span></div>`).join("")}</div>`;
  document.getElementById("c-reviews").innerHTML = revs.length ? revs.map(r => `
    <div class="review">
      <div class="rv-head"><div><b>${esc(r.name)}</b><span>${esc(r.role)} · ${r.date}</span></div>${starsHTML(r.stars)}</div>
      <p>${esc(r.text)}</p>
    </div>`).join("")
    : `<div class="empty-inline">اولین نفری باشید که بعد از گذراندن دوره نظر می‌دهد.</div>`;
  if (MyCourses.isEnrolled(C.id)) document.getElementById("c-reviews").insertAdjacentHTML("beforeend", `
    <div class="panel" style="margin-top:14px"><h3 style="font-size:15px;margin-bottom:10px">نظر شما درباره‌ی این دوره</h3>
      <div class="rate-stars" id="cr-stars">${[1, 2, 3, 4, 5].map(v => `<button type="button" onclick="pickCourseStar(${v})">★</button>`).join("")}</div>
      <div class="form-field"><textarea id="cr-text" rows="3" maxlength="1500" placeholder="تجربه‌ی شما از این دوره…"></textarea></div>
      <button class="btn btn-primary btn-sm" onclick="sendCourseReview(this)">ثبت نظر</button></div>`);
}

function renderEnroll() {
  if (C.draftStatus && C.draftStatus !== "published") {
    document.getElementById("enroll-card").innerHTML = `
      <div class="ec-price"><b class="${!C.price ? "free" : ""}">${coursePrice(C)}</b>${C.oldPrice ? `<s>${fa(C.oldPrice)}</s>` : ""}</div>
      <div class="ec-note">این دوره هنوز منتشر نشده و ثبت‌نام آن پس از بازبینی فعال می‌شود.</div>
      <a class="btn btn-primary btn-block" href="${P["course-builder"]}?id=${C.id}">ویرایش دوره</a>
      <ul class="ec-list"><li>${CHECK} ${fa(C.hours)} ساعت محتوا · ${fa(courseLessons(C).length)} درس</li><li>${CHECK} ${C.cert ? C.certType : "بدون گواهی"}</li></ul>`;
    return;
  }
  const pr = courseProgress(C), wl = MyWishlist.has(C.id);
  const off = C.oldPrice ? Math.round((1 - C.price / C.oldPrice) * 100) : 0;
  const paths = pathsOfCourse(C.id);
  document.getElementById("enroll-card").innerHTML = `
    <div class="ec-price"><b class="${!C.price ? "free" : ""}">${coursePrice(C)}</b>${C.oldPrice ? `<s>${fa(C.oldPrice)}</s><span class="ec-off">${fa(off)}٪ تخفیف</span>` : ""}</div>
    <div class="ec-note">${C.price ? "پس از پرداخت، دسترسی دائمی به دوره برای شما فعال می‌شود" : "بدون هزینه؛ فقط ثبت‌نام کنید و شروع کنید"}</div>
    ${C.seats ? `<div class="ec-seats">⏳ شروع ${C.nextStart} · ظرفیت محدود ${fa(C.seats)} نفر</div>` : ""}
    ${pr.enrolled ? `
      <div class="ec-progress"><div class="bar"><i style="width:${pr.pct}%"></i></div><small>${fa(pr.done)} از ${fa(pr.total)} درس · ${fa(pr.pct)}٪</small></div>
      <a class="btn btn-primary btn-block btn-lg" href="/learn/${C.id}/">${pr.pct === 100 ? "مرور دوره" : pr.pct ? "ادامه یادگیری" : "شروع یادگیری"}</a>`
    : `<button class="btn btn-primary btn-block btn-lg" onclick="enrollCourse(${C.id})">${C.price ? "ثبت‌نام در دوره" : "ثبت‌نام رایگان"}</button>`}
    <button class="btn btn-outline btn-block" onclick="wish()">${wl ? "💚 در علاقه‌مندی‌ها" : "🤍 افزودن به علاقه‌مندی‌ها"}</button>
    <ul class="ec-list">
      <li>${CHECK} ${fa(C.hours)} ساعت محتوا · ${fa(courseLessons(C).length)} درس</li>
      <li>${CHECK} ${fa(courseCount(C, "lab") + courseCount(C, "project"))} تمرین عملی و پروژه</li>
      <li>${CHECK} ${fa(courseCount(C, "quiz"))} آزمون ماژول</li>
      <li>${CHECK} ${C.cert ? C.certType + " با کد رهگیری" : "بدون گواهی"}</li>
      <li>${CHECK} ${C.format === "self" ? "دسترسی دائمی و یادگیری با سرعت خودتان" : courseFormat(C.format).desc}</li>
      <li>${CHECK} دسترسی از موبایل و دسکتاپ</li>
    </ul>
    ${paths.length ? `<div class="ec-path">این دوره بخشی از ${paths.map(p => `<a href="/path/${p.id}/">${p.title}</a>`).join(" و ")} است.</div>` : ""}
    ${C.relatedExamId && AIO_EXAMS.find(e => e.id === C.relatedExamId) ? `<div class="ec-path">🎖️ آزمون مرتبط: <a href="/exam/${C.relatedExamId}/">${esc(AIO_EXAMS.find(e => e.id === C.relatedExamId).title)}</a></div>` : ""}
    <button class="btn btn-ghost btn-block btn-sm" style="margin-top:10px" onclick="navigator.clipboard&&navigator.clipboard.writeText(location.href);toast('لینک دوره کپی شد ✓')">🔗 اشتراک‌گذاری</button>`;
}
function wish() {
  if (!Auth.user) { toast("برای افزودن به علاقه‌مندی‌ها ابتدا وارد شوید"); setTimeout(() => location.href = loginUrl(), 1000); return; }
  const on = MyWishlist.toggle(C.id); toast(on ? "به علاقه‌مندی‌ها اضافه شد ✓" : "از علاقه‌مندی‌ها حذف شد"); renderEnroll();
}
let courseStars = 0;
function pickCourseStar(v) { courseStars = v; document.querySelectorAll("#cr-stars button").forEach((b, i) => b.classList.toggle("on", i < v)); }
async function sendCourseReview(btn) {
  if (!courseStars) { toast("امتیاز ستاره‌ای را انتخاب کنید"); return; }
  const r = await busy(btn, () => API.post("courses/" + C.id + "/review", { stars: courseStars, text: document.getElementById("cr-text").value, role: (ME().resume || {}).title || "" }));
  btn.closest(".panel").innerHTML = `<div class="notice-box ok">${r.approved ? "نظر شما ثبت و منتشر شد ✓" : "نظر شما ثبت شد و پس از بازبینی منتشر می‌شود ✓"}</div>`;
}
