/* ==========================================
   آیولب — چالش علمی هفتگی / ماهانه
   جریان: خواندن سؤال (رایگان) ← پرداخت وجه کم ← ارسال پاسخ ← داوری ← نمایش ۳ پاسخ برتر
   اسپانسر: شرکت یا آزمایشگاه جایزه‌ی یک چالش مرتبط با حوزه‌ی خودش را تأمین می‌کند.
   دمو: ویرایش‌های مدیر و پاسخ‌ها در حافظه‌ی مرورگر؛ نسخه‌ی اصلی در پایگاه داده.
   کلیدهای Store: ch_admin (چالش‌های ساخته/ویرایش‌شده توسط مدیر، بر اساس id)
                  ch_answers (پاسخ‌های من، بر اساس id چالش)
                  ch_winners (برندگان انتخاب‌شده توسط مدیر، بر اساس id چالش)
                  ch_sponsor_req (درخواست‌های اسپانسری)
   ========================================== */

const CH_PERIODS = { weekly: "هفتگی", monthly: "ماهانه" };
const CH_STATUS = { open: "در حال برگزاری", judging: "در حال داوری", closed: "پایان‌یافته" };

const AIO_CHALLENGES = [
  { id: 31, period: "weekly", status: "open", group: "hematology", title: "تالاسمی مینور یا فقر آهن؟",
    question: "در CBC یک خانم ۲۶ ساله این مقادیر گزارش شده است:\nRBC = ۵٫۹ میلیون در میکرولیتر، Hb = ۱۱٫۲، MCV = ۷۲ فمتولیتر، MCH = ۲۲، RDW = ۱۴٪.\n\n۱) شاخص Mentzer را محاسبه کنید و بگویید بیشتر به نفع کدام تشخیص است.\n۲) دو آزمایش تکمیلی برای قطعی کردن تشخیص پیشنهاد دهید و دلیل هرکدام را بنویسید.\n۳) در لام خون محیطی انتظار دیدن چه یافته‌هایی را دارید؟",
    hint: "پاسخ کوتاه و مستدل؛ حداکثر ۳۰۰ کلمه.", image: "نمونه‌ی لام خون محیطی (تصویر پیوست)",
    fee: 20000, prize: "۳ میلیون تومان + کارت هدیه‌ی کتاب هماتولوژی", prizeAmount: 3000000, sponsorOrgId: 5,
    opens: "۱۴۰۵/۰۸/۱۷", deadline: "۱۴۰۵/۰۸/۲۳", daysLeft: 3, participants: 148, winners: [] },
  { id: 32, period: "monthly", status: "open", group: "qc", title: "قانون وستگارد کدام است؟",
    question: "در کنترل کیفی داخلی گلوکز روی اتوآنالایزر، در ران امروز هر دو کنترل سطح ۱ و سطح ۲ بالاتر از +۲SD قرار گرفته‌اند (+۲٫۳SD و +۲٫۱SD). در ران دیروز، کنترل سطح ۱ روی +۱٫۸SD بوده است.\n\n۱) کدام قانون وستگارد نقض شده است؟\n۲) خطا از نوع تصادفی است یا سیستماتیک؟ چرا؟\n۳) به ترتیب اولویت، چه اقداماتی انجام می‌دهید و آیا جواب بیماران ران امروز را تأیید می‌کنید؟",
    hint: "پاسخ ساختارمند (قانون، نوع خطا، اقدامات)؛ حداکثر ۵۰۰ کلمه.", image: "",
    fee: 50000, prize: "۱۰ میلیون تومان + یک دوره‌ی رایگان آکادمی آیولب", prizeAmount: 10000000, sponsorOrgId: 10,
    opens: "۱۴۰۵/۰۸/۰۱", deadline: "۱۴۰۵/۰۸/۳۰", daysLeft: 10, participants: 312, winners: [] },
  { id: 23, period: "weekly", status: "judging", group: "genetics", title: "باند اضافه در ژل PCR",
    question: "در الکتروفورز محصول PCR، علاوه بر باند مورد انتظار ۴۵۰ جفت‌بازی، یک باند ضعیف حدود ۵۰ جفت‌بازی و یک اسمیر خفیف دیده می‌شود. کنترل منفی هم همان باند ۵۰ را دارد.\nعلت هر یافته و راه رفع آن را بنویسید.",
    hint: "", image: "", fee: 20000, prize: "۲ میلیون تومان", prizeAmount: 2000000, sponsorOrgId: null,
    opens: "۱۴۰۵/۰۸/۱۰", deadline: "۱۴۰۵/۰۸/۱۶", daysLeft: 0, participants: 96, winners: [] },
  { id: 21, period: "weekly", status: "closed", group: "microbiology", title: "تشخیص ESBL با دیسک ترکیبی",
    question: "در آنتی‌بیوگرام یک ایزوله‌ی E. coli از نمونه‌ی ادرار، قطر هاله‌ی سفتازیدیم ۱۵ میلی‌متر و سفتازیدیم-کلاوولانیک اسید ۲۳ میلی‌متر است. تفسیر شما چیست و چه گزارشی به پزشک می‌دهید؟",
    hint: "", image: "", fee: 20000, prize: "۲ میلیون تومان + کیت آموزشی آنتی‌بیوگرام", prizeAmount: 2000000, sponsorOrgId: 11,
    opens: "۱۴۰۵/۰۷/۲۶", deadline: "۱۴۰۵/۰۸/۰۲", daysLeft: 0, participants: 121,
    winners: [
      { rank: 1, name: "سمیرا تقوی", candidateId: 108, score: 96, answer: "افزایش ۸ میلی‌متری هاله با کلاوولانیک (≥۵ میلی‌متر) طبق CLSI به معنی تولید ESBL است. گزارش: «ایزوله تولیدکننده‌ی بتالاکتاماز وسیع‌الطیف»؛ همه‌ی پنی‌سیلین‌ها، سفالوسپورین‌ها و آزترئونام صرف‌نظر از نتیجه‌ی دیسک، مقاوم گزارش نشوند بلکه مطابق ویرایش جاری CLSI با یادداشت تفسیری؛ پیشنهاد کارباپنم یا نیتروفورانتوئین برای عفونت ادراری ساده، و ثبت در سامانه‌ی پایش مقاومت." },
      { rank: 2, name: "مریم کریمی", candidateId: 105, score: 91, answer: "تفاوت ۸ میلی‌متر ⇐ فنوتیپ ESBL مثبت. قبل از گزارش، کنترل کیفی با سویه‌ی K. pneumoniae ATCC 700603 بررسی شود. به پزشک: ESBL مثبت، احتیاط در مصرف سفالوسپورین‌ها و توجه به ایزولاسیون تماسی در بیماران بستری." },
      { rank: 3, name: "علی رضایی", candidateId: 101, score: 88, answer: "ESBL مثبت چون اختلاف هاله بیش از ۵ میلی‌متر است. علاوه بر گزارش، تست تأییدی با سفوتاکسیم-کلاوولانیک هم انجام می‌دهم تا نتیجه با دو دیسک تأیید شود." }] },
  { id: 22, period: "monthly", status: "closed", group: "biochemistry", title: "پتاسیم ۷٫۲ بدون علامت",
    question: "پتاسیم سرم یک بیمار بدون علامت ۷٫۲ میلی‌اکی‌والان در لیتر گزارش شده؛ نمونه همولیز ندارد، ECG طبیعی است و شمارش پلاکت ۹۵۰ هزار است. علت محتمل و اقدام آزمایشگاهی شما چیست؟",
    hint: "", image: "", fee: 50000, prize: "۸ میلیون تومان", prizeAmount: 8000000, sponsorOrgId: null,
    opens: "۱۴۰۵/۰۷/۰۱", deadline: "۱۴۰۵/۰۷/۳۰", daysLeft: 0, participants: 274,
    winners: [
      { rank: 1, name: "حسین موسوی", candidateId: 103, score: 97, answer: "هیپرکالمی کاذب ناشی از ترومبوسیتوز: هنگام لخته شدن، پلاکت‌ها پتاسیم آزاد می‌کنند. اقدام: اندازه‌گیری هم‌زمان پتاسیم پلاسمای هپارینه (یا خون کامل روی دستگاه گازهای خون)؛ اختلاف بیش از ۰٫۴ تأیید می‌کند. تا تأیید، نتیجه با یادداشت گزارش شود و پزشک تلفنی مطلع شود چون مقدار بحرانی است." },
      { rank: 2, name: "نگار احمدی", candidateId: 102, score: 93, answer: "سودوهیپرکالمی؛ با ترومبوسیتوز بالای ۵۰۰ هزار شایع است. نمونه‌ی هپارینه بدون فشار زیاد هنگام انتقال، سانتریفیوژ سریع، و مقایسه‌ی سرم و پلاسما. در QC هم اثر زمان تأخیر نمونه را بررسی می‌کنم." },
      { rank: 3, name: "زهرا محمدی", candidateId: 110, score: 87, answer: "احتمال آزاد شدن پتاسیم از پلاکت‌ها؛ تکرار با لوله‌ی هپارین لیتیوم و اطلاع به پزشک. همچنین مشت کردن مکرر دست هنگام نمونه‌گیری را رد می‌کنم." }] }
];

