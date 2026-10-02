/* مرکز تطبیق هوشمند — فقط کارفرما و مدیر؛ داده‌ها از API (رزومه‌های «آماده به کار» + متقاضیان خودِ کارفرما) */
document.addEventListener("DOMContentLoaded", async () => {
  const host = document.getElementById("talent-center");
  const u = requireLogin("employer");
  if (!u) return;
  if (u.role !== "employer") {
    host.innerHTML = `<div class="empty-state"><b>این بخش ویژه‌ی کارفرمایان و مدیران است</b>برای دیدن پوزیشن‌های مناسب خودتان به <a href="${P.dashboard}#matches">داشبورد کارجو</a> بروید.</div>`;
    return;
  }
  host.innerHTML = '<div class="empty-inline">در حال بارگذاری رزومه‌ها و پوزیشن‌ها…</div>';
  try { await loadTalent(); }
  catch (e) {
    host.innerHTML = e.data && e.data.needPlan
      ? `<div class="empty-state"><b>مرکز تطبیق بخشی از اشتراک بانک رزومه است</b><a class="btn btn-primary" href="${P.employer}#pricing">مشاهده‌ی اشتراک‌ها</a></div>`
      : `<div class="empty-state"><b>بارگذاری نشد</b>${esc(e.message)}</div>`;
    return;
  }
  TalentCenter.mount(host, { saved: TalentSaved, candActions: talentCandActions });
});
