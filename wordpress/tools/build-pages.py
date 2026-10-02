#!/usr/bin/env python3
"""تبدیل صفحات دمو به برگه‌های وردپرس
خروجی:
  plugin/aiolab-core/data/pages.json  — محتوای هر برگه به‌صورت بلوک‌های «HTML سفارشی» (هر بخش یک بلوک)
  plugin/aiolab-core/data/menus.json  — منوی بالا و ستون‌های فوتر (از AIO_NAV / AIO_FOOTER)
  theme/aiolab/assets/js/pages/_raw/{role}.js — اسکریپت درون‌خطی هر صفحه (برای بازنویسی دستی)
"""
import json, re, pathlib
from html.parser import HTMLParser
import sys
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from page_patches import apply_patches

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "wordpress"
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr", "path", "circle", "rect", "line", "ellipse", "polygon", "polyline", "stop"}

TITLES = {
    "index": "خانه", "jobs": "فرصت‌های شغلی", "job": "قالب صفحه‌ی آگهی", "labs": "آزمایشگاه‌ها روی نقشه", "lab": "قالب صفحه‌ی مرکز",
    "ranking": "رتبه‌بندی مراکز", "dashboard": "داشبورد کارجو", "employer": "پنل کارفرما", "exams": "آزمون و گواهینامه", "exam": "قالب صفحه‌ی آزمون",
    "assessment": "خودارزیابی مهارت", "mbti": "تست شخصیت‌شناسی MBTI", "courses": "آکادمی آیولب", "course": "قالب صفحه‌ی دوره",
    "learn": "قالب محیط یادگیری", "path": "قالب صفحه‌ی مسیر یادگیری", "course-builder": "ساخت دوره", "magazine": "مجله آیولب",
    "community": "جامعه آزمایشگاهی", "faq": "سؤالات پرتکرار", "services": "خدمات آیولب", "pricing": "تعرفه‌ها و اشتراک‌ها",
    "reports": "گزارش بازار کار", "advertise": "تبلیغات و همکاری", "about": "درباره ما", "contact": "تماس با ما", "login": "ورود",
    "register": "ثبت‌نام", "404": "صفحه پیدا نشد",
    "companies": "شرکت‌ها", "products": "محصولات و تجهیزات", "product": "قالب صفحه‌ی محصول", "talent": "مرکز تطبیق هوشمند",
}
ORDER = list(TITLES)
TPL = {"job", "lab", "course", "exam", "path", "learn", "product"}
MAPS = {"labs", "lab", "employer", "companies"}
# اجزای مشترک دمو و وردپرس — عیناً کپی می‌شوند تا یک منبع حقیقت بماند
SHARED = ["css/style.css", "js/match.js", "js/talent-ui.js", "js/resume-builder.js", "js/talent-center.js", "js/employer-talent.js"]


def role_of(name):
    if name == "index":
        return "home"
    if name in TPL:
        return "tpl-" + name
    return name


class Splitter(HTMLParser):
    """موقعیت عناصر سطح بالا را در متن خام پیدا می‌کند"""
    def __init__(self, src):
        super().__init__(convert_charrefs=False)
        self.src = src
        self.lines = [0]
        for m in re.finditer("\n", src):
            self.lines.append(m.end())
        self.depth = 0
        self.starts = []

    def off(self):
        l, c = self.getpos()
        return self.lines[l - 1] + c

    def handle_starttag(self, tag, attrs):
        if self.depth == 0:
            self.starts.append(self.off())
        if tag not in VOID:
            self.depth += 1

    def handle_startendtag(self, tag, attrs):
        if self.depth == 0:
            self.starts.append(self.off())

    def handle_endtag(self, tag):
        if tag not in VOID:
            self.depth -= 1


def convert_links(s):
    # لینک‌های تک‌صفحه با شناسه‌ی دمو → نشانگر برای درون‌ریز: {{course:8}}
    s = re.sub(r'(job|lab|course|exam|path|product)\.html\?id=([\w-]+)', r'{{\1:\2}}', s)
    s = re.sub(r'(?<![\w/.-])index\.html(#[\w-]+)?', lambda m: "/" + (m.group(1) or ""), s)
    s = re.sub(r'(?<![\w/.-])([a-z][a-z0-9-]*)\.html', r'/\1/', s)
    return s