/* پاسخ‌های نمونه برای صفحه‌ی داوری مدیر */
const AIO_CH_SUBMISSIONS = {
  23: [
    { name: "کیان باقری", candidateId: 109, answer: "باند ۵۰ جفت‌بازی در کنترل منفی = دایمر پرایمر. کاهش غلظت پرایمر، افزایش دمای اتصال و استفاده از Hot-start. اسمیر: DNA الگوی زیاد یا سیکل‌های زیاد؛ رقیق‌سازی الگو و کاهش تعداد سیکل." },
    { name: "پارسا ملکی", candidateId: 111, answer: "دایمر پرایمر؛ طراحی دوباره‌ی پرایمر با ابزار Primer-BLAST. اسمیر به‌خاطر تخریب DNA." },
    { name: "شیدا کاویانی", candidateId: 112, answer: "دایمر پرایمر در هر دو چاهک. برای اسمیر غلظت منیزیم را کم می‌کنم و Touchdown PCR می‌زنم." },
    { name: "فاطمه نوری", candidateId: 104, answer: "آلودگی کنترل منفی؛ باید ریجنت‌ها تعویض شوند." }],
  31: [
    { name: "علی رضایی", candidateId: 101, answer: "Mentzer = ۷۲ ÷ ۵٫۹ ≈ ۱۲٫۲ که کمتر از ۱۳ است و به نفع تالاسمی مینور است. RDW طبیعی هم همین را تأیید می‌کند. تکمیلی: الکتروفورز هموگلوبین (HbA2) و فریتین سرم. در لام: سلول‌های هدف و میکروسیتوز با بازوفیلیک استیپلینگ." },
    { name: "امیر حسینی", candidateId: 107, answer: "شاخص ۱۲٫۲ ⇐ تالاسمی. آزمایش آهن سرم و TIBC و HbA2." }],
  32: [
    { name: "رضا کاظمی", candidateId: 106, answer: "قانون 2-2s بین دو سطح نقض شده که نشانه‌ی خطای سیستماتیک است. ران رد می‌شود؛ بررسی معرف و کالیبراتور، کالیبراسیون مجدد، تکرار کنترل و سپس تکرار نمونه‌های بیماران." }]
};

