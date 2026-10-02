/* فرم تماس — ثبت در پیشخوان (پیام‌های تماس) + ایمیل به مدیر */
async function sendContact(e) {
  e.preventDefault();
  const v = id => document.getElementById(id).value.trim();
  const btn = e.submitter || e.target.querySelector("button[type=submit]");
  const r = await busy(btn, () => API.post("contact", { kind: "contact", name: v("ct-name"), contact: v("ct-email"), role: v("ct-role"), topic: v("ct-topic"), message: v("ct-msg") }));
  toast(r.message || "پیام شما ثبت شد ✓");
  e.target.reset();
}
document.addEventListener("DOMContentLoaded", () => {
  const u = ME();
  if (u) { const n = document.getElementById("ct-name"), m = document.getElementById("ct-email"); if (n && !n.value) n.value = u.name; if (m && !m.value) m.value = u.email; }
});
