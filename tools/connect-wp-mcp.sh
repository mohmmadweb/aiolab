#!/usr/bin/env bash
# اتصال Claude Code به وردپرس aiolab.ir از طریق افزونه‌ی Novamira
# اطلاعات ورود از .secrets/wp-aiolab.env خوانده می‌شود (هرگز داخل کد نوشته نمی‌شود)
#
# پیش‌نیازها (یک‌بار در پیشخوان وردپرس):
#   ۱) تنظیمات ← پیوندهای یکتا ← هر ساختاری غیر از «ساده» ← ذخیره
#   ۲) افزونه‌ی Novamira نصب، فعال و از صفحه‌ی Connect وصل شده باشد
#   ۳) کاربران ← پروفایل ← رمزهای ورود برنامه ← ساخت رمز
set -euo pipefail

ENV_FILE="$(cd "$(dirname "$0")/.." && pwd)/.secrets/wp-aiolab.env"
NAME="novamira-aiolab-ir"

[[ -f "$ENV_FILE" ]] || { echo "✗ فایل اطلاعات پیدا نشد: $ENV_FILE" >&2; exit 1; }
set -a; source "$ENV_FILE"; set +a
WP_API_PASSWORD="${WP_API_PASSWORD// /}"   # وردپرس رمز را با فاصله نشان می‌دهد

echo "→ بررسی $WP_API_URL"
code=$(curl -s -o /dev/null -w '%{http_code}' -u "$WP_API_USERNAME:$WP_API_PASSWORD" "$WP_API_URL" || true)
case "$code" in
  404) echo "✗ نقطه‌ی اتصال نیست. افزونه وصل نشده یا پیوند یکتا «ساده» است." >&2; exit 1 ;;
  401) echo "✗ نام کاربری یا رمز اپلیکیشن اشتباه است." >&2; exit 1 ;;
  405|200) echo "  ✓ نقطه‌ی اتصال پاسخ داد ($code)" ;;
  *)   echo "  پاسخ غیرمنتظره: $code (ادامه می‌دهیم)" ;;
esac

claude mcp remove "$NAME" --scope user 2>/dev/null || true
claude mcp add-json "$NAME" --scope user "$(cat <<JSON
{"command":"npx","args":["-y","@automattic/mcp-wordpress-remote@latest"],
 "env":{"WP_API_URL":"$WP_API_URL","WP_API_USERNAME":"$WP_API_USERNAME","WP_API_PASSWORD":"$WP_API_PASSWORD"}}
JSON
)"
echo "✓ سرور «$NAME» ثبت شد. برای فعال شدن، نشست جدید Claude Code باز کنید."
