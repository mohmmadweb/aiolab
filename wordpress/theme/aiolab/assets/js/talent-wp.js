/* ==========================================
   آیولب (وردپرس) — دسترسی یکپارچه به سازمان‌ها، محصولات، پوزیشن‌ها و رزومه‌ها
   برای اجزای مشترک دمو (talent-ui / talent-center / resume-builder / employer-talent)
   داده‌ی عمومی از /aio-data.js، داده‌ی شخصی از AIO_ME، بقیه از API
   ========================================== */
function orgFull(id) {
  id = Number(id);
  return AIO_LABS.find(l => l.id === id) || ((ME() && ME().labs) || []).find(l => l.id === id) || null;
}
const orgsOfType = t => AIO_LABS.filter(o => (o.orgType || "lab") === t);
function aioProducts() { return typeof AIO_PRODUCTS !== "undefined" ? AIO_PRODUCTS : []; }

/* پوزیشن‌ها و رزومه‌های مرکز تطبیق از سرور بار می‌شوند (فقط برای کارفرما/مدیر) */
let AIO_TALENT_POSITIONS = null, AIO_TALENT_CANDS = null;
function aioPositions() { return AIO_TALENT_POSITIONS || AIO_JOBS.filter(j => j.req); }
function aioCandidates() { return AIO_TALENT_CANDS || []; }
async function loadTalent() {
  const [p, c] = await Promise.all([API.get("talent/positions"), API.get("talent/candidates")]);
  AIO_TALENT_POSITIONS = p.positions || [];
  AIO_TALENT_CANDS = c.candidates || [];
}

/* فیلترهای ذخیره‌شده‌ی مرکز تطبیق — روی سرور */
const TalentSaved = {
  list: () => (ME() && ME().talentFilters) || [],
  add: (name, tree) => API.post("talent/filters", { name, tree }),
  remove: i => API.del("talent/filters/" + i)
};

/* اقدام روی نفر در مرکز تطبیق: مشاهده‌ی رزومه‌ی کامل و تماس */
function talentCandActions(c, job) {
  const canInvite = job && job.id && (job.mine || (ME() && ME().realRole === "admin")) && typeof talentInviteForm === "function";
  return (canInvite ? `<button class="btn btn-primary" onclick="const f=this.parentElement.querySelector('[data-invite]');f.style.display=f.style.display==='none'?'':'none'">دعوت به این پوزیشن</button> ` : "")
    + `<button class="btn btn-outline" onclick="openFullResume(${Number(c.id)}, this)">رزومه‌ی کامل و اطلاعات تماس</button>`
    + (canInvite ? talentInviteForm(c, job) : "");
}
async function openFullResume(uid, btn) {
  const r = await busy(btn, () => API.get("employer/resume/" + uid));
  const x = r.resume || {};
  TalentCenter.open(`<h2>${esc(x.name || "")}</h2><p class="muted">${esc(x.title || "")} · ${esc(x.city || "")}</p>
    <div class="table-wrap"><table class="data spec-table"><tbody>
      <tr><td>ایمیل</td><td dir="ltr">${x.email ? `<a href="mailto:${esc(x.email)}">${esc(x.email)}</a>` : "—"}</td></tr>
      <tr><td>موبایل</td><td dir="ltr">${x.phone ? `<a href="tel:${esc(x.phone)}">${esc(x.phone)}</a>` : "—"}</td></tr>
      <tr><td>فایل رزومه</td><td>${x.file ? `<a href="${esc(x.file)}" target="_blank" rel="noopener">دانلود</a>` : "—"}</td></tr>
    </tbody></table></div>
    ${x.summary ? `<h3>خلاصه</h3><p>${esc(x.summary)}</p>` : ""}`);
}

/* آداپتور پنل سازمان/محصول/پوزیشن برای employer-talent.js */
window.EMP_ADAPTER = {
  orgs: () => ((ME() && ME().labs) || []).map(l => [l.id, l.name + (l.status !== "publish" ? " (در انتظار تأیید)" : "")]),
  orgId: () => { const labs = (ME() && ME().labs) || []; const s = Store.get("emp_org", 0); return labs.some(l => l.id === s) ? s : (labs[0] || {}).id || 0; },
  setOrgId: id => Store.set("emp_org", Number(id)),
  org: id => ((ME() && ME().labs) || []).find(l => l.id === Number(id)) || null,
  publicUrl: id => (orgFull(id) || {}).url || "#",
  saveOrg: (id, data) => API.post("employer/org/" + id, { org: Object.assign({}, data, { gallery: (data.gallery || []).map(g => ({ att: g.att || 0, t: g.t || "", c: g.c || "" })) }) }),
  image: async file => {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error("فقط تصویر JPG، PNG یا WebP");
    if (file.size > 8 * 1024 * 1024) throw new Error("حداکثر حجم هر تصویر ۸ مگابایت است");
    const r = await API.upload("employer/image", file);
    return { att: r.att, img: r.img };
  },
  products: orgId => ((ME() && ME().products) || []).filter(p => p.orgId === orgId),
  newProductId: () => 0,
  saveProduct: p => API.post("employer/product", { product: p }),
  deleteProduct: id => API.del("employer/product/" + id),
  position: id => {
    const j = ((ME() && ME().jobs) || []).find(x => x.id === Number(id));
    if (!j) return null;
    const req = Object.assign({ fields: [], licenses: [], langs: [], military: [], skills: [] }, j.req || {});
    return Object.assign({}, j, { role: req.role || "", orgName: j.clientName || "", salaryMin: j.salaryMin || "", salaryMax: j.salaryMax || "", req });
  },
  savePosition: async job => {
    const r = await API.post("employer/job", { job: {
      id: job.id || 0, title: job.title, labId: job.labId, dept: job.dept, provinceId: job.provinceId, city: job.city, type: job.type, shift: job.shift,
      salaryMin: job.salaryMin || 0, salaryMax: job.salaryMax || 0, desc: job.desc || "", benefits: job.benefits || [], remote: !!job.remote,
      internal: !!job.internal, clientName: job.internal ? job.orgName : "", role: job.role, req: job.req, gender: (job.req && job.req.gender) || "فرقی نمی‌کند"
    } });
    return Object.assign({}, r.job || {}, { status: r.status });
  },
  withDesc: true
};
