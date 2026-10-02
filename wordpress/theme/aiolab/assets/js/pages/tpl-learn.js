/* محیط یادگیری — محتوای درس از سرور (فقط برای ثبت‌نام‌شده‌ها)، پیشرفت و آزمون درس روی سرور */
let C, L = [], idx = 0, lessonCache = {};

document.addEventListener("DOMContentLoaded", () => {
  C = course(qs("id")) || (MyCreated.get(qs("id")) ? draftAsCourse(JSON.parse(JSON.stringify(MyCreated.get(qs("id"))))) : null);
  if (!C) { location.href = P.courses; return; }
  if (!Auth.user) { location.href = loginUrl(); return; }
  const owner = MyCreated.get(C.id);
  if (!MyCourses.isEnrolled(C.id) && !owner) { location.href = C.url || ("/course/" + C.id + "/"); return; }
  if (!MyCourses.get(C.id)) (ME().courses || (ME().courses = [])).push({ id: C.id, done: [], last: null, quiz: {} });

  L = courseLessons(C);
  document.getElementById("back-link").href = C.url || ("/course/" + C.id + "/");
  document.getElementById("lt-title").innerHTML = `${esc(C.title)}<small>${esc(provider(C.providerId).name || "")} · ${C.instructorIds.map(i => esc(instructor(i).name || "")).join("، ")}</small>`;
  document.getElementById("ls-head").textContent = `${fa(C.syllabus.length)} ماژول · ${fa(L.length)} درس`;
  if (!L.length) { document.getElementById("l-content").innerHTML = `<div class="empty-state"><b>هنوز درسی برای این دوره ثبت نشده است</b></div>`; return; }

  const e = MyCourses.get(C.id);
  const start = qs("lesson") || (e.last ? nextAfter(e.last) : L[0].key);
  idx = Math.max(0, L.findIndex(l => l.key === start));
  render();
});

function nextAfter(key) {
  const i = L.findIndex(l => l.key === key);
  const e = MyCourses.get(C.id);
  const next = L.slice(i + 1).find(l => !e.done.includes(l.key)) || L.slice(0, i + 1).find(l => !e.done.includes(l.key));
  return next ? next.key : key;
}

function render() {
  const e = MyCourses.get(C.id), pr = courseProgress(C), l = L[idx];
  document.getElementById("lt-pct").textContent = fa(pr.pct) + "٪";
  document.getElementById("lt-bar").style.width = pr.pct + "%";
  document.getElementById("ls-mods").innerHTML = C.syllabus.map((m, mi) => `
    <details class="mod" ${mi === l.mi ? "open" : ""}>
      <summary><span class="mn">${fa(mi + 1)}</span><span class="mt"><b>${esc(m.title)}</b><small>${fa(m.lessons.filter((_, li) => e.done.includes(mi + ":" + li)).length)} از ${fa(m.lessons.length)} تکمیل</small></span><span class="caret">▾</span></summary>
      ${m.lessons.map((x, li) => {
        const key = mi + ":" + li, done = e.done.includes(key), cur = key === l.key, lt = AIO_LESSON_TYPES[x.type] || { icon: "•", name: "" };
        return `<div class="lesson ${done ? "done" : ""} ${cur ? "cur" : ""}" onclick="goTo('${key}')">
          <span class="li">${done ? "✓" : lt.icon}</span><span class="lt">${esc(x.t)}</span><span class="ld">${fa(x.min)}′</span></div>`;
      }).join("")}
    </details>`).join("");
  const lt = AIO_LESSON_TYPES[l.type] || { icon: "•", name: "درس" };
  document.getElementById("l-mod").textContent = `ماژول ${fa(l.mi + 1)}: ${l.module} · درس ${fa(idx + 1)} از ${fa(L.length)}`;
  document.getElementById("l-title").textContent = l.t;
  document.getElementById("l-type").textContent = `${lt.icon} ${lt.name} · ${fa(l.min)} دقیقه`;
  const done = e.done.includes(l.key);
  const btn = document.getElementById("btn-done");
  btn.textContent = done ? "تکمیل شده ✓ (برای لغو کلیک کنید)" : "علامت‌گذاری به‌عنوان تکمیل‌شده ✓";
  btn.className = "btn grow " + (done ? "btn-outline" : "btn-primary");
  btn.style.display = (l.type === "quiz" && !done && l.qCount) ? "none" : "";
  renderDone(pr);
  loadLesson(l);
}

async function loadLesson(l) {
  const box = document.getElementById("l-content");
  const key = l.key;
  if (!lessonCache[key]) {
    box.innerHTML = `<div class="empty-state">در حال بارگذاری درس…</div>`;
    try { lessonCache[key] = (await API.get("courses/" + C.id + "/lesson?key=" + encodeURIComponent(key))).lesson; }
    catch (e) { box.innerHTML = `<div class="notice-box err">${esc(e.message)}</div>`; return; }
  }
  if (L[idx].key !== key) return;
  box.innerHTML = contentHTML(lessonCache[key]);
}

