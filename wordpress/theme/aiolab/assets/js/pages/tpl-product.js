/* صفحه‌ی محصول — داده از AIO_PRODUCTS (یا محصول در انتظار تأیید خود سازمان) */
let PR = null;
document.addEventListener("DOMContentLoaded", () => {
  const id = Number(qs("id"));
  PR = aioProducts().find(p => p.id === id) || ((ME() && ME().products) || []).find(p => p.id === id);
  if (!PR) { document.querySelector(".detail-layout").innerHTML = `<div class="panel"><h2>این محصول در دسترس نیست</h2><a class="btn btn-primary" href="${P.products}">همه‌ی محصولات</a></div>`; return; }
  const org = orgFull(PR.orgId) || {}, cat = AIO_PRODUCT_CATS.find(c => c.id === PR.cat) || {};
  document.getElementById("bc").textContent = PR.name;
  document.getElementById("pr-name").textContent = PR.name;
  document.getElementById("pr-sub").textContent = [cat.name, org.name].filter(Boolean).join(" · ") + (PR.status && PR.status !== "publish" ? " · در انتظار تأیید" : "");
  document.getElementById("pr-media").innerHTML = PR.img ? `<img src="${esc(PR.img)}" alt="${esc(PR.name)}" style="width:100%;border-radius:14px;margin-bottom:16px">`
    : `<div class="pc-img" style="--pc:${esc(PR.color || cat.color)};--pbg:${esc(cat.bg || "#f1f5f9")};border-radius:14px;margin-bottom:16px;aspect-ratio:16/7">${ICONS[cat.icon] || ICONS.flask}</div>`;
  document.getElementById("pr-desc").textContent = PR.desc || "";
  document.getElementById("pr-specs").innerHTML = (PR.specs || []).map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join("") || '<tr><td colspan="2" class="muted">مشخصاتی ثبت نشده است.</td></tr>';
  document.getElementById("pr-cat").textContent = cat.name || "";
  document.getElementById("pr-price").textContent = PR.price ? fa(Number(PR.price).toLocaleString("en")).replace(/,/g, "٬") + " تومان" : "استعلام قیمت";
  document.getElementById("pr-brand").textContent = PR.brand || "—";
  document.getElementById("pr-model").textContent = PR.model || "—";
  const more = aioProducts().filter(p => p.orgId === PR.orgId && p.id !== PR.id);
  document.getElementById("pr-more").innerHTML = more.map(p => TUI.productCard(p)).join("") || '<p class="muted">محصول دیگری ثبت نشده است.</p>';
  document.getElementById("pr-org").innerHTML = org.id ? `<h2 style="font-size:16px;margin-bottom:10px">تأمین‌کننده</h2>
    <div style="display:flex;gap:10px;align-items:center"><div class="job-logo" style="background:${esc(org.color)}">${org.logo ? `<img src="${esc(org.logo)}" alt="">` : esc((org.name || "؟").replace("شرکت ", "").charAt(0))}</div>
    <div><b>${esc(org.name)} ${org.verified ? "✔️" : ""}</b><div class="muted" style="font-size:12.5px">${esc(org.city || "")}${org.tagline ? " · " + esc(org.tagline) : ""}</div></div></div>
    <a class="btn btn-outline btn-block" style="margin-top:12px" href="${esc(org.url || "#")}">مشاهده پروفایل ${org.orgType === "company" ? "شرکت" : "مرکز"}</a>` : "";
});

/* استعلام قیمت = پیام به سازمان (همان پیام‌رسانی صفحه‌ی مرکز) */
function inquiry() {
  if (!Auth.user) { location.href = loginUrl(); return; }
  const m = aioModal(`<h2>استعلام قیمت و شرایط</h2>
    <p class="muted" style="margin-bottom:12px">«${esc(PR.name)}» — پیام شما برای تأمین‌کننده ارسال می‌شود.</p>
    <div class="form-field"><label for="iq-text">پیام</label><textarea id="iq-text" rows="4" maxlength="1500">سلام؛ لطفاً قیمت و شرایط خرید «${esc(PR.name)}» را اعلام کنید.</textarea></div>
    <div class="modal-actions"><button class="btn btn-ghost" data-x>انصراف</button><button class="btn btn-primary" id="iq-send">ارسال</button></div>`);
  m.querySelector("[data-x]").onclick = () => m.close();
  m.querySelector("#iq-send").onclick = async e => {
    await busy(e.target, () => API.post("labs/" + PR.orgId + "/message", { text: "استعلام محصول «" + PR.name + "»: " + m.querySelector("#iq-text").value }));
    m.close(); toast("درخواست استعلام ارسال شد ✓ پاسخ در اعلان‌ها و ایمیل به شما می‌رسد");
  };
}
