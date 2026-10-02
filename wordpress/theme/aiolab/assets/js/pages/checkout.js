/* صفحه‌ی پرداخت سفارش */
async function payOrder(id) {
  const btn = document.getElementById("pay-btn");
  const r = await busy(btn, () => API.post("orders/" + id + "/pay"));
  if (r.redirect) { toast("در حال انتقال به درگاه پرداخت…"); location.href = r.redirect; }
  else if (r.manual) { document.getElementById("pay-box").insertAdjacentHTML("afterbegin", `<div class="notice-box info">${esc(r.manual).replace(/\n/g, "<br>")}</div>`); }
}
async function cancelOrderCheckout(id) {
  if (!confirm("این سفارش لغو شود؟")) return;
  const btn = window.event && window.event.target;
  await busy(btn, () => API.post("orders/" + id + "/cancel"));
  toast("سفارش لغو شد");
  setTimeout(() => location.reload(), 800);
}
