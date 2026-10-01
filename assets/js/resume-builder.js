/* ==========================================
   آیولب — رزومه‌ساز ساخت‌یافته
   تقریباً همه‌چیز از فهرست‌های آماده انتخاب می‌شود (نه متن آزاد) تا رزومه قابل فیلتر،
   تطبیق و انتقال به سامانه‌های دیگر باشد. سن و سابقه ذخیره نمی‌شوند؛ از تاریخ‌ها محاسبه می‌شوند.
   ResumeBuilder.mount(host, { load(), save(r), onSaved(r) })
   ========================================== */
const ResumeBuilder = (() => {
  const { e, fa, name, O } = TUI;
  const clone = o => JSON.parse(JSON.stringify(o || {}));
  const EMPTY = { name: "", phone: "", gender: "", birth: "", provinceId: "", city: "", relocate: false, provinces: [], military: "",
    targetRoles: [], seniority: "", wantTypes: [], wantShifts: [], salaryMin: "", salaryMax: "", availability: "", availableFrom: "",
    experience: [], education: [], skills: [], licenses: [], langs: [], summary: "" };

  /* درصد تکمیل رزومه — برای «قدرت پروفایل» */
  function completeness(r) {
    const checks = [r.name, r.gender, r.birth, r.provinceId && r.city, (r.targetRoles || []).length, r.seniority, (r.wantTypes || []).length,
      r.availability, (r.experience || []).length, (r.education || []).length, (r.skills || []).length >= 5, (r.langs || []).length, r.salaryMin, r.summary];
    return Math.round(checks.filter(Boolean).length / checks.length * 100);
  }
  function validate(r) {
    const miss = [];
    if (!r.name || r.name.trim().length < 3) miss.push("نام و نام خانوادگی");
    if (!r.gender) miss.push("جنسیت");
    if (!r.birth) miss.push("تاریخ تولد");
    if (!r.provinceId || !r.city) miss.push("استان و شهر محل سکونت");
    if (!(r.targetRoles || []).length) miss.push("عنوان شغلی موردنظر");
    if (!(r.skills || []).length) miss.push("حداقل یک مهارت");
    if (r.phone && !/^09\d{9}$/.test(String(r.phone).replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d)))) miss.push("شماره موبایل درست (۰۹xxxxxxxxx)");
    if (r.salaryMin && r.salaryMax && +r.salaryMax < +r.salaryMin) miss.push("بازه‌ی حقوق درست");
    return miss;
  }

  function mount(host, opts) {
    let R = Object.assign(clone(EMPTY), clone(opts.load() || {}));
    let edit = null;   /* { kind, idx, d } فرم باز */

    const yearSel = (key, val, from, to, ph) => {
      const opt = []; for (let y = to; y >= from; y--) opt.push(`<option value="${y + 621}" ${+val === y + 621 ? "selected" : ""}>${fa(y)}</option>`);
      return `<select data-f="${key}" data-num aria-label="${ph}"><option value="">${ph}</option>${opt.join("")}</select>`;
    };
    const cy = AioDate.thisJYear();
    const pick = (key, o, target) => TUI.picker(Object.assign({}, o, { onChange: v => { (target || R)[key] = v; if (o.after) o.after(v); live(); } }));
    const ic = k => (typeof ICONS !== "undefined" && ICONS[k]) || "";

    function live() {
      const p = AioMatch.profile(R);
      const depts = Object.entries(p.expDept).sort((a, b) => b[1] - a[1]).slice(0, 3);
      const lic = Object.entries(p.licenses);
      const box = host.querySelector("[data-live]");
      if (!box) return;
      box.innerHTML = `<span>سن: <b>${p.age != null ? fa(p.age) + " سال" : "—"}</b></span>
        <span>سابقه کل: <b>${p.expMonths ? AioDate.durText(p.expMonths) : "—"}</b></span>
        ${depts.map(([d, m]) => `<span>${e(name.dept(d))}: <b>${AioDate.durText(m)}</b></span>`).join("")}
        <span>بالاترین مدرک: <b>${p.degree ? e(name.degree(p.degree)) : "—"}</b></span>
        ${lic.length ? `<span>مدارک معتبر: <b>${fa(lic.filter(x => x[1]).length)} از ${fa(lic.length)}</b></span>` : ""}
        <span>تکمیل رزومه: <b>${fa(completeness(R))}٪</b></span>`;
    }

    /* ---------- فرم‌های افزودن/ویرایش ---------- */
    function expForm(d) {
      const orgOpts = d.orgType === "other" ? [] : O.orgs(d.orgType || "lab");
      return `<div class="rb-form panel" style="background:var(--navy-50)"><div class="form-grid">
        <div class="form-field"><label>نوع محل کار</label><select data-f="orgType"><option value="lab" ${d.orgType === "lab" ? "selected" : ""}>آزمایشگاه / مرکز</option><option value="company" ${d.orgType === "company" ? "selected" : ""}>شرکت</option><option value="other" ${d.orgType === "other" ? "selected" : ""}>سایر (عضو آیولب نیست)</option></select></div>
        <div class="form-field"><label>نام محل کار *</label>${d.orgType === "other"
          ? `<input type="text" data-f="orgName" maxlength="120" value="${e(d.orgName || "")}" placeholder="نام رسمی مجموعه">`
          : pick("orgId", { options: orgOpts, value: d.orgId || "", placeholder: "از فهرست مراکز انتخاب کنید", after: v => { const o = AIO_LABS.find(l => String(l.id) === String(v)); d.orgId = +v; d.orgName = o ? o.name : ""; if (o && !d.city) d.city = o.city; } }, d)}</div>
        <div class="form-field"><label>عنوان شغلی *</label>${pick("role", { options: O.roles(), value: d.role || "", placeholder: "انتخاب عنوان", after: v => { const r = AIO_ROLES.find(x => x.id === v); if (r && !d.dept) { d.dept = r.dept; draw(); } } }, d)}</div>
        <div class="form-field"><label>بخش *</label>${pick("dept", { options: O.depts(), value: d.dept || "" }, d)}</div>
        <div class="form-field"><label>نوع همکاری</label>${pick("type", { options: O.jobTypes(), value: d.type || "" }, d)}</div>
        <div class="form-field"><label>شهر</label>${pick("city", { options: O.cities(), value: d.city || "" }, d)}</div>
        <div class="form-field"><label>تاریخ شروع *</label><span data-date="start">${TUI.monthYear({ value: d.start })}</span></div>
        <div class="form-field"><label>تاریخ پایان</label>${d.current ? '<span class="muted" style="padding:9px 0;display:block">تا اکنون</span>' : `<span data-date="end">${TUI.monthYear({ value: d.end })}</span>`}
          <label class="check-item inline" style="margin-top:6px"><input type="checkbox" data-c="current" ${d.current ? "checked" : ""}> هنوز اینجا کار می‌کنم</label></div>
        <div class="form-field full"><label>مهارت‌ها و دستگاه‌هایی که در این سمت به کار بردید</label>${pick("skills", { multi: true, options: O.skills(), value: d.skills || [], addLabel: "مهارت" }, d)}</div>
        </div>${formActions()}</div>`;
    }
    function eduForm(d) {
      return `<div class="rb-form panel" style="background:var(--navy-50)"><div class="form-grid">
        <div class="form-field"><label>مقطع *</label>${pick("degree", { options: O.degrees(), value: d.degree || "", after: v => d.degree = +v }, d)}</div>
        <div class="form-field"><label>رشته *</label>${pick("field", { options: O.fields(), value: d.field || "" }, d)}</div>
        <div class="form-field"><label>دانشگاه / مؤسسه *</label>${pick("uni", { options: O.unis(), value: d.uni || "" }, d)}</div>
        <div class="form-field"><label>سال ورود</label>${yearSel("start", d.start, cy - 50, cy, "سال ورود")}</div>
        <div class="form-field"><label>سال فراغت</label>${d.studying ? '<span class="muted" style="padding:9px 0;display:block">در حال تحصیل</span>' : yearSel("end", d.end, cy - 50, cy + 1, "سال فراغت")}
          <label class="check-item inline" style="margin-top:6px"><input type="checkbox" data-c="studying" ${d.studying ? "checked" : ""}> در حال تحصیل</label></div>
        </div>${formActions()}</div>`;
    }
    function licForm(d) {
      return `<div class="rb-form panel" style="background:var(--navy-50)"><div class="form-grid">
        <div class="form-field"><label>مدرک / پروانه *</label>${pick("id", { options: O.licenses(), value: d.id || "" }, d)}</div>
        <div class="form-field"><label>تاریخ صدور</label><span data-date="issued">${TUI.monthYear({ value: d.issued })}</span></div>
        <div class="form-field"><label>تاریخ انقضا</label>${d.noexp ? '<span class="muted" style="padding:9px 0;display:block">بدون انقضا</span>' : `<span data-date="expires">${TUI.monthYear({ value: d.expires })}</span>`}
          <label class="check-item inline" style="margin-top:6px"><input type="checkbox" data-c="noexp" ${d.noexp ? "checked" : ""}> بدون تاریخ انقضا</label></div>
        </div>${formActions()}</div>`;
    }
    const formActions = () => `<div class="fb-actions"><button type="button" class="btn btn-sm btn-primary" data-act="ok">تأیید</button><button type="button" class="btn btn-sm btn-ghost" data-act="cancel">انصراف</button></div>`;

    function commit() {
      const d = edit.d, list = R[{ exp: "experience", edu: "education", lic: "licenses" }[edit.kind]];
      if (edit.kind === "exp") {
        if (d.current) d.end = null;
        if (!(d.orgName || "").trim() || !d.role || !d.dept || !d.start) return toast("محل کار، عنوان شغلی، بخش و تاریخ شروع لازم است");
        if (d.end && d.end < d.start) return toast("تاریخ پایان نمی‌تواند قبل از شروع باشد");
        if (d.start > new Date().toISOString().slice(0, 7)) return toast("تاریخ شروع در آینده است");
        delete d.current;
      }
      if (edit.kind === "edu") {
        if (d.studying) d.end = null;
        if (!d.degree || !d.field || !d.uni) return toast("مقطع، رشته و دانشگاه را انتخاب کنید");
        if (d.start && d.end && d.end < d.start) return toast("سال فراغت قبل از ورود است");
        delete d.studying;
      }
      if (edit.kind === "lic") {
        if (d.noexp) d.expires = null;
        if (!d.id) return toast("مدرک را انتخاب کنید");
        if (d.issued && d.expires && d.expires < d.issued) return toast("انقضا قبل از صدور است");
        delete d.noexp;
      }
      if (edit.idx == null) list.push(d); else list[edit.idx] = d;
      edit = null; draw();
    }

    /* ---------- رندر کل رزومه‌ساز ---------- */
    function draw() {
      const p = AioMatch.profile(R);
      const exp = R.experience.map((x, i) => ({ x, i })).sort((a, b) => (b.x.end || "9999") < (a.x.end || "9999") ? -1 : (b.x.start > a.x.start ? 1 : -1));
      const grouped = AIO_SKILL_GROUPS.map(g => ({ g, list: R.skills.map((s, i) => ({ s, i })).filter(({ s }) => (AIO_SKILLS.find(k => k.id === s.id) || {}).group === g.id) })).filter(x => x.list.length);
      host.innerHTML = `
      <div class="panel"><h2>محاسبه‌ی خودکار از روی رزومه</h2>
        <p class="muted" style="font-size:13px">سن از تاریخ تولد و سابقه از تاریخ‌های شروع و پایان هر سمت (با حذف هم‌پوشانی‌ها، مثل لینکدین) محاسبه می‌شود و با گذر زمان خودکار به‌روز است.</p>
        <div class="rb-live" data-live></div></div>

      <div class="panel rb-section"><h2>اطلاعات فردی</h2><div class="form-grid">
        <div class="form-field"><label>نام و نام خانوادگی *</label><input type="text" data-f="name" maxlength="80" value="${e(R.name)}"></div>
        <div class="form-field"><label>شماره موبایل</label><input type="tel" dir="ltr" data-f="phone" maxlength="11" value="${e(R.phone || "")}" placeholder="09xxxxxxxxx"></div>
        <div class="form-field"><label>جنسیت *</label>${pick("gender", { options: O.genders(), value: R.gender, after: () => draw() })}</div>
        <div class="form-field"><label>تاریخ تولد *</label><span data-date="birth">${TUI.fullDate({ value: R.birth, back: 70, minAge: 16 })}</span></div>
        ${R.gender === "آقا" ? `<div class="form-field"><label>وضعیت نظام وظیفه</label>${pick("military", { options: O.military(), value: R.military })}</div>` : ""}
        <div class="form-field"><label>استان محل سکونت *</label>${pick("provinceId", { options: O.provinces(), value: R.provinceId, after: () => { R.city = ""; draw(); } })}</div>
        <div class="form-field"><label>شهر *</label>${pick("city", { options: O.cities(R.provinceId), value: R.city, placeholder: R.provinceId ? "انتخاب شهر" : "ابتدا استان" })}</div>
        <div class="form-field full"><label class="check-item inline"><input type="checkbox" data-c="relocate" ${R.relocate ? "checked" : ""}> برای کار به شهر دیگری جابه‌جا می‌شوم</label>
          ${R.relocate ? `<div style="margin-top:8px">${pick("provinces", { multi: true, options: O.provinces(), value: R.provinces, addLabel: "استان مقصد (خالی = همه)" })}</div>` : ""}</div>
      </div></div>

      <div class="panel rb-section"><h2>هدف شغلی و ترجیحات</h2><div class="form-grid">
        <div class="form-field full"><label>عنوان‌های شغلی موردنظر *</label>${pick("targetRoles", { multi: true, options: O.roles(), value: R.targetRoles, addLabel: "عنوان شغلی" })}</div>
        <div class="form-field"><label>رده شغلی فعلی</label>${pick("seniority", { options: O.seniority(), value: R.seniority, after: v => R.seniority = +v })}</div>
        <div class="form-field"><label>زمان آمادگی شروع</label>${pick("availability", { options: O.availability(), value: R.availability, after: () => draw() })}</div>
        ${R.availability === "date" ? `<div class="form-field"><label>آماده از تاریخ</label><span data-date="availableFrom" data-full>${TUI.fullDate({ value: R.availableFrom, back: 0, minAge: -2 })}</span></div>` : ""}
        <div class="form-field"><label>نوع همکاری</label>${pick("wantTypes", { multi: true, options: O.jobTypes(), value: R.wantTypes })}</div>
        <div class="form-field"><label>شیفت</label>${pick("wantShifts", { multi: true, options: O.shifts(), value: R.wantShifts })}</div>
        <div class="form-field"><label>حداقل حقوق (میلیون تومان)</label><input type="number" min="0" max="500" data-f="salaryMin" data-num value="${e(R.salaryMin)}"></div>
        <div class="form-field"><label>حداکثر حقوق (میلیون تومان)</label><input type="number" min="0" max="500" data-f="salaryMax" data-num value="${e(R.salaryMax)}"></div>
      </div></div>

      <div class="panel rb-section"><div class="syllabus-head"><div><h2>سوابق کاری</h2><p>به‌جای «چند سال سابقه دارید؟»، تاریخ شروع و پایان هر سمت را وارد کنید.</p></div>
        <button type="button" class="btn btn-sm btn-outline" data-add="exp">+ افزودن سابقه</button></div>
        ${edit && edit.kind === "exp" && edit.idx == null ? expForm(edit.d) : ""}
        ${exp.map(({ x, i }) => edit && edit.kind === "exp" && edit.idx === i ? expForm(edit.d) : `<div class="rb-item"><div class="ri-ic">${ic("briefcase")}</div>
          <div><b>${e(name.role(x.role))} — ${e(x.orgName)}</b><small>${e(AioDate.toJ(x.start, true))} تا ${x.end ? e(AioDate.toJ(x.end, true)) : "اکنون"} · <b>${AioDate.durText(AioDate.months(x.start, x.end))}</b> · ${e(name.dept(x.dept))}${x.type ? " · " + e(x.type) : ""}${x.city ? " · " + e(x.city) : ""}</small>
          ${(x.skills || []).length ? `<small>${x.skills.map(s => e(name.skill(s))).join("، ")}</small>` : ""}</div>
          <div class="ri-act"><button type="button" class="btn btn-sm btn-ghost" data-edit="exp:${i}">ویرایش</button><button type="button" class="btn btn-sm btn-ghost danger" data-del="experience:${i}">حذف</button></div></div>`).join("") || (edit && edit.kind === "exp" ? "" : '<div class="empty-inline">هنوز سابقه‌ای ثبت نشده — اگر تازه‌کار هستید، این بخش را خالی بگذارید.</div>')}
      </div>

      <div class="panel rb-section"><div class="syllabus-head"><div><h2>تحصیلات</h2></div><button type="button" class="btn btn-sm btn-outline" data-add="edu">+ افزودن مدرک تحصیلی</button></div>
        ${edit && edit.kind === "edu" && edit.idx == null ? eduForm(edit.d) : ""}
        ${R.education.map((x, i) => edit && edit.kind === "edu" && edit.idx === i ? eduForm(edit.d) : `<div class="rb-item"><div class="ri-ic">${ic("grad")}</div>
          <div><b>${e(name.degree(x.degree))} ${e(x.field)}</b><small>${e(name.uni(x.uni))} · ${x.start ? fa(x.start - 621) : "—"} تا ${x.end ? fa(x.end - 621) : "در حال تحصیل"}</small></div>
          <div class="ri-act"><button type="button" class="btn btn-sm btn-ghost" data-edit="edu:${i}">ویرایش</button><button type="button" class="btn btn-sm btn-ghost danger" data-del="education:${i}">حذف</button></div></div>`).join("")}
      </div>

      <div class="panel rb-section"><div class="syllabus-head"><div><h2>مهارت‌ها و دستگاه‌ها</h2><p>سطح هر مهارت را از ۱ (آشنایی) تا ۵ (خبره) مشخص کنید؛ موتور تطبیق همین سطح را با نیاز هر پوزیشن می‌سنجد.</p></div></div>
        ${grouped.map(({ g, list }) => `<div class="rb-skill-group">${e(g.name)}</div>${list.map(({ s, i }) => `<div class="rb-skill"><span>${e(name.skill(s.id))}</span>
          <span style="display:flex;gap:8px;align-items:center"><span data-lvl="skills:${i}">${TUI.levels({ value: s.lvl })}</span><button type="button" class="btn btn-sm btn-ghost danger" data-del="skills:${i}" aria-label="حذف">×</button></span></div>`).join("")}`).join("") || '<div class="empty-inline">مهارتی اضافه نکرده‌اید.</div>'}
        <div style="margin-top:12px">${TUI.picker({ multi: true, options: O.skills().filter(o => !R.skills.some(s => s.id === o[0])), value: [], addLabel: "افزودن مهارت یا دستگاه", onChange: v => { v.forEach(id => { if (!R.skills.some(s => s.id === id)) R.skills.push({ id, lvl: 3 }); }); draw(); } })}</div>
      </div>

      <div class="panel rb-section"><div class="syllabus-head"><div><h2>مدارک، پروانه‌ها و گواهی‌ها</h2><p>مدرکی که تاریخ انقضایش گذشته باشد خودکار «منقضی» نمایش داده می‌شود.</p></div><button type="button" class="btn btn-sm btn-outline" data-add="lic">+ افزودن مدرک</button></div>
        ${edit && edit.kind === "lic" && edit.idx == null ? licForm(edit.d) : ""}
        ${R.licenses.map((x, i) => edit && edit.kind === "lic" && edit.idx === i ? licForm(edit.d) : `<div class="rb-item"><div class="ri-ic">${ic("shield")}</div>
          <div><b>${e(name.license(x.id))} ${p.licenses[x.id] === false ? '<span class="chip sm warn">منقضی</span>' : '<span class="chip sm teal">معتبر</span>'}</b><small>صدور: ${x.issued ? e(AioDate.toJ(x.issued, true)) : "—"} · انقضا: ${x.expires ? e(AioDate.toJ(x.expires, true)) : "ندارد"}</small></div>
          <div class="ri-act"><button type="button" class="btn btn-sm btn-ghost" data-edit="lic:${i}">ویرایش</button><button type="button" class="btn btn-sm btn-ghost danger" data-del="licenses:${i}">حذف</button></div></div>`).join("")}
        ${(typeof MyCerts !== "undefined" && MyCerts.all().length) ? `<p class="muted" style="font-size:12.5px;margin-top:8px">گواهی‌های آزمون آیولب (${fa(MyCerts.all().length)} مورد) خودکار روی رزومه نمایش داده می‌شوند.</p>` : ""}
      </div>

      <div class="panel rb-section"><h2>زبان‌های خارجی</h2>
        ${R.langs.map((l, i) => `<div class="rb-skill"><span>${e(name.lang(l.id))}</span><span style="display:flex;gap:8px;align-items:center"><span data-lvl="langs:${i}">${TUI.levels({ value: l.lvl, list: AIO_LANG_LEVELS }).replace('class="tui-levels"', 'class="tui-levels" data-list="lang"')}</span><button type="button" class="btn btn-sm btn-ghost danger" data-del="langs:${i}" aria-label="حذف">×</button></span></div>`).join("")}
        <div style="margin-top:12px">${TUI.picker({ multi: true, options: O.langs().filter(o => !R.langs.some(l => l.id === o[0])), value: [], addLabel: "افزودن زبان", onChange: v => { v.forEach(id => { if (!R.langs.some(l => l.id === id)) R.langs.push({ id, lvl: 2 }); }); draw(); } })}</div>
      </div>

      <div class="panel rb-section"><h2>خلاصه حرفه‌ای <small class="muted" style="font-weight:400">(اختیاری، حداکثر ۴۰۰ نویسه)</small></h2>
        <textarea data-f="summary" rows="3" maxlength="400" style="width:100%">${e(R.summary)}</textarea></div>

      <div class="panel"><h2>رزومه PDF <small class="muted" style="font-weight:400">(اختیاری)</small></h2>
        <p style="margin-bottom:12px">موتور تطبیق فقط از داده‌های ساخت‌یافته‌ی بالا استفاده می‌کند؛ فایل PDF فقط ضمیمه‌ی درخواست‌هاست.</p>
        ${opts.filePanel ? opts.filePanel() : `<button type="button" class="btn btn-outline" onclick="toast('بارگذاری فایل در نسخه متصل به سرور فعال است')">📎 بارگذاری فایل PDF</button>`}</div>

      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-top:16px">
        <span class="muted" style="font-size:13px">${R.updated ? "آخرین ذخیره: " + e(AioDate.toJ(R.updated)) : "هنوز ذخیره نشده"}</span>
        <button type="button" class="btn btn-primary btn-lg" data-save>ذخیره رزومه</button></div>`;
      live();
      if (opts.afterDraw) opts.afterDraw();
    }

    /* ---------- رویدادها ---------- */
    host.addEventListener("input", ev => {
      const t = ev.target, k = t.dataset.f; if (!k) return;
      const target = edit && t.closest(".rb-form") ? edit.d : R;
      target[k] = t.dataset.num !== undefined ? (t.value === "" ? "" : +t.value) : t.value;
      if (t.tagName === "SELECT") return;
      live();
    });
    host.addEventListener("change", ev => {
      const t = ev.target;
      const inForm = edit && t.closest(".rb-form");
      if (t.dataset.f && t.tagName === "SELECT") { (inForm ? edit.d : R)[t.dataset.f] = t.dataset.num !== undefined ? (t.value ? +t.value : "") : t.value; if (t.dataset.f === "orgType") { edit.d.orgId = ""; edit.d.orgName = ""; draw(); } live(); return; }
      if (t.dataset.c) { (inForm ? edit.d : R)[t.dataset.c] = t.checked; draw(); return; }
      const dt = t.closest("[data-date]");
      if (dt) { const v = TUI.dateVal(dt.querySelector(".tui-date")); (inForm ? edit.d : R)[dt.dataset.date] = v; live(); return; }
      const lv = t.closest("[data-lvl]");
      if (lv) { const [arr, i] = lv.dataset.lvl.split(":"); R[arr][+i].lvl = +t.dataset.value || +lv.querySelector(".tui-levels").dataset.value; live(); }
    });
    host.addEventListener("click", ev => {
      const b = ev.target.closest("[data-add],[data-edit],[data-del],[data-act],[data-save]"); if (!b) return;
      if (b.dataset.add) { edit = { kind: b.dataset.add, idx: null, d: b.dataset.add === "exp" ? { orgType: "lab", skills: [] } : {} }; draw(); }
      else if (b.dataset.edit) { const [k, i] = b.dataset.edit.split(":"); const src = R[{ exp: "experience", edu: "education", lic: "licenses" }[k]][+i];
        const d = clone(src); if (k === "exp") d.current = !d.end; if (k === "edu") d.studying = !d.end; if (k === "lic") d.noexp = !d.expires; edit = { kind: k, idx: +i, d }; draw(); }
      else if (b.dataset.del) { const [k, i] = b.dataset.del.split(":"); R[k].splice(+i, 1); draw(); }
      else if (b.dataset.act === "ok") commit();
      else if (b.dataset.act === "cancel") { edit = null; draw(); }
      else if (b.dataset.save !== undefined) {
        if (edit) return toast("ابتدا فرم باز را تأیید یا لغو کنید");
        const miss = validate(R);
        if (miss.length) return toast("موارد لازم: " + miss.join("، "));
        R.updated = new Date().toISOString().slice(0, 10);
        b.classList.add("is-busy");
        Promise.resolve(opts.save(clone(R))).then(saved => {
          if (saved && typeof saved === "object") R = Object.assign(clone(EMPTY), clone(saved));
          draw();
          if (opts.onSaved) opts.onSaved(R);
        }, err => toast((err && err.message) || "ذخیره نشد")).finally(() => b.classList.remove("is-busy"));
      }
    });
    draw();
    return { get data() { return R; } };
  }
  return { mount, completeness, validate, EMPTY };
})();
