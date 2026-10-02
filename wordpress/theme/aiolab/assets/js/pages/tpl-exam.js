let EX = null, answers = [], idx = 0, timeLeft = 0, timerId = null;

document.addEventListener("DOMContentLoaded", () => {
  EX = AIO_EXAMS.find(e => e.id === Number(qs("id"))) || ((ME() && ME().myExams) || []).find(e => e.id === Number(qs("id")));
  if (!EX) { document.getElementById("intro").innerHTML = `<h2>این آزمون در دسترس نیست</h2><a class="btn btn-primary" href="${P.exams}">همه‌ی آزمون‌ها</a>`; return; }
  const l = lab(EX.authorLabId) || { name: "آیولب" };
  document.getElementById("i-badge").textContent = EX.badge;
  document.getElementById("i-title").textContent = EX.title;
  document.getElementById("bc-exam").textContent = EX.title;
  document.getElementById("i-by").textContent = "طراح آزمون: " + l.name + (l.verified ? " ✔️" : "");
  document.getElementById("i-desc").textContent = EX.desc;
  document.getElementById("i-meta").innerHTML = `
    <div><b>${fa(EX.qCount)}</b><span>سؤال چندگزینه‌ای</span></div>
    <div><b>${fa(EX.duration)}</b><span>دقیقه زمان</span></div>
    <div><b>${fa(EX.passScore)}٪</b><span>حد نصاب قبولی</span></div>
    <div><b>${EX.level}</b><span>سطح آزمون</span></div>
    <div><b>${EX.price ? fa(EX.price) + " تومان" : "رایگان"}</b><span>هزینه شرکت</span></div>`;
  const mine = ((ME() && ME().exams) || {})[EX.id];
  const cert = MyCerts.all().find(c => c.type === "exam" && c.refId === EX.id);
  const note = document.createElement("div");
  if (cert) note.innerHTML = `<div class="notice-box ok">شما این آزمون را با نمره‌ی ${fa(cert.score)}٪ قبول شده‌اید — کد گواهی <a href="${cert.verify}" dir="ltr">${cert.code}</a></div>`;
  else if (mine && mine.attempts) note.innerHTML = `<div class="notice-box info">آخرین نمره‌ی شما: ${fa(mine.lastScore)}٪ — امکان شرکت مجدد ${fa(EX.retakeDays)} روز پس از آخرین تلاش فراهم است.</div>`;
  if (note.innerHTML) document.getElementById("i-meta").after(note);
});

let TOKEN = "", QS = [];
async function startExam() {
  if (!Auth.user) { toast("برای شرکت در آزمون ابتدا وارد حساب شوید"); setTimeout(() => location.href = loginUrl(), 1200); return; }
  const btn = window.event && window.event.target && window.event.target.closest ? window.event.target.closest("button") : null;
  let r;
  try { r = await busy(btn, () => API.post("exams/" + EX.id + "/start")); }
  catch (e) {
    if (e.data && e.data.needPay) {
      const o = await API.post("orders", { exam_id: EX.id });
      if (o.checkout) setTimeout(() => location.href = o.checkout, 900);
    }
    return;
  }
  TOKEN = r.token; QS = r.questions;
  EX.questions = QS; EX.duration = r.duration;
  answers = new Array(QS.length).fill(-1);
  document.getElementById("intro").style.display = "none";
  document.getElementById("runner").style.display = "";
  document.getElementById("q-total").textContent = fa(EX.questions.length);
  timeLeft = EX.duration * 60;
  tick();
  timerId = setInterval(tick, 1000);
  showQ(0);
}

function tick() {
  const m = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const s = String(timeLeft % 60).padStart(2, "0");
  document.getElementById("timer").textContent = (m + ":" + s).replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]);
  document.getElementById("timer").classList.toggle("warn", timeLeft <= 60);
  if (timeLeft <= 0) { clearInterval(timerId); finishExam(true); return; }
  timeLeft--;
}

