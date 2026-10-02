document.addEventListener("DOMContentLoaded", () => {
  renderFaq("");
  document.getElementById("faq-q").addEventListener("input", e => renderFaq(e.target.value.trim()));
});

function renderFaq(q) {
  const data = AIO_FAQ.map(c => ({
    cat: c.cat,
    items: c.items.filter(it => !q || it.q.includes(q) || it.a.includes(q))
  })).filter(c => c.items.length);

  document.getElementById("faq-nav").innerHTML = data.map((c, i) =>
    `<a href="#cat-${i}">${c.cat} <span>${fa(c.items.length)}</span></a>`).join("");

  document.getElementById("faq-main").innerHTML = data.length ? data.map((c, i) => `
    <section class="faq-block" id="cat-${i}">
      <h2>${c.cat}</h2>
      ${c.items.map((it, k) => `
        <details class="faq-item" ${q ? "open" : (i === 0 && k === 0 ? "open" : "")}>
          <summary>${it.q}</summary>
          <div class="fa-body">${it.a}</div>
        </details>`).join("")}
    </section>`).join("")
    : `<div class="empty-state"><b>نتیجه‌ای یافت نشد</b>عبارت دیگری را جستجو کنید.</div>`;
}
