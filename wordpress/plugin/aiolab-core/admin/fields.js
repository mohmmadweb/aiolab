/* آیولب — ویرایشگر فیلدهای تکرارشونده، انتخاب مرتب نوشته‌ها، رسانه، رنگ و نقشه در پیشخوان */
(function ($) {
  "use strict";

  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const optPairs = o => Array.isArray(o) ? o.map(x => Array.isArray(x) ? x : [x, x]) : Object.entries(o || {});

  /* ---------- رندر یک فیلد داخل آیتم تکرارشونده ---------- */
  function fieldHTML(f, val) {
    const t = f.type || "text", lab = `<label>${esc(f.label || f.key)}</label>`;
    if (t === "repeater") return `<div class="aio-f full" data-k="${f.key}">${lab}<div class="aio-rep-nested"></div></div>`;
    let input;
    switch (t) {
      case "textarea": case "html":
        input = `<textarea data-k="${f.key}" rows="${f.rows || 3}" ${t === "html" ? 'class="code" dir="ltr"' : ""}>${esc(val)}</textarea>`; break;
      case "lines":
        input = `<textarea data-k="${f.key}" data-lines="1" rows="${f.rows || 3}">${esc(Array.isArray(val) ? val.join("\n") : val)}</textarea>`; break;
      case "number":
        input = `<input type="number" step="any" dir="ltr" data-k="${f.key}" value="${esc(val)}">`; break;
      case "bool":
        input = `<label class="aio-switch"><input type="checkbox" data-k="${f.key}" ${val && val !== "0" ? "checked" : ""}> <span>بله</span></label>`; break;
      case "select":
        input = `<select data-k="${f.key}"><option value="">—</option>${optPairs(f.options).map(([k, v]) => `<option value="${esc(k)}" ${String(val) === String(k) ? "selected" : ""}>${esc(v)}</option>`).join("")}</select>`; break;
      case "color":
        input = `<input type="text" class="aio-color-in" dir="ltr" data-k="${f.key}" value="${esc(val)}">`; break;
      case "url":
        input = `<input type="url" dir="ltr" data-k="${f.key}" value="${esc(val)}">`; break;
      default:
        input = `<input type="text" data-k="${f.key}" value="${esc(val)}">`;
    }
    const wide = ["textarea", "html", "lines"].includes(t) ? "full" : "half";
    return `<div class="aio-f ${wide}">${lab}${input}</div>`;
  }

  /* ---------- ویرایشگر تکرارشونده ---------- */
  function Repeater(box, schema, value, label, titleKey) {
    this.box = box; this.schema = schema; this.items = Array.isArray(value) ? value : [];
    this.label = label || "مورد"; this.titleKey = titleKey || (schema[0] && schema[0].key);
    this.render();
  }
  Repeater.prototype.render = function () {
    const self = this;
    this.box.innerHTML = `<div class="aio-rep-list"></div><button type="button" class="button aio-rep-add">+ افزودن ${esc(this.label)}</button>`;
    const list = this.box.querySelector(".aio-rep-list");
    this.children = [];
    this.items.forEach((it, i) => list.appendChild(this.itemEl(it, i)));
    this.box.querySelector(".aio-rep-add").onclick = () => { self.collect(); self.items.push({}); self.render(); const last = list.lastElementChild; if (last) last.classList.add("open"); };
  };
  Repeater.prototype.itemEl = function (it, i) {
    const self = this, el = document.createElement("div");
    el.className = "aio-rep-item";
    const title = it[this.titleKey] ? String(Array.isArray(it[this.titleKey]) ? it[this.titleKey][0] : it[this.titleKey]).slice(0, 90) : "";
    el.innerHTML = `<div class="aio-rep-head"><span class="n">${(i + 1).toLocaleString("fa-IR")}</span><b>${esc(title || this.label + " جدید")}</b>
      <span class="acts"><button type="button" class="button-link up" title="بالا">▲</button><button type="button" class="button-link down" title="پایین">▼</button>
      <button type="button" class="button-link dup" title="تکثیر">⧉</button><button type="button" class="button-link del" title="حذف">✕</button></span></div>
      <div class="aio-rep-body aio-fields">${this.schema.map(f => fieldHTML(f, it[f.key] == null ? (f.default == null ? "" : f.default) : it[f.key])).join("")}</div>`;
    const kids = {};
    this.schema.filter(f => f.type === "repeater").forEach(f => {
      const host = el.querySelector(`.aio-f[data-k="${f.key}"] .aio-rep-nested`);
      kids[f.key] = new Repeater(host, f.fields, it[f.key] || [], f.item_label || "مورد", f.title_key);
    });
    this.children[i] = kids;
    el.querySelector(".aio-rep-head b").onclick = () => el.classList.toggle("open");
    el.querySelector(".n").onclick = () => el.classList.toggle("open");
    const act = (fn) => e => { e.preventDefault(); self.collect(); fn(); self.render(); };
    el.querySelector(".up").onclick = act(() => { if (i > 0) [self.items[i - 1], self.items[i]] = [self.items[i], self.items[i - 1]]; });
    el.querySelector(".down").onclick = act(() => { if (i < self.items.length - 1) [self.items[i + 1], self.items[i]] = [self.items[i], self.items[i + 1]]; });
    el.querySelector(".dup").onclick = act(() => self.items.splice(i + 1, 0, JSON.parse(JSON.stringify(self.items[i]))));
    el.querySelector(".del").onclick = e => { e.preventDefault(); if (!confirm("این مورد حذف شود؟")) return; self.collect(); self.items.splice(i, 1); self.render(); };
    return el;
  };
  Repeater.prototype.collect = function () {
    const els = this.box.querySelectorAll(":scope > .aio-rep-list > .aio-rep-item");
    this.items = [...els].map((el, i) => {
      const o = {};
      this.schema.forEach(f => {
        if (f.type === "repeater") { const r = this.children[i] && this.children[i][f.key]; o[f.key] = r ? r.collect() : []; return; }
        const inp = el.querySelector(`:scope > .aio-rep-body > .aio-f [data-k="${f.key}"]`);
        if (!inp) return;
        if (f.type === "bool") o[f.key] = inp.checked ? 1 : 0;
        else if (f.type === "lines") o[f.key] = inp.value.split("\n").map(s => s.trim()).filter(Boolean);
        else o[f.key] = inp.value;
      });
      return o;
    });
    return this.items;
  };

  /* ---------- انتخاب مرتب نوشته‌ها ---------- */
  function Posts(box) {
    const opts = optPairs(JSON.parse(box.dataset.options || "[]"));
    const label = Object.fromEntries(opts);
    const hidden = box.querySelector("input[type=hidden]");
    let val = JSON.parse(box.dataset.value || "[]").map(String);
    const ui = document.createElement("div");
    box.appendChild(ui);
    const draw = () => {
      hidden.value = JSON.stringify(val);
      ui.innerHTML = `<ol class="aio-posts-list">${val.map((v, i) => `<li><span>${esc(label[v] || v)}</span>
        <button type="button" class="button-link" data-a="up" data-i="${i}">▲</button><button type="button" class="button-link" data-a="down" data-i="${i}">▼</button>
        <button type="button" class="button-link" data-a="del" data-i="${i}">✕</button></li>`).join("")}</ol>
        <select class="aio-posts-add"><option value="">+ افزودن…</option>${opts.filter(([k]) => !val.includes(String(k))).map(([k, v]) => `<option value="${esc(k)}">${esc(v)}</option>`).join("")}</select>`;
      ui.querySelector(".aio-posts-add").onchange = e => { if (e.target.value) { val.push(e.target.value); draw(); } };
      ui.querySelectorAll("button").forEach(b => b.onclick = () => {
        const i = +b.dataset.i;
        if (b.dataset.a === "del") val.splice(i, 1);
        if (b.dataset.a === "up" && i > 0) [val[i - 1], val[i]] = [val[i], val[i - 1]];
        if (b.dataset.a === "down" && i < val.length - 1) [val[i + 1], val[i]] = [val[i], val[i + 1]];
        draw();
      });
    };
    draw();
  }

  /* ---------- نقشه‌ی انتخاب مختصات ---------- */
  function MapPick(box) {
    if (typeof L === "undefined") return;
    const form = box.closest(".aio-fields") || document;
    const latIn = form.querySelector(`[data-key="${box.dataset.lat}"] input`), lngIn = form.querySelector(`[data-key="${box.dataset.lng}"] input`);
    if (!latIn || !lngIn) return;
    box.style.height = "300px";
    const lat = parseFloat(latIn.value) || 32.4, lng = parseFloat(lngIn.value) || 53.7;
    const map = L.map(box).setView([lat, lng], latIn.value ? 13 : 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(map);
    let mk = latIn.value ? L.marker([lat, lng]).addTo(map) : null;
    map.on("click", e => {
      latIn.value = e.latlng.lat.toFixed(6); lngIn.value = e.latlng.lng.toFixed(6);
      if (mk) mk.setLatLng(e.latlng); else mk = L.marker(e.latlng).addTo(map);
    });
    setTimeout(() => map.invalidateSize(), 400);
  }

  /* گالری: چند تصویر از کتابخانه‌ی رسانه + عنوان هر تصویر + ترتیب */
  function Gallery(box) {
    const hidden = box.querySelector(":scope > input[type=hidden]");
    let items = JSON.parse(box.dataset.value || "[]");
    const host = document.createElement("div");
    box.appendChild(host);
    const save = () => { hidden.value = JSON.stringify(items.map(x => ({ att: x.att, t: x.t, c: x.c }))); };
    const draw = () => {
      host.innerHTML = `<div class="aio-gal">${items.map((x, i) => `<div class="aio-gal-item">
          <div class="aio-gal-img" style="background:${x.url ? "#f1f5f9" : (x.c || "#94a3b8")}">${x.url ? `<img src="${x.url}" alt="">` : "بدون تصویر"}</div>
          <input type="text" data-i="${i}" value="${(x.t || "").replace(/"/g, "&quot;")}" placeholder="عنوان">
          <div><button type="button" class="button-link" data-mv="${i}:-1">→</button> <button type="button" class="button-link aio-danger" data-rm="${i}">حذف</button> <button type="button" class="button-link" data-mv="${i}:1">←</button></div>
        </div>`).join("")}</div><button type="button" class="button" data-add>افزودن تصویر</button>`;
      save();
    };
    host.addEventListener("input", e => { if (e.target.dataset.i) { items[+e.target.dataset.i].t = e.target.value; save(); } });
    host.addEventListener("click", e => {
      const b = e.target.closest("button"); if (!b) return;
      e.preventDefault();
      if (b.dataset.rm) { items.splice(+b.dataset.rm, 1); draw(); }
      if (b.dataset.mv) { const [i, d] = b.dataset.mv.split(":").map(Number); if (items[i + d]) { [items[i], items[i + d]] = [items[i + d], items[i]]; draw(); } }
      if (b.dataset.add !== undefined) {
        const frame = wp.media({ title: "انتخاب تصاویر گالری", multiple: true, library: { type: "image" } });
        frame.on("select", () => {
          frame.state().get("selection").toJSON().forEach(a => items.push({ att: a.id, t: a.title || "", c: "", url: a.sizes && a.sizes.thumbnail ? a.sizes.thumbnail.url : a.url }));
          draw();
        });
        frame.open();
      }
    });
    draw();
  }

  $(function () {
    document.querySelectorAll(".aio-gallery").forEach(Gallery);
    const reps = [];
    document.querySelectorAll(".aio-repeater").forEach(box => {
      const hidden = box.querySelector(":scope > input[type=hidden]");
      const host = document.createElement("div");
      box.appendChild(host);
      const r = new Repeater(host, JSON.parse(box.dataset.schema), JSON.parse(box.dataset.value || "[]"), box.dataset.label, box.dataset.titleKey);
      reps.push([r, hidden]);
    });
    document.querySelectorAll(".aio-posts").forEach(Posts);
    document.querySelectorAll(".aio-map").forEach(MapPick);
    const sync = () => reps.forEach(([r, h]) => { h.value = JSON.stringify(r.collect()); });
    $("form#post, .aio-settings form, form#edittag, form#addtag").on("submit", sync);
    /* ویرایشگر بلوکی: فرم متاباکس‌ها با کلیک «به‌روزرسانی» ارسال می‌شود */
    if (window.wp && wp.data && wp.data.subscribe) {
      let was = false;
      wp.data.subscribe(() => {
        const ed = wp.data.select("core/editor");
        if (!ed) return;
        const saving = ed.isSavingPost() && !ed.isAutosavingPost();
        if (saving && !was) sync();
        was = saving;
      });
    }
    document.addEventListener("focusout", e => { if (e.target.closest && e.target.closest(".aio-repeater")) sync(); });

    $(".aio-color").wpColorPicker();

    $(document).on("click", ".aio-media-pick", function (e) {
      e.preventDefault();
      const wrap = $(this).closest(".aio-media");
      const frame = wp.media({ title: "انتخاب تصویر", multiple: false, library: { type: "image" } });
      frame.on("select", () => {
        const a = frame.state().get("selection").first().toJSON();
        wrap.find("input").val(a.id);
        wrap.find("img").attr("src", (a.sizes && a.sizes.thumbnail ? a.sizes.thumbnail.url : a.url)).show();
      });
      frame.open();
    });
    $(document).on("click", ".aio-media-clear", function (e) {
      e.preventDefault();
      const wrap = $(this).closest(".aio-media");
      wrap.find("input").val(""); wrap.find("img").hide();
    });
  });
})(jQuery);
