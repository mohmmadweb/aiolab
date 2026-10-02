#!/bin/sh
# پاک‌کردن شمارنده‌های محدودیت نرخ روی سایت زنده (فقط transientهای aio_rl)
python3 "$(dirname "$0")/../tools/wp.py" php 'global $wpdb; return $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE \"\\_transient\\_aio\\_rl\\_%\" OR option_name LIKE \"\\_transient\\_timeout\\_aio\\_rl\\_%\"");' | tr -d '\n '; echo
