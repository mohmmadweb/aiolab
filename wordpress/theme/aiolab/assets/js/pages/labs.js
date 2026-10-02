let mapApi = null, currentList = [];
/* این صفحه فقط یک نوع سازمان را نشان می‌دهد: آزمایشگاه‌ها یا شرکت‌ها (برگه‌ی «شرکت‌ها» همین اسکریپت را دارد) */
const ORG_TYPE = (window.AIO_CFG && AIO_CFG.role === "companies") ? "company" : "lab";
const KINDS_OF = { lab: ["clinical", "research"], company: ["manufacturer", "distributor", "importer"] };

document.addEventListener("DOMContentLoaded", () => {
  bindProvinceCity("f-prov", "f-city", render);
  document.getElementById("f-sector").insertAdjacentHTML("beforeend",
    AIO_SECTORS.map(s => `<option value="${s.id}">${s.name}</option>`).join(""));
  document.getElementById("f-kind").insertAdjacentHTML("beforeend",
    AIO_ORG_KINDS.filter(s => !KINDS_OF[ORG_TYPE] || KINDS_OF[ORG_TYPE].includes(s.id)).map(s => `<option value="${s.id}">${s.name}</option>`).join(""));

  document.querySelectorAll(".lab-filters input, .lab-filters select")
    .forEach(el => el.addEventListener("input", render));

  render();
  buildMap();
});

function currentFilters() {
  return {
    q: document.getElementById("f-q").value.trim(),
    prov: document.getElementById("f-prov").value,
    city: document.getElementById("f-city").value,
    sector: document.getElementById("f-sector").value,
    kind: document.getElementById("f-kind").value,
    verified: document.getElementById("f-verified").checked,
    sort: document.getElementById("f-sort").value
  };
}

function render() {
  const f = currentFilters();
  let list = orgsOfType(ORG_TYPE).filter(l =>
    (!f.q || l.name.includes(f.q)) &&
    (!f.prov || l.provinceId === f.prov) &&
    (!f.city || l.city === f.city) &&
    (!f.sector || l.sector === f.sector) &&
    (!f.kind || l.orgKind === f.kind) &&
    (!f.verified || l.verified));

  const jobsOf = l => AIO_JOBS.filter(j => j.labId === l.id).length;
  if (f.sort === "rating") list.sort((a, b) => labScore(b) - labScore(a));
  if (f.sort === "salary") list.sort((a, b) => b.avgSalary - a.avgSalary);
  if (f.sort === "jobs")   list.sort((a, b) => jobsOf(b) - jobsOf(a));
  if (f.sort === "name")   list.sort((a, b) => a.name.localeCompare(b.name, "fa"));

  currentList = list;
  document.getElementById("lab-count").textContent = fa(list.length);
  const prods = id => aioProducts().filter(p => p.orgId === id).length;
  document.getElementById("lab-grid").innerHTML = list.map(l => labCardHTML(l).replace('<span class="open-jobs">',
    `${(l.accreditations || []).length ? `<div class="org-badges">${l.accreditations.slice(0, 2).map(a => `<span>${esc(a)}</span>`).join("")}</div>` : ""}${prods(l.id) ? `<span class="chip" style="margin-top:6px">${fa(prods(l.id))} محصول</span>` : ""}<span class="open-jobs">`)).join("");
  document.getElementById("empty").style.display = list.length ? "none" : "block";

  document.getElementById("map-side").innerHTML = list.map(l => `
    <button class="ms-item" onclick="focusLab(${l.id})">
      <span class="ms-dot" style="background:${l.color}"></span>
      <div class="ms-body">
        <b>${l.name} ${l.verified ? "✔️" : ""}</b>
        <span>${esc(l.city)} · ${esc(l.tagline || sectorName(l.sector))}</span>
        <div class="ms-meta">
          ${starsHTML(l.rating)} <b>${fa(l.rating)}</b>
          <i>·</i> میانگین حقوق ${fa(l.avgSalary)} م.ت
          <i>·</i> ${fa(AIO_JOBS.filter(j => j.labId === l.id).length)} آگهی
        </div>
      </div>
    </button>`).join("") || `<div class="ms-empty">مرکزی با این فیلترها نیست.</div>`;

  if (mapApi) buildMap();
}

function buildMap() {
  if (mapApi && mapApi.map) mapApi.map.remove();   // جلوگیری از خطای «container already initialized»
  const box = document.getElementById("labs-map");
  box.innerHTML = "";
  mapApi = renderLabsMap("labs-map", currentList);
}

function focusLab(id) { if (mapApi && mapApi.focus) mapApi.focus(id); }

function setView(v) {
  document.querySelectorAll(".vt").forEach(b => b.classList.toggle("active", b.dataset.view === v));
  document.getElementById("view-map").style.display = v === "map" ? "" : "none";
  document.getElementById("view-list").style.display = v === "list" ? "" : "none";
  if (v === "map") setTimeout(() => { if (mapApi && mapApi.map) mapApi.map.invalidateSize(); }, 60);
}

function resetLabFilters() {
  document.getElementById("f-q").value = "";
  document.getElementById("f-prov").value = "";
  document.getElementById("f-sector").value = "";
  document.getElementById("f-kind").value = "";
  document.getElementById("f-verified").checked = false;
  bindProvinceCity("f-prov", "f-city", render);
  render();
}
