#!/bin/sh
# پاک‌کردن محدودیت‌های نرخ (فقط محیط محلی) پیش از اجرای تست‌ها
cd "$(dirname "$0")/../local" && docker compose -p aiolab-local -f docker-compose.yml $( [ -f docker-compose.port.yml ] && echo -f docker-compose.port.yml ) run --rm -T cli transient delete --all >/dev/null 2>&1; echo limits-cleared
