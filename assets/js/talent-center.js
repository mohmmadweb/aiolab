/* ==========================================
   آیولب — مرکز تطبیق هوشمند (مشترک بین talent.html و پنل کارفرما)
   ۱) نیروهای مناسب هر پوزیشن  ۲) پوزیشن‌های مناسب هر نفر
   ۳) جستجوی پیشرفته با شرط‌های AND/OR تودرتو  ۴) خروجی ساخت‌یافته برای یکپارچه‌سازی با سایت‌های دیگر
   ========================================== */
const TalentCenter = (() => {
  const { e, fa, name } = TUI;
  const COLORS = ["#0d9488", "#6366f1", "#f43f5e", "#f59e0b", "#0ea5e9", "#8b5cf6", "#059669", "#ea580c"];
  const colorOf = c => c.color || COLORS[c.id % COLORS.length];
  const st = (k, d) => (typeof Store !== "undefined" ? Store.get(k, d) : d);

  const PRESETS = [
    { name: "هماتولوژی تهران با Sysmex پیشرفته", tree: { op: "and", rules: [
      { field: "skill", op: "has", value: { id: "sysmex-xn", lvl: 4 } },
      { op: "or", rules: [{ field: "province", op: "in", value: ["tehran"] }, { field: "relocate", op: "is", value: true }] }] } },
    { name: "حداقل ۳ سال سابقه + کارشناسی ارشد یا بالاتر", tree: { op: "and", rules: [
      { field: "expTotal", op: ">=", value: [3] }, { field: "degree", op: ">=", value: [4] }] } },
    { name: "آقایان پایان خدمت ۲۵ تا ۳۵ سال، آماده به کار", tree: { op: "and", rules: [
      { field: "gender", op: "in", value: ["آقا"] }, { field: "military", op: "in", value: ["پایان خدمت", "معافیت دائم"] },
      { field: "age", op: "between", value: [25, 35] }, { field: "otw", op: "is", value: true }] } },
    { name: "مولکولی: PCR یا NGS + زبان انگلیسی", tree: { op: "and", rules: [
      { op: "or", rules: [{ field: "skill", op: "has", value: { id: "pcr", lvl: 3 } }, { field: "skill", op: "has", value: { id: "ngs", lvl: 3 } }] },
      { field: "lang", op: "has", value: { id: "en", lvl: 3 } }] } }
  ];

  function drawer() {
    let d = document.getElementById("tl-drawer");
    if (!d) {
      d = document.createElement("aside");
      d.id = "tl-drawer"; d.className = "tl-drawer"; d.setAttribute("aria-hidden", "true");
      document.body.appendChild(d);
      document.addEventListener("keydown", ev => { if (ev.key === "Escape") closeDrawer(); });
    }
    return d;
  }
  function openDrawer(html) {
    const d = drawer();
    d.innerHTML = `<button class="x" type="button" aria-label="بستن" onclick="TalentCenter.close()">✕</button>${html}`;
    d.classList.add("open"); d.setAttribute("aria-hidden", "false"); d.scrollTop = 0;
  }
  function closeDrawer() { const d = document.getElementById("tl-drawer"); if (d) { d.classList.remove("open"); d.setAttribute("aria-hidden", "true"); } }

  /* خلاصه‌ی نیازمندی‌های پوزیشن به‌صورت چیپ */
  function reqChips(j) {
    const r = j.req || {};
    const c = [];
    if (r.role) c.push(name.role(r.role));
    if (r.seniority) c.push("رده: " + name.seniority(r.seniority));
    if (r.minExp) c.push("سابقه ≥ " + AioDate.durText(r.minExp));
    if (r.expDept) c.push("سابقه بخش ≥ " + AioDate.durText(r.expDept));
    if (r.degree) c.push("حداقل " + name.degree(r.degree));
    if ((r.fields || []).length) c.push("رشته: " + r.fields.join("/"));
    (r.licenses || []).forEach(l => c.push(name.license(l)));
    (r.langs || []).forEach(l => c.push(name.lang(l.id) + " ≥ " + name.langLevel(l.lvl)));
    if (r.age) c.push("سن " + fa(r.age[0]) + "–" + fa(r.age[1]));
    if (r.gender && r.gender !== "فرقی نمی‌کند") c.push(r.gender);
    return `<div class="job-meta">${c.map(x => `<span class="chip">${e(x)}</span>`).join("")}</div>
      <div class="tag-list" style="margin-top:8px">${(r.skills || []).map(s => `<span class="tag">${e(name.skill(s.id))} · ${e(name.level(s.lvl))} · وزن ${fa(s.w)}${s.must ? " · کلیدی" : ""}</span>`).join("")}</div>`;
  }
  /* «چرا؟» — دو نکته‌ی مهم */
  function why(m) {
    if (m.blockers.length) return "⛔ " + m.blockers[0];
    const miss = m.skills.filter(s => s.status !== "full").sort((a, b) => b.w - a.w)[0];
    const hit = m.skills.filter(s => s.status === "full").sort((a, b) => b.w - a.w)[0];
    return [hit ? "✓ " + hit.name : "", miss ? "✗ " + miss.name : ""].filter(Boolean).join(" · ");
  }
  const posLabel = j => j.internal ? "پوزیشن داخلی" : j.mine ? "پوزیشن من" : "آگهی عمومی";
  const posOptions = list => list.map(j => [j.id, j.title + " — " + (j.orgName || ""), posLabel(j)]);

  function summary(list) {
    const n = k => list.filter(x => x.m.fit === k).length;
    const bins = Array(10).fill(0); list.forEach(x => bins[Math.min(9, Math.floor(x.m.score / 10))]++);
    const mx = Math.max(1, ...bins);
    return `<div class="tl-summary"><div><b>${fa(list.length)}</b><span>کل</span></div><div><b>${fa(n("high"))}</b><span>تطبیق بالا (≥۷۵)</span></div>
      <div><b>${fa(n("mid"))}</b><span>متوسط</span></div><div><b>${fa(list.filter(x => x.m.eligible).length)}</b><span>واجد شرایط الزامی</span></div></div>
      <div class="tl-dist" title="توزیع امتیاز تطبیق (۰ تا ۱۰۰)">${bins.map((b, i) => `<i style="height:${b / mx * 100}%" title="${fa(i * 10)}–${fa(i * 10 + 9)}: ${fa(b)} نفر"></i>`).join("")}</div>`;
  }

  function mount(host, opts) {
    opts = opts || {};
    const params = new URLSearchParams(location.search);
    /* فیلترهای ذخیره‌شده: دمو در حافظه‌ی مرورگر؛ وردپرس روی سرور (opts.saved) */
    const SV = opts.saved || {
      list: () => st("tl_filters", []),
      add: async (n, tree) => { const a = st("tl_filters", []); a.push({ name: n, tree }); Store.set("tl_filters", a); },
      remove: async i => { const a = st("tl_filters", []); a.splice(i, 1); Store.set("tl_filters", a); }
    };
    const S = { tab: opts.tab || params.get("tab") || (params.get("cand") ? "bycand" : "byjob"),
                job: params.get("job") || "", cand: params.get("cand") || "", onlyOk: false, min: 0,
                tree: st("tl_last_filter", PRESETS[0].tree), rankJob: "" };
    const positions = () => aioPositions().map(j => Object.assign(j, { mine: !!j.mine }));
    const cands = () => aioCandidates();
    if (!positions().length || !cands().length) {
      host.innerHTML = `<div class="empty-state"><b>${!positions().length ? "هنوز پوزیشنی با نیازمندی ساخت‌یافته ثبت نشده است" : "هنوز رزومه‌ی ساخت‌یافته‌ای در دسترس نیست"}</b>${!positions().length ? "از بخش «ثبت آگهی / پوزیشن» مهارت‌ها و شرایط احراز را تعریف کنید." : "رزومه‌های کارجویانِ «آماده به کار» این‌جا نمایش داده می‌شوند."}</div>`;
      return { show() {}, state: {} };
    }
    if (!S.job || !positions().some(j => String(j.id) === String(S.job))) S.job = String(positions()[0].id);
    if (!S.cand || !cands().some(c => String(c.id) === String(S.cand))) S.cand = String(cands()[0].id);

    host.innerHTML = `
      <div class="tl-tabs" role="tablist">
        <button type="button" data-tab="byjob">🎯 نیرو برای پوزیشن</button>
        <button type="button" data-tab="bycand">👤 پوزیشن برای نیرو</button>
        <button type="button" data-tab="filter">🔎 جستجوی پیشرفته (AND / OR)</button>
        <button type="button" data-tab="export">🔗 یکپارچه‌سازی و خروجی</button>
      </div>
      <div class="tl-pane" data-pane="byjob"></div>
      <div class="tl-pane" data-pane="bycand"></div>
      <div class="tl-pane" data-pane="filter"></div>
      <div class="tl-pane" data-pane="export"></div>`;
    const pane = k => host.querySelector(`[data-pane="${k}"]`);
    host.querySelectorAll("[data-tab]").forEach(b => b.onclick = () => { S.tab = b.dataset.tab; show(); });

    function show() {
      host.querySelectorAll("[data-tab]").forEach(b => b.classList.toggle("on", b.dataset.tab === S.tab));
      host.querySelectorAll("[data-pane]").forEach(p => p.classList.toggle("on", p.dataset.pane === S.tab));
      ({ byjob: drawByJob, bycand: drawByCand, filter: drawFilter, export: drawExport })[S.tab]();
    }

    /* ---------- ۱) نیرو برای پوزیشن ---------- */
    function drawByJob() {
      const P = pane("byjob"), list = positions(), job = list.find(j => String(j.id) === String(S.job)) || list[0];
      P.innerHTML = `<div class="tl-bar">${TUI.picker({ options: posOptions(list), value: job.id, onChange: v => { S.job = v; drawByJob(); } })}
          <label class="check-item inline"><input type="checkbox" data-ok ${S.onlyOk ? "checked" : ""}> فقط واجدین شرایط الزامی</label>
          <select data-min aria-label="حداقل امتیاز">${[[0, "همه امتیازها"], [30, "≥ ۳۰٪"], [55, "≥ ۵۵٪"], [75, "≥ ۷۵٪"]].map(([v, l]) => `<option value="${v}" ${S.min == v ? "selected" : ""}>${l}</option>`).join("")}</select></div>
        <div class="panel" style="margin-bottom:14px"><b>${e(job.title)}</b> <span class="chip">${e(posLabel(job))}</span><small class="muted"> · ${e(job.orgName || "")} · ${e(job.city || "")}</small>${reqChips(job)}</div>
        <div data-res></div>`;
      P.querySelector("[data-ok]").onchange = ev => { S.onlyOk = ev.target.checked; drawByJob(); };
      P.querySelector("[data-min]").onchange = ev => { S.min = +ev.target.value; drawByJob(); };
      const all = AioMatch.candidatesFor(job, cands());
      const res = all.filter(x => (!S.onlyOk || x.m.eligible) && x.m.score >= S.min);
      P.querySelector("[data-res]").innerHTML = summary(all) + (res.map((x, i) => `
        <div class="tl-row ${x.m.fit === "none" ? "dim" : ""}" data-i="${i}" tabindex="0" role="button">
          <div><b>${e(x.c.name)}${x.c.self ? ' <span class="chip teal">رزومه‌ی شما</span>' : ""}</b><small>${e(TUI.candSummary(x.c))}</small></div>
          <span class="tl-why">${e(why(x.m))}</span>${TUI.ring(x.m, 52)}</div>`).join("") || '<div class="empty-inline">کسی با این شرایط پیدا نشد.</div>');
      P.querySelectorAll(".tl-row").forEach(r => r.onclick = r.onkeydown = ev => {
        if (ev.type === "keydown" && ev.key !== "Enter") return;
        const x = res[+r.dataset.i];
        openDrawer(TUI.candDetail(x.c, x.m) + `<div class="fb-actions" style="margin-top:18px">${opts.candActions ? opts.candActions(x.c, job) : `<button class="btn btn-primary" onclick="toast('دعوت به مصاحبه برای ${e(x.c.name)} ارسال شد ✓ (دمو)')">دعوت به مصاحبه</button>`}
          <a class="btn btn-outline" href="?tab=bycand&cand=${x.c.id}">پوزیشن‌های مناسب این فرد</a></div>`);
      });
    }

    /* ---------- ۲) پوزیشن برای نیرو ---------- */
    function drawByCand() {
      const P = pane("bycand"), list = cands(), c = list.find(x => String(x.id) === String(S.cand)) || list[0];
      P.innerHTML = `<div class="tl-bar">${TUI.picker({ options: list.map(x => [x.id, x.name + (x.self ? " (رزومه‌ی شما)" : "") + " — " + TUI.candSummary(x)]), value: c.id, onChange: v => { S.cand = v; drawByCand(); } })}
          <button type="button" class="btn btn-outline" data-cv>مشاهده رزومه کامل</button></div><div data-res></div>`;
      P.querySelector("[data-cv]").onclick = () => openDrawer(TUI.candDetail(c));
      const res = AioMatch.jobsFor(c, positions());
      P.querySelector("[data-res]").innerHTML = summary(res.map(x => ({ m: x.m }))) + res.map((x, i) => `
        <div class="tl-row ${x.m.fit === "none" ? "dim" : ""}" data-i="${i}" tabindex="0" role="button">
          <div><b>${e(x.job.title)}</b> <span class="chip">${e(posLabel(x.job))}</span><small>${e(x.job.orgName || "")} · ${e(x.job.city || "")}</small></div>
          <span class="tl-why">${e(why(x.m))}</span>${TUI.ring(x.m, 52)}</div>`).join("");
      P.querySelectorAll(".tl-row").forEach(r => r.onclick = r.onkeydown = ev => {
        if (ev.type === "keydown" && ev.key !== "Enter") return;
        const x = res[+r.dataset.i];
        openDrawer(`<div class="cd-head"><div><h2>${e(x.job.title)}</h2><p>${e(x.job.orgName || "")} · ${e(x.job.city || "")}</p></div>${TUI.ring(x.m, 76)}</div>
          ${reqChips(x.job)}<h3>تطبیق «${e(c.name)}» با این پوزیشن</h3>${TUI.breakdown(x.m)}
          ${x.job.internal || (x.job.mine && !x.job.url) ? "" : `<div class="fb-actions" style="margin-top:18px"><a class="btn btn-primary" href="${e(x.job.url || "job.html?id=" + x.job.id)}">مشاهده آگهی</a></div>`}`);
      });
    }

    /* ---------- ۳) جستجوی پیشرفته ---------- */
    function drawFilter() {
      const P = pane("filter"), list = positions();
      const saved = SV.list() || [];
      P.innerHTML = `<div class="panel">
          <div class="syllabus-head"><div><h2>شرط‌ها</h2><p>هر پارامتر رزومه را با «و» (همه) یا «یا» (حداقل یکی) ترکیب کنید؛ برای پرانتز، گروه بسازید.</p></div></div>
          <div class="tl-saved"><span class="muted" style="font-size:12.5px">نمونه‌ها:</span>${PRESETS.map((p, i) => `<button type="button" class="tp-add" data-preset="${i}">${e(p.name)}</button>`).join("")}</div>
          ${saved.length ? `<div class="tl-saved"><span class="muted" style="font-size:12.5px">ذخیره‌شده‌های من:</span>${saved.map((p, i) => `<span class="tp-chip"><button type="button" style="all:unset;cursor:pointer" data-saved="${i}">${e(p.name)}</button><button type="button" data-delsaved="${i}" aria-label="حذف">×</button></span>`).join("")}</div>` : ""}
          <div data-builder style="margin-top:12px"></div>
          <div class="tl-desc" data-desc></div>
          <div class="fb-actions"><button type="button" class="btn btn-sm btn-primary" data-save>💾 ذخیره این فیلتر</button><button type="button" class="btn btn-sm btn-ghost" data-clear>پاک کردن شرط‌ها</button></div>
        </div>
        <div class="tl-bar"><span class="muted" style="font-size:13px">مرتب‌سازی نتایج بر اساس تطبیق با:</span>${TUI.picker({ options: [["", "— بدون رتبه‌بندی —"], ...posOptions(list)], value: S.rankJob, onChange: v => { S.rankJob = v; results(); } })}</div>
        <div data-res></div>`;
      const host2 = P.querySelector("[data-builder]");
      const ctx = { jobs: list };
      const b = TUI.builder(host2, JSON.parse(JSON.stringify(S.tree)), t => { S.tree = t; try { Store.set("tl_last_filter", t); } catch (_) {} results(); }, ctx);
      P.querySelectorAll("[data-preset]").forEach(x => x.onclick = () => { S.tree = JSON.parse(JSON.stringify(PRESETS[+x.dataset.preset].tree)); drawFilter(); });
      P.querySelectorAll("[data-saved]").forEach(x => x.onclick = () => { S.tree = JSON.parse(JSON.stringify(saved[+x.dataset.saved].tree)); drawFilter(); });
      P.querySelectorAll("[data-delsaved]").forEach(x => x.onclick = () => Promise.resolve(SV.remove(+x.dataset.delsaved)).then(drawFilter, err => toast(err.message)));
      P.querySelector("[data-clear]").onclick = () => { S.tree = { op: "and", rules: [] }; drawFilter(); };
      P.querySelector("[data-save]").onclick = () => {
        const n = prompt("نام این فیلتر:", TUI.describe(S.tree).slice(0, 60));
        if (!n) return;
        Promise.resolve(SV.add(n.slice(0, 80), S.tree)).then(() => { toast("فیلتر ذخیره شد ✓"); drawFilter(); }, err => toast(err.message));
      };
      function results() {
        P.querySelector("[data-desc]").textContent = "شرط فعلی: " + TUI.describe(S.tree);
        const job = S.rankJob ? list.find(j => String(j.id) === String(S.rankJob)) : null;
        let res = cands().filter(c => AioMatch.evaluate(c, S.tree, ctx)).map(c => ({ c, m: job ? AioMatch.score(c, job) : null }));
        if (job) res.sort((a, b) => b.m.score - a.m.score);
        P.querySelector("[data-res]").innerHTML = `<p class="muted" style="margin-bottom:10px">${fa(res.length)} نفر از ${fa(cands().length)} رزومه با شرط‌ها مطابقت دارند.</p>` +
          (res.map((x, i) => `<div class="tl-row" data-i="${i}" tabindex="0" role="button">
            <div><b>${e(x.c.name)}${x.c.self ? ' <span class="chip teal">رزومه‌ی شما</span>' : ""}</b><small>${e(TUI.candSummary(x.c))}</small></div>
            <span class="tl-why">${x.c.otw ? "آماده به کار" : ""}</span>${x.m ? TUI.ring(x.m, 52) : `<span class="chip">${e(name.availability(x.c.availability))}</span>`}</div>`).join("") || '<div class="empty-inline">هیچ رزومه‌ای با این ترکیب شرط‌ها پیدا نشد.</div>');
        P.querySelectorAll("[data-res] .tl-row").forEach(r => r.onclick = r.onkeydown = ev => {
          if (ev.type === "keydown" && ev.key !== "Enter") return;
          const x = res[+r.dataset.i]; openDrawer(TUI.candDetail(x.c, x.m));
        });
      }
      results();
    }

    /* ---------- ۴) یکپارچه‌سازی ---------- */
    function drawExport() {
      const P = pane("export"), c = cands()[0], j = positions()[0];
      const clean = o => JSON.parse(JSON.stringify(o, (k, v) => k === "_p" ? undefined : v));
      P.innerHTML = `<div class="panel"><h2>ساختار استاندارد داده</h2>
        <p>همه‌ی رزومه‌ها و پوزیشن‌ها به‌جای متن آزاد از <b>شناسه‌های ثابت</b> استفاده می‌کنند (مهارت، عنوان شغلی، رشته، دانشگاه، مدرک، زبان، استان).
          بنابراین تطبیق با سامانه‌ی دیگر فقط یک جدول نگاشت شناسه است. سن و سابقه هرگز ذخیره نمی‌شوند؛ از تاریخ تولد و تاریخ‌های شروع/پایان هر سابقه محاسبه می‌شوند و با گذر زمان خودکار به‌روزند.</p>
        <div class="fb-actions"><button type="button" class="btn btn-sm btn-outline" data-dl="cands">⬇ همه‌ی رزومه‌ها (JSON)</button>
          <button type="button" class="btn btn-sm btn-outline" data-dl="positions">⬇ همه‌ی پوزیشن‌ها (JSON)</button>
          <button type="button" class="btn btn-sm btn-outline" data-dl="catalog">⬇ کاتالوگ شناسه‌ها (JSON)</button></div></div>
        <div class="panel"><h2>نمونه رزومه</h2><pre dir="ltr" style="max-height:340px;overflow:auto;font-size:12px;background:var(--navy-50);padding:12px;border-radius:10px">${e(JSON.stringify(clean(c), null, 2))}</pre></div>
        <div class="panel"><h2>نمونه پوزیشن</h2><pre dir="ltr" style="max-height:300px;overflow:auto;font-size:12px;background:var(--navy-50);padding:12px;border-radius:10px">${e(JSON.stringify({ id: j.id, title: j.title, dept: j.dept, provinceId: j.provinceId, city: j.city, req: j.req }, null, 2))}</pre></div>`;
      P.querySelectorAll("[data-dl]").forEach(b => b.onclick = () => {
        const data = { cands: () => cands().map(clean), positions: () => positions().map(x => ({ id: x.id, title: x.title, orgName: x.orgName, dept: x.dept, provinceId: x.provinceId, city: x.city, internal: !!x.internal, req: x.req })),
          catalog: () => ({ skills: AIO_SKILLS, skillLevels: AIO_SKILL_LEVELS, roles: AIO_ROLES, seniority: AIO_SENIORITY, degrees: AIO_DEGREE_LEVELS, fields: AIO_FIELDS_STUDY, universities: AIO_UNIVERSITIES, licenses: AIO_LICENSES, languages: AIO_LANGUAGES, langLevels: AIO_LANG_LEVELS, provinces: AIO_PROVINCES.map(p => ({ id: p.id, name: p.name })) }) }[b.dataset.dl]();
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
        a.download = "aiolab-" + b.dataset.dl + ".json"; a.click();
      });
    }

    show();
    return { show, state: S };
  }

  return { mount, open: openDrawer, close: closeDrawer, reqChips, colorOf, PRESETS };
})();
