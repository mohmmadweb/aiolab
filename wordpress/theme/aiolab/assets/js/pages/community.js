/* جامعه آزمایشگاهی — پست، پسند، دیدگاه و عضویت در گروه‌ها روی سرور */
let POSTS = [];
document.addEventListener("DOMContentLoaded", () => {
  const u = Auth.user;
  if (u) document.getElementById("me-avatar").textContent = u.name.charAt(0);
  POSTS = [...AIO_POSTS];
  renderFeed();
  renderGroups();
  /* اعضای فعال: نویسندگان پست‌های اخیر */
  const seen = new Set(), people = [];
  POSTS.forEach(p => { if (!seen.has(p.author) && (!u || p.author !== u.name)) { seen.add(p.author); people.push(p); } });
  document.getElementById("people").innerHTML = people.slice(0, 5).map(p => `
    <div style="display:flex;gap:10px;align-items:center;padding:9px 0;border-bottom:1px dashed var(--navy-100)">
      <div style="width:38px;height:38px;border-radius:50%;background:${p.color};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px">${esc(p.author.charAt(0))}</div>
      <div style="flex:1"><b style="font-size:13.5px;color:var(--navy-900)">${esc(p.author)}</b><div style="font-size:12px;color:var(--navy-400)">${esc(p.role)}</div></div>
      <a class="btn btn-ghost btn-sm" style="color:var(--teal-700)" href="#post-${p.id}">پست‌ها</a>
    </div>`).join("") || `<p class="muted">هنوز عضوی پست نگذاشته است.</p>`;
  if (location.hash.startsWith("#post-")) setTimeout(() => { const el = document.querySelector(location.hash); if (el) el.scrollIntoView({ block: "center" }); }, 300);
});

function renderGroups() {
  const mine = (ME() && ME().groups) || [];
  const groups = [...AIO_DEPARTMENTS.map(d => d.name + " — گفت‌وگوی تخصصی"), "تازه‌کارهای آزمایشگاه", "بحث تجهیزات و LIS"].slice(0, 6);
  document.getElementById("groups").innerHTML = groups.map(n => {
    const on = mine.includes(n);
    return `<div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px dashed var(--navy-100)">
      <div><b style="font-size:13.5px;color:var(--navy-900)">${esc(n)}</b>${on ? `<div style="font-size:12px;color:var(--teal-700)">عضو هستید</div>` : ""}</div>
      <button class="btn ${on ? "btn-ghost" : "btn-outline"} btn-sm" onclick="joinGroup(this, '${esc(n)}')">${on ? "خروج" : "عضویت"}</button>
    </div>`;
  }).join("");
}
async function joinGroup(btn, name) {
  if (!Auth.user) { location.href = loginUrl(); return; }
  const r = await busy(btn, () => API.post("me/groups", { group: name }));
  toast(r.on ? "به گروه پیوستید ✓" : "از گروه خارج شدید");
  renderGroups();
}

function renderFeed() {
  const liked = (ME() && ME().likes) || [];
  document.getElementById("feed").innerHTML = POSTS.length ? POSTS.map(p => `
    <div class="post-card" id="post-${p.id}">
      <div class="author">
        <div class="avatar" style="background:${p.color}">${esc(p.author.charAt(0))}</div>
        <div><b>${esc(p.author)}</b><span>${esc(p.role)} · ${p.time}</span></div>
      </div>
      <div class="body"><p>${esc(p.text).replace(/\n/g, "<br>")}</p></div>
      <div class="actions">
        <button class="${liked.includes(p.id) ? "liked" : ""}" onclick="likePost(this, ${p.id})">${ICONS.heart} <span>${fa(p.likes)}</span></button>
        <button onclick="toggleComments(${p.id}, this)">${ICONS.comment} <span>${fa(p.comments)}</span></button>
        <button onclick="sharePost(${p.id})">${ICONS.share} <span>اشتراک</span></button>
      </div>
      <div class="post-comments" id="pc-${p.id}" style="display:none"></div>
    </div>`).join("") : `<div class="empty-state"><b>هنوز پستی منتشر نشده</b>اولین نفری باشید که تجربه‌اش را می‌نویسد.</div>`;
}

async function likePost(btn, id) {
  if (!Auth.user) { toast("برای پسندیدن ابتدا وارد شوید"); setTimeout(() => location.href = loginUrl(), 1000); return; }
  const r = await busy(btn, () => API.post("community/" + id + "/like"));
  btn.classList.toggle("liked", r.on);
  btn.querySelector("span").textContent = fa(r.likes);
  const m = ME(); if (m) { m.likes = r.on ? [...m.likes, id] : m.likes.filter(x => x !== id); }
}

async function toggleComments(id, btn) {
  const box = document.getElementById("pc-" + id);
  if (box.style.display !== "none") { box.style.display = "none"; return; }
  box.style.display = "";
  box.innerHTML = `<p class="muted" style="padding:8px 0">در حال بارگذاری…</p>`;
  const r = await API.get("community/" + id + "/comments");
  box.innerHTML = r.comments.map(c => `<div style="padding:8px 0;border-top:1px dashed var(--navy-100);font-size:13.5px"><b>${esc(c.author)}</b> <small class="muted">${c.time}</small><div>${esc(c.text)}</div></div>`).join("")
    + (Auth.user ? `<div style="display:flex;gap:8px;margin-top:8px"><input id="ci-${id}" placeholder="دیدگاه شما…" maxlength="1000" style="flex:1;padding:8px 12px;border:1.5px solid var(--navy-200);border-radius:9px">
        <button class="btn btn-primary btn-sm" onclick="sendComment(${id}, this)">ارسال</button></div>`
      : `<p class="muted" style="padding:8px 0"><a href="${loginUrl()}">وارد شوید</a> تا دیدگاه بنویسید.</p>`);
}
async function sendComment(id, btn) {
  const inp = document.getElementById("ci-" + id);
  const r = await busy(btn, () => API.post("community/" + id + "/comments", { text: inp.value }));
  toast(r.approved ? "دیدگاه شما ثبت شد ✓" : "دیدگاه شما پس از بازبینی نمایش داده می‌شود");
  const p = POSTS.find(x => x.id === id); if (p && r.approved) p.comments++;
  document.getElementById("pc-" + id).style.display = "none";
  toggleComments(id);
}
function sharePost(id) {
  const url = location.origin + location.pathname + "#post-" + id;
  if (navigator.share) navigator.share({ url }).catch(() => {});
  else if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => toast("لینک پست کپی شد ✓"));
}

async function publishPost() {
  const u = Auth.user;
  if (!u) { location.href = loginUrl(); return; }
  const ta = document.getElementById("new-post"), txt = ta.value.trim();
  if (txt.length < 5) { toast("متنی بنویسید!"); return; }
  const btn = document.querySelector('[onclick="publishPost()"]');
  const r = await busy(btn, () => API.post("community", { text: txt }));
  ta.value = "";
  if (r.post) { POSTS.unshift(r.post); renderFeed(); toast("پست شما منتشر شد ✓"); }
  else toast("پست شما ثبت شد و پس از بازبینی منتشر می‌شود ✓");
}
