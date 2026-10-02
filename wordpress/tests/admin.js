/* تست صفحات پیشخوان: متاباکس‌ها، تکرارشونده‌ها، تنظیمات، ذخیره */
const { browser, page, check, done, BASE, wp } = require("./lib");
(async () => {
  const b = await browser();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await page(ctx);
  await p.goto(BASE + "/wp-login.php", { waitUntil: "networkidle" });
  await p.fill("#user_login", "admin"); await p.fill("#user_pass", "admin123");
  await Promise.all([p.waitForNavigation({ waitUntil: "networkidle" }), p.click("#wp-submit")]);
  const ids = JSON.parse(wp(`$d=aio_data(); echo json_encode(["job"=>$d["AIO_JOBS"][0]["id"],"lab"=>$d["AIO_LABS"][0]["id"],"course"=>$d["AIO_COURSES"][0]["id"],"exam"=>$d["AIO_EXAMS"][0]["id"],"path"=>$d["AIO_LEARNING_PATHS"][0]["wpId"],"svc"=>$d["AIO_SERVICES"][0]["wpId"],"order"=>(get_posts(["post_type"=>"aio_order","numberposts"=>1,"fields"=>"ids"])[0]??0),"app"=>(get_posts(["post_type"=>"aio_application","numberposts"=>1,"fields"=>"ids"])[0]??0)]);`));
  const screens = [
    ["/wp-admin/", "پیشخوان"], ["/wp-admin/edit.php?post_type=aio_job", "فهرست آگهی‌ها"], ["/wp-admin/post.php?post=" + ids.job + "&action=edit", "ویرایش آگهی"],
    ["/wp-admin/post.php?post=" + ids.lab + "&action=edit", "ویرایش مرکز"], ["/wp-admin/post.php?post=" + ids.course + "&action=edit", "ویرایش دوره"],
    ["/wp-admin/post.php?post=" + ids.exam + "&action=edit", "ویرایش آزمون"], ["/wp-admin/post.php?post=" + ids.path + "&action=edit", "ویرایش مسیر"],
    ["/wp-admin/post.php?post=" + ids.svc + "&action=edit", "ویرایش خدمت"], ["/wp-admin/post.php?post=" + ids.order + "&action=edit", "ویرایش سفارش"],
    ["/wp-admin/post.php?post=" + ids.app + "&action=edit", "ویرایش درخواست"], ["/wp-admin/edit.php?post_type=aio_order", "فهرست سفارش‌ها"],
    ["/wp-admin/edit.php?post_type=aio_application", "فهرست درخواست‌ها"], ["/wp-admin/edit-tags.php?taxonomy=aio_dept&post_type=aio_job", "بخش‌ها"],
    ["/wp-admin/admin.php?page=aio-settings", "تنظیمات"], ["/wp-admin/admin.php?page=aio-settings&tab=lists", "فهرست‌ها"],
    ["/wp-admin/admin.php?page=aio-settings&tab=tests", "MBTI"], ["/wp-admin/admin.php?page=aio-settings&tab=tools", "ابزارها"],
    ["/wp-admin/nav-menus.php", "منوها"], ["/wp-admin/users.php", "کاربران"], ["/wp-admin/edit-comments.php", "دیدگاه‌ها"],
  ];
  for (const [u, label] of screens) {
    p.errors = [];
    await p.goto(BASE + u, { waitUntil: "load", timeout: 60000 }); await p.waitForTimeout(u.includes("post.php") ? 4000 : 800);
    const txt = await p.evaluate(() => document.body.innerText);
    const bad = /Fatal error|Warning:|Notice:|Deprecated:|خطای مهم/.test(txt);
    const errs = p.errors.filter(e => !/favicon|wp-json\/wp\/v2|block-editor|gravatar/i.test(e));
    check(!bad && !errs.length, `${label} ${bad ? "(PHP error in page)" : ""} ${errs.slice(0, 3).join(" | ")}`);
  }
  // تکرارشونده‌ی سرفصل دوره
  await p.goto(BASE + "/wp-admin/post.php?post=" + ids.course + "&action=edit", { waitUntil: "load" }); await p.waitForTimeout(4000);
  const reps = await p.evaluate(() => document.querySelectorAll("#aio_syllabus .aio-rep-item").length);
  check(reps > 10, "ویرایشگر سرفصل ماژول‌ها و درس‌ها را نشان می‌دهد: " + reps);
  // ذخیره‌ی تنظیمات
  await p.goto(BASE + "/wp-admin/admin.php?page=aio-settings&tab=contact", { waitUntil: "networkidle" });
  await p.fill('input[name="aio[phone]"]', "021-12345678");
  await Promise.all([p.waitForNavigation({ waitUntil: "networkidle" }), p.click("#submit")]);
  check(wp(`echo aio_opt("phone");`) === "021-12345678", "ذخیره‌ی تنظیمات تماس");
  const pub = await page(await b.newContext());
  await pub.goto(BASE + "/", { waitUntil: "networkidle" });
  check((await pub.locator("#site-footer").textContent()).includes("021-12345678"), "تلفن جدید در فوتر سایت نمایش داده شد");
  // ویرایش لیست‌ها: افزودن نوع همکاری
  await p.goto(BASE + "/wp-admin/admin.php?page=aio-settings&tab=lists", { waitUntil: "networkidle" });
  const ta = p.locator('textarea[name="aio[job_types]"]');
  await ta.fill((await ta.inputValue()) + "\nنیمه‌وقت آزمایشی");
  await Promise.all([p.waitForNavigation({ waitUntil: "networkidle" }), p.click("#submit")]);
  await pub.goto(BASE + "/jobs/", { waitUntil: "networkidle" });
  check((await pub.locator("#f-types").textContent()).includes("نیمه‌وقت آزمایشی"), "فهرست پایه‌ی جدید در فیلتر سایت ظاهر شد");
  await ta.page().goto(BASE + "/wp-admin/admin.php?page=aio-settings&tab=lists", { waitUntil: "networkidle" });
  const ta2 = p.locator('textarea[name="aio[job_types]"]');
  await ta2.fill((await ta2.inputValue()).replace("\nنیمه‌وقت آزمایشی", ""));
  await Promise.all([p.waitForNavigation({ waitUntil: "networkidle" }), p.click("#submit")]);
  wp(`$s=get_option("aio_settings"); $s["phone"]=""; update_option("aio_settings",$s); echo 1;`);
  const log = wp(`echo preg_match_all("/PHP (Fatal|Warning|Notice)/", (string) @file_get_contents(WP_CONTENT_DIR . "/debug.log"));`);
  console.log("   PHP warnings/notices in debug.log:", log);
  await b.close();
  done();
})();
