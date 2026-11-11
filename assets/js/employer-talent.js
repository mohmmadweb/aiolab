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
  /* طبقه‌بندی پویا (talent-data.js در دمو؛ در وردپرس از تنظیمات) — اگر نباشد فرم‌ها مثل قبل کار می‌کنند */
  const hasTax = typeof Tax !== "undefined";

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
  /* کاتالوگ و مدارک: PDF یا تصویر تا ۱۰ مگابایت؛ دمو فایل‌های کوچک را در حافظه نگه می‌دارد و برای بقیه فقط نام/حجم */
  function readFileMeta(file) {
    return new Promise((ok, bad) => {
      if (!/^(application\/pdf|image\/(jpeg|png|webp))$/.test(file.type)) return bad("فقط فایل PDF یا تصویر (JPG، PNG، WebP)");
      if (file.size > 10 * 1024 * 1024) return bad("حداکثر حجم هر فایل ۱۰ مگابایت است");
      const mb = file.size / 1048576;
      const meta = { name: file.name.slice(0, 120), size: fa(mb >= 1 ? mb.toFixed(1) : Math.max(1, Math.round(file.size / 1024))) + (mb >= 1 ? " مگابایت" : " کیلوبایت") };
      if (file.size > 1.5 * 1024 * 1024) return ok(meta);
      const fr = new FileReader(); fr.onload = () => ok(Object.assign(meta, { data: fr.result })); fr.onerror = () => bad("فایل خوانده نشد"); fr.readAsDataURL(file);
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
    file: async (file, purpose) => readFileMeta(file),
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
      phone: "", email: "", website: "", socials: {}, video: "", branches: "", staff: "", founded: "", gallery: [],
      labType: "", companyTypes: [], groups: [], represents: [], repairs: [], ceo: {}, catalogs: [], documents: [] }, clone(o));
    if (!D.companyTypes.length && typeof orgCompanyTypes === "function") D.companyTypes = orgCompanyTypes(D).slice();
    D.ceo = D.ceo || {};
    /* لینک‌های نمونه‌ی «#» معتبر نیستند و نباید جلوی ذخیره را بگیرند */
    D.socials = Object.fromEntries(Object.entries(D.socials || {}).filter(([, v]) => /^https:\/\//.test(v)));
    const hours = h => h.h24 ? "شبانه‌روزی" : (h.days.length ? (h.days.length > 2 && h.days.every((d, i) => i === 0 || d === h.days[i - 1] + 1) ? AIO_WEEKDAYS[h.days[0]] + " تا " + AIO_WEEKDAYS[h.days[h.days.length - 1]] : h.days.map(d => AIO_WEEKDAYS[d]).join("، ")) + " " + fa(h.from) + " تا " + fa(h.to) : "");
    const hsel = (k, v) => `<select data-h="${k}">${Array.from({ length: 25 }, (_, i) => `<option value="${i}" ${+v === i ? "selected" : ""}>${fa(i)}:۰۰</option>`).join("")}</select>`;
    /* ---------- نوع، حوزه، نمایندگی، تعمیرات، مدیرعامل، کاتالوگ و مدارک (همه از طبقه‌بندی پویا) ---------- */
    const tOpts = (k, extra) => { const o = Tax.list(k).map(x => [x.id, x.name + (x.country ? " — " + x.country : "")]); (extra || []).filter(v => v && !o.some(x => x[0] === v)).forEach(v => o.push([v, v + " (پیشنهادی)"])); return o; };
    const asks = () => D.companyTypes.flatMap(t => (Tax.find("companyTypes", t) || {}).asks || []);
    const byName = () => (A.org(id) || {}).name || "";
    function typePanels() {
      if (!hasTax) return "";
      const isCo = D.orgType === "company", need = asks();
      const groupItems = g => Tax.itemsOf(g).filter(i => i.kind === "device").map(i => [i.id, i.name]);
      let h = `<div class="panel"><h2>${isCo ? "نوع و حوزه‌ی فعالیت شرکت" : "نوع مرکز و بخش‌های فعال"}</h2>
        <p class="muted" style="font-size:13px">فهرست‌ها را مدیر سایت تعریف می‌کند. اگر برند یا دستگاهی در فهرست نیست، نامش را در جستجو بنویسید و «افزودن» را بزنید؛ برای تأیید به مدیر سایت می‌رود.</p>
        <div class="form-grid">
        ${isCo ? `<div class="form-field full"><label>نوع شرکت * (می‌تواند چند مورد باشد)</label>${TUI.picker({ multi: true, options: tOpts("companyTypes"), value: D.companyTypes, addLabel: "نوع شرکت", onChange: v => { D.companyTypes = v; draw(); } })}
            <small class="muted">${D.companyTypes.map(t => e((Tax.find("companyTypes", t) || {}).desc || "")).filter(Boolean).join(" · ")}</small></div>`
          : `<div class="form-field"><label>نوع مرکز</label>${TUI.picker({ options: tOpts("labTypes"), value: D.labType, onChange: v => D.labType = v })}</div>`}
        <div class="form-field full"><label>${isCo ? "گروه‌های محصول / حوزه‌ی فعالیت" : "بخش‌های فعال آزمایشگاه"}</label>${TUI.picker({ multi: true, options: tOpts("groups"), value: D.groups, addLabel: "گروه", onChange: v => D.groups = v })}</div>
        ${isCo && need.includes("brands") ? `<div class="form-field full"><label>نماینده‌ی کدام شرکت‌ها / برندها؟</label>${TUI.picker({ multi: true, allowNew: true, options: tOpts("brands", D.represents), value: D.represents, addLabel: "برند / شرکت", onChange: v => D.represents = v, onNew: v => Tax.propose("brands", { id: v, name: v }, byName()) })}</div>` : ""}
        </div></div>`;
      if (isCo && need.includes("repairs")) {
        h += `<div class="panel"><h2>خدمات تعمیر و نگهداری</h2>
          <p class="muted" style="font-size:13px">بگویید چه دستگاهی از چه برندی را تعمیر می‌کنید؛ آزمایشگاه‌ها در «یافتن تعمیرکار» دقیقاً با همین‌ها جستجو می‌کنند (مثال: بیوشیمی ← اتوآنالایزر ← Hitachi ← ۹۱۲).</p>
          ${D.repairs.map((r, i) => `<div class="rep-row">
            <div class="form-field"><label>گروه</label>${TUI.picker({ options: tOpts("groups"), value: r.group, onChange: v => { r.group = v; r.item = ""; draw(); } })}</div>
            <div class="form-field"><label>دستگاه</label>${TUI.picker({ allowNew: true, options: [...groupItems(r.group), ...(r.item && !Tax.find("items", r.item) ? [[r.item, r.item + " (پیشنهادی)"]] : [])], value: r.item, onChange: v => r.item = v, onNew: v => Tax.propose("items", { id: v, name: v, group: r.group, kind: "device" }, byName()) })}</div>
            <div class="form-field"><label>برند</label>${TUI.picker({ allowNew: true, options: tOpts("brands", [r.brand]), value: r.brand, onChange: v => r.brand = v, onNew: v => Tax.propose("brands", { id: v, name: v }, byName()) })}</div>
            <div class="form-field"><label>مدل‌ها</label><input type="text" dir="ltr" maxlength="120" data-rep="${i}" value="${e(r.models || "")}" placeholder="912, 917"></div>
            <button type="button" class="btn btn-sm btn-ghost danger" data-rmrep="${i}" aria-label="حذف ردیف">×</button></div>`).join("") || '<div class="empty-inline">هنوز خدمتی ثبت نشده است.</div>'}
          <button type="button" class="tp-add" data-addrep style="margin-top:8px">+ دستگاه / برند تازه</button></div>`;
      }
      const C = D.ceo;
      h += `<div class="panel"><h2>${isCo ? "معرفی مدیرعامل" : "معرفی مدیر / مسئول فنی"} <small class="muted" style="font-weight:400">(اختیاری)</small></h2><div class="form-grid">
          <div class="form-field"><label>نام</label><input type="text" maxlength="80" data-ceo="name" value="${e(C.name || "")}"></div>
          <div class="form-field"><label>سمت</label><input type="text" maxlength="60" data-ceo="title" value="${e(C.title || "")}" placeholder="${isCo ? "مدیرعامل" : "مسئول فنی"}"></div>
          <div class="form-field full"><label>معرفی کوتاه</label><textarea rows="2" maxlength="400" data-ceo="bio">${e(C.bio || "")}</textarea></div>
          <div class="form-field"><label>لینکدین</label><input type="url" dir="ltr" maxlength="200" data-ceo="linkedin" value="${e(C.linkedin || "")}" placeholder="https://"></div>
          <div class="form-field"><label>عکس</label><label class="btn btn-outline btn-sm">📷 انتخاب عکس<input type="file" accept="image/jpeg,image/png,image/webp" data-ceoimg hidden></label>${C.img ? ' <span class="chip teal">عکس دارد</span> <button type="button" class="btn btn-sm btn-ghost" data-rmceoimg>حذف عکس</button>' : ""}</div>
        </div></div>`;
      const fileRow = (f, i, k) => `<li class="file-row"><span>📄 <bdi>${e(f.name)}</bdi></span><small class="muted">${e(f.size || "")}${f.kind ? " · " + e(f.kind) : ""}</small>${k === "documents" ? `<span class="chip ${f.status === "verified" ? "teal" : ""}">${f.status === "verified" ? "تأییدشده" : "در انتظار بررسی"}</span>` : ""}<button type="button" class="btn btn-sm btn-ghost danger" data-rmfile="${k}:${i}">حذف</button></li>`;
      h += `<div class="panel"><h2>${isCo ? "کاتالوگ محصولات و فایل‌ها" : "بروشور و فهرست خدمات"}</h2>
          <p class="muted" style="font-size:13px">PDF یا تصویر، هر فایل تا ۱۰ مگابایت؛ در صفحه‌ی عمومی برای دانلود نمایش داده می‌شود.</p>
          <ul class="file-list">${D.catalogs.map((f, i) => fileRow(f, i, "catalogs")).join("")}</ul>
          ${D.catalogs.length < 10 ? `<label class="btn btn-outline btn-sm">⬆ آپلود فایل<input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" multiple data-fup="catalogs" hidden></label>` : ""}</div>
        <div class="panel"><h2>مدارک و احراز</h2>
          <p class="muted" style="font-size:13px">مدارک فقط برای مدیر سایت دیده می‌شود؛ پس از بررسی، نشان «مدارک تأییدشده» روی صفحه‌ی ${isCo ? "شرکت" : "مرکز"} می‌آید.</p>
          <ul class="file-list">${D.documents.map((f, i) => fileRow(f, i, "documents")).join("")}</ul>
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><select data-dockind aria-label="نوع مدرک">${Tax.list("docKinds").map(k => `<option>${e(k)}</option>`).join("")}</select>
          <label class="btn btn-outline btn-sm">⬆ آپلود مدرک<input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" data-fup="documents" hidden></label></div></div>`;
      return h;
    }
    function draw() {
      host.innerHTML = `
      <div class="panel"><div class="form-grid">
        <div class="form-field"><label>سازمانی که مدیریت می‌کنید</label>${TUI.picker({ options: A.orgs(), value: id, onChange: v => { A.setOrgId(+v); orgProfile(host); if (window.EmpProducts) EmpProducts(); } })}</div>
        <div class="form-field"><label>نوع سازمان</label>${TUI.picker({ options: O.orgTypes(), value: D.orgType, onChange: v => { D.orgType = v; draw(); } })}</div>
        <div class="form-field full"><label>شعار / معرفی یک‌خطی</label><input type="text" maxlength="90" data-k="tagline" value="${e(D.tagline)}"></div>
        <div class="form-field full"><label>درباره سازمان</label><textarea rows="4" maxlength="1500" data-k="about">${e(D.about)}</textarea></div>
      </div></div>
      ${typePanels()}

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
      if (t.dataset.ceo) D.ceo[t.dataset.ceo] = t.value;
      if (t.dataset.rep) D.repairs[+t.dataset.rep].models = t.value;
      if (t.dataset.h) { D.hoursSpec[t.dataset.h] = +t.value; host.querySelector("[data-hours]").textContent = "نمایش: " + hours(D.hoursSpec); }
    };
    host.onchange = async ev => {
      const t = ev.target;
      if (t.dataset.h24 !== undefined) { D.hoursSpec.h24 = t.checked; host.querySelector("[data-hours]").textContent = "نمایش: " + hours(D.hoursSpec); }
      if (t.dataset.ceoimg !== undefined && t.files[0]) {
        try { D.ceo.img = (await A.image(t.files[0], "ceo:" + id, 400)).img; draw(); } catch (err) { fail(err); }
      }
      if (t.dataset.fup) {
        const k = t.dataset.fup, kind = (host.querySelector("[data-dockind]") || {}).value;
        for (const f of [...t.files].slice(0, 10 - D[k].length)) {
          try { D[k].push(Object.assign(await A.file(f, k + ":" + id), k === "documents" ? { kind, status: "pending" } : {})); } catch (err) { fail(err); }
        }
        draw();
      }
      if (t.dataset.up !== undefined) {
        for (const f of [...t.files].slice(0, 10 - D.gallery.length)) {
          try { D.gallery.push(Object.assign({ t: f.name.replace(/\.[^.]+$/, "").slice(0, 60) }, await A.image(f, "gallery:" + id, 1280))); } catch (err) { fail(err); }
        }
        draw();
      }
    };
    host.onclick = ev => {
      const b = ev.target.closest("[data-day],[data-rmg],[data-mv],[data-save],[data-addrep],[data-rmrep],[data-rmfile],[data-rmceoimg]"); if (!b) return;
      if (b.dataset.addrep !== undefined) { D.repairs.push({ group: (D.groups || [])[0] || "", item: "", brand: "", models: "" }); draw(); return; }
      if (b.dataset.rmrep) { D.repairs.splice(+b.dataset.rmrep, 1); draw(); return; }
      if (b.dataset.rmfile) { const [k, i] = b.dataset.rmfile.split(":"); D[k].splice(+i, 1); draw(); return; }
      if (b.dataset.rmceoimg !== undefined) { delete D.ceo.img; draw(); return; }
      if (b.dataset.day) { const d = +b.dataset.day, a = D.hoursSpec.days; D.hoursSpec.days = a.includes(d) ? a.filter(x => x !== d) : [...a, d].sort(); b.classList.toggle("on"); host.querySelector("[data-hours]").textContent = "نمایش: " + hours(D.hoursSpec); }
      if (b.dataset.rmg) { D.gallery.splice(+b.dataset.rmg, 1); draw(); }
      if (b.dataset.mv) { const [i, d] = b.dataset.mv.split(":").map(Number); const g = D.gallery; [g[i], g[i + d]] = [g[i + d], g[i]]; draw(); }
      if (b.dataset.save !== undefined) {
        if (D.orgType === "company" && hasTax && !D.companyTypes.length) return toast("نوع شرکت را انتخاب کنید (تولیدی، وارداتی، توزیع یا خدماتی)");
        D.repairs = (D.repairs || []).filter(r => r.item && r.brand);
        const urls = [D.website, D.video, D.ceo && D.ceo.linkedin, ...Object.values(D.socials || {})].filter(Boolean);
        if (urls.some(u => !/^https:\/\/[^\s<>"']+$/.test(u))) return toast("لینک‌ها باید با https:// شروع شوند");
        if (D.video && !videoOk(D.video)) return toast("لینک ویدئو فقط از این سایت‌ها پذیرفته می‌شود: " + videoHosts().join("، "));
        const ph = String(D.phone || "").replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/[\s-]/g, "");
        if (!/^0\d{9,10}$/.test(ph)) return toast("تلفن سازمان لازم است (با پیش‌شماره، مثلاً ۰۲۱۲۲۲۲۰۰۰۰)");
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(D.email || "")) return toast("ایمیل سازمان لازم است تا متقاضیان و اطلاع‌رسانی‌ها به آن برسند");
        D.phone = ph;
        const keep = ["orgType", "tagline", "about", "services", "accreditations", "hoursSpec", "phone", "email", "website", "socials", "video", "branches", "staff", "founded", "gallery",
          "labType", "companyTypes", "groups", "represents", "repairs", "ceo", "catalogs", "documents"];
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
        <div class="form-field"><label>دسته *</label>${TUI.picker({ options: O.productCats(), value: d.cat || "", onChange: v => { d.cat = v; draw(); } })}</div>
        ${hasTax ? `<div class="form-field"><label>گروه (حوزه)</label>${TUI.picker({ options: Tax.list("groups").map(g => [g.id, g.name]), value: d.group || "", onChange: v => { d.group = v; d.item = ""; draw(); } })}</div>
        <div class="form-field"><label>تعریف محصول (مثلاً TSH، اتوآنالایزر)</label>${TUI.picker({ allowNew: true, placeholder: d.group ? "انتخاب یا افزودن" : "اول گروه را انتخاب کنید",
          options: [...Tax.itemsOf(d.group).map(i => [i.id, i.name]), ...(d.item && !Tax.find("items", d.item) ? [[d.item, d.item + " (پیشنهادی)"]] : [])], value: d.item || "",
          onChange: v => d.item = v, onNew: v => Tax.propose("items", { id: v, name: v, group: d.group, kind: d.cat === "analyzer" || d.cat === "equipment" ? "device" : "test" }, (A.org(myOrgId()) || {}).name) })}</div>` : ""}
        <div class="form-field"><label>نام محصول *</label><input type="text" maxlength="120" data-p="name" value="${e(d.name || "")}"></div>
        <div class="form-field"><label>برند / سازنده</label><input type="text" maxlength="60" data-p="brand" value="${e(d.brand || "")}" list="brand-list" placeholder="از فهرست انتخاب یا تایپ کنید">
          ${hasTax ? `<datalist id="brand-list">${Tax.list("brands").map(b => `<option value="${e(b.name)}">${e(b.country || "")}</option>`).join("")}</datalist>` : ""}</div>
        <div class="form-field"><label>مدل</label><input type="text" maxlength="60" data-p="model" dir="ltr" value="${e(d.model || "")}"></div>
        <div class="form-field"><label>قیمت (تومان) — خالی = استعلامی</label><input type="number" min="0" data-p="price" data-num value="${e(d.price || "")}"></div>
        <div class="form-field"><label>تصویر</label><label class="btn btn-outline btn-sm">📷 انتخاب تصویر<input type="file" accept="image/jpeg,image/png,image/webp" data-pimg hidden></label>${d.img ? ' <span class="chip teal">تصویر دارد</span> <button type="button" class="btn btn-sm btn-ghost" data-noimg>حذف تصویر</button>' : ""}</div>
        <div class="form-field full"><label>توضیحات</label><textarea rows="3" maxlength="1000" data-p="desc">${e(d.desc || "")}</textarea></div>
        ${hasTax && Tax.catFields(d.cat).length ? `<div class="form-field full"><label>ویژگی‌های ${e(Tax.name("categories", d.cat))} <small class="muted">(فیلدها را مدیر سایت برای هر دسته تعریف می‌کند؛ آزمایشگاه‌ها با همین‌ها فیلتر می‌کنند)</small></label>
          <div class="form-grid">${Tax.catFields(d.cat).map(f => `<div class="form-field"><label>${e(f.label)}${f.unit ? ` (${e(f.unit)})` : ""}</label>${f.type === "select"
            ? `<select data-attr="${e(f.key)}"><option value="">—</option>${(f.options || []).map(o => `<option ${String((d.attrs || {})[f.key]) === o ? "selected" : ""}>${e(o)}</option>`).join("")}</select>`
            : `<input type="${f.type === "number" ? "number" : "text"}" ${f.type === "number" ? 'min="0" data-num' : ""} maxlength="80" data-attr="${e(f.key)}" value="${e((d.attrs || {})[f.key] == null ? "" : d.attrs[f.key])}">`}</div>`).join("")}</div></div>` : ""}
        <div class="form-field full"><label class="check-item inline"><input type="checkbox" data-isnew ${d.isNew ? "checked" : ""}> این محصول/دستگاه <b>تازه وارد بازار</b> شده است (برچسب «جدید» و نمایش در بخش محصولات جدید)</label></div>
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
      if (t.dataset.attr) { edit.attrs = edit.attrs || {}; edit.attrs[t.dataset.attr] = t.dataset.num !== undefined ? (t.value === "" ? "" : +t.value) : t.value; }
      if (t.dataset.isnew !== undefined) { edit.isNew = t.checked; if (t.checked && !edit.launched) edit.launched = "امروز"; }
    };
    host.onchange = async ev => {
      if (edit && (ev.target.dataset.attr || ev.target.dataset.isnew !== undefined)) return host.oninput(ev);
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
        if (hasTax && edit.brand && !Tax.list("brands").some(b => b.name === edit.brand.trim())) Tax.propose("brands", { id: edit.brand.trim(), name: edit.brand.trim() }, (A.org(myOrgId()) || {}).name);
        if (edit.attrs) Object.keys(edit.attrs).forEach(k => { if (edit.attrs[k] === "") delete edit.attrs[k]; });
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
