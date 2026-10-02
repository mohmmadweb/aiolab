/* اسکرین‌شات هم‌زمان دمو و نسخه‌ی وردپرس برای مقایسه‌ی ظاهری */
const { browser } = require("./lib");
const pairs = (process.env.PAIRS || "index.html=/,jobs.html=/jobs/,courses.html=/courses/").split(",").map(x => x.split("="));
(async () => {
  const b = await browser();
  for (const [demo, wp] of pairs) {
    for (const [name, url] of [["demo", "https://demo.aiolab.ir/" + demo], ["wp", (process.env.BASE || "http://127.0.0.1:8798") + wp]]) {
      const ctx = await b.newContext({ viewport: { width: 1366, height: 900 }, deviceScaleFactor: 0.6 });
      const p = await ctx.newPage();
      await p.goto(url, { waitUntil: "networkidle", timeout: 60000 }).catch(() => {});
      await p.waitForTimeout(700);
      await p.screenshot({ path: `/tmp/claude-1000/aio-shots/cmp-${demo.replace(".html", "")}-${name}.png`, fullPage: false });
      await ctx.close();
    }
  }
  await b.close();
  console.log("ok");
})();
