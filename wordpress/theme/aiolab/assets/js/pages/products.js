/* کاتالوگ محصولات — داده از AIO_PRODUCTS (پیشخوان و پنل سازمان‌ها) */
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("p-cat").insertAdjacentHTML("beforeend", AIO_PRODUCT_CATS.map(c => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join(""));
  const orgIds = [...new Set(aioProducts().map(p => p.orgId))];
  document.getElementById("p-org").insertAdjacentHTML("beforeend", orgIds.map(orgFull).filter(Boolean).map(o => `<option value="${o.id}">${esc(o.name)}</option>`).join(""));
  const q = new URLSearchParams(location.search);
  if (q.get("cat")) document.getElementById("p-cat").value = q.get("cat");
  if (q.get("org")) document.getElementById("p-org").value = q.get("org");
  document.querySelectorAll(".lab-filters input, .lab-filters select").forEach(el => el.addEventListener("input", render));
  render();
});
function render() {
  const t = document.getElementById("p-q").value.trim().toLowerCase(), cat = document.getElementById("p-cat").value,
        org = document.getElementById("p-org").value, sort = document.getElementById("p-sort").value, priced = document.getElementById("p-price").checked;
  let list = aioProducts().filter(p => (!t || (p.name + " " + (p.brand || "") + " " + (p.model || "")).toLowerCase().includes(t))
    && (!cat || p.cat === cat) && (!org || String(p.orgId) === org) && (!priced || p.price));
  if (sort === "price") list.sort((a, b) => (a.price || 1e15) - (b.price || 1e15));
  else if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name, "fa"));
  else list.sort((a, b) => b.id - a.id);
  document.getElementById("p-count").textContent = fa(list.length) + " محصول";
  document.getElementById("p-grid").innerHTML = list.map(p => TUI.productCard(p)).join("")
    || '<div class="empty-state" style="grid-column:1/-1"><b>محصولی پیدا نشد</b>فیلترها را تغییر دهید.</div>';
}