function contentHTML(x) {
  let html = "";
  if (x.embed) html += `<div class="lesson-video"><iframe src="${esc(x.embed)}" allowfullscreen loading="lazy"></iframe></div>`;
  else if (x.video) html += `<div class="lesson-video"><video src="${esc(x.video)}" controls preload="metadata"></video></div>`;
  else if (x.type === "video") html += `<div class="video-box"><div class="play">▶</div><span>ویدئوی این درس به‌زودی بارگذاری می‌شود</span></div>`;
  if (x.body) html += `<div class="reading-box entry-content">${x.body}</div>`;
  if (x.type === "quiz") html += quizHTML(x);
  if (!html) html = `<div class="reading-box"><p>محتوای این درس به‌زودی بارگذاری می‌شود.</p></div>`;
  return html;
}

function quizHTML(x) {
  if (!x.questions.length) return "";
  return `<div class="quiz-box">
      <h3>✔ ${esc(x.t)}</h3>
      <p>${fa(x.questions.length)} سؤال · حد نصاب قبولی ۶۰٪ · قابل تکرار${x.quizScore != null ? ` · بهترین نمره‌ی شما: ${fa(x.quizScore)}٪` : ""}</p>
      ${x.questions.map((q, i) => `<div class="qz-q"><b>${fa(i + 1)}. ${esc(q.q)}</b>${q.options.map((o, k) => `<label><input type="radio" name="qz${i}" value="${k}"> ${esc(o)}</label>`).join("")}</div>`).join("")}
      <div id="qz-result"></div>
      <button class="btn btn-primary" style="margin-top:14px" onclick="submitQuiz(this)">ثبت پاسخ‌ها</button>
    </div>`;
}

async function submitQuiz(btn) {
  const l = L[idx], x = lessonCache[l.key];
  const answers = x.questions.map((_, i) => { const c = document.querySelector(`input[name="qz${i}"]:checked`); return c ? Number(c.value) : null; });
  const r = await busy(btn, () => API.post("courses/" + C.id + "/quiz", { key: l.key, answers }));
  x.quizScore = Math.max(x.quizScore || 0, r.score);
  document.querySelectorAll(".qz-q").forEach((q, i) => q.querySelectorAll("label").forEach((lb, k) => {
    lb.style.color = k === r.key[i] ? "var(--teal-700)" : (answers[i] === k ? "#be123c" : ""); lb.style.fontWeight = k === r.key[i] ? "700" : "";
  }));
  document.getElementById("qz-result").innerHTML = `<div class="qz-result ${r.pass ? "ok" : "no"}">${r.pass ? `قبول شدید ✓ نمره ${fa(r.score)}٪` : `نمره ${fa(r.score)}٪ — برای قبولی حداقل ۶۰٪ لازم است؛ دوباره تلاش کنید.`}</div>`;
  if (r.pass) { toast("آزمون ثبت شد ✓"); if (r.cert) toast("🎓 گواهی دوره صادر و به رزومه شما اضافه شد"); setTimeout(render, 1200); }
}

async function markCurrent() {
  const l = L[idx], e = MyCourses.get(C.id), was = e.done.includes(l.key);
  const btn = document.getElementById("btn-done");
  try {
    const r = await busy(btn, () => MyCourses.markDone(C.id, l.key, !was));
    if (r && r.cert) toast("🎓 گواهی دوره صادر و به رزومه شما اضافه شد");
    else if (!was) toast("درس تکمیل شد ✓");
  } catch (err) { return; }
  if (!was && idx < L.length - 1 && courseProgress(C).pct < 100) idx++;
  render();
}
function move(d) { idx = Math.max(0, Math.min(L.length - 1, idx + d)); render(); window.scrollTo({ top: 0, behavior: "smooth" }); }
function goTo(key) { idx = L.findIndex(l => l.key === key); render(); }

function renderDone(pr) {
  const box = document.getElementById("done-strip");
  if (pr.pct < 100) { box.innerHTML = ""; return; }
  const cert = MyCerts.all().find(c => c.type === "course" && c.refId === C.id);
  box.innerHTML = `<div class="learn-done">
    <b>🎉 دوره را کامل کردید!</b>
    <p>${cert ? `گواهی «${esc(C.title)}» با کد رهگیری <a href="${cert.verify}" dir="ltr"><b>${cert.code}</b></a> صادر شد و روی رزومه شما قرار گرفت.` : (C.cert ? "گواهی در حال صدور است؛ صفحه را تازه کنید." : "این دوره گواهی ندارد، اما پیشرفت شما ذخیره شده است.")}</p>
    <a class="btn btn-primary btn-sm" href="${P.dashboard}#certs">مشاهده گواهی‌ها</a>
    ${C.relatedExamId ? `<a class="btn btn-outline btn-sm" href="/exam/${C.relatedExamId}/">شرکت در آزمون مهارت مرتبط</a>` : ""}
    <a class="btn btn-outline btn-sm" href="${P.courses}?cat=${C.cat}">دوره بعدی</a>
  </div>`;
}
