/* ==========================================
   آیولب — بازار آزمایشگاه (دمو، ۱۴۰۵/۰۸)
   ارتباط آزمایشگاه ↔ شرکت: جستجوی پارامتریک محصول، یافتن تعمیرکار، استعلام قیمت / درخواست دمو / درخواست تعمیر،
   معرفی محصول جدید، پرسنل آماده به کار و بخش‌های پنل شرکت/آزمایشگاه.
   داده‌ی پایه از talent-data.js (Tax، aioProducts، aioRepairs، orgFull)؛ ذخیره‌ی دمو در حافظه‌ی مرورگر.
   ========================================== */

/* ---------- جستجوی محصول ----------
   f: { q, group, cat, item, brand, org, ctype, isNew, price, attrs: {key: value} } */
function filterProducts(f) {
  f = f || {};
  const q = (f.q || "").trim().toLowerCase();
  return aioProducts().filter(p => {
    const o = orgFull(p.orgId) || {};
    if (q && ![p.name, p.brand, p.model, o.name, Tax.itemName(p.item)].some(x => String(x || "").toLowerCase().includes(q))) return false;
    if (f.group && p.group !== f.group) return false;
    if (f.cat && p.cat !== f.cat) return false;
    if (f.item && p.item !== f.item) return false;
    if (f.brand && String(p.brand || "").toLowerCase() !== String(Tax.brandName(f.brand)).toLowerCase()) return false;
    if (f.org && +p.orgId !== +f.org) return false;
    if (f.ctype && !orgCompanyTypes(o).includes(f.ctype)) return false;
    if (f.isNew && !p.isNew) return false;
    if (f.price && !p.price) return false;
    for (const [k, v] of Object.entries(f.attrs || {})) if (v !== "" && v != null && String((p.attrs || {})[k]) !== String(v)) return false;
    return true;
  });
}

/* ---------- یافتن تعمیرکار: «چه کسی دستگاه X از برند Y مدل Z را تعمیر می‌کند؟» ---------- */
function findRepairers(f) {
  f = f || {};
  const model = String(f.model || "").trim().toLowerCase();
  const brandN = f.brand ? String(Tax.brandName(f.brand)).toLowerCase() : "";
  const hits = aioRepairs().filter(r =>
    (!f.group || r.group === f.group) && (!f.item || r.item === f.item) &&
    (!f.brand || r.brand === f.brand || String(Tax.brandName(r.brand)).toLowerCase() === brandN) &&
    (!model || String(r.models || "").toLowerCase().split(/[,،\s]+/).some(m => m && (m.includes(model) || model.includes(m)))));
  /* خدمات ثبت‌شده به‌شکل محصول (دسته‌ی «خدمات فنی») هم نشان داده می‌شوند */
  const services = aioProducts().filter(p => p.cat === "service" && (!f.group || p.group === f.group) && (!f.item || p.item === f.item) &&
    (!f.brand || String(p.brand || "").toLowerCase() === brandN));
  return { hits, services };
}

/* ---------- استعلام‌ها: قیمت، دمو/وبینار، تعمیر ---------- */
const INQ_KINDS = { quote: "استعلام قیمت", demo: "درخواست دمو / وبینار", repair: "درخواست تعمیر" };
const AIO_INQUIRIES = [
  { id: 1, kind: "quote", productId: 1, toOrg: 5, fromOrg: 1, fromName: "آزمایشگاه پاتوبیولوژی نور", msg: "برای دو دستگاه XN-550 با قرارداد سرویس دو ساله پیش‌فاکتور بفرستید.", date: "۱۴۰۵/۰۸/۱۶", status: "new" },
  { id: 2, kind: "demo", productId: 9, toOrg: 5, fromOrg: 3, fromName: "آزمایشگاه بیمارستان پارس", msg: "امکان دموی حضوری CL-1000i در شیراز هست؟", date: "۱۴۰۵/۰۸/۱۸", status: "new" },
  { id: 3, kind: "repair", toOrg: 5, fromOrg: 6, fromName: "آزمایشگاه رازی اصفهان", repair: { group: "hematology", item: "cell-counter", brand: "sysmex", model: "XN-350" }, msg: "خطای فلو در شمارش WBC؛ دستگاه از دیروز متوقف است.", date: "۱۴۰۵/۰۸/۱۹", status: "answered", reply: "تکنسین ما فردا صبح اعزام می‌شود." },
  { id: 4, kind: "repair", toOrg: 14, fromOrg: 1, fromName: "آزمایشگاه پاتوبیولوژی نور", repair: { group: "biochemistry", item: "auto-chem", brand: "hitachi", model: "912" }, msg: "لامپ دستگاه نیاز به تعویض و کالیبراسیون دارد.", date: "۱۴۰۵/۰۸/۱۷", status: "new" }
];
const Inquiries = {
  all() {
    const mine = Store.get("inquiries", []), patch = Store.get("inquiries_patch", {});
    return [...AIO_INQUIRIES, ...mine].map(x => Object.assign({}, x, patch[x.id] || {}));
  },
  add(x) { const a = Store.get("inquiries", []); x.id = Date.now(); x.date = "امروز"; x.status = "new"; a.push(x); Store.set("inquiries", a); return x; },
  update(id, p) { const all = Store.get("inquiries_patch", {}); all[id] = Object.assign(all[id] || {}, p); Store.set("inquiries_patch", all); },
  to: orgId => Inquiries.all().filter(x => +x.toOrg === +orgId),
  from: orgId => Inquiries.all().filter(x => +x.fromOrg === +orgId)
};

