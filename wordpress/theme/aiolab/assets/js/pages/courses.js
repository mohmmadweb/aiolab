function checks(containerId, name, values, labels) {
  document.getElementById(containerId).innerHTML = values.map((v, i) =>
    `<label class="check-item"><input type="checkbox" name="${name}" value="${v}"> ${labels ? labels[i] : v}</label>`).join("");
}
const getChecked = name => [...document.querySelectorAll(`input[name="${name}"]:checked`)].map(i => i.value);
const getRadio = name => (document.querySelector(`input[name="${name}"]:checked`) || {}).value || "";

document.addEventListener("DOMContentLoaded", () => {
  /* آمار هیرو */
  const totalStudents = AIO_COURSES.reduce((s, c) => s + c.students, 0);
  const stats = [
    ["grad", fa(AIO_COURSES.length), "دوره و پروژه راهنما"],
    ["path", fa(AIO_LEARNING_PATHS.length), "مسیر یادگیری و گواهی حرفه‌ای"],
    ["users", "+" + fa(Math.round(totalStudents / 100) * 100), "فراگیر"],
    ["building", fa(AIO_PROVIDERS.length), "دانشگاه، مرکز و شرکت ارائه‌دهنده"]
  ];
  document.getElementById("acad-stats").innerHTML = stats.map(([ic, n, t]) => `
    <div class="stat-card"><div class="ic">${ICONS[ic]}</div><div><b>${n}</b><span>${t}</span></div></div>`).join("");
  document.getElementById("trend-skills").innerHTML = AIO_TRENDING_SKILLS.map(s =>
    `<a href="/courses/?q=${encodeURIComponent(s)}" onclick="event.preventDefault();setQ('${s}')">${s}</a>`).join("");

  /* دسته‌ها */
  document.getElementById("cat-chips").innerHTML =
    `<button class="cat-chip on" data-cat="" onclick="setCat('')">همه</button>` +
    AIO_COURSE_CATS.map(c => `<button class="cat-chip" data-cat="${c.id}" onclick="setCat('${c.id}')">${ICONS[c.icon] || ""} ${c.name} <small>(${fa(AIO_COURSES.filter(x => x.cat === c.id).length)})</small></button>`).join("");
  document.getElementById("f-cat").insertAdjacentHTML("beforeend",
    AIO_COURSE_CATS.map(c => `<option value="${c.id}">${c.name}</option>`).join(""));

  /* مسیرها */
  document.getElementById("path-grid").innerHTML = AIO_LEARNING_PATHS.map(pathCardHTML).join("");
  document.getElementById("paths-count").textContent = fa(AIO_LEARNING_PATHS.length) + " مسیر";

  /* فیلترها */
  checks("f-type",     "type",     ["course", "guided"], ["دوره", "پروژه راهنما"]);
  checks("f-level",    "level",    AIO_COURSE_LEVELS);
  checks("f-format",   "format",   AIO_COURSE_FORMATS.map(f => f.id), AIO_COURSE_FORMATS.map(f => f.name));
  checks("f-duration", "duration", AIO_COURSE_DURATIONS.map(d => d.id), AIO_COURSE_DURATIONS.map(d => d.name));
  checks("f-lang",     "lang",     AIO_COURSE_LANGS);
  checks("f-prov",     "prov",     AIO_PROVIDERS.map(p => p.id), AIO_PROVIDERS.map(p => p.name));

  /* پارامترهای URL: ?cat= ?q= ?level= ?free=1 ?skill= */
  if (qs("cat")) document.getElementById("f-cat").value = qs("cat");
  if (qs("q")) document.getElementById("f-q").value = qs("q");
  if (qs("skill")) document.getElementById("f-q").value = qs("skill");
  if (qs("level")) { const cb = document.querySelector(`input[name="level"][value="${qs("level")}"]`); if (cb) cb.checked = true; }
  if (qs("free")) document.querySelector('input[name="price"][value="free"]').checked = true;
  if (qs("type")) { const cb = document.querySelector(`input[name="type"][value="${qs("type")}"]`); if (cb) cb.checked = true; }

  document.querySelectorAll(".crs-filters input, .crs-filters select, #f-sort").forEach(el => el.addEventListener("input", render));
  render();
  if (qs("cat") || qs("q") || qs("skill") || qs("free") || qs("level") || qs("type")) setTimeout(() => document.getElementById("catalog").scrollIntoView({ behavior: "smooth" }), 150);

  /* مدرسان */
  document.getElementById("instr-grid").innerHTML = AIO_INSTRUCTORS.map(i => `
    <div class="instr-card">
      <div class="avatar" style="background:${i.color}">${i.name.replace("دکتر ", "").replace("مهندس ", "").charAt(0)}</div>
      <b>${i.name}</b><span>${i.title}</span><span>${i.org}</span>
      <div class="im"><span>★ ${fa(i.rating)}</span><span>${fa(i.students)} فراگیر</span><span>${fa(i.courses)} دوره</span></div>
    </div>`).join("");

  /* بخش‌های حفظ‌شده از نسخه قبل */
  document.getElementById("course-services").innerHTML =
    servicesOf("course").concat(servicesOf("advice")).map(x => serviceCardHTML(x)).join("");
  /* آزمون‌های مهارتی به تفکیک دسته‌های آموزشی (از پیشخوان) */
  const exams = AIO_COURSE_CATS.slice(0, 8).map(c => [c.name, c.icon, c.color, c.bg, c.id]);
  document.getElementById("exams").innerHTML = exams.map(([name, icon, color, bg, cat]) => {
    const ex = AIO_EXAMS.find(e => e.dept === cat);
    const href = ex ? `/exam/${ex.id}/` : `/courses/?cat=${cat}`;
    return `<a class="cat-card" href="${href}">
      <div class="ic" style="background:${bg};color:${color}">${ICONS[icon]}</div>
      <b>آزمون ${name}</b>
      <span>${ex ? "آزمون فعال + گواهی" : "به‌زودی · دوره‌های مرتبط"}</span>
    </a>`;
  }).join("");
});