function showQ(i) {
  idx = Math.max(0, Math.min(EX.questions.length - 1, i));
  const q = EX.questions[idx];
  document.getElementById("q-now").textContent = fa(idx + 1);
  document.getElementById("eb-fill").style.width = ((idx + 1) / EX.questions.length * 100) + "%";
  document.getElementById("q-text").textContent = q.q;
  document.getElementById("q-options").innerHTML = q.options.map((o, k) => `
    <label class="q-opt ${answers[idx] === k ? "sel" : ""}">
      <input type="radio" name="opt" ${answers[idx] === k ? "checked" : ""} onchange="pick(${k})">
      <span class="q-key">${"۱۲۳۴۵۶"[k]}</span><span>${esc(o)}</span>
    </label>`).join("");
  document.getElementById("q-nav").innerHTML = EX.questions.map((_, k) =>
    `<button class="qn ${k === idx ? "cur" : ""} ${answers[k] > -1 ? "done" : ""}" onclick="showQ(${k})">${fa(k + 1)}</button>`).join("");
}

function pick(k) { answers[idx] = k; showQ(idx); }
function move(d) { showQ(idx + d); }

let finishing = false;
async function finishExam(auto) {
  if (!auto) {
    const empty = answers.filter(a => a === -1).length;
    if (empty && !confirm(`${fa(empty)} سؤال بی‌پاسخ مانده است. مطمئنید می‌خواهید آزمون را ثبت کنید؟`)) return;
  }
  if (finishing) return;
  finishing = true;
  clearInterval(timerId);
  let r;
  try { r = await API.post("exams/" + EX.id + "/submit", { token: TOKEN, answers: answers.map(a => a === -1 ? null : a) }); }
  catch (e) { toast(e.message); finishing = false; return; }
  const score = r.score, passed = r.pass;
  document.getElementById("runner").style.display = "none";
  document.getElementById("result").style.display = "";
  const issuer = (lab(EX.authorLabId) || {}).name || "آیولب";
  document.getElementById("res-hero").innerHTML = passed ? `
    <div class="rh pass">
      <div class="rh-icon">${EX.badge}</div>
      <h1>قبول شدید! 🎉</h1>
      <p>نمره شما <b>${fa(score)}٪</b> از حد نصاب <b>${fa(r.passScore)}٪</b></p>
      <div class="cert-strip">
        <b>گواهی «${esc(EX.title)}»</b>
        <span>به رزومه شما اضافه شد · کد رهگیری: <a href="${r.cert.verify}" dir="ltr">${r.cert.code}</a></span>
        <small>صادرکننده: ${esc(issuer)} — تأییدشده توسط آیولب</small>
      </div>
      <p class="rh-note">از این پس پروفایل شما نشان مهارت تأییدشده دارد و در فیلتر «دارای نشان مهارت» بانک رزومه کارفرمایان نمایش داده می‌شود.</p>
      <a class="btn btn-primary" href="${P.dashboard}#certs">گواهی‌های من</a>
    </div>` : `
    <div class="rh fail">
      <div class="rh-icon">📘</div>
      <h1>${r.late ? "زمان آزمون به پایان رسیده بود" : "این بار نشد"}</h1>
      <p>نمره شما <b>${fa(score)}٪</b> — حد نصاب قبولی <b>${fa(r.passScore)}٪</b> است.</p>
      <p class="rh-note">این نمره در پروفایل عمومی شما نمایش داده نمی‌شود. می‌توانید پس از ${fa(EX.retakeDays || 7)} روز دوباره شرکت کنید. دوره‌های آمادگی را در آکادمی ببینید.</p>
      <a class="btn btn-outline" href="${P.courses}?cat=${EX.dept === "management" ? "safety" : EX.dept}">دوره‌های آمادگی</a>
    </div>`;
  document.getElementById("res-breakdown").innerHTML = `
    <h2>مرور پاسخ‌ها</h2>
    ${QS.map((q, i) => {
      const ok = answers[i] === r.key[i];
      return `<div class="rb-item ${ok ? "ok" : "no"}">
        <div class="rb-q"><span>${fa(i + 1)}</span> ${esc(q.q)}</div>
        <div class="rb-a">
          <span class="rb-yours">پاسخ شما: ${answers[i] > -1 ? esc(q.options[answers[i]]) : "بی‌پاسخ"}</span>
          ${ok ? "" : `<span class="rb-right">پاسخ درست: ${esc(q.options[r.key[i]])}</span>`}
        </div>
      </div>`;
    }).join("")}`;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i) | 0; return h; }