/* فرم مشترک استعلام (از صفحه‌ی محصول، شرکت یا نتیجه‌ی جستجوی تعمیرکار) */
function inquiryDialog(opt) {
  const u = Auth.user;
  if (!u) { Store.set("after_login", currentPath() + location.search + location.hash); toast("برای ارسال درخواست، با حساب آزمایشگاه وارد شوید"); setTimeout(() => location.href = "login.html?role=lab", 1100); return; }
  const to = orgFull(opt.toOrg) || {}, p = opt.productId ? aioProducts().find(x => x.id === +opt.productId) : null;
  const e = TUI.e;
  const box = document.createElement("div");
  box.className = "mk-modal";
  box.innerHTML = `<div class="mk-dialog panel" role="dialog" aria-modal="true" aria-label="${e(INQ_KINDS[opt.kind])}">
    <h2>${e(INQ_KINDS[opt.kind])}</h2>
    <p class="muted">به: <b>${e(to.name || "")}</b>${p ? ` · ${e(p.name)}` : ""}${opt.repair ? ` · ${e(Tax.itemName(opt.repair.item))} ${e(Tax.brandName(opt.repair.brand))} ${e(opt.repair.model || "")}` : ""}</p>
    <div class="form-field"><label>توضیح</label><textarea rows="4" maxlength="800" data-msg placeholder="${opt.kind === "repair" ? "مشکل دستگاه، کد خطا، آدرس آزمایشگاه" : (opt.kind === "demo" ? "شهر و زمان پیشنهادی برای دمو یا وبینار" : "تعداد، شرایط پرداخت، زمان تحویل")}"></textarea></div>
    <div class="fb-actions"><button type="button" class="btn btn-primary" data-send>ارسال</button><button type="button" class="btn btn-ghost" data-close>انصراف</button></div></div>`;
  document.body.appendChild(box);
  const close = () => box.remove();
  box.onclick = ev => {
    if (ev.target === box || ev.target.closest("[data-close]")) return close();
    if (ev.target.closest("[data-send]")) {
      const msg = box.querySelector("[data-msg]").value.trim();
      if (msg.length < 5) return toast("چند کلمه توضیح بنویسید");
      const fromOrg = u.role === "employer" ? Store.get("my_org_id", 1) : null;
      Inquiries.add({ kind: opt.kind, productId: p ? p.id : null, toOrg: +opt.toOrg, fromOrg, fromName: fromOrg ? (orgFull(fromOrg) || {}).name : u.name, repair: opt.repair || null, msg });
      close(); toast("درخواست شما برای «" + (to.name || "") + "» ارسال شد ✓ پاسخ در پنل شما دیده می‌شود");
    }
  };
  setTimeout(() => box.querySelector("textarea").focus(), 30);
}

/* ---------- معرفی محصول جدید ---------- */
const LAUNCH_CHANNELS = [
  { id: "badge", name: "برچسب «جدید» و نمایش در «محصولات تازه» (صفحه‌ی محصولات و صفحه‌ی اول)", price: 0 },
  { id: "notify", name: "اعلان به آزمایشگاه‌های فعال در همین گروه", service: "R21" },
  { id: "home", name: "بنر در صفحات اصلی", service: "R22" },
  { id: "webinar", name: "روز دمو / وبینار معرفی (دکمه‌ی ثبت‌نام روی صفحه‌ی محصول)", price: 0 }
];
const Launches = { all: () => Store.get("launches", []), add: x => Store.push("launches", x) };
function launchOf(productId) { return Launches.all().filter(l => +l.productId === +productId).pop() || null; }
function saveProductPatch(p, patch) {
  const list = Store.get("products", []), i = list.findIndex(x => x.id === p.id);
  const next = Object.assign({}, p, patch);
  if (i >= 0) list[i] = next; else list.push(next);
  Store.set("products", list);
  return next;
}