/* ---------- لایه‌ی ذخیره (دمو) ---------- */
const _chE = s => (typeof TUI !== "undefined" ? TUI.e(s) : String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])));
const _chFa = n => (typeof fa === "function" ? fa(n) : String(n));
const _chOrg = id => (id && typeof orgFull === "function") ? orgFull(id) : null;
const _chGroup = id => { const d = (typeof AIO_DEPARTMENTS !== "undefined") && AIO_DEPARTMENTS.find(x => x.id === id); return d ? d.name : (id || "عمومی"); };
const _chCand = id => (id && typeof aioCandidates === "function") ? aioCandidates().find(c => c.id === id) : null;

function challenges() {
  const over = Store.get("ch_admin", {}), wins = Store.get("ch_winners", {});
  const base = AIO_CHALLENGES.map(c => Object.assign({}, c, over[c.id] || {}));
  const added = Object.values(over).filter(o => !AIO_CHALLENGES.some(c => c.id === o.id));
  return [...base, ...added].map(c => {
    const x = Object.assign({}, c);
    if (wins[x.id] && wins[x.id].length) { x.winners = wins[x.id]; x.status = "closed"; }
    const mine = myEntry(x.id);
    x.participantsShown = (+x.participants || 0) + (mine && mine.text ? 1 : 0);
    return x;
  });
}
const challenge = id => challenges().find(c => c.id === +id) || null;
const openChallenges = () => challenges().filter(c => c.status === "open");
const pastChallenges = () => challenges().filter(c => c.status !== "open").sort((a, b) => b.id - a.id);
function myEntry(id) { return Store.get("ch_answers", {})[id] || null; }
function _saveEntry(id, patch) {
  const all = Store.get("ch_answers", {});
  all[id] = Object.assign({}, all[id] || {}, patch);
  Store.set("ch_answers", all);
  return all[id];
}
/* پرداخت آزمایشی ورودیه: سفارش «پرداخت‌شده» در سفارش‌های من */
function payChallengeFee(id) {
  const c = challenge(id); if (!c) return null;
  if (typeof MyOrders !== "undefined") MyOrders.add({ code: "CH-" + c.id, title: "ورودیه چالش «" + c.title + "»", price: c.fee, unit: "چالش " + CH_PERIODS[c.period], date: "امروز", status: "paid" });
  return _saveEntry(id, { paid: true, paidAt: "امروز", name: (Auth.user || {}).name || "" });
}
function submitAnswer(id, text) {
  const t = String(text || "").trim();
  if (t.length < 20) throw new Error("پاسخ خیلی کوتاه است (حداقل ۲۰ نویسه)");
  const e = myEntry(id);
  if (!e || !e.paid) throw new Error("ابتدا ورودیه را پرداخت کنید");
  return _saveEntry(id, { text: t.slice(0, 4000), submittedAt: new Date().toLocaleDateString("fa-IR"), name: (Auth.user || {}).name || "" });
}
/* محل کار فعلی یک برنده (مثل لینکدین) برای دیده شدن */
function challengeWinnerOrg(w) {
  if (w.orgName) return { name: w.orgName, id: w.orgId || null };
  const c = _chCand(w.candidateId); if (!c) return null;
  const cur = (c.experience || []).find(x => !x.end) || (c.experience || [])[0];
  return cur ? { name: cur.orgName, id: cur.orgId || null } : null;
}

