document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("exam-pricing").innerHTML =
    servicesOf("exam").map(x => serviceCardHTML(x, { cta: "خرید و شرکت در آزمون" })).join("");

  document.getElementById("exam-grid").innerHTML = AIO_EXAMS.map(e => {
    const l = lab(e.authorLabId) || { name: "آیولب" };
    const passed = MyCerts.all().find(c => c.type === "exam" && c.refId === e.id);
    return `<div class="exam-card" style="--ec:${e.color};--ebg:${e.bg}">
      <div class="ex-top">
        <div class="ex-badge">${e.badge}</div>
        <div>
          <h3>${e.title}</h3>
          <div class="ex-by">طراح: ${l.name} ${l.verified ? "✔️" : ""}</div>
        </div>
        ${passed ? '<span class="ex-passed">قبول شده ✓</span>' : ""}
      </div>
      <p class="ex-desc">${e.desc}</p>
      <div class="ex-meta">
        <span>${fa(e.qCount)} سؤال</span>${e.price ? `<span>${fa(e.price)} تومان</span>` : ""}
        <span>${fa(e.duration)} دقیقه</span>
        <span>حد نصاب ${fa(e.passScore)}٪</span>
        <span class="ex-level">${e.level}</span>
      </div>
      <div class="ex-stats">
        <span>👥 ${fa(e.takers)} شرکت‌کننده</span>
        <span>🎖️ ${fa(e.certIssued)} گواهی صادرشده</span>
      </div>
      <a class="btn btn-primary btn-block" href="${e.url}">${passed ? "شرکت مجدد" : "شروع آزمون"}</a>
    </div>`;
  }).join("");

  const certs = MyCerts.all();
  if (certs.length) {
    document.getElementById("my-certs-sec").style.display = "";
    document.getElementById("my-certs").innerHTML = certs.map(c => `
      <div class="cert-card">
        <div class="cc-badge">${c.badge || "🎖️"}</div>
        <b>${c.title}</b>
        <span class="cc-score">نمره: ${fa(c.score)}٪</span>
        <span class="cc-code">کد رهگیری: <a href="${c.verify}" dir="ltr">${c.code}</a></span>
        <span class="cc-date">${c.date}</span>
      </div>`).join("");
  }
});
