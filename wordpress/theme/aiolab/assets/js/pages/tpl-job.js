/* صفحه‌ی آگهی شغلی — داده از AIO_JOBS (یا آگهی در انتظار تأیید خود کارفرما) */
let J;

/* نیازمندی‌های ساخت‌یافته‌ی آگهی */
function TalentReq(j) {
  const r = j.req, n = TUI.name, rows = [];
  if (r.role) rows.push(["عنوان شغلی", n.role(r.role)]);
  if (r.seniority) rows.push(["رده شغلی", n.seniority(r.seniority)]);
  rows.push(["حداقل سابقه کل", r.minExp ? AioDate.durText(r.minExp) : "نیاز نیست"]);
  if (r.expDept) rows.push(["سابقه در همین بخش", AioDate.durText(r.expDept)]);
  if (r.degree) rows.push(["حداقل مدرک", n.degree(r.degree) + ((r.fields || []).length ? " — " + r.fields.join("، ") : "")]);
  (r.licenses || []).forEach(l => rows.push(["مدرک الزامی", n.license(l)]));
  (r.langs || []).forEach(l => rows.push(["زبان", n.lang(l.id) + " — حداقل " + n.langLevel(l.lvl)]));
  if (r.age) rows.push(["بازه سنی", fa(r.age[0]) + " تا " + fa(r.age[1]) + " سال"]);
  if (r.gender) rows.push(["جنسیت", r.gender]);
  if ((r.military || []).length) rows.push(["نظام وظیفه (آقایان)", r.military.join("، ")]);
  return `<div class="table-wrap"><table class="data spec-table"><tbody>${rows.map(([k, v]) => `<tr><td>${k}</td><td>${esc(v)}</td></tr>`).join("")}</tbody></table></div>
    <h3>مهارت‌ها و سطح لازم</h3><div class="table-wrap"><table class="data"><thead><tr><th>مهارت</th><th>سطح لازم</th><th>اهمیت</th></tr></thead><tbody>
    ${(r.skills || []).map(s => `<tr><td>${esc(n.skill(s.id))}${s.must ? ' <span class="chip sm warn">کلیدی</span>' : ""}</td><td>${esc(n.level(s.lvl))}</td><td><div class="cc-progress" style="width:90px"><i style="width:${s.w * 10}%"></i></div></td></tr>`).join("")}</tbody></table></div>`;
}
const myCv = () => { const c = ME() && ME().cv; return c && c.skills && c.skills.length ? Object.assign({ name: ME().name }, c) : null; };

document.addEventListener("DOMContentLoaded", () => {
  const id = Number(qs("id"));
  J = AIO_JOBS.find(j => j.id === id) || ((ME() && ME().jobs) || []).find(j => j.id === id);
  if (!J) { document.querySelector(".detail-layout").innerHTML = `<div class="panel"><h2>این آگهی در دسترس نیست</h2><p>ممکن است منقضی یا بسته شده باشد.</p><a class="btn btn-primary" href="${P.jobs}">مشاهده فرصت‌های فعال</a></div>`; return; }
  const L = lab(J.labId) || { name: "—", color: "#0d9488", perks: [], type: "", city: "", about: "" }, D = dept(J.dept) || { name: "", bg: "#f1f5f9", color: "#475569" };

  document.getElementById("bc-title").textContent = J.title;
  document.getElementById("j-title").textContent = J.title;
  document.getElementById("j-sub").innerHTML = `${esc(L.name)} · ${esc(J.city)} · <span class="chip" style="background:${D.bg};color:${D.color}">${esc(D.name)}</span>` +
    (J.urgent ? ' <span class="badge-urgent" style="position:static">فوری</span>' : "") + (J.status && J.status !== "active" ? ` <span class="status ${J.status}">${esc(J.statusText)}</span>` : "");
  document.getElementById("j-desc").textContent = J.desc;
  document.getElementById("j-reqs").innerHTML = J.requirements.map(r => `<li>${esc(r)}</li>`).join("");
  document.getElementById("j-skills").innerHTML = J.skills.map(s => `<span class="chip teal">${esc(s)}</span>`).join("");

  const logo = document.getElementById("l-logo");
  logo.style.background = L.color;
  if (L.logo) logo.innerHTML = `<img src="${L.logo}" alt="">`; else logo.textContent = L.name.replace("آزمایشگاه ", "").charAt(0);
  document.getElementById("l-name").textContent = L.name + (L.verified ? " ✔️" : "");
  document.getElementById("l-type").textContent = [L.type, L.city].filter(Boolean).join(" · ");
  document.getElementById("l-about").textContent = L.about;
  document.getElementById("l-perks").innerHTML = (L.perks || []).map(p => `<span class="chip">${esc(p)}</span>`).join("");
  if (L.url) document.getElementById("l-link").href = L.url;

  document.getElementById("s-type").textContent = J.type;
  document.getElementById("s-shift").textContent = J.shift;
  document.getElementById("s-city").textContent = J.city + (J.remote ? " (امکان دورکاری)" : "");
  document.getElementById("s-salary").textContent = J.salary;
  document.getElementById("s-exp").textContent = J.experience;
  document.getElementById("s-degree").textContent = J.degree;
  document.getElementById("s-date").textContent = timeAgo(J.days);

  if (J.req) { document.getElementById("p-req").hidden = false; document.getElementById("j-req").innerHTML = TalentReq(J); }
  const u = Auth.user;
  if (J.req && u && !["employer", "supplier"].includes(u.role)) {
    const cv = myCv();
    document.getElementById("p-match").hidden = false;
    if (cv) {
      const m = AioMatch.score(cv, J);
      const box = document.getElementById("match-box");
      box.style.display = "flex";
      document.getElementById("match-ring").style.setProperty("--p", m.score);
      document.getElementById("match-val").textContent = fa(m.score) + "٪";
      document.getElementById("match-note").textContent = "تطبیق " + m.fitName + (m.eligible ? "" : " — شرط الزامی ناقص");
      document.getElementById("j-match").innerHTML = TUI.breakdown(m);
    } else {
      document.getElementById("j-match").innerHTML = `<div class="empty-inline">رزومه‌ی آیتمی خود را بسازید تا ببینید چقدر با این آگهی تطبیق دارید. <a href="${P.dashboard}#resume">ساخت رزومه</a></div>`;
    }
  }
  renderActions();

  const sim = AIO_JOBS.filter(x => x.id !== J.id && (x.dept === J.dept || x.city === J.city)).slice(0, 2);
  document.getElementById("similar").innerHTML = sim.length ? sim.map(jobCardHTML).join("") : `<p class="muted">فعلاً آگهی مشابهی نیست.</p>`;
});

