const { browser } = require("./lib");
const pairs = [["index.html", "/"], ["courses.html", "/courses/"], ["labs.html", "/labs/"]];
(async () => {
  const b = await browser();
  for (const [demo, wp] of pairs) for (const [name, url] of [["demo", "https://demo.aiolab.ir/" + demo], ["wp", "http://127.0.0.1:8798" + wp]]) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
    const p = await ctx.newPage();
    await p.goto(url, { waitUntil: "networkidle", timeout: 60000 }).catch(() => {});
    await p.waitForTimeout(600);
    const ov = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    await p.screenshot({ path: `/tmp/claude-1000/aio-shots/m-${demo.replace(".html", "")}-${name}.png` });
    console.log(name, demo, "horizontal overflow px:", ov);
    await ctx.close();
  }
  await b.close();
})();
