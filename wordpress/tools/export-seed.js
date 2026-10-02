// خروجی گرفتن از داده‌های دمو (assets/js/*.js) به JSON برای درون‌ریزی در وردپرس
const fs = require("fs"), vm = require("vm"), path = require("path");
const root = path.resolve(__dirname, "../..");
const src = ["geo.js", "data.js"].map(f => fs.readFileSync(path.join(root, "assets/js", f), "utf8")).join("\n");
const names = [...src.matchAll(/^const (AIO_[A-Z_]+)/gm)].map(m => m[1]);
const ctx = {}; vm.createContext(ctx);
vm.runInContext(src + "\n;globalThis.__out = {" + names.map(n => `${n}: typeof ${n} !== "undefined" ? ${n} : null`).join(",") + "};", ctx);
const out = ctx.__out;
fs.writeFileSync(path.join(root, "wordpress/seed/demo-data.json"), JSON.stringify(out, null, 1));
console.log(names.length + " consts →", Object.entries(out).map(([k, v]) => k + ":" + (Array.isArray(v) ? v.length : typeof v)).join("  "));