const sponsorRequests = {
  all: () => Store.get("ch_sponsor_req", []),
  add(r) { return Store.push("ch_sponsor_req", Object.assign({ id: Date.now(), challengeId: null, status: "pending", date: new Date().toLocaleDateString("fa-IR") }, r)); },
  set(id, patch) { const a = sponsorRequests.all(), i = a.findIndex(x => x.id === id); if (i >= 0) { a[i] = Object.assign(a[i], patch); Store.set("ch_sponsor_req", a); } return a[i]; },
  ofOrg: orgId => sponsorRequests.all().filter(r => +r.orgId === +orgId)
};

/* ---------- قطعه‌های نمایشی مشترک ---------- */
const CH_MEDALS = ["", "🥇", "🥈", "🥉"];
function challengeSponsorHTML(c, compact) {
  const o = _chOrg(c.sponsorOrgId);
  if (!o) return compact ? "" : `<div class="ch-sponsor none">جایزه‌ی این چالش را آیولب تأمین کرده است · <a href="employer.html#sponsor">اسپانسر چالش بعدی شوید</a></div>`;
  return `<a class="ch-sponsor" href="lab.html?id=${o.id}"><span class="ch-sp-logo" style="background:${_chE(o.color || "#0d9488")}">${_chE(o.name.replace(/^(شرکت|آزمایشگاه)\s*/, "").charAt(0))}</span>
    <span><small>اسپانسر${compact ? "" : " این چالش"}</small><b>${_chE(o.name)}</b></span></a>`;
}
function challengeCardHTML(c) {
  const o = _chOrg(c.sponsorOrgId);
  return `<a class="ch-card" href="challenges.html#ch-${c.id}">
    <div class="job-meta"><span class="chip ${c.period === "weekly" ? "teal" : "violet"}">چالش ${CH_PERIODS[c.period]}</span><span class="chip">${_chE(_chGroup(c.group))}</span>
      ${c.status === "open" ? `<span class="chip amber">${c.daysLeft > 0 ? _chFa(c.daysLeft) + " روز مانده" : "آخرین روز"}</span>` : `<span class="chip">${CH_STATUS[c.status]}</span>`}</div>
    <h3>${_chE(c.title)}</h3>
    <p>${_chE(String(c.question).split("\n")[0].slice(0, 120))}…</p>
    <div class="ch-card-foot"><span>🏆 ${_chE(c.prize)}</span><span>👥 ${_chFa(c.participantsShown || c.participants || 0)} شرکت‌کننده</span></div>
    ${o ? `<small class="muted">با حمایت ${_chE(o.name)}</small>` : ""}
  </a>`;
}
function challengeWinnersHTML(c) {
  return (c.winners || []).slice().sort((a, b) => a.rank - b.rank).map(w => {
    const org = challengeWinnerOrg(w);
    return `<div class="ch-winner">
      <span class="ch-medal">${CH_MEDALS[w.rank] || _chFa(w.rank)}</span>
      <div class="ch-w-body"><b>${_chE(w.name)}</b>${org ? ` · <span class="muted">${org.id ? `<a href="lab.html?id=${org.id}">${_chE(org.name)}</a>` : _chE(org.name)}</span>` : ""}${w.score ? ` <span class="chip sm">امتیاز ${_chFa(w.score)}</span>` : ""}
        <details><summary>${_chE(String(w.answer).slice(0, 110))}${String(w.answer).length > 110 ? "…" : ""}</summary><p>${_chE(w.answer)}</p></details></div>
    </div>`;
  }).join("") || '<div class="empty-inline">برندگان هنوز اعلام نشده‌اند.</div>';
}

/* مودال ساده (دمو) */
function _chModal(html) {
  const m = document.createElement("div");
  m.className = "modal-backdrop open";
  m.innerHTML = `<div class="modal" role="dialog" aria-modal="true"><button type="button" class="close" aria-label="بستن">✕</button>${html}</div>`;
  m.addEventListener("click", ev => { if (ev.target === m || ev.target.closest(".close,[data-close]")) m.remove(); });
  document.body.appendChild(m);
  return m;
}

