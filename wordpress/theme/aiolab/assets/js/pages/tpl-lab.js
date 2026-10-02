const METRIC_LABELS = { salary: "حقوق و مزایا", environment: "محیط کاری", learning: "یادگیری و آموزش",
                        management: "مدیریت", worklife: "تعادل کار و زندگی" };

let LAB = null;
document.addEventListener("DOMContentLoaded", () => {
  LAB = AIO_LABS.find(l => l.id === Number(qs("id"))) || ((ME() && ME().labs) || []).find(l => l.id === Number(qs("id")));
  if (!LAB) { document.querySelector("main, .detail-layout, .container").insertAdjacentHTML("afterbegin", `<div class="panel"><h2>این مرکز در دسترس نیست</h2><a class="btn btn-primary" href="${P.labs}">همه‌ی مراکز</a></div>`); return; }
  const logo = document.getElementById("l-logo");
  logo.style.background = LAB.color;
  if (LAB.logo) logo.innerHTML = `<img src="${LAB.logo}" alt="">`; else logo.textContent = LAB.name.replace("آزمایشگاه ", "").replace("شرکت ", "").charAt(0);
  document.getElementById("l-name").textContent = LAB.name + (LAB.verified ? " ✔️" : "");
  document.getElementById("bc-lab").textContent = LAB.name;
  document.getElementById("l-sub").textContent = [LAB.tagline || LAB.type, LAB.city, sectorName(LAB.sector)].filter(Boolean).join(" · ");
  /* پروفایل کامل: نوع سازمان، اسلایدر، اعتباربخشی، خدمات، محصولات، ساعات و شبکه‌ها (از پیشخوان یا پنل سازمان) */
  const isCo = LAB.orgType === "company";
  if (isCo) { const bl = document.getElementById("bc-list"); if (bl) { bl.href = P.companies; bl.textContent = "شرکت‌ها"; } }
  document.getElementById("l-slider").innerHTML = TUI.slider(LAB.gallery || []);
  document.getElementById("l-acc").innerHTML = `<span style="background:var(--navy-100);color:var(--navy-700);border-color:var(--navy-200)">${isCo ? "شرکت" : "آزمایشگاه / مرکز"}</span>` + (LAB.accreditations || []).map(a => `<span>${esc(a)}</span>`).join("");
  if ((LAB.services || []).length) { document.getElementById("p-services").hidden = false; document.getElementById("l-services").innerHTML = LAB.services.map(x => `<li>${esc(x)}</li>`).join(""); }
  const prods = aioProducts().filter(p => p.orgId === LAB.id);
  if (prods.length) { document.getElementById("p-products").hidden = false; document.getElementById("l-products").innerHTML = prods.map(p => TUI.productCard(p)).join(""); document.getElementById("l-allprod").href = P.products + "?org=" + LAB.id; }
  if (LAB.video && /^https:\/\/(www\.)?aparat\.com\//.test(LAB.video)) document.getElementById("l-video").innerHTML = `<p><a href="${esc(LAB.video)}" target="_blank" rel="noopener">▶ مشاهده ویدئوی معرفی</a></p>`;
  const showRow = (k, v) => { if (v) { document.getElementById("r-" + k).hidden = false; document.getElementById("s-" + k).textContent = v; } };
  showRow("branches", LAB.branches ? fa(LAB.branches) + " شعبه" : "");
  showRow("hours", LAB.hours || "");
  showRow("phone", LAB.phone || "");
  const soc = Object.assign({}, LAB.socials || {}, LAB.website ? { website: LAB.website } : {});
  document.getElementById("s-socials").innerHTML = AIO_SOCIALS.filter(([k]) => soc[k]).map(([k, n]) => `<a class="chip" href="${esc(soc[k])}" target="_blank" rel="noopener nofollow">${n}</a>`).join("");
  document.getElementById("l-about").textContent = LAB.about;
  document.getElementById("l-perks").innerHTML = (LAB.perks || []).map(p => `<span class="chip teal">${esc(p)}</span>`).join("");
  renderFollow();

  const jobs = AIO_JOBS.filter(j => j.labId === LAB.id);
  document.getElementById("l-count").textContent = fa(jobs.length) + " آگهی";
  document.getElementById("l-jobs").innerHTML = jobs.length
    ? jobs.map(jobCardHTML).join("")
    : '<p style="color:var(--navy-400);font-size:14px">در حال حاضر آگهی فعالی ندارد.</p>';

  /* اطلاعات جانبی */
  document.getElementById("s-type").textContent = LAB.type;
  document.getElementById("s-sector").textContent = sectorName(LAB.sector);
  document.getElementById("s-kind").textContent = orgKindName(LAB.orgKind);
  document.getElementById("s-city").textContent = (provinceById(LAB.provinceId) || {}).name + " / " + LAB.city;
  document.getElementById("s-staff").textContent = LAB.staff ? fa(LAB.staff) + " نفر" : "—";
  document.getElementById("s-size").textContent = LAB.size;
  document.getElementById("s-founded").textContent = LAB.founded ? String(LAB.founded).replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]) : "—";
  document.getElementById("s-verified").textContent = LAB.verified ? "✔️ تأییدشده" : "در انتظار احراز";
  document.getElementById("s-address").textContent = LAB.address || "";

  /* میانگین حقوق */
  const withSal = AIO_LABS.filter(x => x.avgSalary);
  const market = withSal.reduce((s, x) => s + x.avgSalary, 0) / Math.max(1, withSal.length);
  const diff = market ? Math.round((LAB.avgSalary - market) / market * 100) : 0;
  document.getElementById("s-salary").textContent = fa(LAB.avgSalary);
  document.getElementById("s-salary-cmp").innerHTML = diff >= 0
    ? `<span class="up">▲ ${fa(Math.abs(diff))}٪ بالاتر از میانگین بازار</span>`
    : `<span class="down">▼ ${fa(Math.abs(diff))}٪ پایین‌تر از میانگین بازار</span>`;
  document.getElementById("s-salary-date").textContent = "ثبت‌شده توسط مرکز · به‌روزرسانی: " + LAB.avgSalaryUpdated;

  /* امتیاز و رتبه */
  const ranked = [...AIO_LABS].sort((a, b) => labScore(b) - labScore(a));
  const rank = ranked.findIndex(x => x.id === LAB.id) + 1;
  document.getElementById("r-score").textContent = fa(labScore(LAB));
  document.getElementById("r-stars").innerHTML = starsHTML(LAB.rating, "lg");
  document.getElementById("r-count").textContent = LAB.ratingCount ? `بر پایه ${fa(LAB.ratingCount)} نظر` : "هنوز امتیازی ثبت نشده";
  document.getElementById("r-rank").innerHTML = `رتبه <b>${fa(rank)}</b> از ${fa(AIO_LABS.length)} مرکز`;
  document.getElementById("r-bars").innerHTML = Object.entries(METRIC_LABELS).map(([k, label]) => {
    const v = (LAB.ratingBreakdown || {})[k] || 0;
    return `<div class="rbar"><span>${label}</span>
      <div class="rbar-track"><i style="width:${v / 5 * 100}%"></i></div>
      <b>${fa(v)}</b></div>`;
  }).join("");

  /* نظرات */
  const revs = AIO_REVIEWS.filter(r => r.labId === LAB.id);
  document.getElementById("l-reviews").innerHTML = revs.length ? revs.map(r => `
    <div class="review">
      <div class="rv-head">
        <div><b>${esc(r.author)}</b><span>${esc(r.role)} · ${r.date}</span></div>
        ${starsHTML(r.stars)}
      </div>
      <p>${esc(r.text)}</p>
      <div class="rv-tags">${r.pros ? `<span class="pro">＋ ${esc(r.pros)}</span>` : ""}${r.cons ? `<span class="con">－ ${esc(r.cons)}</span>` : ""}</div>
    </div>`).join("")
    : `<div class="empty-inline">هنوز نظری ثبت نشده است. اگر در این مرکز کار کرده‌اید، اولین نفر باشید.</div>`;

  /* نقشه */
  renderLabsMap("lab-map", [LAB]);
});
function renderFollow() {
  const b = document.getElementById("follow-btn"); if (!b) return;
  const on = ((ME() && ME().follows) || []).includes(LAB.id);
  b.textContent = on ? "✓ دنبال می‌کنید" : "+ دنبال کردن";
  b.className = "btn " + (on ? "btn-primary" : "btn-outline");
}
async function followLab(btn) {
  if (!Auth.user) { toast("برای دنبال کردن ابتدا وارد شوید"); setTimeout(() => location.href = loginUrl(), 1100); return; }
  const r = await busy(btn, () => API.post("me/follow", { lab_id: LAB.id }));
  toast(r.on ? "دنبال شد ✓ آگهی‌های جدید این مجموعه را در اعلان‌ها می‌بینید" : "دنبال کردن لغو شد");
  renderFollow();
}
function rateThisLab() { location.href = P.ranking + "?rate=" + LAB.id; }
function msgLab() {
  if (!Auth.user) { location.href = loginUrl(); return; }
  const m = aioModal(`<h2>پیام به ${esc(LAB.name)}</h2>
    <div class="form-field"><label for="lm-text">متن پیام</label><textarea id="lm-text" rows="5" maxlength="1500" placeholder="سؤال یا درخواست خود را بنویسید…"></textarea></div>
    <p class="muted" style="font-size:12.5px">پیام همراه نام و ایمیل حساب شما برای مرکز ارسال می‌شود.</p>
    <div class="modal-actions"><button class="btn btn-ghost" data-x>انصراف</button><button class="btn btn-primary" id="lm-send">ارسال پیام</button></div>`);
  m.querySelector("[data-x]").onclick = () => m.close();
  m.querySelector("#lm-send").onclick = async e => {
    await busy(e.target, () => API.post("labs/" + LAB.id + "/message", { text: m.querySelector("#lm-text").value }));
    m.close(); toast("پیام شما برای مرکز ارسال شد ✓");
  };
}
