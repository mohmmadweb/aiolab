const STEPS = ["اطلاعات پایه", "دستاوردها و مهارت‌ها", "سرفصل", "قیمت و گواهی", "پرسش‌ها و ارسال"];
let D, step = 1, U;

document.addEventListener("DOMContentLoaded", () => {
  U = requireLogin(); if (!U) return;
  const id = qs("id");
  D = (id && MyCreated.get(id)) || newDraft();
  if (D.status === "published") { toast("این دوره منتشر شده است؛ برای تغییر با پشتیبانی تماس بگیرید"); setTimeout(() => location.href = D.url, 1500); return; }
  if (U.role === "employer") document.getElementById("b-mylist").href = P.employer + "#training";
  else document.getElementById("b-mylist").href = P.dashboard + "#courses";

  /* selects */
  document.getElementById("b-cat").innerHTML = AIO_COURSE_CATS.map(c => `<option value="${c.id}">${c.name}</option>`).join("");
  document.getElementById("b-level").innerHTML = AIO_COURSE_LEVELS.map(l => `<option>${l}</option>`).join("");
  document.getElementById("b-format").innerHTML = AIO_COURSE_FORMATS.map(f => `<option value="${f.id}">${f.name} — ${f.desc}</option>`).join("");
  document.getElementById("b-lang").innerHTML = AIO_COURSE_LANGS.map(l => `<option>${l}</option>`).join("");
  document.getElementById("b-provider").innerHTML = `<option value="mine">مرکز / مؤسسه من (${U.name})</option>` +
    AIO_PROVIDERS.filter(p => p.id !== "mine").map(p => `<option value="${p.id}">${p.name} (${p.kind})</option>`).join("");
  document.getElementById("b-exam").insertAdjacentHTML("beforeend", AIO_EXAMS.map(e => `<option value="${e.id}">${e.badge} ${e.title}</option>`).join(""));
  document.getElementById("b-instr").innerHTML = AIO_INSTRUCTORS.filter(i => !i.id.startsWith("n")).map(i => `
    <label><input type="checkbox" value="${i.id}" onchange="toggleInstr('${i.id}',this.checked)">
      <span class="av" style="background:${i.color}">${i.name.replace("دکتر ", "").replace("مهندس ", "").charAt(0)}</span>
      <span>${i.name}<small>${i.title}</small></span></label>`).join("");

  /* bind inputs: هر فیلد با data-k مستقیم روی D می‌نشیند */
  document.querySelectorAll("[data-k]").forEach(el => {
    const k = el.dataset.k, v = D[k];
    if (el.type === "checkbox") el.checked = !!v; else if (v !== undefined && v !== null) el.value = v;
    const upd = () => { D[k] = el.type === "checkbox" ? el.checked : (el.type === "number" ? (el.value === "" ? null : Number(el.value)) : el.value); if (k === "providerId") renderProviderName(); touch(); };
    el.addEventListener("input", upd); el.addEventListener("change", upd);
  });
  document.getElementById("b-cert").value = D.cert === false ? "0" : "1";
  document.getElementById("b-pricemode").value = D.price ? "paid" : "free";
  D.instructorIds.forEach(id => { const cb = document.querySelector(`#b-instr input[value="${id}"]`); if (cb) cb.checked = true; });

  renderStepper(); renderLists(); renderSyllabus(); renderNewInstr(); renderFaq(); renderProviderName(); priceMode(); certMode(); renderPreview();
  document.getElementById("b-skill-sugg").innerHTML = AIO_TRENDING_SKILLS.slice(0, 6).map(s => `<a href="${P.courses}?skill=${encodeURIComponent(s)}" onclick="addSkill('${s}');return false" style="color:var(--teal-700);margin-inline-end:8px">${s}</a>`).join("");
  document.getElementById("b-title").textContent = D.title ? "ویرایش: " + D.title : "ساخت دوره جدید";
  const hs = Number(qs("step")); if (hs) goStep(hs);
});

