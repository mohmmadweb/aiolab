document.addEventListener("DOMContentLoaded", () => {
  // نمونه داده — از داده واقعی مراکز
  const rows = [...AIO_LABS].filter(l => l.avgSalary).sort((a, b) => b.avgSalary - a.avgSalary).slice(0, 8);
  document.getElementById("rep-sample").innerHTML = rows.map(l => `
    <tr>
      <td><b>${l.name}</b></td>
      <td>${l.city}</td>
      <td>${l.type}</td>
      <td class="ta-c"><b>${fa(l.avgSalary)}</b></td>
      <td class="ta-c">${starsHTML(l.rating, "sm")} ${fa(l.rating)}</td>
      <td class="ta-c">${l.avgSalaryUpdated || "—"}</td>
    </tr>`).join("");

  // گزارش‌ها — R25، R26
  document.getElementById("rep-plans").innerHTML =
    servicesOf("report").map(s => serviceCardHTML(s, { cta: "دریافت گزارش" })).join("");

  // مخاطبان
  const aud = [
    { ic: "users",     t: "کارجویان",      d: "پیش از انتخاب رشته، تخصص یا مذاکره حقوق بدانید بازار واقعاً چه می‌گوید." },
    { ic: "building",  t: "آزمایشگاه‌ها",  d: "حقوق پیشنهادی خود را با بازار بسنجید و برای جذب نیرو رقابتی بمانید." },
    { ic: "grad",      t: "دانشگاه‌ها",    d: "ظرفیت پذیرش و سرفصل‌ها را با تقاضای واقعی بازار کار هماهنگ کنید." },
    { ic: "machine",   t: "تأمین‌کنندگان", d: "رشد و افول هر تخصص را ببینید و بازار هدف محصولات خود را دقیق‌تر بشناسید." }
  ];
  document.getElementById("rep-audience").innerHTML = aud.map(a => `
    <div class="report-card">
      <div class="rc-ic">${ICONS[a.ic]}</div>
      <h3>${a.t}</h3>
      <p>${a.d}</p>
    </div>`).join("");
});
