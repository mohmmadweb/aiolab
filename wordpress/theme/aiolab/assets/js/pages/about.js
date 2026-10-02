document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("about-verticals").innerHTML = AIO_VERTICALS.map(v =>
    `<span class="chip" style="background:${v.bg};color:${v.color}">${v.name}${v.active ? " ✓" : " · به‌زودی"}</span>`).join("");
});
