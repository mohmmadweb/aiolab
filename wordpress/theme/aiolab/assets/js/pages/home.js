const ADV = [
  ["a-type", AIO_JOB_TYPES], ["a-shift", AIO_SHIFTS], ["a-exp", AIO_EXPERIENCES],
  ["a-degree", AIO_DEGREES], ["a-field", AIO_FIELDS_STUDY], ["a-gender", AIO_GENDERS],
  ["a-military", AIO_MILITARY], ["a-benefit", AIO_BENEFITS]
];

document.addEventListener("DOMContentLoaded", () => {
  // stat icons
  document.getElementById("ic-1").innerHTML = ICONS.briefcase;
  document.getElementById("ic-2").innerHTML = ICONS.users;
  document.getElementById("ic-3").innerHTML = ICONS.flask;
  document.getElementById("ic-4").innerHTML = ICONS.shield;

  // province + city (وابسته به هم، همه استان‌ها و شهرها)
  bindProvinceCity("prov", "city");

  // job categories
  const deptSel = document.getElementById("dept");
  AIO_DEPARTMENTS.forEach(d => deptSel.insertAdjacentHTML("beforeend", `<option value="${d.id}">${d.name}</option>`));

  // advanced panel selects
  ADV.forEach(([id, arr]) => document.getElementById(id).insertAdjacentHTML("beforeend",
    arr.map(v => `<option value="${v}">${v}</option>`).join("")));
  document.getElementById("a-band").insertAdjacentHTML("beforeend",
    AIO_SALARY_BANDS.map(b => `<option value="${b.id}">${b.name}</option>`).join(""));
  document.getElementById("a-sector").insertAdjacentHTML("beforeend",
    AIO_SECTORS.map(s => `<option value="${s.id}">${s.name}</option>`).join(""));
  document.getElementById("a-kind").insertAdjacentHTML("beforeend",
    AIO_ORG_KINDS.map(s => `<option value="${s.id}">${s.name}</option>`).join(""));
  document.getElementById("a-age").insertAdjacentHTML("beforeend",
    AIO_POST_AGES.map(a => `<option value="${a.id}">${a.name}</option>`).join(""));

  // job-alert band
  document.getElementById("al-dept").insertAdjacentHTML("beforeend",
    AIO_DEPARTMENTS.map(d => `<option value="${d.id}">${d.name}</option>`).join(""));
  document.getElementById("al-prov").innerHTML = `<option value="">همه استان‌ها</option>` +
    AIO_PROVINCES.map(p => `<option value="${p.id}">${p.name}</option>`).join("");

  // map teaser
  document.getElementById("mt-count").textContent =
    `${fa(AIO_LABS.length)} مرکز پین‌شده در ${fa(new Set(AIO_LABS.map(l => l.provinceId)).size)} استان`;
  document.getElementById("mt-pins").innerHTML = AIO_LABS.slice(0, 9).map((l, i) => `
    <span class="mt-pin" style="background:${l.color};top:${12 + (i % 3) * 26}%;right:${8 + Math.floor(i / 3) * 28 + (i % 3) * 6}%">
      ${l.name.replace("آزمایشگاه ", "").replace("شرکت ", "").charAt(0)}</span>`).join("");

  // FAQ (top 4)
  const top = AIO_FAQ.flatMap(c => c.items).slice(0, 4);
  document.getElementById("faq-home").innerHTML = top.map((it, i) => `
    <details class="faq-item" ${i === 0 ? "open" : ""}>
      <summary>${it.q}</summary>
      <div class="fa-body">${it.a}</div>
    </details>`).join("");

  // categories
  document.getElementById("cat-grid").innerHTML = AIO_DEPARTMENTS.map(d => {
    const count = AIO_JOBS.filter(j => j.dept === d.id).length;
    return `<a class="cat-card" href="${P.jobs}?dept=${d.id}">
      <div class="ic" style="background:${d.bg};color:${d.color}">${ICONS[d.icon] || ICONS.flask}</div>
      <b>${d.name}</b>
      <span>${count.toLocaleString("fa-IR")} فرصت فعال</span>
    </a>`;
  }).join("");

  // featured jobs (urgent+featured first)
  const sorted = [...AIO_JOBS].sort((a, b) => (b.urgent - a.urgent) || (b.featured - a.featured) || (a.days - b.days));
  document.getElementById("featured-jobs").innerHTML = sorted.slice(0, 6).map(jobCardHTML).join("");

  // labs
  document.getElementById("home-labs").innerHTML = AIO_LABS.slice(0, 6).map(labCardHTML).join("");

  // services — یک کارت برای هر جریان درآمد، به تفکیک مخاطب
  document.getElementById("home-services").innerHTML = AIO_SERVICE_GROUPS.map(g => {
    const n = servicesOf(g.id).length;
    const p = payerMeta(g.payer);
    return `<a class="cat-card" href="${P.services}#${g.id}">
      <div class="ic" style="background:${g.bg};color:${g.color}">${ICONS[g.icon] || ICONS.flask}</div>
      <b>${g.name}</b>
      <span>${p ? p.short : ""} · ${fa(n)} خدمت</span>
    </a>`;
  }).join("");

  // academy — پرمخاطب‌ترین دوره‌ها و دو مسیر یادگیری
  document.getElementById("home-courses").innerHTML = sortCourses(AIO_COURSES, "popular").slice(0, 4).map(c => courseCardHTML(c, { compact: true })).join("");
  document.getElementById("home-paths").innerHTML = AIO_LEARNING_PATHS.slice(0, 3).map(pathCardHTML).join("");

  // articles
  document.getElementById("home-articles").innerHTML = AIO_ARTICLES.slice(0, 3).map(a => `
    <a class="content-card" href="${a.url}">
      <div class="thumb" style="background:${a.bg};color:${a.color}">${a.thumb ? `<img src="${a.thumb}" alt="">` : (ICONS[a.icon] || ICONS.doc)}</div>
      <div class="body">
        <span class="cat">${a.cat}</span>
        <h3>${a.title}</h3>
        <div class="meta">${a.time ? `<span>مطالعه ${a.time}</span>` : ""}<span>${a.date}</span></div>
      </div>
    </a>`).join("");
});

