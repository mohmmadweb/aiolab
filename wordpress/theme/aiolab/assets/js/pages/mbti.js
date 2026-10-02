let ans = [], i = 0;

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("m-total").textContent = fa(AIO_MBTI_QUESTIONS.length);
  const prev = MyMBTI.get();
  if (prev && AIO_MBTI_TYPES[prev.type]) document.getElementById("prev-result").innerHTML =
    `<div class="prev-note">نتیجه قبلی شما: <b>${prev.type}</b> — ${AIO_MBTI_TYPES[prev.type].name}
     <a href="#m-res" onclick="showResult(MyMBTI.get());return false">مشاهده دوباره</a></div>`;
});

function start() {
  ans = new Array(AIO_MBTI_QUESTIONS.length).fill(null);
  i = 0;
  document.getElementById("m-intro").style.display = "none";
  document.getElementById("m-run").style.display = "";
  show();
}

function show() {
  const q = AIO_MBTI_QUESTIONS[i];
  document.getElementById("m-now").textContent = fa(i + 1);
  document.getElementById("m-fill").style.width = ((i + 1) / AIO_MBTI_QUESTIONS.length * 100) + "%";
  document.getElementById("m-q").textContent = q.q;
  const a = document.getElementById("opt-a"), b = document.getElementById("opt-b");
  a.textContent = q.a; b.textContent = q.b;
  a.classList.toggle("sel", ans[i] === "a");
  b.classList.toggle("sel", ans[i] === "b");
}

function answer(v) {
  ans[i] = v;
  if (i < AIO_MBTI_QUESTIONS.length - 1) { i++; show(); }
  else compute();
}

function back() { if (i > 0) { i--; show(); } }

function compute() {
  const score = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
  AIO_MBTI_QUESTIONS.forEach((q, k) => {
    if (!ans[k]) return;
    const pair = q.d.split("");             // "EI" -> ["E","I"]
    score[ans[k] === "a" ? pair[0] : pair[1]]++;
  });
  const type = (score.E >= score.I ? "E" : "I") + (score.S >= score.N ? "S" : "N") +
               (score.T >= score.F ? "T" : "F") + (score.J >= score.P ? "J" : "P");
  const res = { type, score, date: new Date().toLocaleDateString("fa-IR") };
  showResult(res);
  if (Auth.user) MyMBTI.set(res).then(() => toast("نتیجه در پروفایل شما ذخیره شد ✓")).catch(e => toast(e.message));
  else toast("برای ذخیره‌ی نتیجه روی رزومه، وارد حساب شوید");
}

function pct(a, b) { return Math.round(a / Math.max(1, a + b) * 100); }

function showResult(res) {
  const t = AIO_MBTI_TYPES[res.type], s = res.score;
  document.getElementById("m-intro").style.display = "none";
  document.getElementById("m-run").style.display = "none";
  const box = document.getElementById("m-res");
  box.style.display = "";
  box.innerHTML = `
    <div class="mbti-hero">
      <div class="mh-type">${res.type}</div>
      <h1>${t.name}</h1>
      <p>${t.short}</p>
    </div>
    <div class="mbti-bars">
      ${bar("برون‌گرا (E)", "درون‌گرا (I)", pct(s.E, s.I))}
      ${bar("حسی (S)", "شهودی (N)", pct(s.S, s.N))}
      ${bar("منطقی (T)", "احساسی (F)", pct(s.T, s.F))}
      ${bar("قضاوتی (J)", "ادراکی (P)", pct(s.J, s.P))}
    </div>
    <div class="mbti-fit">
      <h2>مشاغل آزمایشگاهی متناسب با تیپ شما</h2>
      <div class="fit-chips">${t.fit.map(f => `<span>${f}</span>`).join("")}</div>
      <div class="fit-jobs" id="fit-jobs"></div>
    </div>
    <div class="mbti-privacy">
      <label class="check-item"><input type="checkbox" id="show-emp" ${ME() && ME().mbtiPublic ? "checked" : ""} onchange="togglePrivacy()">
        نمایش تیپ شخصیتی من به کارفرمایان روی پروفایل</label>
    </div>
    <div class="res-actions">
      <a class="btn btn-outline" href="/assessment/">رفتن به خودارزیابی مهارت</a>
      <a class="btn btn-primary" href="/dashboard/#resume">مشاهده رزومه من</a>
    </div>`;

  const matched = AIO_JOBS.filter(j => t.fit.some(f =>
    j.title.includes(f.split(" ")[0]) || (dept(j.dept) || { name: "" }).name.includes(f.split(" ")[0]))).slice(0, 3);
  document.getElementById("fit-jobs").innerHTML = matched.length
    ? `<h3>آگهی‌های فعال مرتبط</h3><div class="job-grid">${matched.map(jobCardHTML).join("")}</div>` : "";
}

function bar(left, right, p) {
  return `<div class="mb-row">
    <span class="mb-l">${left}</span>
    <div class="mb-track"><i style="width:${p}%"></i><b style="${p >= 50 ? "right" : "left"}:6px">${fa(p >= 50 ? p : 100 - p)}٪</b></div>
    <span class="mb-r">${right}</span>
  </div>`;
}

async function togglePrivacy() {
  const cb = document.getElementById("show-emp"), on = cb.checked;
  if (!Auth.user) { cb.checked = false; toast("برای نمایش نتیجه به کارفرمایان ابتدا وارد شوید"); setTimeout(() => location.href = loginUrl(), 1200); return; }
  try { await API.post("me/mbti-public", { on }); } catch (e) { cb.checked = !on; return; }
  toast(on ? "تیپ شخصیتی شما برای کارفرمایان نمایش داده می‌شود" : "تیپ شخصیتی شما مخفی شد");
}
