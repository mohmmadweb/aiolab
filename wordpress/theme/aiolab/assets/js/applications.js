/* ==========================================
   آیولب — فرایند کامل استخدام داخل سایت
   کارفرما: داشبورد آگهی (KPI، روند روزانه، توزیع تطبیق، فیلتر، آستانه‌ی نامرتبط) + پنجره‌ی درخواست با اقدام‌ها
   کارجو: پنجره‌ی درخواست با پاسخ به دعوت/مصاحبه/پیشنهاد، انصراف، گفتگو و تاریخچه
   ========================================== */
const AppUI = (() => {
  const e = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const STEPS = ["sent", "seen", "review", "interview", "offer", "accepted"];
  const CLOSED = ["accepted", "rejected", "withdrawn"];
  const ST = () => (typeof AIO_APP_STATUSES !== "undefined" ? AIO_APP_STATUSES : {});
  const CH = { apply: "درخواست از سایت", invite: "دعوت از مرکز تطبیق" };
  const FITN = { high: "بالا", mid: "متوسط", low: "پایین", none: "نامرتبط" };
  const W = () => (typeof AIO_MATCH_WEIGHTS !== "undefined" ? AIO_MATCH_WEIGHTS : { thresholdIrrelevant: 30, high: 75, mid: 55 });
  const jdate = ts => new Date(ts * 1000).toLocaleDateString("fa-IR", { day: "numeric", month: "long" });
  const statusChip = a => `<span class="status ${e(a.status)}">${e(ST()[a.status] || a.statusText || a.status)}</span>`;

  /** کاری که از کارجو یا کارفرما منتظر است */
  function needs(a, side) {
    if (side === "seeker") {
      if (a.status === "invited") return "پاسخ به دعوت";
      if (a.status === "interview" && a.interview && a.interview.response === "pending") return "تأیید زمان مصاحبه";
      if (a.status === "offer" && a.offer && a.offer.response === "pending") return "پاسخ به پیشنهاد";
      return "";
    }
    if (a.status === "sent") return "بررسی نشده";
    if (a.status === "interview" && a.interview && a.interview.response === "reschedule") return "درخواست تغییر زمان";
    return "";
  }

  /* ---------------- پنجره ---------------- */
  function modal() {
    let d = document.getElementById("app-modal");
    if (!d) {
      d = document.createElement("div");
      d.id = "app-modal"; d.className = "tl-backdrop";
      d.innerHTML = '<div class="tl-dialog" role="dialog" aria-modal="true"><button class="x" type="button" aria-label="بستن">✕</button><div class="tl-body"></div></div>';
      d.addEventListener("click", ev => { if (ev.target === d || ev.target.closest(".tl-dialog > .x")) close(); });
      document.addEventListener("keydown", ev => { if (ev.key === "Escape" && d.classList.contains("open")) close(); });
      document.body.appendChild(d);
    }
    return d;
  }
  let onClose = null;
  function close() { const d = document.getElementById("app-modal"); if (d) d.classList.remove("open"); document.body.classList.remove("modal-open"); if (onClose) onClose(); }

  /* ---------------- پنجره‌ی یک درخواست ---------------- */
  let cur = null, curTab = "status", refresh = null;
  async function open(id, side, onChange) {
    refresh = onChange || null;
    const d = modal();
    d.querySelector(".tl-body").innerHTML = '<div class="empty-inline">در حال بارگذاری…</div>';
    d.classList.add("open"); document.body.classList.add("modal-open");
    onClose = () => { if (refresh) refresh(); };
    try { cur = (await API.get("applications/" + id)).app; }
    catch (err) { d.querySelector(".tl-body").innerHTML = `<div class="notice-box err">${e(err.message)}</div>`; return; }
    curTab = cur.unread ? "chat" : "status";
    draw();
  }

  function head() {
    const a = cur, j = a.jobItem || {};
    if (a.side === "employer") {
      const c = a.candidate;
      const m = c && j.req ? AioMatch.score(c, j) : null;
      return `<div class="cd-head"><div class="avatar" style="background:${e(a.color || "#0d9488")}">${e((a.name || "؟").charAt(0))}</div>
        <div><h2>${e(a.name)}</h2><p>${e(c ? TUI.candSummary(c) : a.title || "")}</p>
        <div class="job-meta"><span class="chip">${e(a.job)}</span><span class="chip">${e(CH[a.channel] || "")}</span><span class="chip">${e(a.date)}</span>${statusChip(a)}</div></div>
        ${m ? TUI.ring(m, 72) : `<div class="mring" style="--p:${a.match};--sz:72px"><i>${fa(a.match)}٪</i></div>`}</div>`;
    }
    const cv = ME() && ME().cv && ME().cv.skills && ME().cv.skills.length ? ME().cv : null;
    const m = cv && j.req ? AioMatch.score(cv, j) : null;
    return `<div class="cd-head"><div class="avatar" style="background:var(--teal-600)">${e((a.lab || a.job || "؟").charAt(0))}</div>
      <div><h2>${e(a.job)}</h2><p>${e(a.lab || "")}${j.city ? " · " + e(j.city) : ""}</p><div class="job-meta">${statusChip(a)}<span class="chip">${e(a.date)}</span></div></div>
      ${m ? TUI.ring(m, 72) : ""}</div>`;
  }

  function steps() {
    const a = cur;
    if (a.status === "invited") return `<div class="app-steps"><span class="done">دعوت کارفرما</span><span>پاسخ کارجو</span><span>فهرست کوتاه</span><span>مصاحبه</span><span>پیشنهاد</span><span>استخدام</span></div>`;
    const reached = Math.max(0, STEPS.indexOf(a.status));
    const hist = (a.history || []).map(h => h.status).filter(Boolean);
    const maxDone = Math.max(reached, ...hist.map(s => STEPS.indexOf(s)));
    const bad = a.status === "rejected" || a.status === "withdrawn";
    return `<div class="app-steps">${STEPS.map((s, i) => `<span class="${i <= maxDone ? "done" : ""} ${bad && i === maxDone ? "bad" : ""}">${e(ST()[s])}</span>`).join("")}
      ${bad ? `<span class="done bad">${e(ST()[a.status])}</span>` : ""}</div>`;
  }

  /* زمان مصاحبه همان‌طور که کارفرما (به وقت تهران) وارد کرده — مستقل از منطقه‌ی زمانی مرورگر */
  function ivWhen(iv) {
    if (!iv.at) return "";
    const [y, m, d] = iv.at.slice(0, 10).split("-").map(Number);
    const wd = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"][new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
    return `${wd} ${AioDate.toJ(iv.at.slice(0, 10), false).replace(/\//g, "/")} — ساعت ${fa(iv.at.slice(11, 16))}`;
  }
  function cards() {
    const a = cur, out = [];
    const iv = a.interview, of = a.offer;
    const resp = { pending: "منتظر پاسخ کارجو", confirm: "✅ تأیید شد", decline: "❌ نمی‌آید", reschedule: "🔁 درخواست زمان دیگر" };
    if (iv && ["interview", "offer", "accepted"].includes(a.status) || (iv && a.history && a.status === "withdrawn")) {
      out.push(`<div class="app-card teal"><b>🗓 مصاحبه:</b> ${e(ivWhen(iv))}<br>
        <b>نوع:</b> ${e(iv.mode)}${iv.place ? ` · <b>${iv.mode === "حضوری" ? "نشانی" : "لینک"}:</b> ${/^https:\/\//.test(iv.place) ? `<a href="${e(iv.place)}" target="_blank" rel="noopener" dir="ltr">${e(iv.place)}</a>` : e(iv.place)}` : ""}
        ${iv.note ? `<br><b>توضیح:</b> ${e(iv.note)}` : ""}<br><b>وضعیت:</b> ${e(resp[iv.response] || "")}${iv.responseNote ? " — " + e(iv.responseNote) : ""}</div>`);
    }
    if (of && ["offer", "accepted"].includes(a.status)) {
      out.push(`<div class="app-card amber"><b>💼 پیشنهاد همکاری:</b> حقوق ${fa(of.salary)} میلیون تومان · شروع ${e(AioDate.toJ(of.start, false))}
        ${of.note ? `<br><b>توضیح:</b> ${e(of.note)}` : ""}<br><b>وضعیت:</b> ${e(resp[of.response] || "")}${of.responseNote ? " — " + e(of.responseNote) : ""}</div>`);
    }
    if (a.status === "rejected" && a.rejectReason) out.push(`<div class="app-card"><b>دلیل:</b> ${e(a.rejectReason)}</div>`);
    if (a.side === "employer") {
      const ct = a.contact || {};
      out.push(`<div class="app-card"><b>📞 تماس:</b> ${ct.phone ? `<a href="tel:${e(ct.phone)}" dir="ltr">${e(ct.phone)}</a>` : "—"} · ${ct.email ? `<a href="mailto:${e(ct.email)}" dir="ltr">${e(ct.email)}</a>` : "—"}
        ${ct.file ? ` · <a href="${e(ct.file)}" target="_blank" rel="noopener">فایل رزومه</a>` : ""}${a.note ? `<br><b>پیام همراه درخواست:</b> ${e(a.note)}` : ""}</div>`);
    } else {
      const L = (typeof lab === "function" && lab(a.labId)) || {};
      if (L.phone || L.email) out.push(`<div class="app-card"><b>📞 تماس با ${e(L.name || "کارفرما")}:</b> ${L.phone ? `<a href="tel:${e(L.phone)}" dir="ltr">${e(L.phone)}</a>` : ""} ${L.email ? ` · <a href="mailto:${e(L.email)}" dir="ltr">${e(L.email)}</a>` : ""}</div>`);
    }
    return out.join("");
  }

  function actions() {
    const a = cur;
    if (CLOSED.includes(a.status)) return `<p class="muted" style="margin-top:10px">این درخواست بسته شده است${a.status === "accepted" ? " — تبریک! 🎉" : ""}.</p>`;
    const b = (act, label, cls) => `<button type="button" class="btn btn-sm ${cls || "btn-outline"}" data-act="${act}">${label}</button>`;
    if (a.side === "employer") {
      if (a.status === "invited") return `<p class="muted" style="margin-top:10px">منتظر پاسخ کارجو به دعوت شما. می‌توانید در «گفتگو» پیام بدهید.</p>`;
      return `<div class="app-actions">${!["review", "interview", "offer"].includes(a.status) ? b("review", "افزودن به فهرست کوتاه") : ""}
        ${b("interview", a.status === "interview" ? "تغییر زمان مصاحبه" : "دعوت به مصاحبه", "btn-primary")}
        ${b("offer", a.status === "offer" ? "ویرایش پیشنهاد" : "پیشنهاد همکاری")}
        ${["interview", "offer"].includes(a.status) ? b("accepted", "استخدام شد ✓") : ""}
        ${b("reject", "رد درخواست", "btn-ghost danger")}</div><div data-form></div>`;
    }
    const iv = a.interview, of = a.offer, out = [];
    if (a.status === "invited") out.push(b("invite:confirm", "علاقه‌مندم ✓", "btn-primary"), b("invite:decline", "علاقه‌ای ندارم", "btn-ghost"));
    if (a.status === "interview" && iv && iv.response !== "confirm") out.push(b("interview:confirm", "تأیید زمان مصاحبه ✓", "btn-primary"), b("interview:reschedule", "درخواست زمان دیگر"), b("interview:decline", "شرکت نمی‌کنم", "btn-ghost"));
    if (a.status === "offer" && of && of.response === "pending") out.push(b("offer:confirm", "پیشنهاد را می‌پذیرم ✓", "btn-primary"), b("offer:decline", "نمی‌پذیرم", "btn-ghost"));
    out.push(b("withdraw", "انصراف از درخواست", "btn-ghost danger"));
    return `<div class="app-actions">${out.join("")}</div><div data-form></div>`;
  }

  function tabResume() {
    const a = cur, j = a.jobItem || {};
    if (a.side === "employer") {
      if (!a.candidate) return `<div class="empty-inline">کارجو هنوز رزومه‌ی آیتمی ندارد.</div>${a.resume && a.resume.summary ? `<p>${e(a.resume.summary)}</p>` : ""}`;
      const m = j.req ? AioMatch.score(a.candidate, j) : null;
      return TUI.candDetail(a.candidate, m);
    }
    const cv = ME() && ME().cv && ME().cv.skills && ME().cv.skills.length ? ME().cv : null;
    return `${j.desc ? `<h3>شرح موقعیت</h3><p style="line-height:2">${e(j.desc)}</p>` : ""}
      ${j.req && cv ? `<h3>تطبیق رزومه‌ی شما</h3>${TUI.breakdown(AioMatch.score(cv, j))}` : ""}
      ${j.url ? `<div class="app-actions"><a class="btn btn-sm btn-outline" href="${e(j.url)}" target="_blank">صفحه‌ی آگهی</a></div>` : ""}`;
  }

  function tabChat() {
    const a = cur;
    return `<div class="chat">${(a.messages || []).map(m => `<div class="msg ${m.from === a.side ? "me" : "them"}">${e(m.text)}<small>${e(m.time)}</small></div>`).join("") || '<div class="empty-inline">هنوز پیامی رد و بدل نشده است.</div>'}</div>
      ${CLOSED.includes(a.status) && a.status !== "accepted" ? "" : `<div class="chat-box"><textarea data-chat maxlength="1500" placeholder="پیام خود را بنویسید…"></textarea><button type="button" class="btn btn-primary" data-act="send">ارسال</button></div>`}`;
  }

  function tabHistory() {
    return `<ul class="timeline-list">${(cur.history || []).slice().reverse().map(h => `<li class="${e(h.by)}">${e(h.text)}<small>${e(h.time)} · ${h.by === "employer" ? "کارفرما" : h.by === "seeker" ? "کارجو" : "سیستم"}</small></li>`).join("") || '<li>—</li>'}</ul>`;
  }

  function draw() {
    const body = document.querySelector("#app-modal .tl-body");
    const unread = (cur.messages || []).filter(m => m.from !== cur.side && !m.read).length;
    body.innerHTML = head() + steps() + `<div class="app-tabs">
        <button type="button" data-tab="status" class="${curTab === "status" ? "on" : ""}">وضعیت و اقدام</button>
        <button type="button" data-tab="resume" class="${curTab === "resume" ? "on" : ""}">${cur.side === "employer" ? "رزومه و تطبیق" : "آگهی و تطبیق"}</button>
        <button type="button" data-tab="chat" class="${curTab === "chat" ? "on" : ""}">گفتگو${(cur.messages || []).length ? ` (${fa(cur.messages.length)})` : ""}${unread ? '<span class="badge-dot">•</span>' : ""}</button>
        <button type="button" data-tab="history" class="${curTab === "history" ? "on" : ""}">تاریخچه</button></div>
      <div data-pane>${curTab === "status" ? cards() + actions() : curTab === "resume" ? tabResume() : curTab === "chat" ? tabChat() : tabHistory()}</div>`;
    const dup = body.querySelector("[data-pane] > .cd-head"); if (dup) dup.remove(); /* سربرگ تکراری رزومه */
    body.querySelectorAll("[data-tab]").forEach(t => t.onclick = () => { curTab = t.dataset.tab; draw(); });
    body.onclick = onAct;
    const chat = body.querySelector(".chat"); if (chat) chat.scrollTop = chat.scrollHeight;
  }

  /* فرم‌های اقدام کارفرما */
  const times = () => { const o = []; for (let h = 7; h <= 21; h++) for (const m of ["00", "30"]) o.push(`${String(h).padStart(2, "0")}:${m}`); return o; };
  function formHTML(kind) {
    const a = cur, iv = a.interview || {}, of = a.offer || {};
    if (kind === "interview") return `<div class="app-form"><b>دعوت به مصاحبه</b><div class="form-grid">
        <div class="form-field"><label>تاریخ *</label><span data-date="iv">${TUI.fullDate({ value: iv.at ? iv.at.slice(0, 10) : "", back: 0, minAge: -1 })}</span></div>
        <div class="form-field"><label>ساعت *</label><select data-f="time">${times().map(t => `<option ${iv.at && iv.at.slice(11, 16) === t ? "selected" : t === "10:00" ? "selected" : ""}>${t}</option>`).join("")}</select></div>
        <div class="form-field"><label>نوع مصاحبه</label><select data-f="mode">${AIO_INTERVIEW_MODES.map(m => `<option ${iv.mode === m ? "selected" : ""}>${e(m)}</option>`).join("")}</select></div>
        <div class="form-field"><label>نشانی یا لینک جلسه</label><input type="text" data-f="place" maxlength="300" value="${e(iv.place || (lab(a.labId) || {}).address || "")}"></div>
        <div class="form-field full"><label>توضیح برای کارجو (اختیاری)</label><textarea data-f="note" rows="2" maxlength="1000">${e(iv.note || "")}</textarea></div></div>
        <button type="button" class="btn btn-primary btn-sm" data-act="send-interview">ارسال دعوت</button> <button type="button" class="btn btn-ghost btn-sm" data-act="cancel">انصراف</button></div>`;
    if (kind === "offer") return `<div class="app-form"><b>پیشنهاد همکاری</b><div class="form-grid">
        <div class="form-field"><label>حقوق ماهانه (میلیون تومان) *</label><input type="number" min="1" step="0.5" data-f="salary" value="${e(of.salary || (a.jobItem || {}).salaryMax || "")}"></div>
        <div class="form-field"><label>تاریخ شروع *</label><span data-date="of">${TUI.fullDate({ value: of.start || "", back: 0, minAge: -1 })}</span></div>
        <div class="form-field full"><label>توضیح (مزایا، ساعت کاری، …)</label><textarea data-f="note" rows="2" maxlength="1000">${e(of.note || "")}</textarea></div></div>
        <button type="button" class="btn btn-primary btn-sm" data-act="send-offer">ارسال پیشنهاد</button> <button type="button" class="btn btn-ghost btn-sm" data-act="cancel">انصراف</button></div>`;
    if (kind === "reject") return `<div class="app-form"><b>رد درخواست</b><div class="form-grid">
        <div class="form-field full"><label>دلیل *</label><select data-f="reason"><option value="">انتخاب کنید</option>${AIO_REJECT_REASONS.map(r => `<option>${e(r)}</option>`).join("")}</select></div>
        <div class="form-field full"><label>پیام محترمانه برای کارجو (اختیاری)</label><textarea data-f="note" rows="2" maxlength="1000"></textarea></div></div>
        <button type="button" class="btn btn-primary btn-sm" data-act="send-reject">ثبت و اطلاع به کارجو</button> <button type="button" class="btn btn-ghost btn-sm" data-act="cancel">انصراف</button></div>`;
    const prompts = { "interview:reschedule": ["زمان‌های مناسب شما", "مثلاً: یکشنبه یا دوشنبه بعدازظهر"], "withdraw": ["دلیل انصراف (اختیاری)", ""], "interview:decline": ["توضیح (اختیاری)", ""], "offer:decline": ["دلیل (اختیاری)", ""], "invite:decline": ["توضیح (اختیاری)", ""] };
    const p = prompts[kind];
    return `<div class="app-form"><div class="form-field full"><label>${p[0]}</label><textarea data-f="note" rows="2" maxlength="600" placeholder="${e(p[1])}"></textarea></div>
      <button type="button" class="btn btn-primary btn-sm" data-act="confirm-${kind}">ثبت</button> <button type="button" class="btn btn-ghost btn-sm" data-act="cancel">انصراف</button></div>`;
  }

  async function run(btn, path, body) {
    try {
      const r = await busy(btn, () => API.post(path, body));
      cur = r.app; draw(); return true;
    } catch (_) { return false; }
  }

  async function onAct(ev) {
    const btn = ev.target.closest("[data-act]"); if (!btn) return;
    const act = btn.dataset.act, a = cur, box = document.querySelector("#app-modal [data-form]");
    const v = k => { const el = document.querySelector(`#app-modal [data-f="${k}"]`); return el ? el.value.trim() : ""; };
    if (act === "cancel") { box.innerHTML = ""; return; }
    if (act === "send") {
      const ta = document.querySelector("#app-modal [data-chat]");
      if (!ta.value.trim()) return toast("متن پیام را بنویسید");
      if (await run(btn, `applications/${a.id}/message`, { text: ta.value })) { curTab = "chat"; draw(); }
      return;
    }
    if (a.side === "employer") {
      if (act === "review" || act === "accepted") {
        if (act === "accepted" && !confirm("استخدام قطعی ثبت و به کارجو اطلاع داده شود؟")) return;
        if (await run(btn, `applications/${a.id}/action`, { status: act })) toast(act === "accepted" ? "استخدام ثبت شد 🎉" : "به فهرست کوتاه اضافه شد ✓");
        return;
      }
      if (["interview", "offer", "reject"].includes(act)) { box.innerHTML = formHTML(act); box.scrollIntoView({ behavior: "smooth", block: "nearest" }); return; }
      if (act === "send-interview") {
        const d = TUI.dateVal(document.querySelector('#app-modal [data-date="iv"] .tui-date'));
        if (!d) return toast("تاریخ مصاحبه را کامل انتخاب کنید");
        if (await run(btn, `applications/${a.id}/action`, { status: "interview", note: v("note"), interview: { at: d + "T" + v("time"), mode: v("mode"), place: v("place") } })) toast("دعوت به مصاحبه ارسال شد ✓ کارجو با ایمیل و اعلان باخبر شد");
        return;
      }
      if (act === "send-offer") {
        const d = TUI.dateVal(document.querySelector('#app-modal [data-date="of"] .tui-date'));
        if (!d) return toast("تاریخ شروع را انتخاب کنید");
        if (await run(btn, `applications/${a.id}/action`, { status: "offer", note: v("note"), offer: { salary: v("salary"), start: d } })) toast("پیشنهاد همکاری ارسال شد ✓");
        return;
      }
      if (act === "send-reject") {
        if (!v("reason")) return toast("دلیل رد را انتخاب کنید");
        if (await run(btn, `applications/${a.id}/action`, { status: "rejected", reason: v("reason"), note: v("note") })) toast("درخواست رد شد و دلیل به کارجو اعلام شد");
        return;
      }
    }
    /* کارجو */
    const quick = { "invite:confirm": 1, "interview:confirm": 1, "offer:confirm": 1 };
    if (quick[act]) {
      const [kind, answer] = act.split(":");
      if (await run(btn, `applications/${a.id}/respond`, { kind, answer })) toast("پاسخ شما ثبت و به کارفرما اطلاع داده شد ✓");
      return;
    }
    if (["interview:reschedule", "interview:decline", "offer:decline", "invite:decline", "withdraw"].includes(act)) { box.innerHTML = formHTML(act); return; }
    if (act.startsWith("confirm-")) {
      const k = act.slice(8);
      if (k === "withdraw") {
        if (!confirm("از این درخواست انصراف می‌دهید؟ قابل بازگشت نیست.")) return;
        if (await run(btn, `applications/${a.id}/withdraw`, { note: v("note") })) toast("انصراف ثبت شد");
        return;
      }
      const [kind, answer] = k.split(":");
      if (answer === "reschedule" && v("note").length < 5) return toast("زمان‌های پیشنهادی خود را بنویسید");
      if (await run(btn, `applications/${a.id}/respond`, { kind, answer, note: v("note") })) toast("پاسخ شما ثبت شد ✓");
    }
  }

  /* ---------------- داشبورد درخواست‌های کارفرما (به سبک ATS) ---------------- */
  const S = { job: "", fit: "", status: "", channel: "", irr: false, page: 0, per: 10 };
  function employer(host) {
    const me = ME() || {}, jobs = me.jobs || [], all = me.applicants || [];
    const thr = W().thresholdIrrelevant;
    const scope = S.job ? all.filter(a => String(a.jobId) === String(S.job)) : all;
    const relevant = scope.filter(a => a.match >= thr);
    const now = Date.now() / 1000, day = 86400;
    const n7 = scope.filter(a => a.ts > now - 7 * day).length, p7 = scope.filter(a => a.ts <= now - 7 * day && a.ts > now - 14 * day).length;
    const avg = relevant.length ? Math.round(relevant.reduce((s, a) => s + a.match, 0) / relevant.length) : 0;
    const job = S.job ? jobs.find(j => String(j.id) === String(S.job)) : null;
    /* روند ۱۴ روز */
    const days = [...Array(14)].map((_, i) => { const t0 = new Date(); t0.setHours(0, 0, 0, 0); return t0.getTime() / 1000 - (13 - i) * day; });
    const trend = days.map(t => scope.filter(a => a.ts >= t && a.ts < t + day).length), tmx = Math.max(1, ...trend);
    /* توزیع ۲۵ بازه‌ی ۴ درصدی */
    const bins = Array(25).fill(0); scope.forEach(a => bins[Math.min(24, Math.floor(a.match / 4))]++);
    const bmx = Math.max(1, ...bins);
    let list = scope.filter(a => (S.irr || a.match >= thr) && (!S.fit || a.fit === S.fit) && (!S.status || a.status === S.status) && (!S.channel || a.channel === S.channel));
    list.sort((x, y) => (needs(y, "employer") ? 1 : 0) - (needs(x, "employer") ? 1 : 0) || y.match - x.match || y.ts - x.ts);
    const pages = Math.max(1, Math.ceil(list.length / S.per));
    if (S.page >= pages) S.page = pages - 1;
    const rows = list.slice(S.page * S.per, S.page * S.per + S.per);
    const fitBadge = a => TUI.fitBadge({ score: a.match, fit: a.fit || "low" });
    host.innerHTML = `
      <div class="ats-filters">
        <select data-s="job" aria-label="آگهی"><option value="">همه‌ی آگهی‌ها (استخر رزومه)</option>${jobs.map(j => `<option value="${j.id}" ${String(S.job) === String(j.id) ? "selected" : ""}>${e(j.title)}${j.internal ? " — داخلی" : ""} (${fa(all.filter(a => a.jobId === j.id).length)})</option>`).join("")}</select>
        ${job ? `<span class="muted" style="font-size:12.5px">کد AD-${fa(job.id)} · انتشار ${e(job.date || "—")}${job.internal ? "" : ` · انقضا ${e(job.expire || "—")}`}</span>
          ${job.req ? `<a class="btn btn-sm btn-outline" href="${P.talent}?job=${job.id}">نیروهای پیشنهادی از بانک رزومه</a>` : ""}` : ""}
      </div>
      <div class="ats-kpis">
        <div><b>${fa(scope.length)}</b><span>درخواست دریافتی</span><small>${fa(scope.length - relevant.length)} مورد نامرتبط (زیر ${fa(thr)}٪)</small></div>
        <div><b>${fa(n7)}</b><span>جدید در ۷ روز اخیر</span><small>${p7 ? (n7 >= p7 ? "▲ " : "▼ ") + fa(Math.abs(Math.round((n7 - p7) / p7 * 100))) + "٪ نسبت به ۷ روز قبل" : "—"}</small></div>
        <div><b>${fa(avg)}٪</b><span>میانگین تطبیق</span><small>موارد نامرتبط لحاظ نشده‌اند</small></div>
        <div><b>${fa(scope.filter(a => a.fit === "high").length)}</b><span>تطبیق بالا</span><small>${fa(scope.filter(a => a.eligible).length)} نفر واجد شرایط الزامی</small></div>
      </div>
      <div class="ats-charts">
        <div class="ats-chart"><b>روند دریافت درخواست</b><small>۱۴ روز گذشته</small>
          <div class="ats-bars">${trend.map((v, i) => `<i style="height:${v / tmx * 100}%" title="${jdate(days[i])}: ${fa(v)}"></i>`).join("")}</div>
          <div class="ats-axis"><span>${jdate(days[0])}</span><span>${jdate(days[13])}</span></div></div>
        <div class="ats-chart"><b>توزیع تطبیق</b><small>هر ستون ۴ درصد · ستون‌های کم‌رنگ زیر آستانه‌ی ${fa(thr)}٪</small>
          <div class="ats-bars">${bins.map((v, i) => `<i class="${i * 4 < thr ? "mute" : ""}" style="height:${v / bmx * 100}%" title="${fa(i * 4)}–${fa(i * 4 + 3)}٪: ${fa(v)}"></i>`).join("")}</div>
          <div class="ats-axis"><span>۰٪</span><span>۵۰٪</span><span>۱۰۰٪</span></div></div>
      </div>
      <div class="ats-filters">
        <select data-s="fit" aria-label="سطح تطبیق"><option value="">همه‌ی سطوح تطبیق</option>${["high", "mid", "low"].map(f => `<option value="${f}" ${S.fit === f ? "selected" : ""}>${FITN[f]}</option>`).join("")}</select>
        <select data-s="status" aria-label="وضعیت"><option value="">همه‌ی وضعیت‌ها</option>${Object.entries(ST()).map(([k, v]) => `<option value="${k}" ${S.status === k ? "selected" : ""}>${e(v)}</option>`).join("")}</select>
        <select data-s="channel" aria-label="کانال"><option value="">همه‌ی کانال‌ها</option>${Object.entries(CH).map(([k, v]) => `<option value="${k}" ${S.channel === k ? "selected" : ""}>${e(v)}</option>`).join("")}</select>
        <label class="check-item inline"><input type="checkbox" data-s="irr" ${S.irr ? "checked" : ""}> نمایش موارد نامرتبط (${fa(scope.length - relevant.length)})</label>
        <span class="muted" style="font-size:12.5px;margin-inline-start:auto">${fa(list.length)} درخواست از ${fa(scope.length)}</span>
      </div>
      <div class="table-wrap"><table class="data ats-table"><thead><tr><th>متقاضی</th>${S.job ? "" : "<th>آگهی</th>"}<th>کانال</th><th>تاریخ</th><th>تطبیق</th><th>وضعیت</th><th></th></tr></thead><tbody>
        ${rows.map(a => `<tr class="clickable" data-app="${a.id}">
          <td><div style="display:flex;gap:10px;align-items:center"><div style="width:36px;height:36px;border-radius:50%;background:${e(a.color)};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;flex-shrink:0">${e((a.name || "؟").charAt(0))}</div>
            <div><b>${e(a.name)}</b>${a.unread ? `<span class="badge-dot">${fa(a.unread)}</span>` : ""}<div style="font-size:12px;color:var(--navy-400)">${e(a.title || "")}${a.city ? " · " + e(a.city) : ""}</div></div></div></td>
          ${S.job ? "" : `<td>${e(a.job)}</td>`}<td style="font-size:12.5px">${e(CH[a.channel] || "")}</td><td>${e(a.date)}</td><td>${fitBadge(a)}</td>
          <td>${statusChip(a)}${needs(a, "employer") ? `<span class="need-act">${e(needs(a, "employer"))}</span>` : ""}</td>
          <td><button type="button" class="btn btn-sm btn-outline">مشاهده</button></td></tr>`).join("")
          || `<tr><td colspan="7"><div class="empty-inline">${scope.length ? "درخواستی با این فیلترها نیست." : "هنوز درخواستی دریافت نکرده‌اید. از «تطبیق هوشمند» می‌توانید نیروهای مناسب را مستقیم دعوت کنید."}</div></td></tr>`}
      </tbody></table></div>
      <div class="ats-pager"><span>تعداد نمایش <select data-s="per">${[10, 20, 50].map(n => `<option ${S.per === n ? "selected" : ""}>${fa(n)}</option>`).join("")}</select></span>
        <span><button type="button" data-pg="-1" ${S.page ? "" : "disabled"}>قبلی</button> صفحه ${fa(S.page + 1)} از ${fa(pages)} <button type="button" data-pg="1" ${S.page < pages - 1 ? "" : "disabled"}>بعدی</button></span></div>`;
    host.onchange = ev => {
      const k = ev.target.dataset.s; if (!k) return;
      S[k] = k === "irr" ? ev.target.checked : k === "per" ? Number(String(ev.target.value).replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))) : ev.target.value;
      S.page = 0; employer(host);
    };
    host.onclick = ev => {
      const pg = ev.target.closest("[data-pg]"); if (pg) { S.page += Number(pg.dataset.pg); employer(host); return; }
      const tr = ev.target.closest("[data-app]"); if (tr) open(Number(tr.dataset.app), "employer", () => API.get("me").then(() => employer(host)).catch(() => {}));
    };
  }

  return { open, close, employer, needs, setJob: id => { S.job = String(id || ""); S.page = 0; } };
})();

/* دعوت مستقیم از مرکز تطبیق (کارفرما → کارجو) */
function talentInviteForm(c, job) {
  if (!job || !job.id) return "";
  return `<div class="app-form" data-invite style="display:none"><div class="form-field full"><label>پیام دعوت (اختیاری)</label><textarea rows="2" maxlength="1000" data-inv-note placeholder="مثلاً: رزومه‌ی شما با این پوزیشن تطبیق بالایی دارد؛ مایلید گفتگو کنیم؟"></textarea></div>
    <button type="button" class="btn btn-primary btn-sm" onclick="talentInviteSend(${Number(job.id)}, ${Number(c.id)}, this)">ارسال دعوت</button></div>`;
}
async function talentInviteSend(jobId, uid, btn) {
  const note = (btn.closest("[data-invite]").querySelector("[data-inv-note]") || {}).value || "";
  try {
    await busy(btn, () => API.post("talent/invite", { job: jobId, uid, note }));
    toast("دعوت ارسال شد ✓ کارجو با اعلان و ایمیل باخبر شد؛ پیگیری در «متقاضیان»");
    btn.closest("[data-invite]").outerHTML = '<div class="notice-box ok" style="margin-top:10px">دعوت ارسال شد؛ پاسخ کارجو در بخش «متقاضیان» پنل نمایش داده می‌شود.</div>';
  } catch (_) {}
}
