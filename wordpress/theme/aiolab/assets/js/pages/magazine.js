let activeCat = "";
document.addEventListener("DOMContentLoaded", () => {
  const cats = ["", ...new Set(AIO_ARTICLES.map(a => a.cat))];
  document.getElementById("cat-filter").innerHTML = cats.map(c =>
    `<button class="btn btn-sm ${c === activeCat ? "btn-primary" : "btn-ghost"}" style="border:1px solid var(--navy-200)" onclick="setCat('${c}')">${c || "همه مطالب"}</button>`).join("");
  render();
});
function setCat(c) { activeCat = c;
  document.querySelectorAll("#cat-filter button").forEach(b => {
    b.className = "btn btn-sm " + ((b.textContent === (c || "همه مطالب")) ? "btn-primary" : "btn-ghost");
    b.style.border = "1px solid var(--navy-200)";
  });
  render();
}
function render() {
  const list = AIO_ARTICLES.filter(a => !activeCat || a.cat === activeCat);
  document.getElementById("articles").innerHTML = list.length ? list.map(a => `
    <a class="content-card" href="${a.url}">
      <div class="thumb" style="background:${a.bg};color:${a.color}">${a.thumb ? `<img src="${a.thumb}" alt="">` : (ICONS[a.icon] || ICONS.doc)}</div>
      <div class="body">
        <span class="cat">${a.cat}</span>
        <h3>${a.title}</h3>
        <div class="meta">${a.time ? `<span>مطالعه ${a.time}</span>` : ""}<span>${a.date}</span></div>
      </div>
    </a>`).join("") : `<p class="muted">مطلبی در این دسته نیست.</p>`;
}