def blocks(body):
    sp = Splitter(body)
    sp.feed(body)
    starts = sp.starts + [len(body)]
    out = []
    prev_end = 0
    for i in range(len(starts) - 1):
        seg_start = starts[i]
        lead = body[prev_end:seg_start]
        comments = re.findall(r"<!--.*?-->", lead, re.S)
        seg = body[seg_start:starts[i + 1]].strip()
        prev_end = starts[i + 1]
        if not seg:
            continue
        html = ("\n".join(c for c in comments) + "\n" if comments else "") + seg
        out.append(html.strip())
    return out


def main():
    import shutil
    for rel in SHARED:
        shutil.copyfile(ROOT / "assets" / rel, OUT / "theme/aiolab/assets" / rel)
    pages = []
    rawdir = OUT / "theme/aiolab/assets/js/pages/_raw"
    rawdir.mkdir(parents=True, exist_ok=True)
    for i, name in enumerate(ORDER):
        src = (ROOT / f"{name}.html").read_text()
        desc = re.search(r'<meta name="description" content="([^"]*)"', src)
        ttl = re.search(r"<title>([^<]*)</title>", src)
        active = re.search(r'<body data-page="([^"]+)"', src).group(1).replace(".html", "")
        body = re.search(r"<body[^>]*>(.*)</body>", src, re.S).group(1)
        scripts = re.findall(r"<script>(.*?)</script>", body, re.S)
        body = re.sub(r"<script[^>]*>.*?</script>", "", body, flags=re.S)
        body = re.sub(r'<header id="site-header"[^>]*></header>', "", body)
        body = re.sub(r'<footer id="site-footer"[^>]*></footer>', "", body)
        body = apply_patches(name, body)
        body = convert_links(body)
        content = "\n\n".join(f"<!-- wp:html -->\n{b}\n<!-- /wp:html -->" for b in blocks(body))
        role = role_of(name)
        pages.append({"role": role, "slug": role, "title": TITLES[name], "desc": desc.group(1) if desc else "",
                      "active": "home" if active == "index" else active, "order": i, "maps": name in MAPS, "seo_title": ttl.group(1).strip() if ttl and name not in TPL else "",
                      "status": "private" if (name in TPL or name == "404") else "publish", "content": content})
        if scripts:
            (rawdir / f"{role}.js").write_text("\n".join(scripts).strip() + "\n")
    # برگه‌های جدید (در دمو نبودند)
    pages.append({"role": "checkout", "slug": "checkout", "title": "پرداخت سفارش", "desc": "", "active": "services", "order": 90, "maps": False, "status": "publish", "content": ""})
    pages.append({"role": "verify", "slug": "verify-certificate", "title": "استعلام گواهی", "desc": "استعلام اصالت گواهی‌های صادرشده‌ی آیولب با کد رهگیری.", "active": "exams", "order": 91, "maps": False, "status": "publish", "content": ""})
    (OUT / "plugin/aiolab-core/data/pages.json").write_text(json.dumps(pages, ensure_ascii=False, indent=1))

    # منوها از app.js
    app = (ROOT / "assets/js/app.js").read_text()
    nav_src = re.search(r"const AIO_NAV = (\[.*?\n\]);", app, re.S).group(1)
    foot_src = re.search(r"const AIO_FOOTER = (\[.*?\n\]);", app, re.S).group(1)
    import subprocess
    js = f"const n={nav_src};const f={foot_src};console.log(JSON.stringify({{n,f}}))"
    data = json.loads(subprocess.check_output(["node", "-e", js]).decode())
    conv = lambda h: convert_links(h)
    menus = {"primary": {"name": "منوی اصلی", "items": []}}
    for it in data["n"]:
        item = {"label": it["label"], "href": conv(it["href"]) if it.get("href") else "#"}
        if it.get("children"):
            item["children"] = [{"label": c["label"], "href": conv(c["href"]), "desc": c.get("desc", ""), "icon": c.get("icon", "")} for c in it["children"]]
        menus["primary"]["items"].append(item)
    for k, col in enumerate(data["f"]):
        menus[f"footer_{k + 1}"] = {"name": col["title"], "items": [{"label": l, "href": conv(h)} for h, l in col["links"]]}
    (OUT / "plugin/aiolab-core/data/menus.json").write_text(json.dumps(menus, ensure_ascii=False, indent=1))
    print(len(pages), "pages;", sum(p["content"].count("<!-- wp:html -->") for p in pages), "blocks")


main()
