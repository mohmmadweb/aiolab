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

/* ---------- شناسنامه‌ی تجهیزات آزمایشگاه‌های نمونه ---------- */
const AIO_LAB_EQUIPMENT = {
  1: [["biochemistry", "auto-chem", "hitachi", "912", 1], ["hematology", "cell-counter", "sysmex", "XN-550", 2], ["hormone", "clia-analyzer", "snibe", "Maglumi 800", 1], ["general", "centrifuge", "hettich", "EBA 200", 3]],
  2: [["genetics", "rt-pcr", "qiagen", "Rotor-Gene Q", 1], ["genetics", "extractor", "qiagen", "QIAcube", 1]],
  3: [["biochemistry", "auto-chem", "mindray", "BS-240", 1], ["hematology", "cell-counter", "sysmex", "XN-350", 1], ["coagulation", "coag-analyzer", "stago", "STart Max", 1]],
  4: [["hematology", "cell-counter", "mindray", "BC-5000", 1], ["urinalysis", "urine-analyzer", "dirui", "H-500", 1]],
  6: [["biochemistry", "auto-chem", "hitachi", "917", 1], ["hormone", "elisa-reader", "biorad", "PR 4100", 1]],
  7: [["genetics", "rt-pcr", "biorad", "CFX96", 1], ["hematology", "cell-counter", "beckman", "DxH 520", 1]],
  8: [["biochemistry", "photometer", "erba", "Chem-7", 1], ["hematology", "cell-counter", "sysmex", "KX-21", 1]],
  9: [["biochemistry", "auto-chem", "roche", "cobas c311", 1], ["hormone", "clia-analyzer", "roche", "cobas e411", 1]],
  12: [["microbiology", "incubator", "hettich", "HettCube 200", 2], ["pathology", "microtome", "siemens", "—", 1]],
  13: [["biochemistry", "auto-chem", "mindray", "BS-200", 1], ["hormone", "elisa-reader", "biorad", "PR 3100", 1]]
};
Object.entries(AIO_LAB_EQUIPMENT).forEach(([id, rows]) => {
  AIO_ORG_EXTRA[id] = AIO_ORG_EXTRA[id] || {};
  if (!AIO_ORG_EXTRA[id].equipment) AIO_ORG_EXTRA[id].equipment = rows.map(([group, item, brand, model, count]) => ({ group, item, brand, model, count }));
});
const equipLine = r => [Tax.itemName(r.item), Tax.brandName(r.brand), r.model && r.model !== "—" ? r.model : ""].filter(Boolean).join(" · ") + (r.count > 1 ? " ×" + fa(r.count) : "");

