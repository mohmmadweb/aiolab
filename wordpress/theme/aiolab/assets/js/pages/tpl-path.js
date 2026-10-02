let PT, PC = [];
const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5L20 7"/></svg>';

document.addEventListener("DOMContentLoaded", () => {
  PT = learningPath(qs("id"));
  if (!PT) { document.getElementById("p-title").textContent = "این مسیر در دسترس نیست"; return; }
  PC = coursesOfPath(PT);
  const hours = PC.reduce((s, c) => s + c.hours, 0), weeks = PC.reduce((s, c) => s + c.weeks, 0);
  const kind = PT.kind === "professional" ? "گواهی حرفه‌ای" : "مسیر تخصصی";
  document.getElementById("p-hero").style.setProperty("--pbg", PT.bg);
  document.getElementById("p-hero").style.setProperty("--pc", PT.color);
  document.getElementById("p-kind").textContent = kind;
  document.getElementById("p-kind").style.cssText = `color:${PT.color};background:${PT.bg}`;
  document.getElementById("p-title").textContent = PT.title;
  document.getElementById("p-desc").textContent = PT.desc;
  document.getElementById("p-stats").innerHTML = `
    <div><b>${fa(PC.length)} دوره</b><span>${fa(PC.reduce((s, c) => s + courseLessons(c).length, 0))} درس</span></div>
    <div><b>★ ${fa(PT.rating)}</b><span>${fa(PT.students)} فراگیر</span></div>
    <div><b>${PT.level}</b><span>سطح مسیر</span></div>
    <div><b>${fa(hours)} ساعت</b><span>حدود ${fa(weeks)} هفته</span></div>
    <div><b>${PT.cert}</b><span>پس از تکمیل همه دوره‌ها</span></div>`;
  document.getElementById("p-outcomes").innerHTML = PT.outcomes.map(o => `<li>${o}</li>`).join("");
  document.getElementById("p-role").innerHTML = `🎯 <b>${PT.role}</b> — <a href="${P.jobs}?q=${encodeURIComponent(PT.role.split(" ")[0])}">آگهی‌های مرتبط را ببینید ←</a>`;
  document.getElementById("p-steps-title").textContent = `${fa(PC.length)} دوره در این مسیر`;

  renderSteps();

  const ins = [...new Set(PC.flatMap(c => c.instructorIds))].map(instructor);
  document.getElementById("p-instructors").innerHTML = ins.map(i => `
    <div class="instr-row">
      <div class="avatar" style="background:${i.color}">${i.name.replace("دکتر ", "").replace("مهندس ", "").charAt(0)}</div>
      <div><b>${i.name}</b><span>${i.title} · ${i.org}</span><p>${i.bio}</p></div>
    </div>`).join("");
  document.getElementById("p-others").innerHTML = AIO_LEARNING_PATHS.filter(x => x.id !== PT.id).slice(0, 2).map(pathCardHTML).join("");
  renderEnroll();
});

function renderSteps() {
  document.getElementById("p-steps").innerHTML = PC.map((c, i) => {
    const pr = courseProgress(c), pv = provider(c.providerId);
    return `<div class="path-step" style="--pc:${PT.color}">
      <div class="ps-num ${pr.pct === 100 ? "done" : ""}">${pr.pct === 100 ? "✓" : fa(i + 1)}</div>
      <div class="ps-card">
        <div><h3><a href="/course/${c.id}/">${c.title}</a></h3><p>${c.subtitle}</p></div>
        ${pr.enrolled ? `<a class="btn btn-sm btn-primary" href="/learn/${c.id}/">${pr.pct === 100 ? "مرور" : pr.pct ? "ادامه (" + fa(pr.pct) + "٪)" : "شروع"}</a>`
                      : `<button class="btn btn-sm btn-outline" onclick="enrollCourse(${c.id}, false, this).then(() => { renderSteps(); renderEnroll(); })">${c.price ? "ثبت‌نام و پرداخت" : "ثبت‌نام"}</button>`}
        <div class="ps-meta">${providerBadgeHTML(pv)}<span>${c.level}</span><span>${fa(c.hours)} ساعت</span><span>${courseFormat(c.format).short}</span>${ratingHTML(c.rating, c.ratingCount)}<span><b>${coursePrice(c)}</b></span></div>
        ${pr.enrolled ? `<div class="cc-progress" style="grid-column:1/-1"><i style="width:${pr.pct}%"></i></div>` : ""}
      </div>
    </div>`;
  }).join("");
}