/* ---------- «چالش‌های من» برای داشبورد کارجو ---------- */
const ChallengeMine = {
  mount(el) {
    if (!el) return;
    const all = Store.get("ch_answers", {});
    const rows = Object.keys(all).map(id => ({ c: challenge(id), e: all[id] })).filter(x => x.c);
    if (!rows.length) {
      el.innerHTML = `<div class="empty-inline">هنوز در چالشی شرکت نکرده‌اید. <a href="challenges.html">چالش‌های این هفته و این ماه</a></div>`;
      return;
    }
    const me = (Auth.user || {}).name;
    el.innerHTML = `<div class="ch-mine">${rows.map(({ c, e }) => {
      const w = (c.winners || []).find(x => x.self || (me && x.name === me));
      const st = w ? `<span class="chip teal">${CH_MEDALS[w.rank]} رتبه ${_chFa(w.rank)}</span>`
        : !e.text ? `<span class="chip amber">پرداخت شده — پاسخ ارسال نشده</span>`
        : c.status === "closed" ? `<span class="chip">پایان‌یافته</span>` : `<span class="chip sky">در انتظار داوری</span>`;
      return `<div class="order-item"><span class="oi-code">${CH_PERIODS[c.period]}</span>
        <div class="oi-body"><b>${_chE(c.title)}</b><small>${e.submittedAt ? "ارسال: " + _chE(e.submittedAt) : "ورودیه پرداخت شد"} · مهلت ${_chE(c.deadline)}</small></div>
        ${st}<a class="btn btn-sm btn-outline" href="challenges.html#ch-${c.id}">مشاهده</a></div>`;
    }).join("")}</div>`;
  }
};

/* ---------- پنل اسپانسری برای شرکت/آزمایشگاه ---------- */
const ChallengeSponsor = {
  mount(el, orgId) {
    if (!el) return;
    const org = _chOrg(orgId);
    const draw = () => {
      const open = challenges().filter(c => c.status === "open");
      const mine = sponsorRequests.ofOrg(orgId).slice().reverse();
      const stChip = s => s === "approved" ? '<span class="chip teal">تأیید شد</span>' : s === "rejected" ? '<span class="chip rose">رد شد</span>' : '<span class="chip amber">در انتظار بررسی</span>';
      el.innerHTML = `
      <div class="panel"><h2>چالش‌های در حال برگزاری</h2>
        <p class="muted" style="font-size:13px">با تأمین جایزه‌ی یک چالش علمی در حوزه‌ی محصولات یا خدمات خود، برندتان را جلوی دید متخصصان آزمایشگاهی قرار دهید. نام و لوگوی اسپانسر روی صفحه‌ی چالش، صفحه‌ی اول و اعلام برندگان نمایش داده می‌شود.</p>
        <div class="ch-grid">${open.map(c => `<div>${challengeCardHTML(c)}${c.sponsorOrgId ? "" : '<div class="chip amber" style="margin-top:6px">بدون اسپانسر — فرصت حمایت</div>'}</div>`).join("") || '<div class="empty-inline">چالش بازی وجود ندارد.</div>'}</div>
      </div>
      <div class="panel"><h2>درخواست اسپانسری</h2>
        <div class="form-grid">
          <div class="form-field"><label>چالش</label><select data-sp="challengeId"><option value="">چالش آینده‌ی مناسب (به انتخاب آیولب)</option>${open.filter(c => !c.sponsorOrgId).map(c => `<option value="${c.id}">${CH_PERIODS[c.period]} — ${_chE(c.title)}</option>`).join("")}</select></div>
          <div class="form-field"><label>حوزه‌ی چالش</label><select data-sp="group">${(typeof AIO_DEPARTMENTS !== "undefined" ? AIO_DEPARTMENTS : []).map(d => `<option value="${d.id}">${_chE(d.name)}</option>`).join("")}</select></div>
          <div class="form-field"><label>مبلغ جایزه (تومان) *</label><input type="number" min="500000" step="100000" data-sp="amount" placeholder="مثلاً ۵۰۰۰۰۰۰"></div>
          <div class="form-field"><label>جایزه‌ی غیرنقدی (اختیاری)</label><input type="text" maxlength="100" data-sp="prizeText" placeholder="مثلاً کیت آموزشی یا دوره‌ی کاربری دستگاه"></div>
          <div class="form-field full"><label>توضیح / محصول مرتبط</label><textarea rows="2" maxlength="500" data-sp="note" placeholder="مثلاً سؤال درباره‌ی تفسیر نتایج دستگاه سل‌کانتر باشد"></textarea></div>
        </div>
        <div class="fb-actions" style="margin-top:12px"><button type="button" class="btn btn-primary" data-sp-send>ارسال درخواست</button></div>
      </div>
      <div class="panel"><h2>درخواست‌های من</h2>
        ${mine.length ? `<div class="table-wrap"><table class="data"><thead><tr><th>تاریخ</th><th>چالش</th><th>حوزه</th><th>مبلغ</th><th>وضعیت</th></tr></thead><tbody>
          ${mine.map(r => { const c = r.challengeId ? challenge(r.challengeId) : null; return `<tr><td>${_chE(r.date)}</td><td>${c ? _chE(c.title) : "چالش آینده"}</td><td>${_chE(_chGroup(r.group))}</td><td>${_chFa(r.amount)} تومان</td><td>${stChip(r.status)}</td></tr>`; }).join("")}
        </tbody></table></div>` : '<div class="empty-inline">هنوز درخواستی ثبت نکرده‌اید.</div>'}
      </div>`;
    };
    el.onclick = ev => {
      if (!ev.target.closest("[data-sp-send]")) return;
      const v = k => (el.querySelector(`[data-sp="${k}"]`) || {}).value || "";
      const amount = +v("amount");
      if (!org) return toast("ابتدا سازمان خود را ثبت کنید");
      if (!amount || amount < 500000) return toast("مبلغ جایزه را وارد کنید (حداقل ۵۰۰ هزار تومان)");
      sponsorRequests.add({ challengeId: v("challengeId") ? +v("challengeId") : null, orgId: org.id, orgName: org.name, amount, group: v("group"), prizeText: v("prizeText").trim(), note: v("note").trim() });
      toast("درخواست اسپانسری ثبت شد ✓ پس از بررسی با شما تماس می‌گیریم");
      draw();
    };
    draw();
  }
};

