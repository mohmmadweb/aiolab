#!/usr/bin/env python3
"""بازسازی sitemap.xml از AIO_SITEMAP در app.js و شناسه‌های واقعی data.js."""
import re, datetime, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
src = (root / "assets/js/app.js").read_text(encoding="utf-8")
data = (root / "assets/js/data.js").read_text(encoding="utf-8")
today = datetime.date.today().isoformat()
statics = re.findall(r'\{ path: "([^"]+)"', src)
skip = {"learn.html", "course-builder.html", "dashboard.html", "employer.html", "404.html",
        "login.html", "register.html", "job.html", "lab.html", "exam.html", "course.html", "path.html"}
urls = [(p, "1.0" if p == "index.html" else "0.8", "weekly") for p in statics if p not in skip]
urls += [(f"job.html?id={i}", "0.6", "weekly") for i in re.findall(r'\{ id: (\d+), title: "[^"]+", labId', data)]
urls += [(f"lab.html?id={i}", "0.6", "monthly") for i in re.findall(r'\{ id: (\d+), name: "[^"]+", vertical', data)]
urls += [(f"exam.html?id={i}", "0.5", "monthly") for i in re.findall(r'\{ id: (\d+), title: "[^"]+", vertical: "lab", dept', data)]
urls += [(f"course.html?id={i}", "0.7", "monthly") for i in re.findall(r'\{ id: (\d+), type: "(?:course|guided)"', data)]
urls += [(f"path.html?id={i}", "0.7", "monthly") for i in re.findall(r'\{ id: "([\w-]+)", kind:', data)]
xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
xml += "".join(f'  <url><loc>https://aiolab.ir/{u.replace("&", "&amp;")}</loc><lastmod>{today}</lastmod>'
               f'<changefreq>{f}</changefreq><priority>{p}</priority></url>\n' for u, p, f in urls)
xml += "</urlset>\n"
(root / "sitemap.xml").write_text(xml, encoding="utf-8")
print(f"sitemap.xml: {len(urls)} urls")