/* ---------- کارت ویزیت: پیشنهاد سازمان به سازمان؛ با پذیرش، اطلاعات تماس دو طرف باز می‌شود ---------- */
const AIO_CARDS = [
  { id: 1, fromOrg: 5, toOrg: 1, offer: "نماینده‌ی رسمی Sysmex هستیم؛ برای سل‌کانتر XN-550 شما قرارداد سرویس سالانه با ۱۵٪ تخفیف پیشنهاد می‌دهیم.", status: "accepted", date: "۱۴۰۵/۰۸/۱۰" },
  { id: 2, fromOrg: 14, toOrg: 1, offer: "تعمیر و کالیبراسیون اتوآنالایزر Hitachi 912 با قطعه‌ی اصل و اعزام فوری در تهران.", status: "pending", date: "۱۴۰۵/۰۸/۲۰" },
  { id: 3, fromOrg: 3, toOrg: 5, offer: "برای خرید یک آنالایزر ایمونواسی دنبال پیش‌فاکتور و دمو هستیم؛ لطفاً تماس بگیرید.", status: "pending", date: "۱۴۰۵/۰۸/۲۱" }
];
const Cards = {
  all() { const mine = Store.get("cards", []), patch = Store.get("cards_patch", {}); return [...AIO_CARDS, ...mine].map(c => Object.assign({}, c, patch[c.id] || {})); },
  add(c) { const a = Store.get("cards", []); c.id = Date.now(); c.date = "امروز"; c.status = "pending"; a.push(c); Store.set("cards", a); return c; },
  update(id, p) { const all = Store.get("cards_patch", {}); all[id] = Object.assign(all[id] || {}, p); Store.set("cards_patch", all); },
  to: id => Cards.all().filter(c => +c.toOrg === +id),
  from: id => Cards.all().filter(c => +c.fromOrg === +id),
  between: (a, b) => Cards.all().filter(c => (+c.fromOrg === +a && +c.toOrg === +b) || (+c.fromOrg === +b && +c.toOrg === +a))
};
/* سازمانِ بیننده (فقط حساب شرکت/آزمایشگاه) */
const viewerOrg = () => (Auth.user && Auth.user.role === "employer") ? +Store.get("my_org_id", 1) : null;
/* اطلاعات تماس یک سازمان فقط برای خودش و سازمان‌هایی که کارت ویزیت پذیرفته‌شده با آن دارند */
function canSeeContact(orgId) {
  const v = viewerOrg();
  return !!v && (v === +orgId || Cards.between(v, orgId).some(c => c.status === "accepted"));
}
function contactHTML(o) {
  const e = TUI.e, soc = Object.assign({}, o.socials || {}, o.website ? { website: o.website } : {});
  return `<div class="bc-contact">${o.phone ? `<span>📞 <b dir="ltr">${e(o.phone)}</b></span>` : ""}${o.email ? `<span>✉️ <b dir="ltr">${e(o.email)}</b></span>` : ""}
    ${o.address ? `<span>📍 ${e(o.address)}</span>` : ""}${soc.website ? `<span>🌐 <a href="${e(soc.website)}" target="_blank" rel="noopener nofollow" dir="ltr">${e(soc.website.replace(/^https?:\/\//, ""))}</a></span>` : ""}</div>`;
}
/* نمای کارت ویزیت یک سازمان */
function bizCardHTML(o, offer) {
  const e = TUI.e, co = o.orgType === "company";
  const types = co ? orgCompanyTypes(o).map(t => Tax.name("companyTypes", t).split(" (")[0].split(" — ")[0]) : [o.labType ? Tax.name("labTypes", o.labType) : (o.type || "")];
  return `<div class="biz-card"><div class="bc-top"><span class="job-logo" style="background:${o.color}">${e((o.name || "؟").replace("شرکت ", "").replace("آزمایشگاه ", "").charAt(0))}</span>
    <div><a href="lab.html?id=${o.id}"><b>${e(o.name)}</b></a><small>${e(types.filter(Boolean).join("، "))} · ${e(o.city || "")}</small></div></div>
    ${offer ? `<p class="bc-offer">«${e(offer)}»</p>` : ""}${contactHTML(o)}</div>`;
}
function cardDialog(opt) {
  const u = Auth.user;
  if (!u || u.role !== "employer") {
    if (!u) Store.set("after_login", currentPath() + location.search + location.hash);
    toast("کارت ویزیت را شرکت‌ها و آزمایشگاه‌ها برای هم می‌فرستند؛ با حساب شرکت یا آزمایشگاه وارد شوید");
    if (!u) setTimeout(() => location.href = "login.html?role=company", 1200); return;
  }
  const me = orgFull(viewerOrg()) || {}, to = orgFull(opt.toOrg) || {}, e = TUI.e;
  if (me.id === to.id) return toast("این سازمان خودتان است");
  const prods = aioProducts().filter(p => p.orgId === me.id);
  const box = document.createElement("div");
  box.className = "mk-modal";
  box.innerHTML = `<div class="mk-dialog panel" role="dialog" aria-modal="true" aria-label="ارسال کارت ویزیت">
    <h2>ارسال کارت ویزیت به «${e(to.name || "")}»</h2>
    <p class="muted" style="font-size:13px">کارت شما (با اطلاعات تماس) و پیشنهادتان برای «${e(to.name || "")}» فرستاده می‌شود. اگر بپذیرد، اطلاعات تماس او هم برای شما باز می‌شود.</p>
    ${bizCardHTML(me)}
    <div class="form-field" style="margin-top:12px"><label>پیشنهاد شما</label><textarea rows="3" maxlength="400" data-offer placeholder="${me.orgType === "company" ? "مثلاً: نماینده‌ی رسمی برند X هستیم؛ برای دستگاه شما سرویس و معرف با شرایط ویژه داریم" : "مثلاً: برای خرید آنالایزر هورمون دنبال پیش‌فاکتور هستیم"}">${e(opt.offer || "")}</textarea></div>
    ${prods.length ? `<div class="form-field"><label>محصول مرتبط (اختیاری)</label><select data-prod><option value="">—</option>${prods.map(p => `<option value="${p.id}">${e(p.name)}</option>`).join("")}</select></div>` : ""}
    <div class="fb-actions"><button type="button" class="btn btn-primary" data-send>ارسال کارت</button><button type="button" class="btn btn-ghost" data-close>انصراف</button></div></div>`;
  document.body.appendChild(box);
  box.onclick = ev => {
    if (ev.target === box || ev.target.closest("[data-close]")) return box.remove();
    if (!ev.target.closest("[data-send]")) return;
    const offer = box.querySelector("[data-offer]").value.trim();
    if (offer.length < 10) return toast("پیشنهادتان را در یک جمله بنویسید");
    const pr = box.querySelector("[data-prod]");
    Cards.add({ fromOrg: me.id, toOrg: +opt.toOrg, offer, productId: pr && pr.value ? +pr.value : null });
    box.remove(); toast("کارت ویزیت برای «" + (to.name || "") + "» فرستاده شد ✓ نتیجه در «کارت‌های ویزیت» پنل شما");
    if (typeof opt.done === "function") opt.done();
  };
  setTimeout(() => box.querySelector("textarea").focus(), 30);
}

/* ---------- آگهی تبلیغاتی محصولات شرکت‌ها ---------- */
const AD_PLANS = [{ id: "normal", name: "آگهی عادی در صفحه‌ی آگهی‌ها", service: "R21" }, { id: "featured", name: "آگهی ویژه (بالای صفحه‌ی آگهی‌ها + صفحه‌ی اول)", service: "R22" }];
const AIO_PRODUCT_ADS = [
  { id: 1, orgId: 5, productId: 9, title: "آنالایزر ایمونواسی CL-1000i — حالا در ایران", text: "بیش از ۱۰۰ تست هورمون و مارکر؛ نصب، آموزش و ۲ سال گارانتی. دموی رایگان در محل آزمایشگاه شما.", offer: "دموی رایگان تا پایان آذر", until: "۱۴۰۵/۰۹/۳۰", plan: "featured", status: "active" },
  { id: 2, orgId: 10, productId: 11, title: "کیت الایزا ویتامین D پارس‌بیوتک", text: "تولید داخل با کالیبراتور قابل ردیابی؛ پایداری ۱۸ ماهه و ارسال زنجیره‌ی سرد.", offer: "۱۰٪ تخفیف خرید ۱۰ کیت", until: "۱۴۰۵/۰۹/۱۵", plan: "normal", status: "active" },
  { id: 3, orgId: 14, productId: 12, title: "تعمیر فوری اتوآنالایزرهای Hitachi", text: "عیب‌یابی، تعویض لامپ و سرنگ و کالیبراسیون با قطعه‌ی اصل؛ اعزام تکنسین در کمتر از ۲۴ ساعت.", offer: "بازدید اول رایگان", until: "۱۴۰۵/۱۰/۱۵", plan: "normal", status: "active" },
  { id: 4, orgId: 11, productId: 10, title: "معرف‌های بیوشیمی پیشتاز طب با پخش سراسری", text: "تحویل ۴۸ ساعته در کل کشور؛ قرارداد سالانه با قیمت ثابت.", offer: "", until: "۱۴۰۵/۱۰/۳۰", plan: "normal", status: "active" }
];
const ProductAds = {
  all() { const mine = Store.get("product_ads", []), gone = Store.get("product_ads_deleted", []); const ids = new Set(mine.map(a => a.id));
    return [...AIO_PRODUCT_ADS.filter(a => !ids.has(a.id) && !gone.includes(a.id)), ...mine.filter(a => !gone.includes(a.id))]; },
  active: () => ProductAds.all().filter(a => a.status === "active").sort((a, b) => (b.plan === "featured") - (a.plan === "featured") || b.id - a.id),
  save(a) { const l = Store.get("product_ads", []), i = l.findIndex(x => x.id === a.id); if (i >= 0) l[i] = a; else l.push(a); Store.set("product_ads", l); },
  remove(id) { Store.set("product_ads", Store.get("product_ads", []).filter(a => a.id !== id)); Store.set("product_ads_deleted", [...Store.get("product_ads_deleted", []), id]); }
};
function adCardHTML(a) {
  const e = TUI.e, p = aioProducts().find(x => x.id === +a.productId) || {}, o = orgFull(a.orgId) || {}, cat = AIO_PRODUCT_CATS.find(c => c.id === p.cat) || {};
  return `<div class="ad-card ${a.plan === "featured" ? "featured" : ""}">
    <a class="ad-media" href="product.html?id=${p.id || ""}" style="--pc:${p.color || cat.color || "#0d9488"};--pbg:${cat.bg || "#f1f5f9"}">${p.img ? `<img src="${e(p.img)}" alt="">` : (ICONS[cat.icon] || ICONS.flask)}${a.plan === "featured" ? '<span class="ad-tag">ویژه</span>' : ""}</a>
    <div class="ad-body"><small class="muted">${e(p.group ? Tax.name("groups", p.group) : "")}${p.group && cat.name ? " · " : ""}${e(cat.name || "")}</small>
      <h3><a href="product.html?id=${p.id || ""}">${e(a.title)}</a></h3><p>${e(a.text)}</p>
      ${a.offer ? `<span class="ad-offer">🎁 ${e(a.offer)}</span>` : ""}
      <div class="ad-foot"><a href="lab.html?id=${o.id}">${e(o.name || "")}</a>${a.until ? `<small class="muted">تا ${e(a.until)}</small>` : ""}</div>
      <div class="fb-actions"><button type="button" class="btn btn-sm btn-primary" data-adq="${a.orgId}:${p.id || ""}">استعلام</button><button type="button" class="btn btn-sm btn-outline" data-adcard="${a.orgId}">کارت ویزیت</button></div></div></div>`;
}
document.addEventListener("click", ev => {
  const q = ev.target.closest("[data-adq]"), c = ev.target.closest("[data-adcard]");
  if (q) { const [org, pid] = q.dataset.adq.split(":"); inquiryDialog({ kind: "quote", toOrg: +org, productId: pid ? +pid : null }); }
  if (c) cardDialog({ toOrg: +c.dataset.adcard });
});

/* ---------- مشتریان شرکت (فهرست سفارشی آزمایشگاه‌ها) ---------- */
const AIO_CUSTOMERS = { 5: [{ labId: 1, tag: "customer", note: "قرارداد سرویس سالانه XN-550" }, { labId: 6, tag: "lead", note: "" }] };
const CUST_TAGS = { customer: "مشتری", lead: "مشتری بالقوه" };
const Customers = {
  of: orgId => Store.get("customers_" + orgId, AIO_CUSTOMERS[orgId] || []),
  set: (orgId, list) => Store.set("customers_" + orgId, list),
  find: (orgId, labId) => Customers.of(orgId).find(c => +c.labId === +labId)
};

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
    if (Auth.persona === "company") return customers(host, o);
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

  /* شرکت: همه‌ی آزمایشگاه‌ها با فیلتر (شهر، نوع، بخش، دستگاه، برند) + فهرست سفارشی مشتریان + کارت ویزیت */
  function customers(host, o) {
    const f = { q: "", city: "", type: "", group: "", item: "", brand: "", mine: false, fit: false };
    const repairs = o.repairs || [], groupsMine = o.groups || [];
    const labs = () => AIO_LABS.map(l => orgFull(l.id)).filter(x => x.orgType !== "company");
    /* «مرتبط با من»: دستگاهی دارد که ما تعمیر می‌کنیم یا برندش را نمایندگی/محصولش را داریم، یا در حوزه‌ی ما فعال است */
    const myBrands = new Set([...(o.represents || []), ...aioProducts().filter(p => p.orgId === o.id).map(p => (Tax.list("brands").find(b => b.name.toLowerCase() === String(p.brand || "").toLowerCase()) || {}).id).filter(Boolean)]);
    const fitOf = l => (l.equipment || []).filter(eq => repairs.some(r => r.item === eq.item && r.brand === eq.brand) || myBrands.has(eq.brand));
    const opt = (list, v) => list.map(([a, b]) => `<option value="${e(a)}" ${a === v ? "selected" : ""}>${e(b)}</option>`).join("");
    function draw() {
      const mine = Customers.of(o.id);
      let list = labs().filter(l => (!f.q || l.name.includes(f.q)) && (!f.city || l.city === f.city) && (!f.type || l.labType === f.type)
        && (!f.group || (l.groups || []).includes(f.group)) && (!f.item || (l.equipment || []).some(q => q.item === f.item))
        && (!f.brand || (l.equipment || []).some(q => q.brand === f.brand)) && (!f.mine || mine.some(c => +c.labId === l.id)) && (!f.fit || fitOf(l).length));
      list = list.sort((a, b) => fitOf(b).length - fitOf(a).length);
      const cities = [...new Set(labs().map(l => l.city))].sort((a, b) => a.localeCompare(b, "fa"));
      host.innerHTML = `<div class="panel"><p class="muted" style="margin-top:0">آزمایشگاه‌ها را با دستگاه‌ها و بخش‌هایشان فیلتر کنید، مشتریانتان را علامت بزنید و برای ارتباط کارت ویزیت بفرستید.</p>
        <div class="lab-filters" data-f>
          <input type="text" data-k="q" value="${e(f.q)}" placeholder="نام آزمایشگاه…" aria-label="نام">
          <select data-k="city" aria-label="شهر"><option value="">همه‌ی شهرها</option>${opt(cities.map(c => [c, c]), f.city)}</select>
          <select data-k="type" aria-label="نوع مرکز"><option value="">همه‌ی انواع مرکز</option>${opt(Tax.list("labTypes").map(t => [t.id, t.name]), f.type)}</select>
          <select data-k="group" aria-label="بخش"><option value="">همه‌ی بخش‌ها</option>${opt(Tax.list("groups").map(g => [g.id, g.name]), f.group)}</select>
          <select data-k="item" aria-label="دستگاه"><option value="">دارای هر دستگاهی</option>${opt(Tax.list("items").filter(i => i.kind === "device").map(i => [i.id, i.name]), f.item)}</select>
          <select data-k="brand" aria-label="برند دستگاه"><option value="">هر برندی</option>${opt(Tax.list("brands").map(b => [b.id, b.name]), f.brand)}</select>
          <label class="check-item inline"><input type="checkbox" data-k="fit" ${f.fit ? "checked" : ""}> مرتبط با محصول/خدمات من</label>
          <label class="check-item inline"><input type="checkbox" data-k="mine" ${f.mine ? "checked" : ""}> فقط مشتریان من (${fa(mine.length)})</label>
        </div><p class="muted" style="margin:8px 0 0">${fa(list.length)} آزمایشگاه</p></div>
        <div class="cust-list">${list.map(l => {
          const c = mine.find(x => +x.labId === l.id), fit = fitOf(l), sent = Cards.between(o.id, l.id).pop();
          return `<div class="panel cust-row"><div class="cust-main">
            <a class="rep-org" href="lab.html?id=${l.id}"><span class="job-logo" style="background:${l.color}">${e(l.name.replace("آزمایشگاه ", "").charAt(0))}</span>
              <span><b>${e(l.name)}</b><small>${e(l.labType ? Tax.name("labTypes", l.labType) : l.type)} · ${e(l.city)}</small></span></a>
            ${c ? `<span class="chip ${c.tag === "customer" ? "teal" : "amber"}">${CUST_TAGS[c.tag]}</span>` : ""}</div>
            <div class="job-meta">${(l.equipment || []).map(q => `<span class="chip ${fit.includes(q) ? "teal" : ""}" title="${fit.includes(q) ? "مرتبط با خدمات/برندهای شما" : ""}">${e(equipLine(q))}</span>`).join("") || '<small class="muted">تجهیزات ثبت نشده</small>'}</div>
            ${c ? `<input type="text" maxlength="160" class="cust-note" data-note="${l.id}" value="${e(c.note || "")}" placeholder="یادداشت داخلی (فقط برای شما)">` : ""}
            <div class="fb-actions">
              <select data-tag="${l.id}" aria-label="وضعیت"><option value="">— افزودن به فهرست من —</option>${Object.entries(CUST_TAGS).map(([k, n]) => `<option value="${k}" ${c && c.tag === k ? "selected" : ""}>${n}</option>`).join("")}${c ? '<option value="-">برداشتن از فهرست</option>' : ""}</select>
              ${sent ? `<span class="chip ${sent.status === "accepted" ? "teal" : ""}">کارت ویزیت: ${sent.status === "accepted" ? "پذیرفته شد" : (sent.status === "declined" ? "رد شد" : "در انتظار")}</span>` : ""}
              <button type="button" class="btn btn-sm btn-primary" data-card="${l.id}">${sent ? "کارت تازه" : "ارسال کارت ویزیت"}</button></div>
            ${canSeeContact(l.id) ? contactHTML(l) : ""}</div>`;
        }).join("") || '<div class="empty-inline">آزمایشگاهی با این فیلترها نیست.</div>'}</div>`;
    }
    host.oninput = host.onchange = ev => {
      const t = ev.target;
      if (t.closest("[data-f]") && t.dataset.k) { f[t.dataset.k] = t.type === "checkbox" ? t.checked : t.value; if (ev.type === "change" || t.type !== "text") draw(); else { clearTimeout(host._t); host._t = setTimeout(() => { draw(); const i = host.querySelector('[data-k="q"]'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 250); } return; }
      if (t.dataset.tag && ev.type === "change") { let l = Customers.of(o.id).filter(c => +c.labId !== +t.dataset.tag); const cur = Customers.find(o.id, t.dataset.tag);
        if (t.value && t.value !== "-") l.push({ labId: +t.dataset.tag, tag: t.value, note: (cur || {}).note || "" }); Customers.set(o.id, l); draw(); toast(t.value === "-" ? "از فهرست شما برداشته شد" : "در فهرست شما ذخیره شد ✓"); }
      if (t.dataset.note && ev.type === "change") { Customers.set(o.id, Customers.of(o.id).map(c => +c.labId === +t.dataset.note ? Object.assign({}, c, { note: t.value }) : c)); toast("یادداشت ذخیره شد"); }
    };
    host.onclick = ev => { const b = ev.target.closest("[data-card]"); if (b) cardDialog({ toOrg: +b.dataset.card, done: draw }); };
    draw();
  }

  /* کارت‌های ویزیت: دریافتی (پذیرش/رد) و ارسالی (وضعیت + اطلاعات تماس پس از پذیرش) */
  function cards(host) {
    let tab = "in";
    const draw = () => {
      const me = myOrg(), inc = Cards.to(me).slice().reverse(), out = Cards.from(me).slice().reverse();
      const st = c => c.status === "accepted" ? '<span class="chip teal">پذیرفته شد</span>' : (c.status === "declined" ? '<span class="chip rose">رد شد</span>' : '<span class="chip amber">در انتظار</span>');
      host.innerHTML = `<div class="mk-tabs"><button type="button" data-tab="in" class="${tab === "in" ? "on" : ""}">دریافتی (${fa(inc.filter(c => c.status === "pending").length)} تازه)</button><button type="button" data-tab="out" class="${tab === "out" ? "on" : ""}">ارسالی (${fa(out.length)})</button></div>
        ${tab === "in" ? (inc.map(c => `<div class="panel bc-row">${bizCardHTML(orgFull(c.fromOrg) || {}, c.offer)}
            <div class="bc-side"><small class="muted">${e(c.date)}</small>${st(c)}
            ${c.status === "pending" ? `<button type="button" class="btn btn-sm btn-primary" data-acc="${c.id}">پذیرش و اشتراک اطلاعات تماس</button><button type="button" class="btn btn-sm btn-ghost" data-dec="${c.id}">رد</button>` : ""}</div></div>`).join("")
            || '<div class="empty-inline">کارت ویزیتی دریافت نکرده‌اید.</div>')
        : (out.map(c => { const to = orgFull(c.toOrg) || {};
            return `<div class="panel bc-row"><div class="biz-card"><div class="bc-top"><span class="job-logo" style="background:${to.color}">${e((to.name || "؟").replace("شرکت ", "").replace("آزمایشگاه ", "").charAt(0))}</span><div><a href="lab.html?id=${to.id}"><b>${e(to.name || "")}</b></a><small>${e(to.city || "")}</small></div></div>
              <p class="bc-offer">«${e(c.offer)}»</p>${c.status === "accepted" ? contactHTML(to) : '<p class="muted" style="font-size:13px;margin:0">اطلاعات تماس پس از پذیرش نمایش داده می‌شود.</p>'}</div>
              <div class="bc-side"><small class="muted">${e(c.date)}</small>${st(c)}</div></div>`; }).join("")
            || `<div class="empty-inline">هنوز کارتی نفرستاده‌اید. از ${Auth.persona === "company" ? "«آزمایشگاه‌ها و مشتریان»" : "صفحه‌ی شرکت‌ها"} یا صفحه‌ی هر سازمان «ارسال کارت ویزیت» را بزنید.</div>`)}`;
    };
    host.onclick = ev => {
      const t = ev.target.closest("[data-tab]"); if (t) { tab = t.dataset.tab; return draw(); }
      const a = ev.target.closest("[data-acc],[data-dec]"); if (!a) return;
      Cards.update(+(a.dataset.acc || a.dataset.dec), { status: a.dataset.acc ? "accepted" : "declined" });
      toast(a.dataset.acc ? "پذیرفته شد ✓ اطلاعات تماس شما برای فرستنده باز شد" : "کارت رد شد"); draw();
    };
    draw();
  }

  /* آگهی تبلیغاتی محصولات (شرکت) */
  function ads(host) {
    let edit = null;
    const draw = () => {
      const me = myOrg(), mine = ProductAds.all().filter(a => +a.orgId === me), prods = aioProducts().filter(p => p.orgId === me);
      host.innerHTML = `${edit ? `<div class="panel rb-form"><div class="form-grid">
          <div class="form-field full"><label>محصول *</label><select data-a="productId">${prods.map(p => `<option value="${p.id}" ${+edit.productId === p.id ? "selected" : ""}>${e(p.name)}</option>`).join("")}</select></div>
          <div class="form-field full"><label>عنوان آگهی *</label><input type="text" maxlength="90" data-a="title" value="${e(edit.title || "")}"></div>
          <div class="form-field full"><label>متن کوتاه</label><textarea rows="2" maxlength="240" data-a="text">${e(edit.text || "")}</textarea></div>
          <div class="form-field"><label>پیشنهاد ویژه (اختیاری)</label><input type="text" maxlength="60" data-a="offer" value="${e(edit.offer || "")}" placeholder="مثلاً: ۱۰٪ تخفیف تا پایان ماه"></div>
          <div class="form-field"><label>اعتبار تا</label><input type="text" maxlength="12" data-a="until" value="${e(edit.until || "")}" placeholder="۱۴۰۵/۰۹/۳۰"></div>
          <div class="form-field full"><label>نوع آگهی</label>${AD_PLANS.map(pl => { const sv = service(pl.service); return `<label class="check-item"><input type="radio" name="ad-plan" value="${pl.id}" ${edit.plan === pl.id ? "checked" : ""}> ${e(pl.name)} <small class="muted">— ${sv ? e(priceText(sv)) : ""}</small></label>`; }).join("")}</div>
        </div><div class="fb-actions"><button type="button" class="btn btn-primary btn-sm" data-ok>${edit.id ? "ذخیره" : "انتشار آگهی"}</button><button type="button" class="btn btn-ghost btn-sm" data-cancel>انصراف</button></div></div>` : ""}
        <div class="syllabus-head" style="margin-bottom:12px"><div><p>آگهی‌ها در صفحه‌ی <a href="ads.html">آگهی محصولات</a> و صفحه‌ی شرکت شما نمایش داده می‌شوند.</p></div>
          ${prods.length ? '<button type="button" class="btn btn-primary btn-sm" data-new>+ آگهی تازه</button>' : '<span class="muted">اول در «محصولات من» محصول ثبت کنید.</span>'}</div>
        <div class="ad-grid">${mine.map(a => `<div>${adCardHTML(a)}<div class="fb-actions" style="margin-top:6px"><button type="button" class="btn btn-sm btn-outline" data-edit="${a.id}">ویرایش</button><button type="button" class="btn btn-sm btn-ghost danger" data-del="${a.id}">حذف</button></div></div>`).join("") || '<div class="empty-inline">هنوز آگهی‌ای ندارید.</div>'}</div>`;
    };
    host.oninput = host.onchange = ev => { const t = ev.target; if (!edit) return; if (t.dataset.a) edit[t.dataset.a] = t.value; if (t.name === "ad-plan") edit.plan = t.value; };
    host.onclick = ev => {
      const b = ev.target.closest("button"); if (!b || b.closest(".ad-card")) return;
      const me = myOrg();
      if (b.dataset.new !== undefined) { const p = aioProducts().find(x => x.orgId === me); edit = { orgId: me, productId: p.id, title: p.name, text: p.desc || "", offer: "", until: "", plan: "normal", status: "active" }; draw(); }
      else if (b.dataset.edit) { edit = JSON.parse(JSON.stringify(ProductAds.all().find(a => a.id === +b.dataset.edit))); draw(); }
      else if (b.dataset.del) { if (confirm("این آگهی حذف شود؟")) { ProductAds.remove(+b.dataset.del); draw(); toast("آگهی حذف شد"); } }
      else if (b.dataset.cancel !== undefined) { edit = null; draw(); }
      else if (b.dataset.ok !== undefined) {
        if (!(edit.title || "").trim()) return toast("عنوان آگهی لازم است");
        const isNew = !edit.id; if (isNew) edit.id = Date.now();
        ProductAds.save(edit);
        if (isNew) { const sv = service((AD_PLANS.find(p => p.id === edit.plan) || AD_PLANS[0]).service);
          MyOrders.add({ code: sv.code, title: sv.title + " — " + edit.title, price: sv.price, unit: sv.unit, date: "امروز", status: "pending" });
          if (typeof renderEmployerOrders === "function") renderEmployerOrders(); }
        edit = null; draw(); toast(isNew ? "آگهی منتشر شد ✓ (هزینه در «سفارش‌های من»)" : "آگهی ذخیره شد ✓");
      }
    };
    draw();
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
      ["market", "فهرست مشتریان و کارت ویزیت به آزمایشگاه‌ها", Customers.of(o.id).length > 0 && Cards.from(o.id).length > 0],
      ["ads", "آگهی تبلیغاتی محصول", ProductAds.all().some(a => +a.orgId === o.id)],
      ["sponsor", "اسپانسری یک چالش علمی", typeof sponsorRequests !== "undefined" && sponsorRequests.ofOrg(o.id).length > 0]
    ] : [
      ["addlab", "ثبت مرکز روی نقشه", !!o.address],
      ["orgprofile", "نوع مرکز، بخش‌ها، معرفی و گالری", !!(o.labType && (o.gallery || []).length)],
      ["orgprofile", "تجهیزات آزمایشگاه (شناسنامه)", (o.equipment || []).length > 0],
      ["orgprofile", "مدارک (پروانه بهره‌برداری)", (o.documents || []).length > 0],
      ["post", "آگهی استخدام", Store.get("positions", []).length > 0],
      ["otw", "دیدن پرسنل آماده به کار", false],
      ["market", "یافتن محصول یا تعمیرکار", Inquiries.from(o.id).length > 0],
      ["cards", "کارت ویزیت به شرکت‌ها", Cards.from(o.id).length > 0],
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

  return { inquiries, launch, otw, market, checklist, customers, cards, ads };
})();
