const METRICS = ["salary", "environment", "learning", "management", "worklife"];

document.addEventListener("DOMContentLoaded", () => {
  bindProvinceCity("r-prov", "r-city", render);
  document.getElementById("r-sector").insertAdjacentHTML("beforeend",
    AIO_SECTORS.map(s => `<option value="${s.id}">${s.name}</option>`).join(""));
  document.getElementById("r-kind").insertAdjacentHTML("beforeend",
    AIO_ORG_KINDS.map(s => `<option value="${s.id}">${s.name}</option>`).join(""));
  document.querySelectorAll(".lab-filters select").forEach(el => el.addEventListener("change", render));
  render();
});

function render() {
  const prov = document.getElementById("r-prov").value;
  const city = document.getElementById("r-city").value;
  const sector = document.getElementById("r-sector").value;
  const kind = document.getElementById("r-kind").value;
  const metric = document.getElementById("r-metric").value;

  let list = AIO_LABS.filter(l =>
    (!prov || l.provinceId === prov) && (!city || l.city === city) &&
    (!sector || l.sector === sector) && (!kind || l.orgKind === kind));

  list.sort((a, b) => {
    if (metric === "total") return labScore(b) - labScore(a);
    if (metric === "avgSalary") return b.avgSalary - a.avgSalary;
    return b.ratingBreakdown[metric] - a.ratingBreakdown[metric];
  });

  document.getElementById("rank-body").innerHTML = list.map((l, i) => {
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : fa(i + 1);
    const low = l.ratingCount < 10;
    return `<tr>
      <td class="rk">${medal}</td>
      <td class="rl">
        <a href="/lab/${l.id}/">
          <span class="job-logo sm" style="background:${l.color}">${l.name.replace("آزمایشگاه ", "").replace("شرکت ", "").charAt(0)}</span>
          <b>${l.name}</b> ${l.verified ? "✔️" : ""}
          ${low ? '<i class="low-data">داده کم</i>' : ""}
        </a>
      </td>
      <td>${l.city}</td>
      <td><span class="tiny-chip">${sectorName(l.sector)}</span></td>
      <td class="score"><b>${fa(labScore(l))}</b>${starsHTML(l.rating, "sm")}</td>
      ${METRICS.map(m => `<td class="${metric === m ? "hl" : ""}">${fa(l.ratingBreakdown[m])}</td>`).join("")}
      <td class="${metric === "avgSalary" ? "hl" : ""}"><b>${fa(l.avgSalary)}</b> م.ت</td>
      <td>${fa(l.ratingCount)}</td>
    </tr>`;
  }).join("");
}

function rateFlow() {
  if (!Auth.user) { toast("برای ثبت نظر ابتدا وارد شوید"); setTimeout(() => location.href = loginUrl(), 1200); return; }
  document.getElementById("rm-lab").innerHTML = AIO_LABS.map(l => `<option value="${l.id}">${l.name}</option>`).join("");
  document.getElementById("rm-stars").innerHTML = [
    ["salary", "حقوق و مزایا"], ["environment", "محیط کاری"], ["learning", "یادگیری و آموزش"],
    ["management", "مدیریت"], ["worklife", "تعادل کار و زندگی"]
  ].map(([id, label]) => `
    <div class="rate-row">
      <span>${label}</span>
      <div class="rate-stars" data-metric="${id}">
        ${[1,2,3,4,5].map(v => `<button onclick="pickStar('${id}',${v},this)">★</button>`).join("")}
      </div>
    </div>`).join("");
  document.getElementById("rate-modal").style.display = "flex";
}

const myRating = {};
function pickStar(metric, v, el) {
  myRating[metric] = v;
  [...el.parentElement.children].forEach((b, i) => b.classList.toggle("on", i < v));
}

async function submitRate(btn) {
  if (Object.keys(myRating).length < 5) { toast("لطفاً به هر پنج شاخص امتیاز بدهید"); return; }
  const v = id => document.getElementById(id).value.trim();
  const r = await busy(btn, () => API.post("labs/" + v("rm-lab") + "/review", { breakdown: myRating, role: v("rm-role"), pros: v("rm-pros"), cons: v("rm-cons"), text: v("rm-text") }));
  document.getElementById("rate-modal").style.display = "none";
  ["rm-pros", "rm-cons", "rm-text"].forEach(id => document.getElementById(id).value = "");
  toast(r.approved ? "نظر شما ثبت و منتشر شد ✓" : "نظر شما ثبت شد ✓ پس از بازبینی، به‌صورت ناشناس منتشر می‌شود");
}

/* باز کردن مستقیم فرم نظر از صفحه‌ی مرکز: /ranking/?rate=ID */
document.addEventListener("DOMContentLoaded", () => {
  const id = new URLSearchParams(location.search).get("rate");
  if (id && Auth.user) { rateFlow(); document.getElementById("rm-lab").value = id; }
  else if (id) rateFlow();
});
