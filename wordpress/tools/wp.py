#!/usr/bin/env python3
"""کلاینت خط فرمان Novamira برای وردپرس aiolab.ir

اطلاعات ورود از .secrets/wp-aiolab.env خوانده می‌شود (هرگز داخل کد نیست).

نمونه‌ها:
  wp.py php 'return get_bloginfo("name");'
  wp.py php-file script.php          # اجرای یک فایل PHP (بدون تگ <?php)
  wp.py ability novamira/list-directory '{"path":"wp-content"}'
  wp.py upload local.zip wp-content/uploads/aio-deploy/x.zip
"""
import json
import os
import sys
import pathlib
import requests

ROOT = pathlib.Path(__file__).resolve().parents[2]
ENV = ROOT / ".secrets" / "wp-aiolab.env"


def load_env():
    env = {}
    for line in ENV.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        env[k.strip()] = v.strip().strip('"').strip("'")
    env["WP_API_PASSWORD"] = env["WP_API_PASSWORD"].replace(" ", "")
    return env


class Client:
    def __init__(self):
        e = load_env()
        self.url = e["WP_API_URL"]
        self.auth = (e["WP_API_USERNAME"], e["WP_API_PASSWORD"])
        self.sid = None
        self.n = 0
        self.s = requests.Session()
        self._init()

    def _post(self, payload):
        h = {"Content-Type": "application/json", "Accept": "application/json, text/event-stream", "Accept-Encoding": "gzip, deflate"}
        if self.sid:
            h["Mcp-Session-Id"] = self.sid
        r = self.s.post(self.url, json=payload, headers=h, auth=self.auth, timeout=300)
        if "Mcp-Session-Id" in r.headers:
            self.sid = r.headers["Mcp-Session-Id"]
        if r.status_code >= 400:
            raise SystemExit(f"HTTP {r.status_code}: {r.text[:800]}")
        txt = r.text.strip()
        if not txt:
            return None
        if txt.startswith("event:") or txt.startswith("data:"):
            data = [l[5:].strip() for l in txt.splitlines() if l.startswith("data:")]
            txt = data[-1] if data else "{}"
        return json.loads(txt)

    def _init(self):
        self.n += 1
        self._post({"jsonrpc": "2.0", "id": self.n, "method": "initialize",
                    "params": {"protocolVersion": "2025-06-18", "capabilities": {},
                               "clientInfo": {"name": "aiolab-cli", "version": "1"}}})
        self._post({"jsonrpc": "2.0", "method": "notifications/initialized"})

    def call(self, tool, args):
        self.n += 1
        res = self._post({"jsonrpc": "2.0", "id": self.n, "method": "tools/call",
                          "params": {"name": tool, "arguments": args}})
        if res is None:
            raise SystemExit("empty response")
        if "error" in res:
            raise SystemExit("RPC error: " + json.dumps(res["error"], ensure_ascii=False))
        content = res["result"].get("content", [])
        text = "".join(c.get("text", "") for c in content if c.get("type") == "text")
        try:
            return json.loads(text)
        except Exception:
            return text

    def ability(self, name, params):
        return self.call("mcp-adapter-execute-ability", {"ability_name": name, "parameters": params})

    def php(self, code):
        r = self.ability("novamira/execute-php", {"code": code})
        return r


def unwrap(r):
    """نتیجه‌ی execute-php را ساده می‌کند و خطاها را برجسته."""
    if isinstance(r, dict) and "data" in r:
        d = r["data"]
        if isinstance(d, dict) and "return_value" in d:
            out = {"return": d.get("return_value")}
            if d.get("output"):
                out["output"] = d["output"]
            if d.get("errors"):
                out["errors"] = d["errors"]
            return out
    return r


def main(argv):
    if len(argv) < 2:
        print(__doc__)
        return 1
    c = Client()
    cmd = argv[1]
    if cmd == "php":
        r = unwrap(c.php(argv[2]))
    elif cmd == "php-file":
        code = pathlib.Path(argv[2]).read_text()
        if code.lstrip().startswith("<?php"):
            code = code.lstrip()[5:]
        r = unwrap(c.php(code))
    elif cmd == "ability":
        r = c.ability(argv[2], json.loads(argv[3]) if len(argv) > 3 else {})
    elif cmd == "upload":
        r = upload(c, argv[2], argv[3])
    else:
        print(__doc__)
        return 1
    print(json.dumps(r, ensure_ascii=False, indent=1) if not isinstance(r, str) else r)
    return 0


def upload(c, local, remote):
    """آپلود یک فایل باینری با لینک موقت Novamira."""
    info = c.ability("novamira/create-upload-link", {"path": remote, "overwrite": True})
    d = info.get("data", info) if isinstance(info, dict) else info
    url = d.get("upload_url")
    if not url:
        raise SystemExit("no upload url: " + json.dumps(info, ensure_ascii=False)[:600])
    headers = {d.get("token_header", "Authorization"): d["upload_token"]}
    with open(local, "rb") as f:
        r = requests.put(url, data=f, headers=headers, timeout=600)
    if r.status_code >= 400:
        raise SystemExit(f"upload HTTP {r.status_code}: {r.text[:600]}")
    try:
        return r.json()
    except Exception:
        return r.text


if __name__ == "__main__":
    sys.exit(main(sys.argv))