/* ---------- مدیریت چالش‌ها (پنل مدیر) ---------- */
const ChallengeAdmin = {
  mount(el) {
    if (!el) return;
    let view = "list", cur = null;
    const orgs = () => (typeof AIO_LABS !== "undefined" ? AIO_LABS : []).map(l => [l.id, l.name]);
    const saveOver = c => { const o = Store.get("ch_admin", {}); o[c.id] = c; Store.set("ch_admin", o); };
    const subsOf = id => {
      const list = (AIO_CH_SUBMISSIONS[id] || []).map((s, i) => Object.assign({ key: "s" + i }, s));
      const mine = myEntry(id);
      if (mine && mine.text) list.push({ key: "me", name: mine.name || "کاربر فعلی", answer: mine.text, self: true });
      return list;
    };
    const blank = () => ({ id: 100 + Date.now() % 100000, period: "weekly", status: "open", group: "biochemistry", title: "", question: "", hint: "", image: "",
      fee: 20000, prize: "", prizeAmount: 0, sponsorOrgId: null, opens: "", deadline: "", daysLeft: 7, participants: 0, winners: [] });

    function list() {
      const reqs = sponsorRequests.all().slice().reverse();
      return `<div class="syllabus-head" style="margin-bottom:12px"><div><h2 style="margin:0">چالش‌ها</h2><p class="muted" style="font-size:13px">سؤال هفتگی/ماهانه، ورودیه، جایزه، اسپانسر و داوری برترین پاسخ‌ها</p></div>
        <button type="button" class="btn btn-primary btn-sm" data-a="new">+ چالش جدید</button></div>
      <div class="table-wrap"><table class="data"><thead><tr><th>عنوان</th><th>دوره</th><th>وضعیت</th><th>شرکت‌کننده</th><th>اسپانسر</th><th></th></tr></thead><tbody>
        ${challenges().map(c => `<tr><td><b>${_chE(c.title)}</b><br><small class="muted">${_chE(_chGroup(c.group))} · مهلت ${_chE(c.deadline)}</small></td><td>${CH_PERIODS[c.period]}</td><td>${CH_STATUS[c.status]}</td>
          <td>${_chFa(c.participantsShown)}</td><td>${_chE((_chOrg(c.sponsorOrgId) || {}).name || "—")}</td>
          <td style="white-space:nowrap"><button type="button" class="btn btn-sm btn-outline" data-a="edit" data-id="${c.id}">ویرایش</button> <button type="button" class="btn btn-sm btn-ghost" data-a="judge" data-id="${c.id}">داوری (${_chFa(subsOf(c.id).length)})</button></td></tr>`).join("")}
      </tbody></table></div>
      <div class="panel" style="margin-top:18px"><h2>درخواست‌های اسپانسری</h2>
        ${reqs.length ? `<div class="table-wrap"><table class="data"><thead><tr><th>سازمان</th><th>چالش</th><th>مبلغ</th><th>توضیح</th><th>وضعیت</th><th></th></tr></thead><tbody>
          ${reqs.map(r => `<tr><td>${_chE(r.orgName)}</td>
            <td>${r.status === "pending" ? `<select data-attach="${r.id}"><option value="">انتخاب چالش…</option>${challenges().filter(c => c.status === "open").map(c => `<option value="${c.id}" ${+r.challengeId === c.id ? "selected" : ""}>${_chE(c.title)}</option>`).join("")}</select>` : _chE((challenge(r.challengeId) || {}).title || "—")}</td>
            <td>${_chFa(r.amount)} تومان${r.prizeText ? "<br><small>" + _chE(r.prizeText) + "</small>" : ""}</td><td><small>${_chE(r.note || "")}</small></td>
            <td>${r.status === "approved" ? "تأیید شد" : r.status === "rejected" ? "رد شد" : "در انتظار"}</td>
            <td style="white-space:nowrap">${r.status === "pending" ? `<button type="button" class="btn btn-sm btn-primary" data-a="approve" data-id="${r.id}">تأیید و اتصال</button> <button type="button" class="btn btn-sm btn-ghost danger" data-a="reject" data-id="${r.id}">رد</button>` : ""}</td></tr>`).join("")}
        </tbody></table></div>` : '<div class="empty-inline">درخواستی ثبت نشده است. شرکت‌ها و آزمایشگاه‌ها از پنل خود «اسپانسری چالش» را درخواست می‌دهند.</div>'}
      </div>`;
    }
    function form(c) {
      const f = (k, label, input, full) => `<div class="form-field${full ? " full" : ""}"><label>${label}</label>${input}</div>`;
      const inp = (k, type, extra) => `<input type="${type || "text"}" data-f="${k}" value="${_chE(c[k] == null ? "" : c[k])}" ${extra || ""}>`;
      const sel = (k, opts) => `<select data-f="${k}">${opts.map(([v, n]) => `<option value="${v}" ${String(c[k]) === String(v) ? "selected" : ""}>${_chE(n)}</option>`).join("")}</select>`;
      return `<div class="panel"><h2>${c.title ? "ویرایش چالش" : "چالش جدید"}</h2><div class="form-grid">
        ${f("title", "عنوان *", inp("title", "text", 'maxlength="100"'), true)}
        ${f("period", "دوره", sel("period", Object.entries(CH_PERIODS)))}
        ${f("status", "وضعیت", sel("status", Object.entries(CH_STATUS)))}
        ${f("group", "حوزه", sel("group", (typeof AIO_DEPARTMENTS !== "undefined" ? AIO_DEPARTMENTS : []).map(d => [d.id, d.name])))}
        ${f("sponsorOrgId", "اسپانسر", sel("sponsorOrgId", [["", "بدون اسپانسر (آیولب)"], ...orgs()]))}
        ${f("question", "متن سؤال *", `<textarea rows="6" data-f="question" maxlength="3000">${_chE(c.question)}</textarea>`, true)}
        ${f("hint", "راهنمای پاسخ", inp("hint", "text", 'maxlength="200"'), true)}
        ${f("image", "شرح تصویر پیوست (اختیاری)", inp("image", "text", 'maxlength="120"'), true)}
        ${f("fee", "ورودیه (تومان)", inp("fee", "number", 'min="0" step="1000"'))}
        ${f("prizeAmount", "مبلغ جایزه (تومان)", inp("prizeAmount", "number", 'min="0" step="100000"'))}
        ${f("prize", "متن جایزه *", inp("prize", "text", 'maxlength="120"'), true)}
        ${f("opens", "شروع (شمسی)", inp("opens", "text", 'placeholder="۱۴۰۵/۰۸/۲۴"'))}
        ${f("deadline", "مهلت (شمسی)", inp("deadline", "text", 'placeholder="۱۴۰۵/۰۸/۳۰"'))}
        ${f("daysLeft", "روزهای باقی‌مانده", inp("daysLeft", "number", 'min="0"'))}
        ${f("participants", "تعداد شرکت‌کننده (پایه)", inp("participants", "number", 'min="0"'))}
      </div><div class="fb-actions" style="margin-top:12px"><button type="button" class="btn btn-primary" data-a="save">ذخیره</button><button type="button" class="btn btn-ghost" data-a="back">انصراف</button></div></div>`;
    }
    function judge(c) {
      const subs = subsOf(c.id);
      const picked = {}; (c.winners || []).forEach(w => { const s = subs.find(x => x.name === w.name && x.answer === w.answer); if (s) picked[s.key] = { rank: w.rank, score: w.score || "" }; });
      return `<div class="panel"><div class="syllabus-head"><div><h2 style="margin:0">داوری: ${_chE(c.title)}</h2><p class="muted" style="font-size:13px">برای سه پاسخ برتر رتبه‌ی ۱ تا ۳ و امتیاز بگذارید؛ با «انتشار» در صفحه‌ی چالش و صفحه‌ی اول نمایش داده می‌شوند و چالش «پایان‌یافته» می‌شود.</p></div>
        <button type="button" class="btn btn-ghost btn-sm" data-a="back">بازگشت</button></div>
        <details style="margin:10px 0"><summary>متن سؤال</summary><p style="white-space:pre-line">${_chE(c.question)}</p></details>
        ${subs.length ? subs.map(s => `<div class="ch-sub" data-key="${s.key}">
          <div class="ch-sub-head"><b>${_chE(s.name)}</b>${s.self ? ' <span class="chip sm">پاسخ کاربر فعلی دمو</span>' : ""}
            <select data-rank aria-label="رتبه"><option value="">بدون رتبه</option>${[1, 2, 3].map(r => `<option value="${r}" ${(picked[s.key] || {}).rank === r ? "selected" : ""}>${CH_MEDALS[r]} رتبه ${_chFa(r)}</option>`).join("")}</select>
            <input type="number" min="0" max="100" data-score placeholder="امتیاز" value="${_chE((picked[s.key] || {}).score || "")}" style="width:90px"></div>
          <p>${_chE(s.answer)}</p></div>`).join("") : '<div class="empty-inline">هنوز پاسخی ارسال نشده است.</div>'}
        <div class="fb-actions" style="margin-top:12px"><button type="button" class="btn btn-primary" data-a="publish">انتشار برترین پاسخ‌ها</button></div></div>`;
    }
    function draw() { el.innerHTML = view === "form" ? form(cur) : view === "judge" ? judge(cur) : list(); }
    el.onclick = ev => {
      const b = ev.target.closest("[data-a]"); if (!b) return;
      const a = b.dataset.a, id = +b.dataset.id;
      if (a === "new") { cur = blank(); view = "form"; }
      else if (a === "edit") { cur = JSON.parse(JSON.stringify(challenge(id))); view = "form"; }
      else if (a === "judge") { cur = challenge(id); view = "judge"; }
      else if (a === "back") { view = "list"; }
      else if (a === "save") {
        el.querySelectorAll("[data-f]").forEach(i => { const k = i.dataset.f; cur[k] = ["fee", "prizeAmount", "daysLeft", "participants"].includes(k) ? (+i.value || 0) : (k === "sponsorOrgId" ? (i.value ? +i.value : null) : i.value.trim()); });
        if (!cur.title || !cur.question || !cur.prize) return toast("عنوان، متن سؤال و متن جایزه لازم است");
        delete cur.participantsShown;
        saveOver(cur); toast("چالش ذخیره شد ✓"); view = "list";
      }
      else if (a === "publish") {
        const subs = subsOf(cur.id), wins = [];
        el.querySelectorAll(".ch-sub").forEach(row => {
          const r = +row.querySelector("[data-rank]").value; if (!r) return;
          const s = subs.find(x => x.key === row.dataset.key);
          wins.push({ rank: r, name: s.name, candidateId: s.candidateId || null, answer: s.answer, score: +row.querySelector("[data-score]").value || null, self: !!s.self });
        });
        const ranks = wins.map(w => w.rank);
        if (!wins.length) return toast("حداقل یک پاسخ را رتبه‌بندی کنید");
        if (new Set(ranks).size !== ranks.length) return toast("هر رتبه فقط به یک پاسخ داده شود");
        const w = Store.get("ch_winners", {}); w[cur.id] = wins.sort((x, y) => x.rank - y.rank); Store.set("ch_winners", w);
        toast("برترین پاسخ‌ها منتشر شد ✓"); view = "list";
      }
      else if (a === "approve" || a === "reject") {
        const r = sponsorRequests.all().find(x => x.id === id); if (!r) return;
        if (a === "reject") { sponsorRequests.set(id, { status: "rejected" }); toast("درخواست رد شد"); }
        else {
          const chId = +(el.querySelector(`[data-attach="${id}"]`) || {}).value || +r.challengeId;
          if (!chId) return toast("ابتدا چالش موردنظر را انتخاب کنید");
          const c = challenge(chId); delete c.participantsShown;
          c.sponsorOrgId = +r.orgId; c.prizeAmount = Math.max(+c.prizeAmount || 0, +r.amount);
          c.prize = _chFa(r.amount) + " تومان" + (r.prizeText ? " + " + r.prizeText : "");
          saveOver(c); sponsorRequests.set(id, { status: "approved", challengeId: chId }); toast("اسپانسر به چالش متصل شد ✓");
        }
      }
      draw();
    };
    draw();
  }
};
