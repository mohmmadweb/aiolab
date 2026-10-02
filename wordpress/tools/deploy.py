#!/usr/bin/env python3
"""انتشار قالب و افزونه‌ی آیولب روی aiolab.ir از طریق Novamira

مراحل: ساخت zip ← آپلود با لینک موقت ← باز کردن در پوشه‌ی موقت ← جابه‌جایی اتمیک با نسخه‌ی قبلی
← (اختیاری) فعال‌سازی ← همگام‌سازی برگه‌ها و پاک‌سازی کش

  deploy.py            انتشار افزونه و قالب
  deploy.py plugin     فقط افزونه
  deploy.py theme      فقط قالب
  deploy.py --activate فعال‌سازی و درون‌ریزی داده‌های نمونه (فقط بار اول)
"""
import io, os, sys, time, zipfile, pathlib, json
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from wp import Client, unwrap, upload

ROOT = pathlib.Path(__file__).resolve().parents[1]
SKIP = {"_raw", "node_modules", ".DS_Store"}


def build_zip(src: pathlib.Path, name: str) -> pathlib.Path:
    out = pathlib.Path(os.environ.get("TMPDIR", "/tmp/claude-1000")) / f"{name}.zip"
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        for f in sorted(src.rglob("*")):
            if f.is_dir() or any(part in SKIP for part in f.parts):
                continue
            z.write(f, f"{name}/{f.relative_to(src)}")
    return out


SWAP_PHP = r'''
$zip = WP_CONTENT_DIR . '/uploads/aio-deploy/%(name)s.zip';
$dest_parent = %(parent)s;
$dest = $dest_parent . '/%(name)s';
$tmp = $dest_parent . '/.%(name)s-new';
$bak = WP_CONTENT_DIR . '/uploads/aio-deploy/%(name)s-prev-' . date('Ymd-His');
$rm = function ($d) use (&$rm) { if (!is_dir($d)) return; foreach (array_diff(scandir($d), ['.', '..']) as $f) { $p = "$d/$f"; is_dir($p) ? $rm($p) : unlink($p); } rmdir($d); };
if (!file_exists($zip)) return ['error' => 'zip missing'];
$rm($tmp);
$z = new ZipArchive();
if ($z->open($zip) !== true) return ['error' => 'zip open failed'];
@mkdir($tmp, 0755, true);
$z->extractTo($tmp);
$z->close();
if (!is_dir("$tmp/%(name)s")) return ['error' => 'bad zip layout'];
/* جابه‌جایی: نسخه‌ی قبلی به پوشه‌ی پشتیبان منتقل می‌شود (قابل بازگشت) */
if (is_dir($dest)) rename($dest, $bak);
rename("$tmp/%(name)s", $dest);
$rm($tmp);
unlink($zip);
/* فقط ۳ نسخه‌ی پشتیبان آخر نگه داشته شود */
$baks = glob(WP_CONTENT_DIR . '/uploads/aio-deploy/%(name)s-prev-*', GLOB_ONLYDIR) ?: [];
sort($baks);
while (count($baks) > 3) $rm(array_shift($baks));
if (function_exists('opcache_reset')) @opcache_reset();
return ['ok' => true, 'files' => iterator_count(new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dest, FilesystemIterator::SKIP_DOTS))), 'backup' => is_dir($bak) ? basename($bak) : null];
'''

POST_PHP = r'''
$out = [];
if (function_exists('aio_sync_pages')) $out['pages'] = aio_sync_pages();
if (function_exists('aio_add_rewrites')) { aio_add_rewrites(); flush_rewrite_rules(false); }
do_action('aio_data_changed');
$out['active_plugin'] = is_plugin_active('aiolab-core/aiolab-core.php');
$out['theme'] = get_stylesheet();
return $out;
'''

ACTIVATE_PHP = r'''
require_once ABSPATH . 'wp-admin/includes/plugin.php';
$r = activate_plugin('aiolab-core/aiolab-core.php');
if (is_wp_error($r)) return ['error' => $r->get_error_message()];
return ['activated' => is_plugin_active('aiolab-core/aiolab-core.php')];
'''

IMPORT_PHP = r'''
$r = aio_import_all();
switch_theme('aiolab');
flush_rewrite_rules(false);
return ['import' => $r, 'theme' => get_stylesheet(), 'front' => get_option('page_on_front'), 'cs' => aio_opt('cs_enabled'), 'preview' => home_url('/?preview=' . aio_opt('cs_preview_key'))];
'''


def ship(c, name, src, parent):
    z = build_zip(src, name)
    print(f"→ {name}: {z.stat().st_size // 1024} KB")
    upload(c, str(z), f"wp-content/uploads/aio-deploy/{name}.zip")
    r = unwrap(c.php(SWAP_PHP % {"name": name, "parent": parent}))
    print("  ", json.dumps(r, ensure_ascii=False))
    if not (isinstance(r, dict) and isinstance(r.get("return"), dict) and r["return"].get("ok")):
        raise SystemExit("✗ deploy failed")


def main():
    args = sys.argv[1:]
    c = Client()
    what = [a for a in args if not a.startswith("--")] or ["plugin", "theme"]
    if "plugin" in what:
        ship(c, "aiolab-core", ROOT / "plugin/aiolab-core", "WP_PLUGIN_DIR")
    if "theme" in what:
        ship(c, "aiolab", ROOT / "theme/aiolab", "get_theme_root()")
    if "--activate" in args:
        print("→ activate:", json.dumps(unwrap(c.php(ACTIVATE_PHP)), ensure_ascii=False))
        print("→ import:", json.dumps(unwrap(c.php(IMPORT_PHP)), ensure_ascii=False)[:1500])
    else:
        c2 = Client()  # نشست تازه تا کد جدید بارگذاری شود
        print("→ post:", json.dumps(unwrap(c2.php(POST_PHP)), ensure_ascii=False)[:1500])


if __name__ == "__main__":
    main()
