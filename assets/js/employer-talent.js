/* ==========================================
   آیولب — پنل کارفرما: پروفایل کامل سازمان (گالری، خدمات، اعتباربخشی، ساعات، شبکه‌ها)،
   مدیریت محصولات، و تعریف پوزیشن با نیازمندی‌های ساخت‌یافته + پیش‌نمایش زنده‌ی نیروهای واجد شرایط
   ========================================== */
/* سایت‌های مجاز ویدئو: وردپرس از «تنظیمات آیولب»، دمو آپارات */
function videoHosts() { return (window.AIO_CFG && AIO_CFG.videoHosts && AIO_CFG.videoHosts.length) ? AIO_CFG.videoHosts : ["aparat.com"]; }
function videoOk(u) { try { const h = new URL(u).hostname.replace(/^www\./, ""); return /^https?:$/.test(new URL(u).protocol) && videoHosts().includes(h); } catch (_) { return false; } }
const EmpTalent = (() => {
  const { e, fa, name, O } = TUI;
  const clone = o => JSON.parse(JSON.stringify(o == null ? {} : o));

  /* تصویر انتخابی → JPEG کوچک‌شده (دمو در حافظه‌ی مرورگر نگه می‌دارد؛ نسخه‌ی اصلی در رسانه‌ی وردپرس) */
  function readImage(file, max) {
    return new Promise((ok, bad) => {
      if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return bad("فقط تصویر JPG، PNG یا WebP");
      if (file.size > 8 * 1024 * 1024) return bad("حداکثر حجم هر تصویر ۸ مگابایت است");
      const fr = new FileReader();
      fr.onload = () => { const im = new Image(); im.onload = () => {
        const k = Math.min(1, (max || 1280) / im.width), c = document.createElement("canvas");
        c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
        c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); ok(c.toDataURL("image/jpeg", 0.78)); }; im.onerror = () => bad("تصویر خراب است"); im.src = fr.result; };
      fr.readAsDataURL(file);
    });
  }
  const safeSet = (k, v) => { try { localStorage.setItem("aio_" + k, JSON.stringify(v)); return true; } catch (_) { throw new Error("حافظه‌ی مرورگر پر است؛ تعداد یا حجم تصاویر را کم کنید (در نسخه‌ی اصلی محدودیتی نیست)"); } };

  /* آداپتور ذخیره‌سازی: دمو = حافظه‌ی مرورگر؛ وردپرس = API سرور (window.EMP_ADAPTER) */
  const A = Object.assign({
    orgs: () => AIO_LABS.map(l => [l.id, l.name]),
    orgId: () => Store.get("my_org_id", 1),
    setOrgId: id => Store.set("my_org_id", +id),
    org: id => orgFull(id),
    publicUrl: id => "lab.html?id=" + id,
    saveOrg: async (id, data) => { safeSet("org_" + id, data); },
    image: async (file, purpose, max) => ({ img: await readImage(file, max) }),
    products: orgId => aioProducts().filter(p => p.orgId === orgId),
    newProductId: () => Date.now(),
    saveProduct: async p => { const list = Store.get("products", []), i = list.findIndex(x => x.id === p.id); if (i >= 0) list[i] = p; else list.push(p); safeSet("products", list); return p; },
    deleteProduct: async id => { Store.set("products", Store.get("products", []).filter(x => x.id !== id)); if (AIO_PRODUCTS.some(x => x.id === id)) Store.set("products_deleted", [...Store.get("products_deleted", []), id]); },
    position: id => Store.get("positions", []).find(p => p.id === id),
    savePosition: async job => {
      job.id = job.id || 5000 + Date.now() % 100000; job.status = job.internal ? "active" : "pending";
      const list = Store.get("positions", []), i = list.findIndex(p => p.id === job.id);
      if (i >= 0) list[i] = job; else list.push(job);
      Store.set("positions", list); return job;
    },
    withDesc: false
  }, (typeof window !== "undefined" && window.EMP_ADAPTER) || {});
  const myOrgId = () => +A.orgId();
  const fail = err => toast((err && err.message) || String(err));

  /* ================= پروفایل سازمان ================= */
  function orgProfile(host) {
    const id = myOrgId(), o = A.org(id);
    if (!o) { host.innerHTML = '<div class="empty-inline">ابتدا سازمان خود را در بخش «ثبت سازمان روی نقشه» ثبت کنید.</div>'; return; }
    const D = Object.assign({ orgType: "lab", tagline: "", about: "", services: [], accreditations: [], hoursSpec: { days: [0, 1, 2, 3, 4], from: 8, to: 17, h24: false },
      phone: "", email: "", website: "", socials: {}, video: "", branches: "", staff: "", founded: "", gallery: [] }, clone(o));
    /* لینک‌های نمونه‌ی «#» معتبر نیستند و نباید جلوی ذخیره را بگیرند */
    D.socials = Object.fromEntries(Object.entries(D.socials || {}).filter(([, v]) => /^https:\/\//.test(v)));
    const hours = h => h.h24 ? "شبانه‌روزی" : (h.days.length ? (h.days.length > 2 && h.days.every((d, i) => i === 0 || d === h.days[i - 1] + 1) ? AIO_WEEKDAYS[h.days[0]] + " تا " + AIO_WEEKDAYS[h.days[h.days.length - 1]] : h.days.map(d => AIO_WEEKDAYS[d]).join("، ")) + " " + fa(h.from) + " تا " + fa(h.to) : "");
    const hsel = (k, v) => `<select data-h="${k}">${Array.from({ length: 25 }, (_, i) => `<option value="${i}" ${+v === i ? "selected" : ""}>${fa(i)}:۰۰</option>`).join("")}</select>`;
    function draw() {
      host.innerHTML = `
      <div class="panel"><div class="form-grid">
        <div class="form-field"><label>سازمانی که مدیریت می‌کنید</label>${TUI.picker({ options: A.orgs(), value: id, onChange: v => { A.setOrgId(+v); orgProfile(host); if (window.EmpProducts) EmpProducts(); } })}</div>
        <div class="form-field"><label>نوع سازمان</label>${TUI.picker({ options: O.orgTypes(), value: D.orgType, onChange: v => D.orgType = v })}</div>
        <div class="form-field full"><label>شعار / معرفی یک‌خطی</label><input type="text" maxlength="90" data-k="tagline" value="${e(D.tagline)}"></div>
        <div class="form-field full"><label>درباره سازمان</label><textarea rows="4" maxlength="1500" data-k="about">${e(D.about)}</textarea></div>
      </div></div>

      <div class="panel"><h2>گالری تصاویر (اسلایدر صفحه‌ی سازمان)</h2>
        <p class="muted" style="font-size:13px">تا ۱۰ تصویر؛ ترتیب همان ترتیب اسلایدر است. برای هر تصویر یک عنوان کوتاه بنویسید.</p>
        <div class="gal-edit">${D.gallery.map((g, i) => `<div><div class="gi" style="background:${e(g.c || "#94a3b8")}">${g.img ? `<img src="${e(g.img)}" alt="">` : "بدون تصویر"}</div>
          <input type="text" maxlength="60" data-gal="${i}" value="${e(g.t || "")}" placeholder="عنوان">
          <div style="display:flex"><button type="button" data-mv="${i}:-1" style="background:var(--navy-50);color:var(--navy-600)" ${i ? "" : "disabled"}>→</button><button type="button" data-rmg="${i}">حذف</button><button type="button" data-mv="${i}:1" style="background:var(--navy-50);color:var(--navy-600)" ${i < D.gallery.length - 1 ? "" : "disabled"}>←</button></div></div>`).join("")}</div>
        ${D.gallery.length < 10 ? `<label class="btn btn-outline btn-sm" style="margin-top:12px">📷 افزودن تصویر<input type="file" accept="image/jpeg,image/png,image/webp" multiple data-up hidden></label>` : ""}
        <div style="margin-top:14px">${TUI.slider(D.gallery)}</div>
      </div>

      <div class="panel"><h2>خدمات و اعتباربخشی</h2><div class="form-grid">
        <div class="form-field full"><label>خدمات</label>${TUI.picker({ multi: true, options: AIO_ORG_SERVICES.map(x => [x, x]), value: D.services, addLabel: "خدمت", onChange: v => D.services = v })}</div>
        <div class="form-field full"><label>گواهی‌ها و اعتباربخشی</label>${TUI.picker({ multi: true, options: AIO_ACCREDITATIONS.map(x => [x, x]), value: D.accreditations, addLabel: "گواهی", onChange: v => D.accreditations = v })}</div>
      </div></div>

      <div class="panel"><h2>ساعات کاری و اطلاعات تماس</h2><div class="form-grid">
        <div class="form-field full"><label>روزهای کاری</label><div class="chips-pick">${AIO_WEEKDAYS.map((d, i) => `<button type="button" class="cp ${D.hoursSpec.days.includes(i) ? "on" : ""}" data-day="${i}">${d}</button>`).join("")}</div></div>
        <div class="form-field"><label>از ساعت</label>${hsel("from", D.hoursSpec.from)}</div>
        <div class="form-field"><label>تا ساعت</label>${hsel("to", D.hoursSpec.to)}</div>
        <div class="form-field full"><label class="check-item inline"><input type="checkbox" data-h24 ${D.hoursSpec.h24 ? "checked" : ""}> شبانه‌روزی</label> <span class="muted" data-hours style="font-size:13px">نمایش: ${e(hours(D.hoursSpec))}</span></div>
        <div class="form-field"><label>تلفن سازمان *</label><input type="tel" dir="ltr" maxlength="20" data-k="phone" value="${e(D.phone)}" placeholder="02122220000"></div>
        <div class="form-field"><label>ایمیل سازمان *</label><input type="email" dir="ltr" maxlength="120" data-k="email" value="${e(D.email || "")}" placeholder="info@example.ir"></div>
        <div class="form-field"><label>وب‌سایت</label><input type="url" dir="ltr" maxlength="200" data-k="website" value="${e(D.website)}" placeholder="https://"></div>
        ${AIO_SOCIALS.filter(([k]) => k !== "website").map(([k, n]) => `<div class="form-field"><label>${n}</label><input type="url" dir="ltr" maxlength="200" data-soc="${k}" value="${e((D.socials || {})[k] && D.socials[k] !== "#" ? D.socials[k] : "")}" placeholder="https://"></div>`).join("")}
        <div class="form-field"><label>ویدئوی معرفی (لینک ${e(videoHosts().join(" / "))})</label><input type="url" dir="ltr" maxlength="200" data-k="video" value="${e(D.video)}" placeholder="https://www.aparat.com/v/..."></div>
        <div class="form-field"><label>تعداد شعب / نمایندگی</label><input type="number" min="0" max="999" data-k="branches" data-num value="${D.branches ? e(D.branches) : ""}"></div>
        <div class="form-field"><label>تعداد پرسنل</label><input type="number" min="0" max="99999" data-k="staff" data-num value="${D.staff ? e(D.staff) : ""}"></div>
        <div class="form-field"><label>سال تأسیس (شمسی)</label><input type="number" min="1300" max="${AioDate.thisJYear()}" data-k="founded" data-num value="${D.founded ? e(D.founded) : ""}"></div>
      </div></div>
      <div style="display:flex;justify-content:flex-end;gap:10px"><a class="btn btn-outline" href="${e(A.publicUrl(id))}" target="_blank">مشاهده صفحه‌ی عمومی</a><button type="button" class="btn btn-primary btn-lg" data-save>ذخیره پروفایل</button></div>`;
    }
    host.oninput = ev => {
      const t = ev.target;
      if (t.dataset.k) D[t.dataset.k] = t.dataset.num !== undefined ? (t.value === "" ? "" : +t.value) : t.value;
      if (t.dataset.soc) D.socials = Object.assign({}, D.socials, { [t.dataset.soc]: t.value.trim() });
      if (t.dataset.gal) D.gallery[+t.dataset.gal].t = t.value;
      if (t.dataset.h) { D.hoursSpec[t.dataset.h] = +t.value; host.querySelector("[data-hours]").textContent = "نمایش: " + hours(D.hoursSpec); }
    };
    host.onchange = async ev => {
      const t = ev.target;
      if (t.dataset.h24 !== undefined) { D.hoursSpec.h24 = t.checked; host.querySelector("[data-hours]").textContent = "نمایش: " + hours(D.hoursSpec); }
      if (t.dataset.up !== undefined) {
        for (const f of [...t.files].slice(0, 10 - D.gallery.length)) {
          try { D.gallery.push(Object.assign({ t: f.name.replace(/\.[^.]+$/, "").slice(0, 60) }, await A.image(f, "gallery:" + id, 1280))); } catch (err) { fail(err); }
        }
        draw();
      }
    };
    host.onclick = ev => {
      const b = ev.target.closest("[data-day],[data-rmg],[data-mv],[data-save]"); if (!b) return;
      if (b.dataset.day) { const d = +b.dataset.day, a = D.hoursSpec.days; D.hoursSpec.days = a.includes(d) ? a.filter(x => x !== d) : [...a, d].sort(); b.classList.toggle("on"); host.querySelector("[data-hours]").textContent = "نمایش: " + hours(D.hoursSpec); }
      if (b.dataset.rmg) { D.gallery.splice(+b.dataset.rmg, 1); draw(); }
      if (b.dataset.mv) { const [i, d] = b.dataset.mv.split(":").map(Number); const g = D.gallery; [g[i], g[i + d]] = [g[i + d], g[i]]; draw(); }
      if (b.dataset.save !== undefined) {
        const urls = [D.website, D.video, ...Object.values(D.socials || {})].filter(Boolean);
        if (urls.some(u => !/^https:\/\/[^\s<>"']+$/.test(u))) return toast("لینک‌ها باید با https:// شروع شوند");
        if (D.video && !videoOk(D.video)) return toast("لینک ویدئو فقط از این سایت‌ها پذیرفته می‌شود: " + videoHosts().join("، "));
        const ph = String(D.phone || "").replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/[\s-]/g, "");
        if (!/^0\d{9,10}$/.test(ph)) return toast("تلفن سازمان لازم است (با پیش‌شماره، مثلاً ۰۲۱۲۲۲۲۰۰۰۰)");
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(D.email || "")) return toast("ایمیل سازمان لازم است تا متقاضیان و اطلاع‌رسانی‌ها به آن برسند");
        D.phone = ph;
        const keep = ["orgType", "tagline", "about", "services", "accreditations", "hoursSpec", "phone", "email", "website", "socials", "video", "branches", "staff", "founded", "gallery"];
        const out = {}; keep.forEach(k => out[k] = D[k]); out.hours = hours(D.hoursSpec);
        b.classList.add("is-busy");
        A.saveOrg(id, out).then(() => toast("پروفایل سازمان ذخیره شد ✓ صفحه‌ی عمومی به‌روز است"), fail).finally(() => b.classList.remove("is-busy"));
      }
    };
    draw();
  }

  /* ================= محصولات ================= */
  function products(host) {
    let edit = null;
    const mine = () => A.products(myOrgId());
    function del(id) {
      if (!confirm("این محصول حذف شود؟")) return;
      A.deleteProduct(id).then(() => { draw(); toast("محصول حذف شد"); }, fail);
    }
    function form(d) {
      return `<div class="panel rb-form"><div class="form-grid">
        <div class="form-field"><label>دسته *</label>${TUI.picker({ options: O.productCats(), value: d.cat || "", onChange: v => d.cat = v })}</div>
        <div class="form-field"><label>نام محصول *</label><input type="text" maxlength="120" data-p="name" value="${e(d.name || "")}"></div>
        <div class="form-field"><label>برند</label><input type="text" maxlength="60" data-p="brand" value="${e(d.brand || "")}"></div>
        <div class="form-field"><label>مدل</label><input type="text" maxlength="60" data-p="model" dir="ltr" value="${e(d.model || "")}"></div>
        <div class="form-field"><label>قیمت (تومان) — خالی = استعلامی</label><input type="number" min="0" data-p="price" data-num value="${e(d.price || "")}"></div>
        <div class="form-field"><label>تصویر</label><label class="btn btn-outline btn-sm">📷 انتخاب تصویر<input type="file" accept="image/jpeg,image/png,image/webp" data-pimg hidden></label>${d.img ? ' <span class="chip teal">تصویر دارد</span> <button type="button" class="btn btn-sm btn-ghost" data-noimg>حذف تصویر</button>' : ""}</div>
        <div class="form-field full"><label>توضیحات</label><textarea rows="3" maxlength="1000" data-p="desc">${e(d.desc || "")}</textarea></div>
        <div class="form-field full"><label>مشخصات فنی</label>
          ${(d.specs || []).map((s, i) => `<div style="display:flex;gap:8px;margin-bottom:6px"><input type="text" maxlength="40" data-spec="${i}:0" value="${e(s[0])}" placeholder="ویژگی (مثلاً ظرفیت)"><input type="text" maxlength="80" data-spec="${i}:1" value="${e(s[1])}" placeholder="مقدار"><button type="button" class="btn btn-sm btn-ghost danger" data-rmspec="${i}">×</button></div>`).join("")}
          <button type="button" class="tp-add" data-addspec>+ ردیف مشخصات</button></div>
      </div><div class="fb-actions"><button type="button" class="btn btn-sm btn-primary" data-ok>ذخیره محصول</button><button type="button" class="btn btn-sm btn-ghost" data-cancel>انصراف</button></div></div>`;
    }
    function draw() {
      const list = mine();
      const org = A.org(myOrgId());
      if (!org) { host.innerHTML = '<div class="empty-inline">ابتدا سازمان خود را ثبت کنید؛ محصولات به نام سازمان منتشر می‌شوند.</div>'; return; }
      host.innerHTML = `<div class="syllabus-head" style="margin-bottom:12px"><div><p>محصولات «${e(org.name || "")}» در صفحه‌ی سازمان و کاتالوگ محصولات نمایش داده می‌شوند.</p></div>
        <button type="button" class="btn btn-primary btn-sm" data-new>+ محصول جدید</button></div>
        ${edit ? form(edit) : ""}
        <div class="prod-grid">${list.map(p => `<div>${TUI.productCard(p)}<div class="fb-actions" style="margin-top:6px"><button type="button" class="btn btn-sm btn-outline" data-edit="${p.id}">ویرایش</button><button type="button" class="btn btn-sm btn-ghost danger" data-del="${p.id}">حذف</button></div></div>`).join("")
          || '<div class="empty-inline" style="grid-column:1/-1">هنوز محصولی ثبت نکرده‌اید.</div>'}</div>`;
    }
    host.oninput = ev => {
      const t = ev.target; if (!edit) return;
      if (t.dataset.p) edit[t.dataset.p] = t.dataset.num !== undefined ? (t.value === "" ? null : +t.value) : t.value;
      if (t.dataset.spec) { const [i, k] = t.dataset.spec.split(":").map(Number); edit.specs[i][k] = t.value; }
    };
    host.onchange = async ev => {
      if (ev.target.dataset.pimg === undefined || !edit) return;
      try { Object.assign(edit, await A.image(ev.target.files[0], "product", 900)); draw(); } catch (err) { fail(err); }
    };
    host.onclick = ev => {
      const b = ev.target.closest("button"); if (!b) return;
      if (b.dataset.new !== undefined) { edit = { id: A.newProductId(), orgId: myOrgId(), specs: [["", ""]] }; draw(); }
      else if (b.dataset.edit) { edit = clone(aioProducts().find(p => p.id === +b.dataset.edit)); edit.specs = edit.specs || []; draw(); }
      else if (b.dataset.del) del(+b.dataset.del);
      else if (b.dataset.addspec !== undefined) { edit.specs.push(["", ""]); draw(); }
      else if (b.dataset.rmspec) { edit.specs.splice(+b.dataset.rmspec, 1); draw(); }
      else if (b.dataset.noimg !== undefined) { delete edit.img; edit.att = 0; draw(); }
      else if (b.dataset.cancel !== undefined) { edit = null; draw(); }
      else if (b.dataset.ok !== undefined) {
        if (!edit.cat || !(edit.name || "").trim()) return toast("دسته و نام محصول لازم است");
        edit.specs = (edit.specs || []).filter(s => s[0].trim() && s[1].trim());
        b.classList.add("is-busy");
        A.saveProduct(edit).then(() => { edit = null; draw(); toast("محصول ذخیره شد ✓"); }, fail).finally(() => b.classList.remove("is-busy"));
      }
    };
    window.EmpProducts = () => { edit = null; draw(); };
    draw();
  }

  /* ================= تعریف پوزیشن با نیازمندی ساخت‌یافته ================= */
  function positionForm(host, onSaved) {
    let D;
    const blank = () => ({ title: "", role: "", dept: "", provinceId: "", city: "", type: "تمام‌وقت", shift: "صبح", salaryMin: "", salaryMax: "", internal: false, orgName: "", desc: "", benefits: [], remote: false,
      req: { seniority: "", minExp: 0, expDept: 0, degree: "", fields: [], licenses: [], langs: [], age: null, gender: "", military: [], skills: [] } });
    function load(id) {
      const ex = id ? A.position(id) : null;
      D = ex ? clone(ex) : blank();
      D.req = Object.assign(blank().req, D.req || {});
      draw();
      host.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    const yearsSel = (k, v) => `<select data-rq="${k}">${[0, 0.5, 1, 2, 3, 4, 5, 7, 10, 15].map(y => `<option value="${y * 12}" ${+v === y * 12 ? "selected" : ""}>${y ? fa(y) + " سال" : "نیاز نیست"}</option>`).join("")}</select>`;
    function preview() {
      const box = host.querySelector("[data-preview]"); if (!box) return;
      const job = toJob();
      if (!job.req.skills.length) { box.innerHTML = '<span class="muted">برای پیش‌نمایش، حداقل یک مهارت اضافه کنید.</span>'; return; }
      const res = AioMatch.candidatesFor(job, aioCandidates());
      const hi = res.filter(x => x.m.fit === "high"), mid = res.filter(x => x.m.fit === "mid"), ok = res.filter(x => x.m.eligible);
      box.innerHTML = `<b>پیش‌نمایش زنده از بانک رزومه:</b> ${fa(hi.length)} نفر تطبیق بالا، ${fa(mid.length)} نفر متوسط، ${fa(ok.length)} نفر واجد شرایط الزامی از ${fa(res.length)} رزومه.
        <div class="rb-live" style="margin-top:8px">${res.slice(0, 4).map(x => `<span>${e(x.c.name)} <b>${fa(x.m.score)}٪</b></span>`).join("")}</div>`;
    }
    function toJob() {
      const r = clone(D.req);
      if (!r.age || (!r.age[0] && !r.age[1])) delete r.age;
      ["seniority", "degree"].forEach(k => { if (!r[k]) delete r[k]; else r[k] = +r[k]; });
      if (!r.gender || r.gender === "فرقی نمی‌کند") delete r.gender;
      if (!r.military.length) delete r.military;
      r.role = D.role;
      return Object.assign({}, D, { req: r });
    }
    function draw() {
      const R = D.req;
      host.innerHTML = `
      <div class="panel"><h2>اطلاعات پوزیشن</h2><div class="form-grid">
        <div class="form-field full"><label>نمایش</label><div style="display:flex;gap:18px;flex-wrap:wrap">
          <label class="check-item inline"><input type="radio" name="pf-vis" value="0" ${D.internal ? "" : "checked"}> آگهی عمومی در سایت</label>
          <label class="check-item inline"><input type="radio" name="pf-vis" value="1" ${D.internal ? "checked" : ""}> پوزیشن داخلی (فقط تطبیق؛ مثلاً برای مشتری بیرون از سایت)</label></div></div>
        ${D.internal ? `<div class="form-field full"><label>نام مشتری / سازمان مقصد</label><input type="text" maxlength="100" data-d="orgName" value="${e(D.orgName)}"></div>` : ""}
        <div class="form-field"><label>عنوان شغلی استاندارد *</label>${TUI.picker({ options: O.roles(), value: D.role, onChange: v => { D.role = v; const r = AIO_ROLES.find(x => x.id === v); if (r) { if (!D.title) D.title = r.name; if (!D.dept) D.dept = r.dept; } draw(); } })}</div>
        <div class="form-field"><label>عنوان آگهی *</label><input type="text" maxlength="100" data-d="title" value="${e(D.title)}"></div>
        <div class="form-field"><label>بخش *</label>${TUI.picker({ options: O.depts(), value: D.dept, onChange: v => { D.dept = v; preview(); } })}</div>
        <div class="form-field"><label>استان *</label>${TUI.picker({ options: O.provinces(), value: D.provinceId, onChange: v => { D.provinceId = v; D.city = ""; draw(); } })}</div>
        <div class="form-field"><label>شهر *</label>${TUI.picker({ options: O.cities(D.provinceId), value: D.city, placeholder: D.provinceId ? "انتخاب شهر" : "ابتدا استان", onChange: v => { D.city = v; preview(); } })}</div>
        <div class="form-field"><label>نوع همکاری</label>${TUI.picker({ options: O.jobTypes(), value: D.type, onChange: v => D.type = v })}</div>
        <div class="form-field"><label>شیفت</label>${TUI.picker({ options: O.shifts(), value: D.shift, onChange: v => D.shift = v })}</div>
        <div class="form-field"><label>حقوق از (میلیون تومان)</label><input type="number" min="0" data-d="salaryMin" data-num value="${e(D.salaryMin)}"></div>
        <div class="form-field"><label>حقوق تا (میلیون تومان)</label><input type="number" min="0" data-d="salaryMax" data-num value="${e(D.salaryMax)}"></div>
        ${A.withDesc ? `<div class="form-field full"><label>شرح موقعیت شغلی ${D.internal ? "(اختیاری)" : "*"}</label><textarea rows="4" maxlength="5000" data-d="desc" placeholder="شرح وظایف، محیط کار و ساعات کاری">${e(D.desc || "")}</textarea></div>
        <div class="form-field full"><label>مزایا</label>${TUI.picker({ multi: true, options: AIO_BENEFITS.map(x => [x, x]), value: D.benefits || [], addLabel: "مزیت", onChange: v => D.benefits = v })}</div>
        <div class="form-field full"><label class="check-item inline"><input type="checkbox" data-remote ${D.remote ? "checked" : ""}> امکان دورکاری دارد</label></div>` : ""}
      </div></div>

      <div class="panel"><h2>شرایط احراز (ساخت‌یافته)</h2><div class="form-grid">
        <div class="form-field"><label>رده شغلی</label>${TUI.picker({ options: [["", "مهم نیست"], ...O.seniority()], value: R.seniority, onChange: v => { R.seniority = v; preview(); } })}</div>
        <div class="form-field"><label>حداقل سابقه کل</label>${yearsSel("minExp", R.minExp)}</div>
        <div class="form-field"><label>حداقل سابقه در همین بخش</label>${yearsSel("expDept", R.expDept)}</div>
        <div class="form-field"><label>حداقل مدرک</label>${TUI.picker({ options: [["", "مهم نیست"], ...O.degrees()], value: R.degree, onChange: v => { R.degree = v; preview(); } })}</div>
        <div class="form-field full"><label>رشته‌های قابل‌قبول</label>${TUI.picker({ multi: true, options: O.fields(), value: R.fields, addLabel: "رشته", onChange: v => { R.fields = v; preview(); } })}</div>
        <div class="form-field full"><label>مدارک / پروانه‌های الزامی</label>${TUI.picker({ multi: true, options: O.licenses(), value: R.licenses, addLabel: "مدرک", onChange: v => { R.licenses = v; preview(); } })}</div>
        <div class="form-field"><label>جنسیت</label>${TUI.picker({ options: [["فرقی نمی‌کند", "فرقی نمی‌کند"], ...O.genders()], value: R.gender || "فرقی نمی‌کند", onChange: v => { R.gender = v; preview(); } })}</div>
        <div class="form-field"><label>نظام وظیفه (آقایان)</label>${TUI.picker({ multi: true, options: O.military(), value: R.military, addLabel: "وضعیت", onChange: v => { R.military = v; preview(); } })}</div>
        <div class="form-field"><label>حداقل سن</label><input type="number" min="16" max="70" data-age="0" value="${e(R.age ? R.age[0] : "")}" placeholder="مهم نیست"></div>
        <div class="form-field"><label>حداکثر سن</label><input type="number" min="16" max="70" data-age="1" value="${e(R.age ? R.age[1] : "")}" placeholder="مهم نیست"></div>
        <div class="form-field full"><label>زبان خارجی</label>
          ${R.langs.map((l, i) => `<div class="rb-skill"><span>${e(name.lang(l.id))}</span><span style="display:flex;gap:8px;align-items:center"><select data-lang="${i}">${AIO_LANG_LEVELS.map(x => `<option value="${x.v}" ${+l.lvl === x.v ? "selected" : ""}>حداقل ${x.name}</option>`).join("")}</select><button type="button" class="btn btn-sm btn-ghost danger" data-rmlang="${i}">×</button></span></div>`).join("")}
          ${TUI.picker({ multi: true, options: O.langs().filter(o => !R.langs.some(l => l.id === o[0])), value: [], addLabel: "زبان", onChange: v => { v.forEach(id => { if (!R.langs.some(l => l.id === id)) R.langs.push({ id, lvl: 2 }); }); draw(); } })}</div>
      </div></div>

      <div class="panel"><h2>مهارت‌ها، سطح لازم و وزن</h2>
        <p class="muted" style="font-size:13px">وزن (۱ تا ۱۰) اهمیت هر مهارت در امتیاز نهایی است. «کلیدی» یعنی بدون آن (پوشش کمتر از ۵۰٪) نفر واجد شرایط نیست.</p>
        ${R.skills.map((s, i) => `<div class="req-skill"><b style="font-size:13.5px">${e(name.skill(s.id))}</b>
          <select data-sk="${i}:lvl">${AIO_SKILL_LEVELS.map(l => `<option value="${l.v}" ${+s.lvl === l.v ? "selected" : ""}>${l.name}</option>`).join("")}</select>
          <span style="display:flex;align-items:center;gap:6px;min-width:150px"><input type="range" min="1" max="10" data-sk="${i}:w" value="${s.w}"><b data-wv="${i}">${fa(s.w)}</b></span>
          <label class="check-item inline"><input type="checkbox" data-sk="${i}:must" ${s.must ? "checked" : ""}> کلیدی</label>
          <button type="button" class="btn btn-sm btn-ghost danger" data-rmsk="${i}">×</button></div>`).join("") || '<div class="empty-inline">هنوز مهارتی تعریف نشده است.</div>'}
        <div style="margin-top:12px">${TUI.picker({ multi: true, options: O.skills().filter(o => !R.skills.some(s => s.id === o[0])), value: [], addLabel: "افزودن مهارت/دستگاه", onChange: v => { v.forEach(id => { if (!R.skills.some(s => s.id === id)) R.skills.push({ id, w: 5, lvl: 3, must: false }); }); draw(); } })}</div>
      </div>

      <div class="notice-box info" data-preview style="margin-bottom:14px"></div>
      <div style="display:flex;justify-content:flex-end;gap:10px">${D.id ? '<button type="button" class="btn btn-ghost" data-new>پوزیشن جدید</button>' : ""}<button type="button" class="btn btn-primary btn-lg" data-submit>${D.id ? "ذخیره تغییرات" : (D.internal ? "ثبت پوزیشن داخلی" : "ثبت و ارسال برای تأیید")}</button></div>`;
      preview();
    }
    host.oninput = ev => {
      const t = ev.target;
      if (t.dataset.d) { D[t.dataset.d] = t.dataset.num !== undefined ? (t.value === "" ? "" : +t.value) : t.value; }
      if (t.dataset.age) { D.req.age = D.req.age || [0, 0]; D.req.age[+t.dataset.age] = +t.value || 0; if (!D.req.age[0] && !D.req.age[1]) D.req.age = null; else { if (!D.req.age[1]) D.req.age[1] = 70; if (!D.req.age[0]) D.req.age[0] = 16; } preview(); }
      if (t.dataset.sk) { const [i, k] = t.dataset.sk.split(":"); const s = D.req.skills[+i];
        if (k === "w") { s.w = +t.value; host.querySelector(`[data-wv="${i}"]`).textContent = fa(s.w); } else if (k === "lvl") s.lvl = +t.value; else s.must = t.checked; preview(); }
      if (t.dataset.lang) { D.req.langs[+t.dataset.lang].lvl = +t.value; preview(); }
      if (t.dataset.rq) { D.req[t.dataset.rq] = +t.value; preview(); }
    };
    host.onchange = ev => {
      const t = ev.target;
      if (t.name === "pf-vis") { D.internal = t.value === "1"; draw(); return; }
      if (t.dataset.remote !== undefined) { D.remote = t.checked; return; }
      if (t.dataset.sk && t.type === "checkbox") host.oninput(ev);
    };
    host.onclick = ev => {
      const b = ev.target.closest("button"); if (!b) return;
      if (b.dataset.rmsk) { D.req.skills.splice(+b.dataset.rmsk, 1); draw(); }
      if (b.dataset.rmlang) { D.req.langs.splice(+b.dataset.rmlang, 1); draw(); }
      if (b.dataset.new !== undefined) load(null);
      if (b.dataset.submit !== undefined) {
        const miss = [];
        if (!D.role) miss.push("عنوان شغلی استاندارد"); if (!(D.title || "").trim()) miss.push("عنوان آگهی");
        if (!D.dept) miss.push("بخش"); if (!D.city) miss.push("شهر"); if (!D.req.skills.length) miss.push("حداقل یک مهارت");
        if (D.internal && !(D.orgName || "").trim()) miss.push("نام مشتری");
        if (miss.length) return toast("موارد لازم: " + miss.join("، "));
        if (D.salaryMin && D.salaryMax && D.salaryMax < D.salaryMin) return toast("حداکثر حقوق کمتر از حداقل است");
        if (A.withDesc && !D.internal && (D.desc || "").trim().length < 20) return toast("شرح موقعیت شغلی را کامل‌تر بنویسید (حداقل ۲۰ نویسه)");
        const org = A.org(myOrgId()) || {};
        if (!org.id) return toast("ابتدا سازمان خود را ثبت کنید");
        const job = toJob();
        Object.assign(job, { mine: true, labId: org.id, orgName: D.internal ? D.orgName : org.name,
          salary: D.salaryMin ? fa(D.salaryMin) + (D.salaryMax ? " تا " + fa(D.salaryMax) : "") + " میلیون تومان" : "توافقی",
          created: D.created || new Date().toISOString().slice(0, 10) });
        b.classList.add("is-busy");
        A.savePosition(job).then(saved => {
          toast(D.internal ? "پوزیشن داخلی ثبت شد ✓ نیروهای مناسب را در «تطبیق هوشمند» ببینید" : (saved && saved.status === "publish" ? "آگهی منتشر شد ✓" : "آگهی ثبت شد و پس از تأیید منتشر می‌شود ✓"));
          load(null);
          if (onSaved) onSaved(saved || job);
        }, fail).finally(() => b.classList.remove("is-busy"));
      }
    };
    load(null);
    return { load };
  }

  return { orgProfile, products, positionForm, myOrgId, adapter: A, readImage };
})();
