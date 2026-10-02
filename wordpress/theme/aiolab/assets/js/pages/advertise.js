document.addEventListener("DOMContentLoaded", () => {
  /* آمار و «چرا آیولب» در متن برگه هستند (قابل ویرایش در پیشخوان) */
  // پکیج‌ها — R21..R24
  const pkgs = servicesFor("supplier");
  document.getElementById("ad-packages").innerHTML = pkgs.map(s => serviceCardHTML(s, { cta: "رزرو این پکیج" })).join("");

  // انتخابگر پکیج در فرم
  document.getElementById("ad-pkg").innerHTML = '<option value="">انتخاب کنید</option>' +
    pkgs.map(s => `<option value="${s.code}">${s.title} — ${priceShort(s)}</option>`).join("") +
    '<option value="custom">پکیج سفارشی / مشاوره</option>';
});

async function submitAdRequest(e) {
  e.preventDefault();
  const v = id => (document.getElementById(id) || { value: "" }).value.trim();
  const c = v("ad-company"), pkg = v("ad-pkg");
  const s = pkg && pkg !== "custom" ? service(pkg) : null;
  const extra = [...e.target.querySelectorAll("input, select, textarea")].filter(el => el.id && !["ad-company", "ad-person", "ad-phone", "ad-pkg"].includes(el.id) && el.value)
    .map(el => ((el.closest(".form-field") || {}).querySelector ? (el.closest(".form-field").querySelector("label") || {}).textContent : el.id) + ": " + el.value).join("\n");
  const btn = e.submitter || e.target.querySelector("button[type=submit]");
  await busy(btn, () => API.post("contact", { kind: "advertise", name: v("ad-person") || c, contact: v("ad-phone"), topic: c + (s ? " — " + s.code + " " + s.title : " — پکیج سفارشی"), role: "supplier",
    message: `شرکت: ${c}\nمسئول: ${v("ad-person")}\nتماس: ${v("ad-phone")}\nپکیج: ${s ? s.title : "سفارشی"}` + (extra ? "\n" + extra : "") }));
  toast(`درخواست همکاری «${c}» ثبت شد ✓ کارشناسان ما تماس می‌گیرند`);
  e.target.reset();
}

/* پنل تأمین‌کننده: سفارش‌های من (پکیج‌های تبلیغاتی) بالای صفحه */
function renderSupplierOrders() {
  const me = ME();
  if (!me || me.role !== "supplier") return;
  let box = document.getElementById("sup-orders");
  if (!box) {
    const host = document.querySelector(".page-head") || document.querySelector("section");
    host.insertAdjacentHTML("afterend", `<section class="section" style="padding-bottom:0"><div class="container"><div class="panel" id="sup-orders"></div></div></section>`);
    box = document.getElementById("sup-orders");
  }
  const list = MyOrders.all();
  box.innerHTML = `<div class="syllabus-head"><div><h2>پنل تأمین‌کننده — ${esc(me.name)}</h2><p>سفارش‌ها و درخواست‌های تبلیغاتی شما</p></div></div>` + (list.length ? list.map((o, i) => `
    <div class="order-item"><span class="oi-code">${esc(o.code)}</span>
      <div class="oi-body"><b>${esc(o.title)}</b><small>${esc(o.unit)} · ثبت: ${o.date} · شماره ${fa(o.number)}</small></div>
      <span class="status ${o.status}">${o.statusText}</span><span class="oi-price">${o.price === 0 ? "رایگان" : fa(o.price) + " تومان"}</span>
      ${o.status === "pending" ? `<a class="btn btn-sm btn-primary" href="${o.payUrl}">پرداخت</a>` : ""}</div>`).join("")
    : `<p class="muted">هنوز سفارشی ثبت نکرده‌اید؛ از پکیج‌های پایین صفحه یکی را رزرو کنید.</p>`);
}
function renderEmployerOrders() { renderSupplierOrders(); }
document.addEventListener("DOMContentLoaded", renderSupplierOrders);
