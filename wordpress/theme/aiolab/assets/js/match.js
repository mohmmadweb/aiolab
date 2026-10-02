/* ==========================================
   آیولب — موتور تطبیق نیرو و پوزیشن + فیلتر AND/OR
   مشترک بین دمو و وردپرس. هیچ مقدار مشتق‌شده‌ای ذخیره نمی‌شود:
   سن از تاریخ تولد، سابقه از تاریخ‌های شروع/پایان (ادغام بازه‌های هم‌پوشان، مثل لینکدین).
   ========================================== */
const AioDate = (() => {
  /* تبدیل جلالی ↔ میلادی (الگوریتم استاندارد) */
  function g2j(gy, gm, gd) {
    const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    const gy2 = gm > 2 ? gy + 1 : gy;
    let days = 355666 + 365 * gy + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) + gd + g_d_m[gm - 1];
    let jy = -1595 + 33 * Math.floor(days / 12053); days %= 12053;
    jy += 4 * Math.floor(days / 1461); days %= 1461;
    if (days > 365) { jy += Math.floor((days - 1) / 365); days = (days - 1) % 365; }
    const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
    const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
    return [jy, jm, jd];
  }
  function j2g(jy, jm, jd) {
    jy += 1595;
    let days = -355668 + 365 * jy + Math.floor(jy / 33) * 8 + Math.floor(((jy % 33) + 3) / 4) + jd + (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
    let gy = 400 * Math.floor(days / 146097); days %= 146097;
    if (days > 36524) { gy += 100 * Math.floor(--days / 36524); days %= 36524; if (days >= 365) days++; }
    gy += 4 * Math.floor(days / 1461); days %= 1461;
    if (days > 365) { gy += Math.floor((days - 1) / 365); days = (days - 1) % 365; }
    let gd = days + 1;
    const sal = [0, 31, (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let gm = 0; for (gm = 0; gm < 13 && gd > sal[gm]; gm++) gd -= sal[gm];
    return [gy, gm, gd];
  }
  const pad = n => String(n).padStart(2, "0");
  const MONTHS = ["", "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
  const parse = s => { if (!s) return null; const p = String(s).split("-").map(Number); return { y: p[0], m: p[1] || 1, d: p[2] || 1 }; };
  const today = () => { const t = new Date(); return { y: t.getFullYear(), m: t.getMonth() + 1, d: t.getDate() }; };
  return {
    g2j, j2g, MONTHS,
    /* «۱۴۰۲/۰۳» یا «خرداد ۱۴۰۲» از ISO */
    toJ(iso, withMonthName) {
      const g = parse(iso); if (!g) return "";
      const [jy, jm, jd] = g2j(g.y, g.m, g.d);
      const s = withMonthName ? `${MONTHS[jm]} ${jy}` : `${jy}/${pad(jm)}` + (String(iso).length > 7 ? "/" + pad(jd) : "");
      return s.replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]);
    },
    /* ISO از شمسی */
    fromJ(jy, jm, jd) { const [gy, gm, gd] = j2g(+jy, +jm, +(jd || 1)); return `${gy}-${pad(gm)}` + (jd ? "-" + pad(gd) : ""); },
    jParts(iso) { const g = parse(iso); if (!g) return null; const [y, m, d] = g2j(g.y, g.m, g.d); return { y, m, d }; },
    thisJYear() { const t = today(); return g2j(t.y, t.m, t.d)[0]; },
    /* ماه‌های بین دو تاریخ ISO (تا امروز اگر end خالی باشد) */
    months(start, end) {
      const a = parse(start); if (!a) return 0; const b = end ? parse(end) : today();
      return Math.max(0, (b.y - a.y) * 12 + (b.m - a.m) + (end ? 1 : 0));
    },
    age(birth) {
      const b = parse(birth); if (!b) return null; const t = today();
      return t.y - b.y - ((t.m < b.m || (t.m === b.m && t.d < b.d)) ? 1 : 0);
    },
    /* «۳ سال و ۴ ماه» */
    durText(months) {
      const y = Math.floor(months / 12), m = months % 12;
      const fa = n => String(n).replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]);
      if (!months) return "کمتر از یک ماه";
      return [y ? fa(y) + " سال" : "", m ? fa(m) + " ماه" : ""].filter(Boolean).join(" و ");
    }
  };
})();

