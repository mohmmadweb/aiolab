<?php
/* شبیه‌ساز سرویس پیامک و API ربات برای تست محلی: هر درخواست در /tmp/aio-mock.log ثبت می‌شود */
file_put_contents('/tmp/aio-mock.log', json_encode(['url' => $_SERVER['REQUEST_URI'], 'method' => $_SERVER['REQUEST_METHOD'], 'body' => file_get_contents('php://input')], JSON_UNESCAPED_UNICODE) . "\n", FILE_APPEND);
header('Content-Type: application/json');
echo json_encode(['ok' => true, 'result' => ['id' => 1, 'first_name' => 'آیولب', 'username' => 'aiolab_test_bot', 'url' => 'x']]);