function currentFilters() {
  return {
    q: document.getElementById("f-q").value.trim(),
    cat: document.getElementById("f-cat").value,
    type: getChecked("type"), level: getChecked("level"), format: getChecked("format"),
    duration: getChecked("duration"), lang: getChecked("lang"), provider: getChecked("prov"),
    price: getRadio("price"), rating: parseFloat(getRadio("rating")) || 0,
    cert: document.getElementById("f-cert").checked
  };
}

function render() {
  const f = currentFilters();
  const list = sortCourses(filterCourses(f), document.getElementById("f-sort").value);
  document.getElementById("count").textContent = fa(list.length);
  document.getElementById("course-grid").innerHTML = list.map(c => courseCardHTML(c)).join("");
  document.getElementById("empty").style.display = list.length ? "none" : "block";
  document.querySelectorAll(".cat-chip").forEach(b => b.classList.toggle("on", b.dataset.cat === f.cat));
  renderChips(f);
}

function renderChips(f) {
  const chips = [];
  const add = (label, clear) => chips.push(`<button class="a-chip" onclick="${clear}">${label} ✕</button>`);
  if (f.q) add(`«${f.q}»`, `document.getElementById('f-q').value='';render()`);
  if (f.cat) add(courseCat(f.cat).name, `setCat('')`);
  f.type.forEach(v => add(v === "guided" ? "پروژه راهنما" : "دوره", `uncheck('type','${v}')`));
  f.level.forEach(v => add(v, `uncheck('level','${v}')`));
  f.format.forEach(v => add(courseFormat(v).name, `uncheck('format','${v}')`));
  f.duration.forEach(v => add(AIO_COURSE_DURATIONS.find(d => d.id === v).name, `uncheck('duration','${v}')`));
  f.lang.forEach(v => add(v, `uncheck('lang','${v}')`));
  f.provider.forEach(v => add(provider(v).name, `uncheck('prov','${v}')`));
  if (f.price) add(f.price === "free" ? "رایگان" : "پولی", `document.querySelector('input[name=price][value=""]').checked=true;render()`);
  if (f.rating) add(`امتیاز ${fa(f.rating)}+`, `document.querySelector('input[name=rating][value=""]').checked=true;render()`);
  if (f.cert) add("گواهی‌دار", `document.getElementById('f-cert').checked=false;render()`);
  document.getElementById("chips").innerHTML = chips.length
    ? chips.join("") + `<button class="a-chip clear" onclick="resetFilters()">حذف همه فیلترها</button>` : "";
}

function uncheck(name, value) { const cb = document.querySelector(`input[name="${name}"][value="${value}"]`); if (cb) cb.checked = false; render(); }
function setCat(id) { document.getElementById("f-cat").value = id; render(); document.getElementById("catalog").scrollIntoView({ behavior: "smooth" }); }
function setQ(q) { document.getElementById("f-q").value = q; render(); document.getElementById("catalog").scrollIntoView({ behavior: "smooth" }); }
function heroSearch(e) { e.preventDefault(); setQ(document.getElementById("hq").value.trim()); }
function resetFilters() {
  document.querySelectorAll(".crs-filters input[type=checkbox]").forEach(i => i.checked = false);
  document.querySelectorAll('input[name="price"], input[name="rating"]').forEach(i => i.checked = i.value === "");
  document.getElementById("f-q").value = ""; document.getElementById("f-cat").value = "";
  render();
}