function newDraft() {
  return { id: "d" + Date.now().toString(36), status: "draft", ownerName: Auth.user.name,
    title: "", subtitle: "", type: "course", cat: "hematology", level: "مقدماتی", format: "self", lang: "فارسی", weeks: 4,
    providerId: "mine", providerName: Auth.user.role === "seeker" ? "" : Auth.user.name, instructorIds: [], newInstructors: [],
    outcomes: ["", "", ""], skills: [], audience: [""], prereq: [], syllabus: [], price: null, oldPrice: null, cert: true,
    certType: "گواهی مهارت آیولب", relatedExamId: "", nextStart: "", seats: null, venue: "", faq: [], highlightReq: false, allowReviews: true, terms: false };
}
/* ذخیره‌ی خودکار روی سرور — ۲ ثانیه پس از آخرین تغییر، و ذخیره‌ها پشت سر هم (بدون ساخت نسخه‌ی تکراری) */
let saveTimer = null, saveChain = Promise.resolve(), dirty = false;
function touch() { dirty = true; renderPreview(); clearTimeout(saveTimer); saveTimer = setTimeout(() => saveDraft(false), 2000); setSaveState("تغییرات ذخیره‌نشده…"); }
function setSaveState(t) { const el = document.getElementById("b-status"); if (el) el.title = t; const n = document.getElementById("b-save-state"); if (n) n.textContent = t; }
function saveDraft(notify, submit) {
  clearTimeout(saveTimer);
  saveChain = saveChain.then(async () => {
    setSaveState("در حال ذخیره…");
    try {
      await MyCreated.save(D, submit);
      dirty = false;
      if (/^\d+$/.test(String(D.id)) && qs("id") !== String(D.id)) history.replaceState(null, "", location.pathname + "?id=" + D.id + location.hash);
      setSaveState("ذخیره شد ✓");
      if (notify) toast("پیش‌نویس ذخیره شد ✓");
      renderPreview();
    } catch (e) { setSaveState("ذخیره نشد"); toast(e.message); throw e; }
  });
  return saveChain;
}
window.addEventListener("beforeunload", e => { if (dirty) { e.preventDefault(); e.returnValue = ""; } });

