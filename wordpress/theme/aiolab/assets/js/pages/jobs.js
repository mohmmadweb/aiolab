function checks(containerId, name, values, labels) {
  document.getElementById(containerId).innerHTML = values.map((v, i) =>
    `<label class="check-item"><input type="checkbox" name="${name}" value="${v}"> ${labels ? labels[i] : v}</label>`).join("");
}

document.addEventListener("DOMContentLoaded", () => {
  bindProvinceCity("f-prov", "f-city", render);
  document.getElementById("f-dept").insertAdjacentHTML("beforeend",
    AIO_DEPARTMENTS.map(d => `<option value="${d.id}">${d.name}</option>`).join(""));

  checks("f-types",    "type",     AIO_JOB_TYPES);
  checks("f-shifts",   "shift",    AIO_SHIFTS);
  checks("f-salary",   "band",     AIO_SALARY_BANDS.map(b => b.id), AIO_SALARY_BANDS.map(b => b.name));
  checks("f-exp",      "exp",      AIO_EXPERIENCES);
  checks("f-degree",   "degree",   AIO_DEGREES);
  checks("f-field",    "field",    AIO_FIELDS_STUDY);
  checks("f-gender",   "gender",   AIO_GENDERS);
  checks("f-military", "military", AIO_MILITARY);
  checks("f-benefits", "benefit",  AIO_BENEFITS);
  checks("f-sector",   "sector",   AIO_SECTORS.map(s => s.id), AIO_SECTORS.map(s => s.name));
  checks("f-kind",     "kind",     AIO_ORG_KINDS.map(s => s.id), AIO_ORG_KINDS.map(s => s.name));
  checks("f-size",     "size",     AIO_ORG_SIZES);
  document.getElementById("f-age").innerHTML = AIO_POST_AGES.map(a =>
    `<label class="check-item"><input type="radio" name="age" value="${a.id}"> ${a.name}</label>`).join("") +
    `<label class="check-item"><input type="radio" name="age" value="" checked> همه زمان‌ها</label>`;

  applyURLParams();

  document.querySelectorAll(".filters input, .filters select, #f-sort")
    .forEach(el => el.addEventListener("input", render));
  render();
});

function applyURLParams() {
  if (qs("q")) document.getElementById("f-q").value = qs("q");
  if (qs("prov")) { document.getElementById("f-prov").value = qs("prov");
                    document.getElementById("f-prov").dispatchEvent(new Event("change")); }
  if (qs("city")) document.getElementById("f-city").value = qs("city");
  if (qs("dept")) document.getElementById("f-dept").value = qs("dept");
  if (qs("remote")) document.getElementById("f-remote").checked = true;
  if (qs("urgent")) document.getElementById("f-urgent").checked = true;
  if (qs("featured")) document.getElementById("f-featured").checked = true;
  if (qs("verified")) document.getElementById("f-verified").checked = true;
  ["type", "shift", "benefit", "band", "exp", "degree", "field", "gender", "military", "sector", "kind", "size", "age"].forEach(n => {
    const v = qs(n); if (!v) return;
    const cb = document.querySelector(`input[name="${n}"][value="${CSS.escape(v)}"]`); if (cb) cb.checked = true;
  });
}

const getChecked = name => [...document.querySelectorAll(`input[name="${name}"]:checked`)].map(i => i.value);

function currentFilters() {
  return {
    q: document.getElementById("f-q").value.trim(),
    provinceId: document.getElementById("f-prov").value,
    city: document.getElementById("f-city").value,
    dept: document.getElementById("f-dept").value,
    types: getChecked("type"),
    shifts: getChecked("shift"),
    salaryBands: getChecked("band"),
    experiences: getChecked("exp"),
    degrees: getChecked("degree"),
    fields: getChecked("field"),
    genders: getChecked("gender"),
    militaries: getChecked("military"),
    benefits: getChecked("benefit"),
    sectors: getChecked("sector"),
    orgKinds: getChecked("kind"),
    sizes: getChecked("size"),
    postAge: (document.querySelector('input[name="age"]:checked') || {}).value || "",
    remote: document.getElementById("f-remote").checked,
    urgent: document.getElementById("f-urgent").checked,
    featured: document.getElementById("f-featured").checked,
    verifiedOnly: document.getElementById("f-verified").checked
  };
}

