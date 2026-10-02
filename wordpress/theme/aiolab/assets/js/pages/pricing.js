let activePayer = "all";

document.addEventListener("DOMContentLoaded", () => {
  renderPlans();
  renderTabs();
  renderTables();
});

/* اشتراک‌های سالانه — R27..R30 */
function planCardHTML(s) {
  return `
    <div class="price-card ${s.highlight ? "featured" : ""}">
      ${s.highlight ? '<span class="plan-badge">پیشنهاد آیولب</span>' : ""}
      <h3>${s.title.replace("اشتراک سالانه ", "")}</h3>
      <div class="price">${fa(s.price)}</div>
      <div class="per">تومان / سالانه</div>
      <ul>${s.features.map(f => `<li>${f}</li>`).join("")}</ul>
      <button class="btn ${s.highlight ? "btn-primary" : "btn-outline"} btn-block"
              onclick="orderService('${s.code}')">انتخاب این اشتراک</button>
    </div>`;
}

function renderPlans() {
  const plans = AIO_SERVICES.filter(s => s.plan);
  document.getElementById("plans-lab").innerHTML =
    plans.filter(s => s.payer === "lab").map(planCardHTML).join("");
  document.getElementById("plans-seeker").innerHTML =
    plans.filter(s => s.payer === "seeker").map(planCardHTML).join("");
}

function renderTabs() {
  const tabs = [{ id: "all", short: "همه", icon: "flask" }].concat(AIO_PAYERS);
  document.getElementById("payer-tabs").innerHTML = tabs.map(p => {
    const n = p.id === "all" ? AIO_SERVICES.length : servicesFor(p.id).length;
    return `<button class="payer-tab ${p.id === activePayer ? "on" : ""}" onclick="setPayer('${p.id}')">
      ${ICONS[p.icon] || ICONS.flask}<span>${p.short || p.name}</span><span class="cnt">(${fa(n)})</span>
    </button>`;
  }).join("");
}

function setPayer(id) { activePayer = id; renderTabs(); renderTables(); }

/* جدول‌ها به تفکیک جریان درآمد */
function renderTables() {
  const groups = AIO_SERVICE_GROUPS.filter(g => activePayer === "all" || g.payer === activePayer);
  document.getElementById("price-tables").innerHTML = groups.map(g => {
    const list = servicesOf(g.id);
    if (!list.length) return "";
    const p = payerMeta(g.payer);
    return `
      <div class="svc-group" id="g-${g.id}">
        <div class="svc-group-head">
          <span class="gh-ic" style="background:${g.bg};color:${g.color}">${ICONS[g.icon] || ICONS.flask}</span>
          <div>
            <h2>${g.name} <span class="chip sm">${p ? p.name : ""}</span></h2>
            <p>${g.desc}</p>
          </div>
        </div>
        <div class="price-table-wrap">
          <table class="price-table">
            <thead><tr>
              <th>کد</th><th>خدمت</th><th>مدل پرداخت</th><th>شرح قیمت‌گذاری</th><th class="ta-c">قیمت</th><th></th>
            </tr></thead>
            <tbody>${list.map(serviceRowHTML).join("")}</tbody>
          </table>
        </div>
      </div>`;
  }).join("");
}

/* درخواست بسته سازمانی → پیام در پیشخوان (نوع «مشاوره») */
async function requestEnterprise(btn) {
  const me = ME();
  if (!me) {
    const m = aioModal(`<h2>درخواست بسته سازمانی</h2>
      <div class="form-field"><label for="en-name">نام مرکز / شخص</label><input id="en-name"></div>
      <div class="form-field"><label for="en-contact">تلفن یا ایمیل</label><input id="en-contact" dir="ltr"></div>
      <div class="modal-actions"><button class="btn btn-primary" id="en-send">ثبت درخواست</button></div>`);
    m.querySelector("#en-send").onclick = async e => {
      await busy(e.target, () => API.post("contact", { kind: "consult", name: m.querySelector("#en-name").value, contact: m.querySelector("#en-contact").value, topic: "بسته سازمانی", message: "درخواست مشاوره برای بسته سازمانی از صفحه تعرفه‌ها." }));
      m.close(); toast("درخواست شما ثبت شد ✓ کارشناسان ما تماس می‌گیرند");
    };
    return;
  }
  await busy(btn, () => API.post("contact", { kind: "consult", name: me.name, contact: me.phone || me.email, topic: "بسته سازمانی", message: "درخواست مشاوره برای بسته سازمانی از صفحه تعرفه‌ها.", role: me.role }));
  toast("درخواست شما ثبت شد ✓ کارشناسان ما تماس می‌گیرند");
}
