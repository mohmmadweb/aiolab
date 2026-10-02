/* ورود با ایمیل (یا نام کاربری/موبایل) و رمز عبور */
let role = "seeker";
document.addEventListener("DOMContentLoaded", () => {
  if (Auth.user) { location.href = qs("redirect") || (Auth.user.role === "employer" ? P.employer : Auth.user.role === "supplier" ? P.advertise : P.dashboard); return; }
  const r = qs("role");
  if (r === "employer" || r === "supplier") setRole(r);
});

function setRole(r) {
  role = r;
  ["seeker", "employer", "supplier"].forEach(x => document.getElementById("rb-" + x).classList.toggle("active", x === r));
  const red = qs("redirect");
  document.getElementById("reg-link").href = P.register + "?" + new URLSearchParams(Object.assign(r === "seeker" ? {} : { role: r }, red ? { redirect: red } : {})).toString();
}

function msg(t, ok) { const m = document.getElementById("form-msg"); if (m) { m.textContent = t || ""; m.className = "form-msg" + (ok ? " ok" : ""); } }

async function doLogin(e) {
  e.preventDefault();
  msg("");
  const btn = e.target.querySelector("button[type=submit]");
  try {
    const r = await busy(btn, () => API.post("auth/login", {
      login: document.getElementById("email").value.trim(),
      password: document.getElementById("pass").value,
      remember: document.getElementById("remember") ? document.getElementById("remember").checked : true,
      redirect: qs("redirect") || ""
    }));
    msg("ورود موفق؛ در حال انتقال…", true);
    location.href = r.redirect;
  } catch (err) { msg(err.message); }
}

async function lostPass(e) {
  e.preventDefault();
  const m = aioModal(`<h2>بازیابی رمز عبور</h2>
    <p class="muted" style="margin-bottom:12px">ایمیل حساب خود را وارد کنید؛ لینک تعیین رمز جدید برایتان ارسال می‌شود.</p>
    <div class="form-field"><label for="lp-mail">ایمیل</label><input id="lp-mail" type="email" dir="ltr" value="${esc(document.getElementById("email").value)}"></div>
    <div class="form-msg" id="lp-msg"></div>
    <div class="modal-actions"><button class="btn btn-ghost" data-x>بستن</button><button class="btn btn-primary" id="lp-send">ارسال لینک</button></div>`);
  m.querySelector("[data-x]").onclick = () => m.close();
  m.querySelector("#lp-send").onclick = async ev => {
    const out = m.querySelector("#lp-msg");
    try {
      const r = await busy(ev.target, () => API.post("auth/lost", { login: m.querySelector("#lp-mail").value.trim() }));
      out.textContent = r.message; out.className = "form-msg ok";
    } catch (err) { out.textContent = err.message; out.className = "form-msg"; }
  };
}