function toggleAdv() {
  const p = document.getElementById("adv-panel");
  p.style.display = p.style.display === "none" ? "" : "none";
}

function goSearch(e, adv) {
  e.preventDefault();
  const p = new URLSearchParams();
  const set = (k, v) => { if (v) p.set(k, v); };
  set("q", document.getElementById("q").value.trim());
  set("prov", document.getElementById("prov").value);
  set("city", document.getElementById("city").value);
  set("dept", document.getElementById("dept").value);
  if (adv) {
    /* همه‌ی فیلترهای پنل پیشرفته به صفحه‌ی جستجو منتقل می‌شوند */
    [["type", "a-type"], ["shift", "a-shift"], ["band", "a-band"], ["exp", "a-exp"], ["degree", "a-degree"], ["field", "a-field"],
     ["gender", "a-gender"], ["military", "a-military"], ["sector", "a-sector"], ["kind", "a-kind"], ["benefit", "a-benefit"], ["age", "a-age"]]
      .forEach(([k, id]) => set(k, document.getElementById(id).value));
    if (document.getElementById("a-remote").checked) p.set("remote", "1");
    if (document.getElementById("a-verified").checked) p.set("verified", "1");
  }
  location.href = P.jobs + (p.toString() ? "?" + p.toString() : "");
}

async function quickAlert(e) {
  e.preventDefault();
  if (!Auth.user) { toast("برای ساخت هشدار شغلی ابتدا ثبت‌نام کنید"); setTimeout(() => location.href = P.register + "?redirect=" + encodeURIComponent(location.pathname + "#alerts"), 1200); return; }
  const d = document.getElementById("al-dept").value;
  const pr = document.getElementById("al-prov").value;
  const title = [d ? dept(d).name : "همه بخش‌ها", pr ? provinceById(pr).name : "سراسر کشور"].join(" · ");
  await busy(e.submitter || e.target.querySelector("button"), () => MyAlerts.add({ title, filters: { dept: d, provinceId: pr }, channels: ["ایمیل", "اعلان سایت"], freq: "خلاصه روزانه" }));
  toast("هشدار شغلی «" + title + "» ساخته شد ✓ آگهی‌های جدید به ایمیل و اعلان‌های شما می‌آید");
}
