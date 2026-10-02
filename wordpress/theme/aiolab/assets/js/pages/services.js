let activePayer = "all";

document.addEventListener("DOMContentLoaded", () => {
  // اگر از لینک فوتر با #group آمده، همان گروه هدف قرار می‌گیرد
  const hash = location.hash.slice(1);
  const g = hash ? serviceGroup(hash) : null;
  if (g) activePayer = g.payer;

  renderTabs();
  renderStats();
  renderGroups();

  if (g) setTimeout(() => document.getElementById("g-" + g.id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
});

function renderTabs() {
  const tabs = [{ id: "all", short: "همه خدمات", icon: "flask" }].concat(AIO_PAYERS);
  document.getElementById("payer-tabs").innerHTML = tabs.map(p => {
    const n = p.id === "all" ? AIO_SERVICES.length : servicesFor(p.id).length;
    return `<button class="payer-tab ${p.id === activePayer ? "on" : ""}" onclick="setPayer('${p.id}')">
      ${ICONS[p.icon] || ICONS.flask}
      <span>${p.short || p.name}</span>
      <span class="cnt">(${fa(n)})</span>
    </button>`;
  }).join("");
}

function setPayer(id) {
  activePayer = id;
  renderTabs(); renderStats(); renderGroups();
  document.getElementById("svc-groups").scrollIntoView({ behavior: "smooth", block: "start" });
}

function visibleServices() {
  return activePayer === "all" ? AIO_SERVICES : servicesFor(activePayer);
}

function renderStats() {
  const list = visibleServices();
  const priced = list.filter(s => s.price);
  const min = priced.length ? Math.min(...priced.map(s => s.price)) : 0;
  const free = list.filter(s => s.price === 0).length;
  const items = [
    { ic: "briefcase", n: fa(list.length), t: "خدمت قابل ارائه" },
    { ic: "chart",     n: fa(new Set(list.map(s => s.group)).size), t: "جریان درآمدی" },
    { ic: "shield",    n: free ? fa(free) : "—", t: "خدمت رایگان" },
    { ic: "clock",     n: priced.length ? priceShort({ price: min }) : "—", t: "شروع قیمت از" }
  ];
  const tint = [["#ccfbf1","#0f766e"],["#e0f2fe","#0369a1"],["#ede9fe","#6d28d9"],["#fef3c7","#92400e"]];
  document.getElementById("svc-stats").innerHTML = items.map((s, i) => `
    <div class="stat-card">
      <div class="ic" style="background:${tint[i][0]};color:${tint[i][1]}">${ICONS[s.ic]}</div>
      <div><b>${s.n}</b><span>${s.t}</span></div>
    </div>`).join("");
}

function renderGroups() {
  const groups = AIO_SERVICE_GROUPS.filter(g => activePayer === "all" || g.payer === activePayer);
  document.getElementById("svc-groups").innerHTML = groups.map(g => {
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
        <div class="svc-grid">${list.map(s => serviceCardHTML(s)).join("")}</div>
      </div>`;
  }).join("");
}
