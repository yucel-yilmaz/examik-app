// Examik masaüstü tanıtım sayfası: işletim sistemini öne çıkarır, son sürümü GitHub'dan okur ve sayfa haritasını canlandırır.

const REPO = "yucel-yilmaz/examik-app";
const ASSETS = { windows: /\.exe$/i, mac: /\.dmg$/i };

function detectOs() {
  const platform = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || "";
  const ua = navigator.userAgent;
  if (/win/i.test(platform) || /Windows/.test(ua)) return "windows";
  if (/mac/i.test(platform) || /Mac OS X/.test(ua)) return /iPhone|iPad/.test(ua) ? null : "mac";
  return null;
}

function highlightOs() {
  const os = detectOs();
  if (!os) return;
  const downloads = document.querySelector(".downloads");
  const preferred = downloads.querySelector(`[data-os="${os}"]`);
  const other = downloads.querySelector(`[data-os]:not([data-os="${os}"])`);
  // Ziyaretçinin sistemi birincil düğme olur ve başa geçer.
  preferred.classList.replace("btn-ghost", "btn-primary");
  other.classList.replace("btn-primary", "btn-ghost");
  downloads.prepend(preferred);
  document.querySelector(`[data-os-card="${os}"]`)?.classList.add("current");
}

const DATE = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" });

async function loadRelease() {
  const label = document.querySelector("[data-release]");
  const downloads = document.querySelector(".downloads");
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers: { Accept: "application/vnd.github+json" } });
    if (res.status === 404) {
      // Henüz yayınlanmış sürüm yok: düğmeler pasif, açıklama dürüst.
      label.textContent = "İlk sürüm hazırlanıyor";
      downloads.querySelectorAll("[data-os]").forEach((a) => {
        a.setAttribute("aria-disabled", "true");
        a.removeAttribute("href");
      });
      downloads.dataset.state = "none";
      return;
    }
    if (!res.ok) throw new Error(String(res.status));
    const release = await res.json();
    for (const [os, pattern] of Object.entries(ASSETS)) {
      const asset = release.assets.find((a) => pattern.test(a.name));
      const link = downloads.querySelector(`[data-os="${os}"]`);
      if (asset) link.href = asset.browser_download_url;
    }
    const version = release.tag_name.replace(/^\D+/, "");
    label.textContent = `Sürüm ${version} · ${DATE.format(new Date(release.published_at))}`;
    downloads.dataset.state = "ready";
  } catch {
    // API'ye ulaşılamazsa düğmeler sürümler sayfasına gider.
    label.textContent = "Son sürüm";
    downloads.dataset.state = "fallback";
  }
}

// 24 sayfalık bir taramanın okunuşu: çoğu okunur, biri kontrol ister, biri okunamaz.
const PAGES = "oooooooooowoooooooobooooo".slice(0, 24).split("");

function animateMap() {
  const map = document.querySelector(".map");
  const count = document.querySelector("[data-count]");
  const tiles = PAGES.map(() => map.appendChild(document.createElement("span")));
  const done = () => {
    tiles.forEach((t, i) => (t.className = { o: "ok", w: "warn", b: "bad" }[PAGES[i]]));
    count.textContent = PAGES.filter((p) => p !== "b").length;
  };
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return done();

  let i = 0;
  let read = 0;
  const step = () => {
    if (i > 0) {
      const prev = tiles[i - 1];
      prev.className = { o: "ok", w: "warn", b: "bad" }[PAGES[i - 1]];
      if (PAGES[i - 1] !== "b") count.textContent = ++read;
    }
    if (i < tiles.length) {
      tiles[i].className = "reading";
      i++;
      setTimeout(step, 170);
    } else {
      // Bir süre sonuç gösterilir, sonra yeni tarama gelmiş gibi baştan başlar.
      setTimeout(() => {
        tiles.forEach((t) => (t.className = ""));
        count.textContent = "0";
        i = 0;
        read = 0;
        setTimeout(step, 900);
      }, 4200);
    }
  };
  // Pencere ekrana girince başlar.
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      io.disconnect();
      setTimeout(step, 600);
    }
  });
  io.observe(map);
}

highlightOs();
loadRelease();
animateMap();