function renderEnroll() {
  const total = PC.reduce((s, c) => s + c.price, 0);
  const enrolledAll = PC.every(c => MyCourses.isEnrolled(c.id));
  const pr = pathProgress(PT);
  const first = PC.find(c => courseProgress(c).pct < 100) || PC[0];
  document.getElementById("enroll-card").innerHTML = `
    <div class="ec-price"><b class="${!total ? "free" : ""}">${total ? fa(total) + " تومان" : "رایگان"}</b></div>
    <div class="ec-note">${total ? "مجموع " + fa(PC.length) + " دوره · با اشتراک سالانه کارجو تا ۴۰٪ کمتر" : "همه دوره‌های این مسیر رایگان است"}</div>
    ${pr.started ? `<div class="ec-progress"><div class="bar"><i style="width:${pr.pct}%"></i></div><small>${fa(pr.pct)}٪ مسیر طی شده</small></div>` : ""}
    ${enrolledAll
      ? `<a class="btn btn-primary btn-block btn-lg" href="/learn/${first.id}/">${pr.pct === 100 ? "مرور مسیر" : "ادامه مسیر"}</a>`
      : `<button class="btn btn-primary btn-block btn-lg" onclick="enrollPath()">ثبت‌نام در کل مسیر</button>
         <a class="btn btn-outline btn-block" href="/course/${first.id}/">فقط دوره اول را ببینم</a>`}
    <ul class="ec-list">
      <li>${CHECK} ${fa(PC.length)} دوره زنجیره‌ای · ${fa(PC.reduce((s, c) => s + c.hours, 0))} ساعت</li>
      <li>${CHECK} ${PT.cert}</li>
      <li>${CHECK} گواهی هر دوره جداگانه هم صادر می‌شود</li>
      <li>${CHECK} یادگیری با سرعت خودتان، از هر دوره</li>
      ${PT.relatedExamId ? `<li>${CHECK} آماده‌سازی برای <a href="/exam/${PT.relatedExamId}/">آزمون مهارت مرتبط</a></li>` : ""}
    </ul>`;
}
async function enrollPath() {
  if (!Auth.user) { toast("برای ثبت‌نام ابتدا وارد شوید"); setTimeout(() => location.href = loginUrl(), 1100); return; }
  const btn = window.event && window.event.target && window.event.target.closest ? window.event.target.closest("button") : null;
  const free = PC.filter(c => !c.price && !MyCourses.isEnrolled(c.id)), paid = PC.filter(c => c.price && !MyCourses.isEnrolled(c.id));
  await busy(btn, async () => { for (const c of free) await API.post("courses/" + c.id + "/enroll"); });
  if (paid.length) {
    aioModal(`<h2>ثبت‌نام در مسیر</h2><p>${free.length ? `در ${fa(free.length)} دوره‌ی رایگان ثبت‌نام شدید ✓<br>` : ""}${fa(paid.length)} دوره‌ی این مسیر پولی است؛ برای هر کدام از دکمه‌ی زیر ثبت‌نام و پرداخت کنید:</p>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:12px">${paid.map(c => `<button class="btn btn-outline" onclick="enrollCourse(${c.id}, false, this)">${esc(c.title)} — ${fa(c.price)} تومان</button>`).join("")}</div>`);
  } else toast(`در همه ${fa(PC.length)} دوره مسیر ثبت‌نام شدید ✓`);
  renderSteps(); renderEnroll();
}