function applied() { return ((ME() && ME().applications) || []).find(a => a.jobId === J.id); }

function renderActions() {
  const applyBtn = document.querySelector('[onclick="applyJob()"]');
  const saveBtn = document.querySelector('[onclick^="toast(\'آگهی در نشان‌شده‌ها"], [onclick="toggleSave()"]');
  const a = applied();
  if (applyBtn) {
    if (a) { applyBtn.textContent = "درخواست ارسال شده — " + a.statusText + " (پیگیری)"; applyBtn.className = "btn btn-outline btn-block btn-lg"; }
    if (J.status && J.status !== "active") applyBtn.disabled = true;
  }
  if (saveBtn) {
    saveBtn.setAttribute("onclick", "toggleSave()");
    const on = ((ME() && ME().saved) || []).includes(J.id);
    saveBtn.textContent = on ? "🔖 ذخیره‌شده (برای حذف کلیک کنید)" : "🔖 ذخیره آگهی";
  }
}

async function applyJob() {
  const u = Auth.user;
  if (!u) { location.href = loginUrl(); return; }
  if (["employer", "supplier"].includes(u.role)) { toast("با حساب کارفرما/تأمین‌کننده نمی‌توانید درخواست بدهید"); return; }
  if (applied()) { location.href = P.dashboard + "#applications"; return; }
  const m = aioModal(`<h2>ارسال درخواست همکاری</h2>
    <p class="muted" style="margin-bottom:12px">«${esc(J.title)}» — رزومه‌ی آیولب شما${ME().resumeFile ? " و فایل رزومه" : ""} برای کارفرما ارسال می‌شود.</p>
    <div class="form-field"><label for="ap-note">پیام کوتاه به کارفرما (اختیاری)</label><textarea id="ap-note" rows="4" maxlength="1500" placeholder="مثلاً: آمادگی شروع همکاری از هفته‌ی آینده را دارم."></textarea></div>
    <div class="modal-actions"><button class="btn btn-ghost" data-x>انصراف</button><button class="btn btn-primary" id="ap-send">ارسال درخواست</button></div>`);
  m.querySelector("[data-x]").onclick = () => m.close();
  m.querySelector("#ap-send").onclick = async e => {
    try {
      await busy(e.target, () => API.post("jobs/" + J.id + "/apply", { note: m.querySelector("#ap-note").value }));
      m.close();
      toast("درخواست شما برای «" + J.title + "» ارسال شد ✓");
      renderActions();
    } catch (err) {
      if (err.data && err.data.needResume) { m.close(); setTimeout(() => location.href = P.dashboard + "#resume", 1500); }
    }
  };
}

async function toggleSave() {
  if (!Auth.user) { location.href = loginUrl(); return; }
  const r = await API.post("me/saved", { job_id: J.id });
  toast(r.on ? "آگهی در ذخیره‌شده‌ها قرار گرفت ✓" : "از ذخیره‌شده‌ها حذف شد");
  renderActions();
}