const AioMatch = (() => {
  const byId = (arr, id) => (arr || []).find(x => x.id === id);
  const skillName = id => (byId(typeof AIO_SKILLS !== "undefined" ? AIO_SKILLS : [], id) || { name: id }).name;
  const lvlName = v => ((typeof AIO_SKILL_LEVELS !== "undefined" ? AIO_SKILL_LEVELS : []).find(l => l.v === v) || { name: "—" }).name;
  const degName = v => ((typeof AIO_DEGREE_LEVELS !== "undefined" ? AIO_DEGREE_LEVELS : []).find(l => l.v === v) || { name: "—" }).name;
  const senName = v => ((typeof AIO_SENIORITY !== "undefined" ? AIO_SENIORITY : []).find(l => l.v === +v) || { name: String(v) }).name;
  const langLvl = v => ((typeof AIO_LANG_LEVELS !== "undefined" ? AIO_LANG_LEVELS : []).find(l => l.v === +v) || { name: v ? String(v) : "ندارد" }).name;
  const ym = s => { const p = String(s).split("-"); return (+p[0]) * 12 + (+p[1] || 1) - 1; };
  const nowYM = () => { const t = new Date(); return t.getFullYear() * 12 + t.getMonth(); };

  /* ادغام بازه‌های هم‌پوشان تا سابقه دو بار شمرده نشود */
  function mergedMonths(items) {
    const iv = (items || []).filter(x => x.start).map(x => [ym(x.start), x.end ? ym(x.end) : nowYM()]).filter(x => x[1] >= x[0]).sort((a, b) => a[0] - b[0]);
    let total = 0, cur = null;
    iv.forEach(([s, e]) => {
      if (!cur) cur = [s, e];
      else if (s <= cur[1] + 1) cur[1] = Math.max(cur[1], e);
      else { total += cur[1] - cur[0] + 1; cur = [s, e]; }
    });
    if (cur) total += cur[1] - cur[0] + 1;
    return total;
  }

  /* مقادیر مشتق‌شده‌ی زنده از رزومه */
  function profile(c) {
    const exp = c.experience || [];
    const byDept = {}, byRole = {};
    exp.forEach(e => {
      if (e.dept) (byDept[e.dept] = byDept[e.dept] || []).push(e);
      if (e.role) (byRole[e.role] = byRole[e.role] || []).push(e);
    });
    const expDept = {}, expRole = {};
    Object.keys(byDept).forEach(k => expDept[k] = mergedMonths(byDept[k]));
    Object.keys(byRole).forEach(k => expRole[k] = mergedMonths(byRole[k]));
    const current = exp.filter(e => !e.end).sort((a, b) => ym(b.start) - ym(a.start))[0] || null;
    const last = current || [...exp].sort((a, b) => ym(b.end || b.start) - ym(a.end || a.start))[0] || null;
    const edu = c.education || [];
    const degree = edu.reduce((m, e) => Math.max(m, (e.end || e.degree < 3) ? +e.degree || 0 : (+e.degree || 0) - 0.5), 0);
    const skills = {};
    (c.skills || []).forEach(s => skills[s.id] = Math.max(skills[s.id] || 0, +s.lvl || 0));
    /* مهارت‌هایی که فقط در سوابق آمده‌اند حداقل «مقدماتی» حساب می‌شوند */
    exp.forEach(e => (e.skills || []).forEach(id => { if (!skills[id]) skills[id] = 2; }));
    const nowISO = new Date().toISOString().slice(0, 7);
    const licenses = {};
    (c.licenses || []).forEach(l => licenses[l.id] = !l.expires || l.expires >= nowISO);
    const langs = {};
    (c.langs || []).forEach(l => langs[l.id] = Math.max(langs[l.id] || 0, +l.lvl || 0));
    return {
      age: AioDate.age(c.birth), expMonths: mergedMonths(exp), expDept, expRole, current, last,
      degree: Math.floor(degree), fields: edu.map(e => e.field).filter(Boolean), unis: edu.map(e => e.uni).filter(Boolean),
      skills, licenses, langs, roles: [...new Set([...(c.targetRoles || []), ...exp.map(e => e.role)])].filter(Boolean)
    };
  }

  const DEFAULT_WEIGHTS = { skills: 0.65, criteria: 0.35, thresholdIrrelevant: 30, high: 75, mid: 55 };
  const W = () => Object.assign({}, DEFAULT_WEIGHTS, (typeof AIO_MATCH_WEIGHTS !== "undefined" ? AIO_MATCH_WEIGHTS : {}));

  /* امتیاز تطبیق یک نفر با یک پوزیشن + توضیح کامل */
  function score(c, job) {
    const req = job.req || {}, p = c._p || (c._p = profile(c));
    const w = W();
    /* ۱) پوشش وزنی مهارت‌ها (مثل استاندارد DOJT) */
    const sk = (req.skills || []).map(r => {
      const have = p.skills[r.id] || 0;
      const cover = have >= r.lvl ? 1 : have / r.lvl;
      return { id: r.id, name: skillName(r.id), w: r.w, lvl: r.lvl, lvlName: lvlName(r.lvl), have, haveName: have ? lvlName(have) : "ندارد", cover, must: !!r.must,
               status: cover >= 1 ? "full" : have ? "partial" : "none" };
    });
    const sumW = sk.reduce((s, x) => s + x.w, 0);
    const skillScore = sumW ? sk.reduce((s, x) => s + x.w * x.cover, 0) / sumW : 1;
    /* ۲) معیارهای دیگر */
    const crit = [];
    const add = (key, label, need, has, pts, hard) => crit.push({ key, label, need, has, pts: Math.max(0, Math.min(1, pts)), ok: pts >= 1, hard: !!hard });
    if (req.minExp) add("exp", "سابقه کل", AioDate.durText(req.minExp), AioDate.durText(p.expMonths), p.expMonths / req.minExp);
    if (req.expDept && job.dept) add("expDept", "سابقه در همین بخش", AioDate.durText(req.expDept), AioDate.durText(p.expDept[job.dept] || 0), (p.expDept[job.dept] || 0) / req.expDept);
    if (req.degree) add("degree", "حداقل مدرک", degName(req.degree), degName(p.degree), p.degree >= req.degree ? 1 : p.degree / req.degree * 0.8);
    if (req.fields && req.fields.length) add("field", "رشته تحصیلی", req.fields.join("، "), p.fields.join("، ") || "—", p.fields.some(f => req.fields.includes(f)) ? 1 : 0.3);
    (req.licenses || []).forEach(id => {
      const l = byId(typeof AIO_LICENSES !== "undefined" ? AIO_LICENSES : [], id) || { name: id };
      add("lic-" + id, "مدرک: " + l.name, "دارد", p.licenses[id] === true ? "دارد" : p.licenses[id] === false ? "منقضی" : "ندارد", p.licenses[id] ? 1 : 0, true);
    });
    (req.langs || []).forEach(r => {
      const l = byId(typeof AIO_LANGUAGES !== "undefined" ? AIO_LANGUAGES : [], r.id) || { name: r.id };
      add("lang-" + r.id, "زبان " + l.name, langLvl(r.lvl), langLvl(p.langs[r.id] || 0), (p.langs[r.id] || 0) / r.lvl);
    });
    if (req.age && p.age != null) add("age", "بازه سنی", req.age.join(" تا "), String(p.age), p.age >= req.age[0] && p.age <= req.age[1] ? 1 : 0, true);
    if (req.gender && req.gender !== "فرقی نمی‌کند") add("gender", "جنسیت", req.gender, c.gender || "—", c.gender === req.gender ? 1 : 0, true);
    if (req.military && req.military.length && c.gender === "آقا") add("military", "وضعیت سربازی", req.military.join(" / "), c.military || "—", req.military.includes(c.military) ? 1 : 0, true);
    if (job.provinceId && !job.remote) {
      const sameCity = c.city === job.city, sameProv = c.provinceId === job.provinceId, moves = c.relocate && (!c.provinces || !c.provinces.length || c.provinces.includes(job.provinceId));
      add("location", "محل کار", job.city || "", c.city || "—", sameCity ? 1 : sameProv ? 0.85 : moves ? 0.7 : 0.15);
    }
    if (req.seniority && c.seniority) add("seniority", "رده شغلی", senName(req.seniority), senName(c.seniority), c.seniority >= req.seniority ? 1 : c.seniority / req.seniority);
    const critScore = crit.length ? crit.reduce((s, x) => s + x.pts, 0) / crit.length : 1;
    /* ۳) شرایط الزامی */
    const blockers = [...sk.filter(x => x.must && x.cover < 0.5).map(x => "مهارت الزامی: " + x.name), ...crit.filter(x => x.hard && !x.ok).map(x => x.label)];
    let total = Math.round(100 * (sumW ? (w.skills * skillScore + w.criteria * critScore) : critScore));
    if (blockers.length) total = Math.min(total, w.thresholdIrrelevant + 9);
    const fit = total >= w.high ? "high" : total >= w.mid ? "mid" : total >= w.thresholdIrrelevant ? "low" : "none";
    return { score: total, fit, fitName: { high: "بالا", mid: "متوسط", low: "پایین", none: "نامرتبط" }[fit], eligible: !blockers.length, blockers,
             skillScore: Math.round(skillScore * 100), critScore: Math.round(critScore * 100), skills: sk, criteria: crit };
  }

  /* ---------- فیلدهای سازنده‌ی فیلتر ---------- */
  const opt = (arr, idKey, nameKey) => (arr || []).map(x => typeof x === "string" ? [x, x] : [String(x[idKey || "id"]), x[nameKey || "name"]]);
  function fields() {
    const g = n => (typeof window !== "undefined" && window[n]) || (typeof globalThis !== "undefined" && globalThis[n]) || [];
    return [
      { key: "skill", label: "مهارت / دستگاه", type: "skill", ops: ["has"], options: () => opt(AIO_SKILLS) },
      { key: "expTotal", label: "سابقه کل (سال)", type: "number", ops: [">=", "<=", "between"] },
      { key: "expDept", label: "سابقه در بخش (سال)", type: "deptyears", ops: [">="], options: () => opt(AIO_DEPARTMENTS) },
      { key: "roleTarget", label: "عنوان شغلی موردنظر", type: "multi", ops: ["in", "notin"], options: () => opt(AIO_ROLES) },
      { key: "rolePast", label: "عنوان شغلی در سوابق", type: "multi", ops: ["in", "notin"], options: () => opt(AIO_ROLES) },
      { key: "seniority", label: "رده شغلی", type: "number-select", ops: [">=", "<=", "="], options: () => opt(AIO_SENIORITY, "v") },
      { key: "degree", label: "مقطع تحصیلی", type: "number-select", ops: [">=", "<=", "="], options: () => opt(AIO_DEGREE_LEVELS, "v") },
      { key: "field", label: "رشته تحصیلی", type: "multi", ops: ["in", "notin"], options: () => opt(AIO_FIELDS_STUDY) },
      { key: "uni", label: "دانشگاه", type: "multi", ops: ["in", "notin"], options: () => opt(AIO_UNIVERSITIES) },
      { key: "license", label: "مدرک / پروانه معتبر", type: "multi", ops: ["hasall", "hasany"], options: () => opt(AIO_LICENSES) },
      { key: "lang", label: "زبان خارجی", type: "lang", ops: ["has"], options: () => opt(AIO_LANGUAGES) },
      { key: "age", label: "سن", type: "number", ops: [">=", "<=", "between"] },
      { key: "gender", label: "جنسیت", type: "multi", ops: ["in"], options: () => opt(["آقا", "خانم"]) },
      { key: "military", label: "وضعیت سربازی", type: "multi", ops: ["in"], options: () => opt(AIO_MILITARY.filter(x => x !== "مهم نیست")) },
      { key: "province", label: "استان محل سکونت", type: "multi", ops: ["in", "notin"], options: () => opt(AIO_PROVINCES) },
      { key: "city", label: "شهر", type: "multi", ops: ["in"], options: () => opt(AIO_ALL_CITIES) },
      { key: "relocate", label: "آماده‌ی جابه‌جایی", type: "bool", ops: ["is"] },
      { key: "wantType", label: "نوع همکاری موردنظر", type: "multi", ops: ["hasany"], options: () => opt(AIO_JOB_TYPES) },
      { key: "wantShift", label: "شیفت موردنظر", type: "multi", ops: ["hasany"], options: () => opt(AIO_SHIFTS) },
      { key: "salary", label: "حداقل حقوق درخواستی (میلیون)", type: "number", ops: ["<=", ">="] },
      { key: "availability", label: "زمان آمادگی", type: "multi", ops: ["in"], options: () => opt(AIO_AVAILABILITY) },
      { key: "otw", label: "آماده به کار", type: "bool", ops: ["is"] },
      { key: "platformCert", label: "دارای گواهی آیولب", type: "bool", ops: ["is"] },
      { key: "mbti", label: "تیپ MBTI", type: "multi", ops: ["in"], options: () => Object.keys(typeof AIO_MBTI_TYPES !== "undefined" ? AIO_MBTI_TYPES : {}).map(k => [k, k]) },
      { key: "matchJob", label: "درصد تطبیق با پوزیشن", type: "jobscore", ops: [">="] }
    ];
  }

  /* ارزیابی یک شرط روی یک نفر */
  function test(c, r, ctx) {
    const p = c._p || (c._p = profile(c));
    const v = r.value, op = r.op;
    const num = (x, cmp) => {
      if (x == null) return false;
      if (op === ">=") return x >= +cmp[0];
      if (op === "<=") return x <= +cmp[0];
      if (op === "=") return x == +cmp[0];
      if (op === "between") return x >= +cmp[0] && x <= +cmp[1];
      return false;
    };
    const arr = Array.isArray(v) ? v.map(String) : [String(v)];
    const inList = (vals, list) => (Array.isArray(vals) ? vals : [vals]).some(x => list.includes(String(x)));
    switch (r.field) {
      case "skill": return (p.skills[v.id] || 0) >= (+v.lvl || 1);
      case "expTotal": return num(p.expMonths / 12, Array.isArray(v) ? v : [v]);
      case "expDept": return (p.expDept[v.dept] || 0) / 12 >= (+v.years || 0);
      case "roleTarget": return op === "notin" ? !inList(c.targetRoles || [], arr) : inList(c.targetRoles || [], arr);
      case "rolePast": { const roles = (c.experience || []).map(e => e.role); return op === "notin" ? !inList(roles, arr) : inList(roles, arr); }
      case "seniority": return num(c.seniority || 0, Array.isArray(v) ? v : [v]);
      case "degree": return num(p.degree, Array.isArray(v) ? v : [v]);
      case "field": return op === "notin" ? !inList(p.fields, arr) : inList(p.fields, arr);
      case "uni": return op === "notin" ? !inList(p.unis, arr) : inList(p.unis, arr);
      case "license": return op === "hasall" ? arr.every(id => p.licenses[id] === true) : arr.some(id => p.licenses[id] === true);
      case "lang": return (p.langs[v.id] || 0) >= (+v.lvl || 1);
      case "age": return num(p.age, Array.isArray(v) ? v : [v]);
      case "gender": return arr.includes(c.gender);
      case "military": return arr.includes(c.military);
      case "province": return op === "notin" ? !arr.includes(c.provinceId) : arr.includes(c.provinceId);
      case "city": return arr.includes(c.city);
      case "relocate": return !!c.relocate === (v === true || v === "1" || v === "true");
      case "wantType": return inList(c.wantTypes || [], arr);
      case "wantShift": return inList(c.wantShifts || [], arr);
      case "salary": return num(c.salaryMin || 0, Array.isArray(v) ? v : [v]);
      case "availability": return arr.includes(c.availability);
      case "otw": return !!c.otw === (v === true || v === "1" || v === "true");
      case "platformCert": return !!(c.certs && c.certs.length) === (v === true || v === "1" || v === "true");
      case "mbti": return arr.includes(c.mbti);
      case "matchJob": { const job = ctx && ctx.jobs && ctx.jobs.find(j => String(j.id) === String(v.job)); return job ? score(c, job).score >= (+v.min || 0) : false; }
    }
    return true;
  }

  /* درخت شرط: { op: "and"|"or", rules: [ {field, op, value} | {op, rules} ] } */
  function evaluate(c, tree, ctx) {
    if (!tree || !tree.rules || !tree.rules.length) return true;
    const res = tree.rules.map(r => r.rules ? evaluate(c, r, ctx) : test(c, r, ctx));
    return tree.op === "or" ? res.some(Boolean) : res.every(Boolean);
  }

  /* پوزیشن‌های مناسب یک نفر و نفرات مناسب یک پوزیشن */
  const jobsFor = (c, jobs) => jobs.map(j => ({ job: j, m: score(c, j) })).sort((a, b) => b.m.score - a.m.score);
  const candidatesFor = (job, cands) => cands.map(c => ({ c, m: score(c, job) })).sort((a, b) => b.m.score - a.m.score);

  /* تعداد شرط‌های یک درخت (برای نمایش) */
  const countRules = t => !t || !t.rules ? 0 : t.rules.reduce((s, r) => s + (r.rules ? countRules(r) : 1), 0);

  return { profile, score, fields, evaluate, test, jobsFor, candidatesFor, mergedMonths, countRules, skillName, lvlName, degName, DEFAULT_WEIGHTS };
})();