/* ---------- گام‌ها ---------- */
function renderStepper() {
  document.getElementById("stepper").innerHTML = STEPS.map((s, i) => `<button class="${step === i + 1 ? "on" : ""} ${stepOk(i + 1) ? "done" : ""}" onclick="goStep(${i + 1})"><i>${stepOk(i + 1) && step !== i + 1 ? "✓" : fa(i + 1)}</i>${s}</button>`).join("");
}
function goStep(n) {
  step = n;
  document.querySelectorAll(".b-step").forEach(s => s.classList.toggle("active", Number(s.dataset.step) === n));
  renderStepper(); if (n === 5) renderFinalCheck();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function stepOk(n) {
  const c = checks();
  if (n === 1) return c.title && c.subtitle && c.instr && c.provider;
  if (n === 2) return c.outcomes && c.skills;
  if (n === 3) return c.syllabus && c.quiz;
  if (n === 4) return c.price;
  if (n === 5) return !!D.terms;
  return false;
}
function checks() {
  const lessons = D.syllabus.flatMap(m => m.lessons);
  return {
    title: D.title.trim().length >= 8, subtitle: D.subtitle.trim().length >= 15,
    provider: D.providerId !== "mine" || !!(D.providerName || "").trim(),
    instr: D.instructorIds.length + D.newInstructors.filter(n => n.name.trim()).length > 0,
    outcomes: D.outcomes.filter(o => o.trim()).length >= 3, skills: D.skills.length >= 3,
    syllabus: D.syllabus.length >= 1 && D.syllabus.every(m => m.title.trim() && m.lessons.filter(l => l.t.trim()).length >= 2) && lessons.length >= 2,
    quiz: D.type === "guided" || lessons.some(l => l.type === "quiz"),
    price: D.price === 0 || D.price > 0
  };
}

/* ---------- ارائه‌دهنده و مدرسان ---------- */
function renderProviderName() { document.getElementById("b-provname-wrap").style.display = D.providerId === "mine" ? "" : "none"; }
function toggleInstr(id, on) { const s = new Set(D.instructorIds); on ? s.add(id) : s.delete(id); D.instructorIds = [...s]; touch(); }
function addNewInstr() { D.newInstructors.push({ name: "", title: "", bio: "" }); renderNewInstr(); touch(); }
function renderNewInstr() {
  document.getElementById("b-newinstr").innerHTML = D.newInstructors.map((n, i) => `
    <div class="le-row"><input placeholder="نام و نام خانوادگی" value="${esc(n.name)}" oninput="D.newInstructors[${i}].name=this.value;touch()">
      <input placeholder="عنوان / سمت" value="${esc(n.title)}" oninput="D.newInstructors[${i}].title=this.value;touch()">
      <input placeholder="بیو کوتاه" value="${esc(n.bio)}" oninput="D.newInstructors[${i}].bio=this.value;touch()">
      <button onclick="D.newInstructors.splice(${i},1);renderNewInstr();touch()">✕</button></div>`).join("") || `<p style="font-size:12.5px;color:var(--navy-400)">مدرس جدیدی اضافه نشده است.</p>`;
}

/* ---------- فهرست‌ها ---------- */
function renderLists() { ["outcomes", "audience", "prereq"].forEach(renderList); renderSkills(); }
function renderList(k) {
  const ph = { outcomes: "مثلاً: نمودار لوی‌جنینگز را رسم و تفسیر کنید", audience: "مثلاً: کارشناسان بخش هماتولوژی", prereq: "مثلاً: آشنایی با آمار پایه" }[k];
  document.getElementById("b-" + k).innerHTML = D[k].map((v, i) => `
    <div class="le-row"><input value="${esc(v)}" placeholder="${ph}" oninput="D['${k}'][${i}]=this.value;touch()"><button onclick="D['${k}'].splice(${i},1);renderList('${k}');touch()">✕</button></div>`).join("");
}
function addItem(k) { D[k].push(""); renderList(k); touch(); setTimeout(() => { const inps = document.querySelectorAll(`#b-${k} input`); inps[inps.length - 1]?.focus(); }, 30); }
function renderSkills() {
  document.getElementById("b-skills").innerHTML = D.skills.map((s, i) => `<span>${esc(s)}<button onclick="D.skills.splice(${i},1);renderSkills();touch()">✕</button></span>`).join("") +
    `<input placeholder="مهارت + Enter" onkeydown="if(event.key==='Enter'||event.key===','){event.preventDefault();addSkill(this.value);this.value=''}">`;
}
function addSkill(v) { v = (v || "").replace(",", "").trim(); if (!v || D.skills.includes(v)) return; D.skills.push(v); renderSkills(); touch(); document.querySelector("#b-skills input")?.focus(); }

/* ---------- سرفصل ---------- */
const LTYPES = Object.entries(AIO_LESSON_TYPES);
function addModule() { D.syllabus.push({ title: "", lessons: [{ t: "", type: "video", min: 15 }, { t: "", type: "quiz", min: 10 }] }); renderSyllabus(); touch(); }
function addLesson(mi, type) { D.syllabus[mi].lessons.push({ t: "", type: type || "video", min: type === "quiz" ? 10 : 20 }); renderSyllabus(); touch(); }
function moveModule(mi, d) { const a = D.syllabus, j = mi + d; if (j < 0 || j >= a.length) return; [a[mi], a[j]] = [a[j], a[mi]]; renderSyllabus(); touch(); }
function renderSyllabus() {
  document.getElementById("b-syllabus").innerHTML = D.syllabus.map((m, mi) => {
    const mins = m.lessons.reduce((s, l) => s + (Number(l.min) || 0), 0);
    return `<div class="b-mod">
      <div class="b-mod-head"><span class="mn">${fa(mi + 1)}</span>
        <input placeholder="عنوان ماژول ${fa(mi + 1)} — مثلاً: مبانی و ایمنی نمونه‌گیری" value="${esc(m.title)}" oninput="D.syllabus[${mi}].title=this.value;touch()">
        <span class="mh">${fa(m.lessons.length)} درس · ${fa(Math.round(mins / 6) / 10)} ساعت</span>
        <button class="btn btn-sm btn-ghost" title="بالا" onclick="moveModule(${mi},-1)">↑</button><button class="btn btn-sm btn-ghost" title="پایین" onclick="moveModule(${mi},1)">↓</button>
      </div>
      ${m.lessons.map((l, li) => `<div class="b-lesson">
        <span class="li">${AIO_LESSON_TYPES[l.type].icon}</span>
        <input placeholder="عنوان درس" value="${esc(l.t)}" oninput="D.syllabus[${mi}].lessons[${li}].t=this.value;touch()">
        <select onchange="D.syllabus[${mi}].lessons[${li}].type=this.value;renderSyllabus();touch()">${LTYPES.map(([id, t]) => `<option value="${id}" ${l.type === id ? "selected" : ""}>${t.icon} ${t.name}</option>`).join("")}</select>
        <input type="number" min="1" value="${l.min}" title="دقیقه" oninput="D.syllabus[${mi}].lessons[${li}].min=Number(this.value);touch()">
        <button onclick="D.syllabus[${mi}].lessons.splice(${li},1);renderSyllabus();touch()">✕</button>
      </div>`).join("")}
      <div class="b-mod-foot">
        <button class="btn btn-sm btn-outline" onclick="addLesson(${mi},'video')">+ ویدئو</button>
        <button class="btn btn-sm btn-outline" onclick="addLesson(${mi},'reading')">+ مطالعه</button>
        <button class="btn btn-sm btn-outline" onclick="addLesson(${mi},'lab')">+ تمرین</button>
        <button class="btn btn-sm btn-outline" onclick="addLesson(${mi},'project')">+ پروژه</button>
        <button class="btn btn-sm btn-outline" onclick="addLesson(${mi},'quiz')">+ آزمون ماژول</button>
        <button class="btn btn-sm btn-danger" onclick="if(confirm('ماژول حذف شود؟')){D.syllabus.splice(${mi},1);renderSyllabus();touch()}">حذف ماژول</button>
      </div>
    </div>`;
  }).join("") || `<div class="empty-inline" style="margin-bottom:12px">هنوز ماژولی ندارید. «افزودن ماژول» یا «الگوی پیشنهادی» را بزنید.</div>`;
  const lessons = D.syllabus.flatMap(m => m.lessons), mins = lessons.reduce((s, l) => s + (Number(l.min) || 0), 0);
  document.getElementById("b-syl-sum").textContent = `${fa(D.syllabus.length)} ماژول · ${fa(lessons.length)} درس · ${fa(Math.round(mins / 6) / 10)} ساعت · ${fa(lessons.filter(l => l.type === "quiz").length)} آزمون`;
}
function loadTemplate() {
  if (D.syllabus.length && !confirm("سرفصل فعلی با الگو جایگزین شود؟")) return;
  D.syllabus = D.type === "guided"
    ? [{ title: "پروژه گام‌به‌گام", lessons: [{ t: "گام ۱: آماده‌سازی", type: "lab", min: 25 }, { t: "گام ۲: اجرا", type: "lab", min: 40 }, { t: "گام ۳: تحلیل نتیجه", type: "lab", min: 30 }, { t: "گام ۴: تحویل و ارزیابی", type: "project", min: 20 }] }]
    : [{ title: "مبانی و مفاهیم پایه", lessons: [{ t: "معرفی دوره و مسیر یادگیری", type: "video", min: 8 }, { t: "مفاهیم کلیدی", type: "video", min: 20 }, { t: "منبع مطالعه", type: "reading", min: 20 }, { t: "آزمون ماژول ۱", type: "quiz", min: 10 }] },
       { title: "تکنیک و اجرا", lessons: [{ t: "روش کار گام‌به‌گام", type: "video", min: 25 }, { t: "خطاهای رایج", type: "video", min: 18 }, { t: "تمرین عملی", type: "lab", min: 60 }, { t: "آزمون ماژول ۲", type: "quiz", min: 12 }] },
       { title: "کیفیت و موارد خاص", lessons: [{ t: "کنترل کیفیت و مستندسازی", type: "video", min: 22 }, { t: "مطالعه موردی", type: "reading", min: 25 }, { t: "آزمون ماژول ۳", type: "quiz", min: 12 }] },
       { title: "جمع‌بندی و پروژه", lessons: [{ t: "مرور و نکات پایانی", type: "video", min: 15 }, { t: "پروژه پایانی", type: "project", min: 90 }, { t: "آزمون جامع", type: "quiz", min: 20 }] }];
  renderSyllabus(); touch(); toast("الگو بارگذاری شد؛ عناوین را ویرایش کنید");
}

/* ---------- قیمت، گواهی، FAQ ---------- */
function priceMode() {
  const free = document.getElementById("b-pricemode").value === "free";
  document.getElementById("b-price-wrap").style.display = free ? "none" : "";
  document.getElementById("b-oldprice-wrap").style.display = free ? "none" : "";
  if (free) { D.price = 0; D.oldPrice = null; } else if (D.price === 0) D.price = null;
  touch();
}
function certMode() { D.cert = document.getElementById("b-cert").value === "1"; document.getElementById("b-certtype-wrap").style.display = D.cert ? "" : "none"; touch(); }
function addFaq() { D.faq.push({ q: "", a: "" }); renderFaq(); touch(); }
function renderFaq() {
  document.getElementById("b-faq").innerHTML = D.faq.map((f, i) => `
    <div class="le-row"><input placeholder="پرسش" value="${esc(f.q)}" oninput="D.faq[${i}].q=this.value;touch()"><input placeholder="پاسخ" value="${esc(f.a)}" oninput="D.faq[${i}].a=this.value;touch()"><button onclick="D.faq.splice(${i},1);renderFaq();touch()">✕</button></div>`).join("")
    || `<p style="font-size:12.5px;color:var(--navy-400)">اگر خالی بماند، پرسش‌های عمومی آکادمی نمایش داده می‌شود.</p>`;
}

/* ---------- پیش‌نمایش و بررسی ---------- */
function checklistHTML(c) {
  const rows = [["title", "عنوان (حداقل ۸ نویسه)"], ["subtitle", "زیرعنوان (حداقل ۱۵ نویسه)"], ["provider", "نام ارائه‌دهنده"], ["instr", "حداقل یک مدرس"],
    ["outcomes", "حداقل ۳ دستاورد"], ["skills", "حداقل ۳ مهارت"], ["syllabus", "حداقل ۱ ماژول با ۲ درس (همه با عنوان)"], ["quiz", "حداقل یک آزمون ماژول"], ["price", "قیمت مشخص (یا رایگان)"]];
  return rows.map(([k, l]) => `<li class="${c[k] ? "ok" : "no"}">${l}</li>`).join("");
}
function renderPreview() {
  const c = draftAsCourse(JSON.parse(JSON.stringify(D)));
  c.title = c.title || "عنوان دوره شما"; c.skills = c.skills.length ? c.skills : ["مهارت ۱", "مهارت ۲"];
  const previewUrl = /^\d+$/.test(String(D.id)) ? "/course/" + D.id + "/?preview=1" : "#";
  document.getElementById("b-card").innerHTML = courseCardHTML(c, { href: previewUrl });
  const lessons = c.syllabus.flatMap(m => m.lessons);
  document.getElementById("b-stats").innerHTML = `
    <div><b>${fa(c.syllabus.length)}</b><span>ماژول</span></div><div><b>${fa(lessons.length)}</b><span>درس</span></div>
    <div><b>${fa(c.hours)}</b><span>ساعت محتوا</span></div><div><b>${fa(lessons.filter(l => l.type === "quiz").length)}</b><span>آزمون ماژول</span></div>`;
  document.getElementById("b-check").innerHTML = checklistHTML(checks());
  const pl = document.getElementById("b-preview-link");
  pl.href = previewUrl;
  pl.onclick = previewUrl === "#" ? (e => { e.preventDefault(); saveDraft(false).then(() => location.href = "/course/" + D.id + "/?preview=1"); }) : null;
  document.getElementById("b-status").textContent = { draft: "پیش‌نویس", pending: "در انتظار بازبینی", published: "منتشرشده" }[D.status];
  document.getElementById("b-status").className = "status-pill " + D.status;
  if (step === 5) renderFinalCheck();
}
function renderFinalCheck() { document.getElementById("b-check-final").innerHTML = checklistHTML(checks()) + `<li class="${D.terms ? "ok" : "no"}">پذیرش شرایط انتشار</li>`; }
async function submitCourse() {
  const c = checks(); const bad = Object.keys(c).filter(k => !c[k]);
  if (bad.length || !D.terms) { renderFinalCheck(); toast("چند مورد از بررسی نهایی کامل نیست"); document.getElementById("b-check-final").scrollIntoView({ behavior: "smooth", block: "center" }); return; }
  const btn = window.event && window.event.target && window.event.target.closest ? window.event.target.closest("button") : null;
  await busy(btn, () => saveDraft(false, true));
  D.status = "pending"; renderPreview();
  toast(`دوره «${D.title}» برای بازبینی ارسال شد ✓ نتیجه تا ۳ روز کاری اعلام می‌شود`);
  setTimeout(() => location.href = (Auth.user.role === "employer" ? P.employer + "#training" : P.dashboard + "#courses"), 1400);
}