function render() {
  const f = currentFilters();
  const list = sortJobs(filterJobs(f), document.getElementById("f-sort").value);

  document.getElementById("count").textContent = fa(list.length);
  document.getElementById("job-list").innerHTML = list.map(jobCardHTML).join("");
  document.getElementById("empty").style.display = list.length ? "none" : "block";
  renderChips(f);
}

function renderChips(f) {
  const chips = [];
  const add = (label, clear) => chips.push(`<button class="a-chip" onclick="${clear}">${label} ✕</button>`);
  if (f.q) add(`«${f.q}»`, `document.getElementById('f-q').value='';render()`);
  if (f.provinceId) add(provinceById(f.provinceId).name, `document.getElementById('f-prov').value='';document.getElementById('f-prov').dispatchEvent(new Event('change'));render()`);
  if (f.city) add(f.city, `document.getElementById('f-city').value='';render()`);
  if (f.dept) add(dept(f.dept).name, `document.getElementById('f-dept').value='';render()`);
  const groups = { type: f.types, shift: f.shifts, exp: f.experiences, degree: f.degrees,
                   field: f.fields, gender: f.genders, military: f.militaries, benefit: f.benefits, size: f.sizes };
  Object.entries(groups).forEach(([name, arr]) => (arr || []).forEach(v =>
    add(v, `uncheck('${name}','${v}')`)));
  (f.salaryBands || []).forEach(id => add(AIO_SALARY_BANDS.find(b => b.id === id).name, `uncheck('band','${id}')`));
  (f.sectors || []).forEach(id => add(sectorName(id), `uncheck('sector','${id}')`));
  (f.orgKinds || []).forEach(id => add(orgKindName(id), `uncheck('kind','${id}')`));
  if (f.remote) add("دورکاری", `document.getElementById('f-remote').checked=false;render()`);
  if (f.urgent) add("فوری", `document.getElementById('f-urgent').checked=false;render()`);
  if (f.featured) add("ویژه", `document.getElementById('f-featured').checked=false;render()`);
  if (f.verifiedOnly) add("تأییدشده", `document.getElementById('f-verified').checked=false;render()`);

  document.getElementById("chips").innerHTML = chips.length
    ? chips.join("") + `<button class="a-chip clear" onclick="resetFilters()">حذف همه فیلترها</button>`
    : "";
}

function uncheck(name, value) {
  const cb = document.querySelector(`input[name="${name}"][value="${value}"]`);
  if (cb) cb.checked = false;
  render();
}

function resetFilters() {
  document.querySelectorAll(".filters input[type=checkbox]").forEach(i => i.checked = false);
  document.querySelectorAll('input[name="age"]').forEach(i => i.checked = i.value === "");
  document.getElementById("f-q").value = "";
  document.getElementById("f-prov").value = "";
  document.getElementById("f-dept").value = "";
  bindProvinceCity("f-prov", "f-city", render);
  render();
}

/* ---- هشدار شغلی: پاسخ به «چطور از آگهی‌های جدید باخبر شوم؟» ---- */
async function saveAlert() {
  if (!Auth.user) { toast("برای ساخت هشدار شغلی وارد حساب شوید"); setTimeout(() => location.href = loginUrl(), 1200); return; }
  const f = currentFilters();
  const parts = [];
  if (f.q) parts.push(f.q);
  if (f.dept) parts.push(dept(f.dept).name);
  if (f.city) parts.push(f.city);
  else if (f.provinceId) parts.push(provinceById(f.provinceId).name);
  (f.types || []).forEach(t => parts.push(t));
  const filters = { q: f.q, dept: f.dept, provinceId: f.provinceId, city: f.city, type: (f.types || [])[0] || "", band: (f.salaryBands || [])[0] || "" };
  const btn = window.event && window.event.target && window.event.target.closest ? window.event.target.closest("button") : null;
  await busy(btn, () => MyAlerts.add({ title: parts.join(" · ") || "همه فرصت‌های شغلی", filters, channels: ["ایمیل", "اعلان سایت"], freq: "خلاصه روزانه" }));
  toast("هشدار شغلی ساخته شد ✓ آگهی‌های جدید مطابق این جستجو به ایمیل و اعلان‌های شما می‌آید");
}
