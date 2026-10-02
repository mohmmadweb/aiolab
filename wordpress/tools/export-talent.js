// خروجی کاتالوگ‌ها و داده‌های نمونه‌ی رزومه/تطبیق (assets/js/talent-data.js) برای درون‌ریز وردپرس
const fs = require("fs"), vm = require("vm"), path = require("path");
const root = path.resolve(__dirname, "../..");
const src = ["geo.js", "data.js", "talent-data.js"].map(f => fs.readFileSync(path.join(root, "assets/js", f), "utf8")).join("\n");
const ctx = { localStorage: { getItem: () => null } }; vm.createContext(ctx);
vm.runInContext(src + `;globalThis.__out = { AIO_SKILL_LEVELS, AIO_SKILL_GROUPS, AIO_SKILLS, AIO_ROLES, AIO_SENIORITY, AIO_DEGREE_LEVELS, AIO_UNIVERSITIES,
  AIO_LICENSES, AIO_LANGUAGES, AIO_LANG_LEVELS, AIO_AVAILABILITY, AIO_ORG_TYPES, AIO_PRODUCT_CATS, AIO_ACCREDITATIONS, AIO_ORG_SERVICES,
  AIO_ORG_EXTRA, AIO_PRODUCTS, AIO_JOB_REQ, AIO_POSITIONS_INTERNAL, AIO_CANDIDATES };`, ctx);
const out = ctx.__out;
fs.writeFileSync(path.join(root, "wordpress/plugin/aiolab-core/data/talent.json"), JSON.stringify(out, null, 1));
console.log(Object.entries(out).map(([k, v]) => k + ":" + (Array.isArray(v) ? v.length : Object.keys(v).length)).join("  "));
