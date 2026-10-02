/* ابزار مشترک تست‌های مرورگری آیولب (playwright-core + Chrome محلی) */
const { chromium } = require("playwright-core");
const path = require("path"), fs = require("fs");
const EXE = process.env.CHROME || path.join(process.env.HOME, ".cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell");
const BASE = process.env.BASE || "http://127.0.0.1:8798";
const SHOTS = process.env.SHOTS || "/tmp/claude-1000/aio-shots";
fs.mkdirSync(SHOTS, { recursive: true });

async function browser() { return chromium.launch({ executablePath: EXE, args: ["--no-sandbox", "--lang=fa-IR", "--renderer-process-limit=2", "--disable-dev-shm-usage", "--disable-gpu", "--disable-extensions"] }); }

/** صفحه‌ی جدید با ثبت خطاهای کنسول/شبکه */
async function page(ctx, opts = {}) {
  const p = await ctx.newPage();
  /* روی سایت زنده تأخیر شبکه بیشتر است؛ مکث‌های ثابت تست ۳ برابر می‌شوند */
  if (!BASE.includes("127.0.0.1")) { const w = p.waitForTimeout.bind(p); p.waitForTimeout = ms => w(ms * 3); p.setDefaultTimeout(60000); }
  /* شبکه‌ی این سرور گاهی جابه‌جا می‌شود (ERR_NETWORK_CHANGED)؛ بارگذاری صفحه تا ۳ بار تکرار شود */
  const goto = p.goto.bind(p);
  p.goto = async (url, o) => { for (let i = 0; ; i++) { try { return await goto(url, o); } catch (e) { if (i < 2 && /ERR_NETWORK_CHANGED|ERR_CONNECTION_RESET|ERR_CONNECTION_CLOSED/.test(e.message)) { await new Promise(r => setTimeout(r, 2000)); continue; } throw e; } } };
  p.errors = [];
  p.on("pageerror", e => p.errors.push("JS: " + e.message));
  p.on("console", m => { if (m.type() === "error" && !/favicon|ERR_BLOCKED|tile\.openstreetmap/.test(m.text())) p.errors.push("console: " + m.text()); });
  p.on("response", r => { if (r.status() >= 400 && !/favicon|openstreetmap/.test(r.url())) p.errors.push(`HTTP ${r.status()} ${r.url()}`); });
  return p;
}

async function login(ctx, email, pass) {
  const p = await page(ctx);
  await p.goto(BASE + "/login/", { waitUntil: "networkidle" });
  await p.fill("#email", email);
  await p.fill("#pass", pass);
  await Promise.all([p.waitForNavigation({ waitUntil: "networkidle" }), p.click(".auth-form button[type=submit]")]);
  return p;
}

let failures = 0;
function check(cond, msg) { console.log((cond ? "  ✓ " : "  ✗ ") + msg); if (!cond) failures++; return cond; }
function done() { console.log(failures ? `\n${failures} FAILED` : "\nALL PASSED"); process.exitCode = failures ? 1 : 0; }

/** زمینه‌ی مرورگر؛ روی سایت زنده کوکی پیش‌نمایش (حالت «به‌زودی») هم اضافه می‌شود */
async function newCtx(b, opts) {
  const c = await b.newContext(Object.assign({ viewport: { width: 1280, height: 900 }, locale: "fa-IR" }, opts || {}));
  if (process.env.PREVIEW) await c.addCookies([{ name: "aio_preview", value: process.env.PREVIEW, url: BASE }]);
  return c;
}

/** اجرای PHP روی وردپرس: محلی با wp-cli داخل داکر، زنده با Novamira */
const { execSync } = require("child_process");
function wp(code) {
  if (BASE.includes("127.0.0.1")) {
    const files = "-f docker-compose.yml" + (fs.existsSync(__dirname + "/../local/docker-compose.port.yml") ? " -f docker-compose.port.yml" : "");
    return execSync(`cd ${__dirname}/../local && docker compose -p aiolab-local ${files} run --rm -T cli eval '${code.replace(/'/g, "'\\''")}' 2>/dev/null`).toString().trim();
  }
  const php = code.replace(/\becho\s+/g, "$__o[] = ") + " return implode('', $__o ?? []);";
  const out = require("child_process").execFileSync("python3", [__dirname + "/../tools/wp.py", "php", "$__o = []; " + php], { maxBuffer: 1e7 }).toString();
  try { return String(JSON.parse(out).return ?? ""); } catch { return out.trim(); }
}

/** شماره موبایل یکتای تستی (۰۹۹۹…) — ثبت‌نام بدون موبایل ممکن نیست */
let phoneSeq = 0;
function testPhone() { return "0999" + String(Date.now() % 1e6 + (phoneSeq++)).padStart(6, "0").slice(-6) + String(Math.floor(Math.random() * 10)); }

module.exports = { testPhone, browser, page, login, check, done, BASE, SHOTS, newCtx, wp };
