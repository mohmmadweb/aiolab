/* ==========================================
   آیولب — ماژول نقشه
   موتور: Leaflet (متن‌باز، بدون نیاز به کلید)
   ارائه‌دهنده کاشی‌ها قابل تعویض است:
     - osm     : OpenStreetMap (پیش‌فرض، بدون کلید، بدون هزینه)
     - neshan  : نقشه نشان (فارسی، بومی ایران) — نیازمند کلید رایگان از developer.neshan.org
   برای سوییچ به نشان کافی است کلید را در AIO_MAP_CONFIG.neshanKey بگذارید.
   بلد (balad.ir) فقط امکان iframe embed می‌دهد و SDK عمومی برای پین‌گذاری چندگانه ندارد،
   بنابراین برای نمایش هم‌زمان ده‌ها مرکز روی یک نقشه مناسب نیست.
   ========================================== */

const AIO_MAP_CONFIG = {
  provider: "osm",          // "osm" | "neshan"
  neshanKey: "",            // کلید رایگان وب از developer.neshan.org اینجا قرار می‌گیرد
  neshanMapType: "neshan",  // neshan | dreamy | standard-day | standard-night
  center: [32.4279, 53.6880], // مرکز ایران
  zoom: 5
};

const AIO_TILES = {
  osm: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; مشارکت‌کنندگان OpenStreetMap",
    maxZoom: 19
  },
  neshan: {
    // کاشی‌های رستری نشان — نیازمند کلید معتبر وب
    url: "https://api.neshan.org/v4/static/{z}/{x}/{y}?key={key}&type={type}",
    attribution: "نقشه: نشان (neshan.org)",
    maxZoom: 18
  }
};

/* آیا Leaflet لود شده است؟ */
function mapReady() { return typeof L !== "undefined"; }

function tileLayerFor() {
  const p = AIO_MAP_CONFIG.provider;
  if (p === "neshan" && AIO_MAP_CONFIG.neshanKey) {
    const t = AIO_TILES.neshan;
    return L.tileLayer(
      t.url.replace("{key}", AIO_MAP_CONFIG.neshanKey).replace("{type}", AIO_MAP_CONFIG.neshanMapType),
      { attribution: t.attribution, maxZoom: t.maxZoom }
    );
  }
  const t = AIO_TILES.osm;
  return L.tileLayer(t.url, { attribution: t.attribution, maxZoom: t.maxZoom });
}

/* آیکون پین سفارشی به رنگ هر مرکز */
function aioPin(color, label) {
  return L.divIcon({
    className: "aio-pin-wrap",
    html: `<div class="aio-pin" style="background:${color}">
             <span>${label || ""}</span>
             <i style="border-top-color:${color}"></i>
           </div>`,
    iconSize: [34, 44],
    iconAnchor: [17, 44],
    popupAnchor: [0, -42]
  });
}

/* ---------- نقشه فهرست مراکز ---------- */
function renderLabsMap(elId, labs, onSelect) {
  if (!mapReady()) { document.getElementById(elId).innerHTML = mapFallbackHTML(labs); return null; }

  const map = L.map(elId, { scrollWheelZoom: false, attributionControl: true })
    .setView(AIO_MAP_CONFIG.center, AIO_MAP_CONFIG.zoom);
  tileLayerFor().addTo(map);
  map.on("click", () => map.scrollWheelZoom.enable());

  const markers = [];
  labs.forEach(l => {
    if (typeof l.lat !== "number" || typeof l.lng !== "number") return;
    const initial = l.name.replace("آزمایشگاه ", "").replace("شرکت ", "").charAt(0);
    const m = L.marker([l.lat, l.lng], { icon: aioPin(l.color, initial) }).addTo(map);
    const jobsCount = (typeof AIO_JOBS !== "undefined") ? AIO_JOBS.filter(j => j.labId === l.id).length : 0;
    m.bindPopup(`
      <div class="map-pop">
        <b>${l.name} ${l.verified ? "✔️" : ""}</b>
        <span class="mp-type">${l.type} · ${l.city}</span>
        <div class="mp-row">
          <span class="mp-star">★ ${l.rating.toLocaleString("fa-IR")}</span>
          <span>میانگین حقوق: ${l.avgSalary.toLocaleString("fa-IR")} م.ت</span>
        </div>
        <div class="mp-row"><span>${jobsCount.toLocaleString("fa-IR")} فرصت شغلی فعال</span></div>
        <a class="mp-btn" href="lab.html?id=${l.id}">مشاهده مرکز</a>
      </div>`);
    m.on("click", () => onSelect && onSelect(l));
    markers.push({ id: l.id, marker: m });
  });

  if (markers.length) {
    const group = L.featureGroup(markers.map(m => m.marker));
    map.fitBounds(group.getBounds().pad(0.25));
  }

  return {
    map,
    focus(id) {
      const m = markers.find(x => x.id === id);
      if (!m) return;
      map.setView(m.marker.getLatLng(), 14, { animate: true });
      m.marker.openPopup();
    }
  };
}

/* ---------- نقشه انتخاب موقعیت (ثبت آزمایشگاه) ---------- */
function renderPickerMap(elId, opts) {
  opts = opts || {};
  const el = document.getElementById(elId);
  if (!mapReady()) { el.innerHTML = '<div class="map-fallback">نقشه در دسترس نیست (اتصال به CDN برقرار نشد).</div>'; return null; }

  const start = (opts.lat && opts.lng) ? [opts.lat, opts.lng] : AIO_MAP_CONFIG.center;
  const map = L.map(elId).setView(start, opts.lat ? 14 : AIO_MAP_CONFIG.zoom);
  tileLayerFor().addTo(map);

  let marker = null;
  function place(latlng) {
    if (marker) marker.setLatLng(latlng);
    else marker = L.marker(latlng, { icon: aioPin("#0d9488", "📍"), draggable: true }).addTo(map)
      .on("dragend", e => opts.onPick && opts.onPick(e.target.getLatLng()));
    opts.onPick && opts.onPick(marker.getLatLng());
  }
  if (opts.lat && opts.lng) place([opts.lat, opts.lng]);
  map.on("click", e => place(e.latlng));

  return {
    map,
    goTo(lat, lng, zoom) { map.setView([lat, lng], zoom || 13); },
    setPin(lat, lng) { place([lat, lng]); map.setView([lat, lng], 14); },
    clear() { if (marker) { map.removeLayer(marker); marker = null; } }
  };
}

/* ---------- در صورت در دسترس نبودن نقشه ---------- */
function mapFallbackHTML(labs) {
  return `<div class="map-fallback">
    <b>نقشه بارگذاری نشد</b>
    <p>اتصال به سرویس نقشه برقرار نشد. فهرست مراکز در بخش زیر همچنان در دسترس است.</p>
    <span>${labs.length.toLocaleString("fa-IR")} مرکز ثبت‌شده</span>
  </div>`;
}