/* آزمایشگاه‌هایی که در گروه‌های یک محصول/شرکت فعال‌اند (مخاطب معرفی محصول) */
function labsInGroups(groups) {
  return AIO_LABS.map(l => orgFull(l.id)).filter(o => o.orgType !== "company" && (!groups.length || (o.groups || []).some(g => groups.includes(g)) || !(o.groups || []).length));
}

/* ---------- آماده به کار ---------- */
function otwPeople() {
  const ad = Store.get("otw_ad", null), on = Store.get("otw", false);
  return aioCandidates().filter(c => c.self ? on : c.otw).map(c => c.self && ad ? Object.assign({}, c, { otw: true, otwNote: ad.note, otwRoles: ad.roles, otwCities: ad.cities }) : c);
}

/* ==========================================
   بخش‌های پنل شرکت / آزمایشگاه (employer.html)
   ========================================== */
const OrgPanel = (() => {
  const e = s => TUI.e(s), myOrg = () => Store.get("my_org_id", 1);
  const statusChip = s => s === "answered" ? '<span class="chip teal">پاسخ داده شد</span>' : '<span class="chip amber">جدید</span>';
  const inqLine = x => {
    const p = x.productId ? aioProducts().find(y => y.id === +x.productId) : null;
    return `${e(INQ_KINDS[x.kind])}${p ? ` · <a href="product.html?id=${p.id}">${e(p.name)}</a>` : ""}${x.repair ? ` · ${e(Tax.itemName(x.repair.item))} ${e(Tax.brandName(x.repair.brand))} ${e(x.repair.model || "")}` : ""}`;
  };

  /* استعلام‌ها: شرکت = دریافتی، آزمایشگاه = ارسالی */
  function inquiries(host) {
    const draw = () => {
      const co = Auth.persona === "company";
      const list = co ? Inquiries.to(myOrg()) : Inquiries.from(myOrg());
      host.innerHTML = `<p class="muted">${co ? "درخواست‌هایی که آزمایشگاه‌ها از صفحه‌ی شرکت و محصولات شما فرستاده‌اند." : "درخواست‌هایی که از صفحه‌ی محصولات یا «یافتن تعمیرکار» برای شرکت‌ها فرستاده‌اید."}</p>
        ${list.length ? list.slice().reverse().map(x => `<div class="panel inq-card">
          <div class="inq-head"><div><b>${co ? `<a href="lab.html?id=${x.fromOrg}">${e(x.fromName || "")}</a>` : `<a href="lab.html?id=${x.toOrg}">${e((orgFull(x.toOrg) || {}).name || "")}</a>`}</b>
            <small class="muted"> · ${e(x.date)}</small></div>${statusChip(x.status)}</div>
          <p class="inq-what">${inqLine(x)}</p><p>${e(x.msg)}</p>
          ${x.reply ? `<div class="inq-reply"><b>پاسخ:</b> ${e(x.reply)}</div>` : ""}
          ${co && x.status !== "answered" ? `<div class="fb-actions"><input type="text" maxlength="300" data-reply="${x.id}" placeholder="پاسخ کوتاه (قیمت، زمان دمو، زمان اعزام تکنسین…)"><button type="button" class="btn btn-sm btn-primary" data-send="${x.id}">ارسال پاسخ</button></div>` : ""}
        </div>`).join("") : `<div class="empty-inline">${co ? "هنوز استعلامی نرسیده است. محصولات و خدمات تعمیر را کامل کنید تا آزمایشگاه‌ها پیدایتان کنند." : 'هنوز درخواستی نفرستاده‌اید. از <a href="products.html">محصولات</a> یا <a href="products.html?tab=repair">یافتن تعمیرکار</a> شروع کنید.'}</div>`}`;
    };
    host.onclick = ev => {
      const b = ev.target.closest("[data-send]"); if (!b) return;
      const v = host.querySelector(`[data-reply="${b.dataset.send}"]`).value.trim();
      if (!v) return toast("متن پاسخ را بنویسید");
      Inquiries.update(+b.dataset.send, { status: "answered", reply: v }); draw(); toast("پاسخ برای آزمایشگاه فرستاده شد ✓");
    };
    draw();
  }

  /* معرفی محصول جدید (فقط شرکت) */
  function launch(host) {
    const draw = () => {
      const prods = aioProducts().filter(p => p.orgId === myOrg());
      const o = orgFull(myOrg()) || {};
      const past = Launches.all().filter(l => prods.some(p => p.id === +l.productId));
      host.innerHTML = prods.length ? `<div class="panel"><div class="form-grid">
          <div class="form-field full"><label>کدام محصول را معرفی می‌کنید؟</label><select data-lp>${prods.map(p => `<option value="${p.id}">${e(p.name)}${p.isNew ? " (جدید)" : ""}</option>`).join("")}</select></div>
          <div class="form-field full"><label>کانال‌های معرفی</label>${LAUNCH_CHANNELS.map(c => { const s = c.service && service(c.service);
            return `<label class="check-item"><input type="checkbox" data-ch="${c.id}" ${c.id === "badge" ? "checked" : ""}> ${e(c.name)} <small class="muted">— ${s ? e(priceText(s)) : "رایگان"}</small></label>`; }).join("")}</div>
          <div class="form-field"><label>تاریخ روز دمو / وبینار (اختیاری)</label><input type="text" data-wd placeholder="مثلاً ۱۴۰۵/۰۹/۱۰ ساعت ۱۰"></div>
          <div class="form-field"><label>پیام کوتاه معرفی</label><input type="text" maxlength="140" data-msg placeholder="مثلاً: نسل جدید با ۲۰٪ مصرف معرف کمتر"></div>
        </div><p class="muted" data-aud></p>
        <div class="fb-actions"><button type="button" class="btn btn-primary" data-go>ثبت معرفی</button></div></div>
        <h2 style="font-size:17px">معرفی‌های قبلی</h2>
        ${past.length ? `<div class="table-wrap"><table class="data"><thead><tr><th>محصول</th><th>کانال‌ها</th><th>تاریخ</th></tr></thead><tbody>${past.slice().reverse().map(l => `<tr><td>${e((aioProducts().find(p => p.id === +l.productId) || {}).name || "")}</td><td>${l.channels.map(c => e((LAUNCH_CHANNELS.find(x => x.id === c) || {}).name || c).split(" (")[0]).join("، ")}</td><td>${e(l.date)}</td></tr>`).join("")}</tbody></table></div>` : '<div class="empty-inline">هنوز محصولی معرفی نکرده‌اید.</div>'}`
        : `<div class="empty-inline">اول در «محصولات من» محصول ثبت کنید.</div>`;
      const aud = () => { const p = prods.find(x => x.id === +host.querySelector("[data-lp]").value) || {}; const n = labsInGroups(p.group ? [p.group] : (o.groups || [])).length;
        host.querySelector("[data-aud]").textContent = `مخاطب اعلان: ${fa(n)} آزمایشگاه فعال در گروه «${Tax.name("groups", p.group) || "همه"}»`; };
      if (prods.length) { aud(); host.querySelector("[data-lp]").onchange = aud; }
    };
    host.onclick = ev => {
      if (!ev.target.closest("[data-go]")) return;
      const pid = +host.querySelector("[data-lp]").value, p = aioProducts().find(x => x.id === pid);
      const ch = [...host.querySelectorAll("[data-ch]:checked")].map(x => x.dataset.ch);
      if (!ch.length) return toast("حداقل یک کانال را انتخاب کنید");
      const webinar = host.querySelector("[data-wd]").value.trim();
      saveProductPatch(p, { isNew: true, launched: p.launched || "امروز", launchMsg: host.querySelector("[data-msg]").value.trim(), webinar: ch.includes("webinar") ? (webinar || "به‌زودی") : (p.webinar || "") });
      Launches.add({ productId: pid, channels: ch, date: "امروز" });
      ch.forEach(c => { const s = (LAUNCH_CHANNELS.find(x => x.id === c) || {}).service; if (s) MyOrders.add({ code: s, title: service(s).title + " — معرفی «" + p.name + "»", price: service(s).price, unit: service(s).unit, date: "امروز", status: "pending" }); });
      toast("«" + p.name + "» به‌عنوان محصول جدید معرفی شد ✓" + (ch.some(c => c === "notify" || c === "home") ? " (سفارش تبلیغ در «سفارش‌های من»)" : ""));
      if (typeof renderEmployerOrders === "function") renderEmployerOrders();
      draw();
    };
    draw();
  }

  /* پرسنل آماده به کار */
  function otw(host) {
    const list = otwPeople();
    host.innerHTML = `<p class="muted">کارجویانی که «آماده به کار» را روشن کرده‌اند. برای دیدن رزومه‌ی کامل و دعوت، از «بانک رزومه» یا «تطبیق هوشمند» استفاده کنید.</p>
      <div class="otw-grid">${list.map(c => {
        const cur = (c.experience || []).filter(x => !x.end);
        return `<div class="panel otw-card"><div class="otw-head"><span class="avatar" style="background:${c.color || "#0d9488"}">${e(c.name.charAt(0))}</span>
          <div><b>${e(c.name)}</b><small>${e(TUI.candSummary(c))}</small></div></div>
          ${cur.length ? `<p class="otw-cur">شاغل در: ${cur.map(x => x.orgId ? `<a href="lab.html?id=${x.orgId}">${e(x.orgName)}</a>` : e(x.orgName)).join("، ")}</p>` : ""}
          ${c.otwNote ? `<p class="otw-note">«${e(c.otwNote)}»</p>` : ""}
          <div class="job-meta"><span class="chip teal">آماده به کار</span><span class="chip">آمادگی: ${e(TUI.name.availability(c.availability))}</span>${c.relocate ? '<span class="chip">آماده جابه‌جایی</span>' : ""}</div>
          <div class="fb-actions"><a class="btn btn-sm btn-outline" href="employer.html#resumes" onclick="showSec('resumes')">مشاهده در بانک رزومه</a>
          <button type="button" class="btn btn-sm btn-primary" onclick="toast('دعوت به همکاری برای ${e(c.name)} فرستاده شد ✓')">دعوت به همکاری</button></div></div>`;
      }).join("") || '<div class="empty-inline">فعلاً کسی آماده به کار نیست.</div>'}</div>`;
  }

  /* بازار: آزمایشگاه → یافتن محصول و تعمیرکار؛ شرکت → رقبا و آزمایشگاه‌های هدف */
  function market(host) {
    const o = orgFull(myOrg()) || {};
    if (Auth.persona === "company") {
      const types = orgCompanyTypes(o), groups = o.groups || [];
      const rivals = AIO_LABS.map(l => orgFull(l.id)).filter(x => x.orgType === "company" && x.id !== o.id &&
        (orgCompanyTypes(x).some(t => types.includes(t)) || (x.groups || []).some(g => groups.includes(g))));
      const labs = labsInGroups(groups);
      host.innerHTML = `<div class="panel"><h2>شرکت‌های هم‌حوزه (رقبا)</h2><div class="lab-grid">${rivals.map(labCardHTML).join("") || '<div class="empty-inline">شرکت هم‌حوزه‌ای پیدا نشد.</div>'}</div>
          <a class="btn btn-sm btn-outline" href="companies.html" style="margin-top:12px">همه‌ی شرکت‌ها</a></div>
        <div class="panel"><h2>آزمایشگاه‌های فعال در حوزه‌ی شما <small class="muted">(${fa(labs.length)} مرکز)</small></h2><div class="lab-grid">${labs.slice(0, 6).map(labCardHTML).join("")}</div>
          <a class="btn btn-sm btn-outline" href="labs.html" style="margin-top:12px">همه‌ی آزمایشگاه‌ها روی نقشه</a></div>`;
      return;
    }
    host.innerHTML = `<div class="panel"><h2>یافتن محصول</h2><form class="mk-search" data-prod>
        <input type="text" name="q" placeholder="نام محصول، برند یا مدل… (مثلاً TSH یا Sysmex)">
        <select name="group"><option value="">همه‌ی گروه‌ها</option>${Tax.list("groups").map(g => `<option value="${g.id}">${e(g.name)}</option>`).join("")}</select>
        <button class="btn btn-primary">جستجو</button></form></div>
      <div class="panel"><h2>یافتن تعمیرکار</h2><form class="mk-search" data-rep>
        <select name="rgroup"><option value="">گروه</option>${Tax.list("groups").map(g => `<option value="${g.id}">${e(g.name)}</option>`).join("")}</select>
        <select name="rbrand"><option value="">برند</option>${Tax.list("brands").map(b => `<option value="${b.id}">${e(b.name)}</option>`).join("")}</select>
        <input type="text" name="model" dir="ltr" placeholder="مدل (مثلاً 912)">
        <button class="btn btn-primary">پیدا کن</button></form></div>
      <div class="panel"><h2>محصولات تازه‌ی بازار</h2><div class="prod-grid">${filterProducts({ isNew: true }).map(p => TUI.productCard(p)).join("") || '<div class="empty-inline">فعلاً محصول تازه‌ای نیست.</div>'}</div></div>
      <div class="panel"><h2>آزمایشگاه‌های هم‌حوزه</h2><div class="lab-grid">${AIO_LABS.map(l => orgFull(l.id)).filter(x => x.orgType !== "company" && x.id !== o.id && x.city === o.city).slice(0, 6).map(labCardHTML).join("") || '<div class="empty-inline">در شهر شما مرکز دیگری ثبت نشده است.</div>'}</div>
        <a class="btn btn-sm btn-outline" href="ranking.html" style="margin-top:12px">رتبه‌بندی مراکز</a></div>`;
    host.onsubmit = ev => {
      ev.preventDefault();
      const f = new FormData(ev.target), qs = new URLSearchParams();
      for (const [k, v] of f.entries()) if (v) qs.set(k, v);
      if (ev.target.dataset.rep !== undefined) qs.set("tab", "repair");
      location.href = "products.html?" + qs.toString();
    };
  }

  /* چک‌لیست شروع هر پرسونا روی پیشخوان */
  function checklist(host) {
    const o = orgFull(myOrg()) || {}, co = Auth.persona === "company";
    const prods = aioProducts().filter(p => p.orgId === o.id).length;
    const items = co ? [
      ["orgprofile", "نوع شرکت و حوزه‌ی فعالیت", orgCompanyTypes(o).length > 0],
      ["orgprofile", "معرفی شرکت، گالری و ویدئو", !!(o.about && (o.gallery || []).length)],
      ["products", "ثبت محصولات با گروه و ویژگی‌ها", prods > 0],
      ["orgprofile", "خدمات تعمیر (اگر خدماتی هستید)", !orgCompanyTypes(o).includes("service") || (o.repairs || []).length > 0],
      ["orgprofile", "کاتالوگ و مدارک", (o.catalogs || []).length > 0 && (o.documents || []).length > 0],
      ["launch", "معرفی محصول جدید به آزمایشگاه‌ها", Launches.all().length > 0],
      ["post", "آگهی استخدام", Store.get("positions", []).length > 0],
      ["sponsor", "اسپانسری یک چالش علمی", typeof sponsorRequests !== "undefined" && sponsorRequests.ofOrg(o.id).length > 0]
    ] : [
      ["addlab", "ثبت مرکز روی نقشه", !!o.address],
      ["orgprofile", "نوع مرکز، بخش‌ها، معرفی و گالری", !!(o.labType && (o.gallery || []).length)],
      ["orgprofile", "مدارک (پروانه بهره‌برداری)", (o.documents || []).length > 0],
      ["post", "آگهی استخدام", Store.get("positions", []).length > 0],
      ["otw", "دیدن پرسنل آماده به کار", false],
      ["market", "یافتن محصول یا تعمیرکار", Inquiries.from(o.id).length > 0],
      ["training", "دوره‌ی آموزشی برای پرسنل", false],
      ["sponsor", "اسپانسری یک چالش علمی", typeof sponsorRequests !== "undefined" && sponsorRequests.ofOrg(o.id).length > 0]
    ];
    const done = items.filter(x => x[2]).length;
    host.innerHTML = `<div class="panel"><div class="syllabus-head"><div><h2 style="margin:0">گام‌های ${co ? "شرکت" : "آزمایشگاه"} در آیولب</h2><p class="muted" style="margin:4px 0 0">${fa(done)} از ${fa(items.length)} انجام شده</p></div>
      <a class="btn btn-sm btn-outline" href="lab.html?id=${o.id}" target="_blank">صفحه‌ی عمومی ${co ? "شرکت" : "مرکز"}</a></div>
      <div class="mk-progress"><i style="width:${Math.round(done / items.length * 100)}%"></i></div>
      <ul class="steps-check">${items.map(([sec, t, ok]) => `<li class="${ok ? "ok" : ""}"><a href="#${sec}" data-go="${sec}">${ok ? "✓" : "○"} ${e(t)}</a></li>`).join("")}</ul></div>`;
    host.onclick = ev => { const a = ev.target.closest("[data-go]"); if (!a) return; ev.preventDefault(); showSec(a.dataset.go); history.replaceState(null, "", "#" + a.dataset.go); };
  }

  return { inquiries, launch, otw, market, checklist };
})();
