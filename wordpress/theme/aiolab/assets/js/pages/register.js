/* ثبت‌نام واقعی: کارجو، داوطلب، کارفرما، تأمین‌کننده — ایمیل + رمز عبور */
let role = "seeker";
const HINTS = {
  seeker: "پرسنل آزمایشگاه که سابقه کاری دارد و دنبال موقعیت جدید است.",
  volunteer: "دانشجو، تازه‌فارغ‌التحصیل یا کسی که می‌خواهد تازه وارد بازار کار آزمایشگاه شود. مسیر شما با کارآموزی، آزمون مهارت و خودارزیابی شروع می‌شود.",
  employer: "آزمایشگاه، بیمارستان، مرکز پژوهشی، تولیدکننده یا توزیع‌کننده تجهیزات که نیرو جذب می‌کند.",
  supplier: "تأمین‌کننده تجهیزات، مواد مصرفی، کیت یا خدمات آزمایشگاهی که می‌خواهد محصول خود را به جامعه آزمایشگاهی معرفی کند."
};

document.addEventListener("DOMContentLoaded", () => {
  if (Auth.user) { location.href = Auth.user.role === "employer" ? P.employer : Auth.user.role === "supplier" ? P.advertise : P.dashboard; return; }
  document.getElementById("prov").innerHTML = `<option value="">استان خود را انتخاب کنید</option>` +
    AIO_PROVINCES.map(p => `<option value="${p.id}">${p.name}</option>`).join("");
  const r = qs("role");
  if (r === "employer" || r === "volunteer" || r === "supplier") setRole(r);
  const alt = document.querySelector('.alt-link a[href="/login/"]');
  if (alt && qs("redirect")) alt.href = P.login + "?redirect=" + encodeURIComponent(qs("redirect"));
});

function setRole(r) {
  role = r;
  ["seeker", "volunteer", "employer", "supplier"].forEach(x =>
    document.getElementById("rb-" + x).classList.toggle("active", x === r));
  const org = r === "employer" || r === "supplier";
  document.getElementById("role-hint").textContent = HINTS[r];
  document.getElementById("name-label").textContent = org
    ? (r === "supplier" ? "نام شرکت" : "نام مرکز / آزمایشگاه") : "نام و نام خانوادگی";
  document.getElementById("name").placeholder = org
    ? (r === "supplier" ? "مثلاً: شرکت زیست‌تجهیز" : "مثلاً: آزمایشگاه نور") : "مثلاً: علی رضایی";
  document.getElementById("f-field").style.display = org ? "block" : "none";
  document.getElementById("f-vol").style.display = r === "volunteer" ? "block" : "none";
}

async function doRegister(e) {
  e.preventDefault();
  const m = document.getElementById("form-msg");
  m.textContent = "";
  const btn = e.target.querySelector("button[type=submit]");
  try {
    const r = await busy(btn, () => API.post("auth/register", {
      role,
      name: document.getElementById("name").value.trim(),
      email: document.getElementById("email").value.trim(),
      phone: document.getElementById("phone").value.trim(),
      password: document.getElementById("pass").value,
      province: document.getElementById("prov").value,
      center_type: document.getElementById("center-type").value,
      vol_status: document.getElementById("vol-status").value,
      redirect: qs("redirect") || ""
    }));
    m.textContent = "حساب شما ساخته شد ✓ در حال انتقال…"; m.className = "form-msg ok";
    location.href = r.redirect;
  } catch (err) { m.textContent = err.message; m.className = "form-msg"; }
}
