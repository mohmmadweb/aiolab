/* ==========================================
   آیولب — اجزای رابط رزومه‌ی ساخت‌یافته و تطبیق
   انتخابگر آیتمی (تکی/چندتایی با جستجو)، تاریخ شمسی، سطح مهارت،
   نمایش جزئیات تطبیق، سازنده‌ی فیلتر AND/OR، اسلایدر تصاویر سازمان
   ========================================== */
const TUI = (() => {
  const e = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fa = n => String(n == null ? "" : n).replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]);
  let uid = 0;
  const id = () => "tui" + (++uid);

  /* ---------------- انتخابگر آیتمی ----------------
     options: [[value, label, group?], ...]  — مقدار همیشه یکی از گزینه‌هاست (نه متن آزاد) */
  const pickers = {};
  function picker(o) {
    const pid = id();
    pickers[pid] = Object.assign({ multi: false, value: o.multi ? [] : "", placeholder: "انتخاب کنید", onChange: null }, o);
    pickers[pid].value = o.multi ? [...(o.value || [])].map(String) : (o.value == null ? "" : String(o.value));
    return `<div class="tui-picker ${o.multi ? "multi" : ""}" id="${pid}" data-pid="${pid}">${pickerInner(pid)}</div>`;
  }
  function optLabel(p, v) { const x = p.options.find(x => String(x[0]) === String(v)); return x ? x[1] : v; }
  function pickerInner(pid) {
    const p = pickers[pid];
    if (p.multi) {
      return `<div class="tp-chips">${p.value.map(v => `<span class="tp-chip">${e(optLabel(p, v))}<button type="button" data-rm="${e(v)}" aria-label="حذف">×</button></span>`).join("")}
        <button type="button" class="tp-add" data-open>+ ${e(p.addLabel || "افزودن")}</button></div>`;
    }
    return `<button type="button" class="tp-btn ${p.value === "" ? "empty" : ""}" data-open>${e(p.value === "" ? p.placeholder : optLabel(p, p.value))}<i>▾</i></button>`;
  }
  function openPicker(pid, anchor) {
    closePickers();
    const p = pickers[pid];
    const pop = document.createElement("div");
    pop.className = "tp-pop";
    pop.dataset.pid = pid;
    pop.innerHTML = `<input class="tp-search" placeholder="جستجو…" autocomplete="off"><div class="tp-list"></div>`;
    document.body.appendChild(pop);
    const r = anchor.getBoundingClientRect();
    pop.style.top = (window.scrollY + r.bottom + 4) + "px";
    pop.style.right = Math.max(8, document.documentElement.clientWidth - r.right) + "px";
    pop.style.minWidth = Math.max(220, r.width) + "px";
    const list = pop.querySelector(".tp-list"), inp = pop.querySelector(".tp-search");
    const draw = q => {
      q = (q || "").trim();
      let lastG = null;
      list.innerHTML = p.options.filter(x => !q || String(x[1]).includes(q) || String(x[0]).toLowerCase().includes(q.toLowerCase()))
        .filter(x => !p.multi || !p.value.includes(String(x[0])))
        .slice(0, 300).map(x => {
          const g = x[2] && x[2] !== lastG ? `<div class="tp-group">${e(x[2])}</div>` : "";
          lastG = x[2] || lastG;
          return g + `<button type="button" class="tp-opt ${String(x[0]) === String(p.value) ? "on" : ""}" data-v="${e(x[0])}">${e(x[1])}</button>`;
        }).join("") || `<div class="tp-empty">موردی پیدا نشد</div>`;
    };
    draw("");
    inp.oninput = () => draw(inp.value);
    inp.focus();
    list.onclick = ev => {
      const b = ev.target.closest(".tp-opt"); if (!b) return;
      setValue(pid, p.multi ? [...p.value, b.dataset.v] : b.dataset.v);
      if (!p.multi) closePickers(); else { inp.value = ""; draw(""); inp.focus(); }
    };
  }
  function setValue(pid, v) {
    const p = pickers[pid]; if (!p) return;
    p.value = p.multi ? v.map(String) : String(v);
    const el = document.getElementById(pid); if (el) el.innerHTML = pickerInner(pid);
    if (p.onChange) p.onChange(p.value);
  }
  function closePickers() { document.querySelectorAll(".tp-pop").forEach(x => x.remove()); }
  const val = pid => pickers[pid] ? pickers[pid].value : null;
  document.addEventListener("click", ev => {
    const open = ev.target.closest("[data-open]");
    const host = ev.target.closest(".tui-picker");
    if (open && host) { ev.preventDefault(); openPicker(host.dataset.pid, open); return; }
    const rm = ev.target.closest("[data-rm]");
    if (rm && host) { ev.preventDefault(); const p = pickers[host.dataset.pid]; setValue(host.dataset.pid, p.value.filter(x => x !== rm.dataset.rm)); return; }
    if (!ev.target.closest(".tp-pop")) closePickers();
  });
  document.addEventListener("keydown", ev => { if (ev.key === "Escape") closePickers(); });

  /* ---------------- گزینه‌های آماده ---------------- */
  const O = {
    skills: () => AIO_SKILL_GROUPS.flatMap(g => AIO_SKILLS.filter(s => s.group === g.id).map(s => [s.id, s.name, g.name])),
    roles: () => AIO_ROLES.map(r => [r.id, r.name, (AIO_DEPARTMENTS.find(d => d.id === r.dept) || {}).name]),
    depts: () => AIO_DEPARTMENTS.map(d => [d.id, d.name]),
    seniority: () => AIO_SENIORITY.map(s => [s.v, s.name]),
    degrees: () => AIO_DEGREE_LEVELS.map(s => [s.v, s.name]),
    fields: () => AIO_FIELDS_STUDY.map(f => [f, f]),
    unis: () => AIO_UNIVERSITIES.map(u => [u.id, u.name]),
    licenses: () => AIO_LICENSES.map(l => [l.id, l.name]),
    langs: () => AIO_LANGUAGES.map(l => [l.id, l.name]),
    langLevels: () => AIO_LANG_LEVELS.map(l => [l.v, l.name]),
    levels: () => AIO_SKILL_LEVELS.map(l => [l.v, l.name]),
    provinces: () => AIO_PROVINCES.map(p => [p.id, p.name]),
    cities: provId => (provId ? (AIO_PROVINCES.find(p => p.id === provId) || { cities: [] }).cities : AIO_ALL_CITIES).map(c => [c, c]),
    jobTypes: () => AIO_JOB_TYPES.map(t => [t, t]),
    shifts: () => AIO_SHIFTS.map(t => [t, t]),
    genders: () => [["آقا", "آقا"], ["خانم", "خانم"]],
    military: () => AIO_MILITARY.filter(x => x !== "مهم نیست").map(t => [t, t]),
    availability: () => AIO_AVAILABILITY.map(a => [a.id, a.name]),
    orgTypes: () => AIO_ORG_TYPES.map(o => [o.id, o.short]),
    orgs: type => AIO_LABS.filter(l => !type || orgType(l) === type).map(l => [l.id, l.name]),
    productCats: () => AIO_PRODUCT_CATS.map(c => [c.id, c.name])
  };
  const name = {
    skill: id => (AIO_SKILLS.find(s => s.id === id) || { name: id }).name,
    role: id => (AIO_ROLES.find(r => r.id === id) || { name: id || "—" }).name,
    dept: id => (AIO_DEPARTMENTS.find(d => d.id === id) || { name: id || "—" }).name,
    uni: id => (AIO_UNIVERSITIES.find(u => u.id === id) || { name: id || "—" }).name,
    license: id => (AIO_LICENSES.find(l => l.id === id) || { name: id }).name,
    lang: id => (AIO_LANGUAGES.find(l => l.id === id) || { name: id }).name,
    level: v => (AIO_SKILL_LEVELS.find(l => l.v === +v) || { name: "—" }).name,
    langLevel: v => (AIO_LANG_LEVELS.find(l => l.v === +v) || { name: "—" }).name,
    degree: v => (AIO_DEGREE_LEVELS.find(l => l.v === +v) || { name: "—" }).name,
    seniority: v => (AIO_SENIORITY.find(l => l.v === +v) || { name: "—" }).name,
    province: id => (AIO_PROVINCES.find(p => p.id === id) || { name: id || "—" }).name,
    availability: id => (AIO_AVAILABILITY.find(a => a.id === id) || { name: "—" }).name
  };

  /* نوع سازمان (آزمایشگاه/شرکت) */
  function orgType(l) {
    if (l.orgType) return l.orgType;
    const x = (typeof AIO_ORG_EXTRA !== "undefined" && AIO_ORG_EXTRA[l.id]) || {};
    return x.orgType || (["manufacturer", "distributor", "importer"].includes(l.orgKind) ? "company" : "lab");
  }

  /* ---------------- تاریخ شمسی ---------------- */
  function yearOpts(from, to) { const a = []; for (let y = to; y >= from; y--) a.push(y); return a; }
  /* انتخابگر ماه/سال شمسی؛ مقدار ISO «YYYY-MM» */
  function monthYear(o) {
    const j = o.value ? AioDate.jParts(o.value + "-15") : null, cy = AioDate.thisJYear(), pid = id();
    return `<span class="tui-date" id="${pid}" data-kind="my">
      <select data-m aria-label="ماه"><option value="">ماه</option>${AioDate.MONTHS.slice(1).map((m, i) => `<option value="${i + 1}" ${j && j.m === i + 1 ? "selected" : ""}>${m}</option>`).join("")}</select>
      <select data-y aria-label="سال"><option value="">سال</option>${yearOpts(cy - 50, cy).map(y => `<option value="${y}" ${j && j.y === y ? "selected" : ""}>${fa(y)}</option>`).join("")}</select></span>`;
  }
  /* انتخابگر روز/ماه/سال (تاریخ تولد)؛ مقدار ISO کامل */
  function fullDate(o) {
    const j = o.value ? AioDate.jParts(o.value) : null, cy = AioDate.thisJYear(), pid = id();
    const days = []; for (let d = 1; d <= 31; d++) days.push(d);
    return `<span class="tui-date" id="${pid}" data-kind="full">
      <select data-d aria-label="روز"><option value="">روز</option>${days.map(d => `<option value="${d}" ${j && j.d === d ? "selected" : ""}>${fa(d)}</option>`).join("")}</select>
      <select data-m aria-label="ماه"><option value="">ماه</option>${AioDate.MONTHS.slice(1).map((m, i) => `<option value="${i + 1}" ${j && j.m === i + 1 ? "selected" : ""}>${m}</option>`).join("")}</select>
      <select data-y aria-label="سال"><option value="">سال</option>${yearOpts(cy - (o.back || 70), cy - (o.minAge || 0)).map(y => `<option value="${y}" ${j && j.y === y ? "selected" : ""}>${fa(y)}</option>`).join("")}</select></span>`;
  }
  function dateVal(el) {
    if (!el) return "";
    const y = el.querySelector("[data-y]").value, m = el.querySelector("[data-m]").value, d = el.querySelector("[data-d]");
    if (!y || !m || (d && !d.value)) return "";
    return d ? AioDate.fromJ(y, m, d.value) : AioDate.fromJ(y, m, 15).slice(0, 7);
  }

  /* ---------------- سطح ---------------- */
  function levels(o) {
    const pid = id(), list = o.list || AIO_SKILL_LEVELS;
    return `<span class="tui-levels" id="${pid}" data-value="${+o.value || 0}">${list.map(l => `<button type="button" class="${+o.value >= l.v ? "on" : ""}" data-lv="${l.v}" title="${e(l.name)}">${fa(l.v)}</button>`).join("")}<small>${e(((list.find(l => l.v === +o.value)) || { name: "" }).name)}</small></span>`;
  }
  document.addEventListener("click", ev => {
    const b = ev.target.closest(".tui-levels [data-lv]"); if (!b) return;
    const host = b.parentElement, v = +b.dataset.lv;
    host.dataset.value = v;
    host.querySelectorAll("[data-lv]").forEach(x => x.classList.toggle("on", +x.dataset.lv <= v));
    const list = host.dataset.list === "lang" ? AIO_LANG_LEVELS : AIO_SKILL_LEVELS;
    host.querySelector("small").textContent = ((list.find(l => l.v === v)) || { name: "" }).name;
    host.dispatchEvent(new Event("change", { bubbles: true }));
  });

  /* ---------------- نمایش تطبیق ---------------- */
  const FIT = { high: ["بالا", "#047857", "#d1fae5"], mid: ["متوسط", "#92400e", "#fef3c7"], low: ["پایین", "#9a3412", "#ffedd5"], none: ["نامرتبط", "#64748b", "#f1f5f9"] };
  const fitBadge = m => { const f = FIT[m.fit]; return `<span class="fit-badge" style="color:${f[1]};background:${f[2]}">${fa(m.score)}٪ · ${f[0]}</span>`; };
  const ring = (m, size) => `<div class="mring" style="--p:${m.score};--sz:${size || 58}px"><i>${fa(m.score)}٪</i></div>`;
  function breakdown(m) {
    const st = { full: ["کامل", "ok"], partial: ["جزئی", "mid"], none: ["ندارد", "no"] };
    return `<div class="mb-wrap">
      ${m.blockers.length ? `<div class="notice-box err" style="margin-bottom:12px">شرط الزامی برآورده نشده: ${m.blockers.map(e).join("، ")}</div>` : ""}
      <div class="mb-scores"><span>پوشش مهارت‌ها <b>${fa(m.skillScore)}٪</b></span><span>سایر معیارها <b>${fa(m.critScore)}٪</b></span><span>امتیاز نهایی ${fitBadge(m)}</span></div>
      ${m.skills.length ? `<div class="table-wrap"><table class="data mb-table"><thead><tr><th>مهارت</th><th>وزن</th><th>لازم</th><th>متقاضی</th><th>پوشش</th></tr></thead><tbody>
        ${m.skills.map(s => `<tr><td>${e(s.name)}${s.must ? ' <span class="chip sm warn">کلیدی</span>' : ""}</td><td>${fa(s.w)}</td><td>${e(s.lvlName)}</td><td>${e(s.haveName)}</td><td><span class="cov ${st[s.status][1]}">${st[s.status][0]}</span></td></tr>`).join("")}
      </tbody></table></div>` : ""}
      ${m.criteria.length ? `<ul class="mb-crit">${m.criteria.map(c => `<li class="${c.ok ? "ok" : c.pts > 0.5 ? "mid" : "no"}"><b>${e(c.label)}</b><span>لازم: ${e(fa(c.need))}</span><span>متقاضی: ${e(fa(c.has))}</span></li>`).join("")}</ul>` : ""}
    </div>`;
  }

  /* خلاصه‌ی رزومه برای کارت‌ها و کشو */
  function candSummary(c) {
    const p = c._p || (c._p = AioMatch.profile(c));
    const cur = p.current || p.last;
    return [cur ? name.role(cur.role) : (c.targetRoles && c.targetRoles[0] ? name.role(c.targetRoles[0]) : ""), c.city, p.expMonths ? AioDate.durText(p.expMonths) + " سابقه" : "بدون سابقه", p.age != null ? fa(p.age) + " ساله" : ""].filter(Boolean).join(" · ");
  }
  function candDetail(c, m) {
    const p = c._p || (c._p = AioMatch.profile(c));
    const exp = [...(c.experience || [])].sort((a, b) => (b.end || "9999") < (a.end || "9999") ? -1 : 1);
    return `<div class="cd-head"><div class="avatar" style="background:${c.color || ["#0d9488", "#6366f1", "#f43f5e", "#f59e0b", "#0ea5e9", "#8b5cf6", "#059669", "#ea580c"][c.id % 8]}">${e(c.name.charAt(0))}</div>
        <div><h2>${e(c.name)}</h2><p>${e(candSummary(c))}</p>
        <div class="job-meta">${c.otw ? '<span class="chip teal">آماده به کار</span>' : ""}${c.relocate ? '<span class="chip">آماده جابه‌جایی</span>' : ""}<span class="chip">آمادگی: ${e(name.availability(c.availability))}</span>${c.mbti ? `<span class="chip">${e(c.mbti)}</span>` : ""}</div></div>
        ${m ? ring(m, 76) : ""}</div>
      ${m ? `<h3>تطبیق با پوزیشن</h3>${breakdown(m)}` : ""}
      <h3>سوابق کاری <small>(${e(AioDate.durText(p.expMonths))})</small></h3>
      ${exp.length ? `<div class="cd-timeline">${exp.map(x => `<div><b>${e(name.role(x.role))}</b> — ${e(x.orgName || "")}<small>${e(AioDate.toJ(x.start, true))} تا ${x.end ? e(AioDate.toJ(x.end, true)) : "اکنون"} · ${e(AioDate.durText(AioDate.months(x.start, x.end)))} · ${e(name.dept(x.dept))}</small></div>`).join("")}</div>` : '<p class="muted">بدون سابقه کاری</p>'}
      <h3>تحصیلات</h3>${(c.education || []).map(x => `<p>${e(name.degree(x.degree))} ${e(x.field)} — ${e(name.uni(x.uni))} <small class="muted">${x.start ? fa(x.start - 621) : ""}${x.end ? "–" + fa(x.end - 621) : " (در حال تحصیل)"}</small></p>`).join("") || '<p class="muted">—</p>'}
      <h3>مهارت‌ها</h3><div class="tag-list">${(c.skills || []).map(s => `<span class="tag">${e(name.skill(s.id))} · ${e(name.level(s.lvl))}</span>`).join("")}</div>
      ${(c.licenses || []).length ? `<h3>مدارک و پروانه‌ها</h3><div class="tag-list">${c.licenses.map(l => `<span class="tag">${e(name.license(l.id))}${l.expires && l.expires < new Date().toISOString().slice(0, 7) ? " (منقضی)" : ""}</span>`).join("")}</div>` : ""}
      ${(c.langs || []).length ? `<h3>زبان</h3><div class="tag-list">${c.langs.map(l => `<span class="tag">${e(name.lang(l.id))} · ${e(name.langLevel(l.lvl))}</span>`).join("")}</div>` : ""}
      <h3>ترجیحات</h3><p>نوع همکاری: ${e((c.wantTypes || []).join("، ") || "—")} · شیفت: ${e((c.wantShifts || []).join("، ") || "—")} · حقوق درخواستی: ${c.salaryMin ? fa(c.salaryMin) + (c.salaryMax ? " تا " + fa(c.salaryMax) : "") + " میلیون" : "توافقی"}</p>
      ${c.summary ? `<h3>خلاصه</h3><p>${e(c.summary)}</p>` : ""}`;
  }

  /* ---------------- سازنده‌ی فیلتر AND/OR ---------------- */
  const OPS = { has: "دارد", ">=": "حداقل", "<=": "حداکثر", "=": "برابر", between: "بین", in: "یکی از", notin: "هیچ‌کدام از", hasall: "همه‌ی", hasany: "حداقل یکی از", is: "هست" };
  function builder(host, tree, onChange, ctx) {
    host.__tree = tree && tree.rules ? tree : { op: "and", rules: [] };
    host.__ctx = ctx || {};
    const F = AioMatch.fields();
    const fdef = k => F.find(f => f.key === k);
    const valueEditor = (r, path) => {
      const f = fdef(r.field); if (!f) return "";
      const opts = f.options ? f.options() : [];
      const sel = (key, list, cur) => `<select data-path="${path}" data-k="${key}">${list.map(([v, l]) => `<option value="${e(v)}" ${String(cur) === String(v) ? "selected" : ""}>${e(l)}</option>`).join("")}</select>`;
      switch (f.type) {
        case "skill": r.value = r.value || { id: opts[0][0], lvl: 3 }; return sel("v.id", opts, r.value.id) + sel("v.lvl", AIO_SKILL_LEVELS.map(l => [l.v, "حداقل " + l.name]), r.value.lvl);
        case "lang": r.value = r.value || { id: opts[0][0], lvl: 2 }; return sel("v.id", opts, r.value.id) + sel("v.lvl", AIO_LANG_LEVELS.map(l => [l.v, "حداقل " + l.name]), r.value.lvl);
        case "deptyears": r.value = r.value || { dept: opts[0][0], years: 1 }; return sel("v.dept", opts, r.value.dept) + `<input type="number" min="0" step="0.5" data-path="${path}" data-k="v.years" value="${e(r.value.years)}"><span>سال</span>`;
        case "number": if (!Array.isArray(r.value)) r.value = [r.value != null ? r.value : 0, 0];
          return `<input type="number" min="0" step="0.5" data-path="${path}" data-k="v.0" value="${e(r.value[0])}">` + (r.op === "between" ? `<span>تا</span><input type="number" min="0" step="0.5" data-path="${path}" data-k="v.1" value="${e(r.value[1])}">` : "");
        case "number-select": if (!Array.isArray(r.value)) r.value = [r.value != null ? r.value : opts[0][0]]; return sel("v.0", opts, r.value[0]);
        case "bool": if (typeof r.value !== "boolean") r.value = true; return sel("v.bool", [["true", "بله"], ["false", "خیر"]], String(r.value));
        case "jobscore": r.value = r.value || { job: ((host.__ctx.jobs || [])[0] || {}).id, min: 60 };
          return sel("v.job", (host.__ctx.jobs || []).map(j => [j.id, j.title]), r.value.job) + `<input type="number" min="0" max="100" data-path="${path}" data-k="v.min" value="${e(r.value.min)}"><span>٪</span>`;
        default: if (!Array.isArray(r.value)) r.value = [];
          const pid = picker({ multi: true, options: opts, value: r.value, addLabel: "انتخاب", onChange: v => { r.value = v; fire(); } });
          return pid;
      }
    };
    const ruleHTML = (r, path) => {
      const f = fdef(r.field) || F[0];
      if (!f.ops.includes(r.op)) r.op = f.ops[0];
      return `<div class="fb-rule">
        <select data-path="${path}" data-k="field">${F.map(x => `<option value="${x.key}" ${x.key === r.field ? "selected" : ""}>${e(x.label)}</option>`).join("")}</select>
        ${f.ops.length > 1 ? `<select data-path="${path}" data-k="op">${f.ops.map(o => `<option value="${o}" ${o === r.op ? "selected" : ""}>${OPS[o]}</option>`).join("")}</select>` : `<span class="fb-op">${OPS[r.op]}</span>`}
        <span class="fb-val">${valueEditor(r, path)}</span>
        <button type="button" class="fb-x" data-path="${path}" data-act="rm" aria-label="حذف شرط">✕</button></div>`;
    };
    const groupHTML = (g, path, depth) => `<div class="fb-group ${depth ? "nested" : ""}" data-op="${g.op}">
        <div class="fb-ghead"><span>اگر</span>
          <div class="fb-toggle"><button type="button" class="${g.op === "and" ? "on" : ""}" data-path="${path}" data-act="op" data-v="and">همه‌ی شرط‌ها (AND)</button><button type="button" class="${g.op === "or" ? "on" : ""}" data-path="${path}" data-act="op" data-v="or">حداقل یکی (OR)</button></div>
          ${depth ? `<button type="button" class="fb-x" data-path="${path}" data-act="rm" aria-label="حذف گروه">✕</button>` : ""}</div>
        ${g.rules.map((r, i) => r.rules ? groupHTML(r, path + "." + i, depth + 1) : ruleHTML(r, path + "." + i)).join(`<div class="fb-join">${g.op === "and" ? "و" : "یا"}</div>`)}
        <div class="fb-actions"><button type="button" class="btn btn-sm btn-outline" data-path="${path}" data-act="add">+ شرط</button>${depth < 2 ? `<button type="button" class="btn btn-sm btn-ghost" data-path="${path}" data-act="addg">+ گروه (پرانتز)</button>` : ""}</div>
      </div>`;
    const get = path => path.split(".").slice(1).reduce((n, i) => n.rules[+i], host.__tree);
    const parentOf = path => { const p = path.split("."); const i = +p.pop(); return [get(p.join(".")), i]; };
    function draw() { host.innerHTML = groupHTML(host.__tree, "r", 0); }
    function fire() { if (onChange) onChange(host.__tree); }
    host.onclick = ev => {
      const b = ev.target.closest("[data-act]"); if (!b) return;
      const path = b.dataset.path, act = b.dataset.act;
      if (act === "op") get(path).op = b.dataset.v;
      if (act === "add") get(path).rules.push({ field: "skill", op: "has", value: null });
      if (act === "addg") get(path).rules.push({ op: "or", rules: [{ field: "province", op: "in", value: [] }] });
      if (act === "rm") { const [par, i] = parentOf(path); par.rules.splice(i, 1); }
      draw(); fire();
    };
    host.onchange = ev => {
      const t = ev.target, path = t.dataset.path, k = t.dataset.k; if (!path || !k) return;
      const r = get(path);
      if (k === "field") { r.field = t.value; r.op = (fdef(t.value) || F[0]).ops[0]; r.value = null; draw(); fire(); return; }
      if (k === "op") { r.op = t.value; draw(); fire(); return; }
      const [, sub, idx] = k.split(".");
      if (sub === "bool") r.value = t.value === "true";
      else if (/^\d$/.test(sub)) { r.value = Array.isArray(r.value) ? r.value : []; r.value[+sub] = +t.value; }
      else r.value = Object.assign({}, r.value, { [sub]: isNaN(+t.value) || sub === "id" || sub === "dept" ? t.value : +t.value });
      fire();
    };
    draw();
    return { get tree() { return host.__tree; }, set(t) { host.__tree = t; draw(); } };
  }
  /* توضیح متنی درخت شرط */
  function describe(t) {
    if (!t || !t.rules || !t.rules.length) return "بدون فیلتر";
    const F = AioMatch.fields();
    const one = r => {
      if (r.rules) return "(" + describe(r) + ")";
      const f = F.find(x => x.key === r.field) || { label: r.field }, v = r.value;
      const lab = list => (Array.isArray(v) ? v : [v]).map(x => { const o = (f.options ? f.options() : []).find(o => String(o[0]) === String(x)); return o ? o[1] : x; }).join("، ");
      if (f.type === "skill") return `${name.skill(v.id)} (حداقل ${name.level(v.lvl)})`;
      if (f.type === "lang") return `${name.lang(v.id)} (حداقل ${name.langLevel(v.lvl)})`;
      if (f.type === "deptyears") return `سابقه ${name.dept(v.dept)} ≥ ${fa(v.years)} سال`;
      if (f.type === "number") return `${f.label} ${OPS[r.op]} ${fa(v[0])}${r.op === "between" ? " تا " + fa(v[1]) : ""}`;
      if (f.type === "number-select") return `${f.label} ${OPS[r.op]} ${lab(v)}`;
      if (f.type === "bool") return `${f.label}: ${v ? "بله" : "خیر"}`;
      if (f.type === "jobscore") return `تطبیق ≥ ${fa(v.min)}٪`;
      return `${f.label} ${OPS[r.op]} ${lab(v) || "…"}`;
    };
    return t.rules.map(one).join(t.op === "and" ? " و " : " یا ");
  }

  /* ---------------- اسلایدر تصاویر سازمان ---------------- */
  function slider(slides) {
    if (!slides || !slides.length) return "";
    const sid = id();
    const slide = (s, i) => s.img
      ? `<figure class="sl-item"><img src="${e(s.img)}" alt="${e(s.t || "")}" loading="${i ? "lazy" : "eager"}">${s.t ? `<figcaption>${e(s.t)}</figcaption>` : ""}</figure>`
      : `<figure class="sl-item sl-ph" style="--sc:${e(s.c || "#0d9488")}"><svg viewBox="0 0 120 80" aria-hidden="true"><circle cx="92" cy="18" r="10" fill="#fff" opacity=".35"/><path d="M0 70 30 38l22 20 18-14 50 36z" fill="#fff" opacity=".28"/></svg>${s.t ? `<figcaption>${e(s.t)}</figcaption>` : ""}</figure>`;
    if (slides.length > 1) setTimeout(() => {
      const el = document.getElementById(sid); if (!el) return;
      const track = el.querySelector(".sl-track"), dots = el.querySelectorAll(".sl-dots button");
      let i = 0;
      const go = n => { i = (n + slides.length) % slides.length; track.scrollTo({ left: -i * track.clientWidth, behavior: "smooth" }); dots.forEach((d, k) => d.classList.toggle("on", k === i)); };
      el.querySelector(".sl-prev").onclick = () => go(i - 1);
      el.querySelector(".sl-next").onclick = () => go(i + 1);
      dots.forEach((d, k) => d.onclick = () => go(k));
      let t = setInterval(() => go(i + 1), 5000);
      el.addEventListener("mouseenter", () => clearInterval(t));
      el.addEventListener("mouseleave", () => { t = setInterval(() => go(i + 1), 5000); });
    }, 50);
    return `<div class="org-slider" id="${sid}"><div class="sl-track">${slides.map(slide).join("")}</div>
      ${slides.length > 1 ? `<button type="button" class="sl-prev" aria-label="قبلی">›</button><button type="button" class="sl-next" aria-label="بعدی">‹</button>
      <div class="sl-dots">${slides.map((_, k) => `<button type="button" class="${k ? "" : "on"}" aria-label="اسلاید ${fa(k + 1)}"></button>`).join("")}</div>` : ""}</div>`;
  }

  /* کارت محصول */
  function productCard(pr, href) {
    const cat = AIO_PRODUCT_CATS.find(c => c.id === pr.cat) || {}, org = AIO_LABS.find(l => l.id === pr.orgId) || {};
    return `<a class="prod-card" href="${e(href || pr.url || "product.html?id=" + pr.id)}">
      <div class="pc-img" style="--pc:${pr.color || cat.color};--pbg:${cat.bg || "#f1f5f9"}">${pr.img ? `<img src="${e(pr.img)}" alt="">` : (typeof ICONS !== "undefined" ? (ICONS[cat.icon] || ICONS.flask) : "")}</div>
      <div class="pc-body"><span class="pc-cat">${e(cat.name || "")}</span><h3>${e(pr.name)}</h3>
        <small>${e(org.name || "")}</small>
        <b class="pc-price">${pr.price ? fa(Number(pr.price).toLocaleString("en")).replace(/,/g, "٬") + " تومان" : "استعلام قیمت"}</b></div></a>`;
  }

  return { e, fa, picker, setValue, val, O, name, orgType, monthYear, fullDate, dateVal, levels, fitBadge, ring, breakdown, candSummary, candDetail, builder, describe, slider, productCard, FIT };
})();
