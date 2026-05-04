// piece-art.js — Flat crusader chess piece icons

// Cross-shaped hole path, centered at (cx, cy)
function crossHole(cx, cy, vw, vh, hw, hh) {
  const xl = cx - vw / 2, xr = cx + vw / 2;
  const yt = cy - vh / 2, yb = cy + vh / 2;
  const hxl = cx - hw / 2, hxr = cx + hw / 2;
  const hyt = cy - hh / 2, hyb = cy + hh / 2;
  return `M${xl} ${yt} L${xr} ${yt} L${xr} ${hyt} L${hxr} ${hyt} L${hxr} ${hyb} L${xr} ${hyb} L${xr} ${yb} L${xl} ${yb} L${xl} ${hyb} L${hxl} ${hyb} L${hxl} ${hyt} L${xl} ${hyt} Z`;
}

// T-visor hole: wide eye slit + narrow chin slit down to chinY
function visorHole(eyeY, chinY, cx, ew, eh, sw) {
  const ey2 = eyeY + eh;
  const ex1 = cx - ew / 2, ex2 = cx + ew / 2;
  const sx1 = cx - sw / 2, sx2 = cx + sw / 2;
  return `M${ex1} ${eyeY} L${ex2} ${eyeY} L${ex2} ${ey2} L${sx2} ${ey2} L${sx2} ${chinY} L${sx1} ${chinY} L${sx1} ${ey2} L${ex1} ${ey2} Z`;
}

// Circle hole path (for knight eye, uses two arcs)
function circleHole(cx, cy, r) {
  return `M${cx - r} ${cy} A${r} ${r} 0 1 0 ${cx + r} ${cy} A${r} ${r} 0 1 0 ${cx - r} ${cy}`;
}

// Two-tier base (standard and small)
const BASE    = '<rect x="26" y="70" width="48" height="7" rx="1"/><rect x="21" y="77" width="58" height="9" rx="1"/>';
const BASE_SM = '<rect x="30" y="70" width="40" height="7" rx="1"/><rect x="25" y="77" width="50" height="9" rx="1"/>';

// Wide pauldrons (king/queen) and narrow (bishop/pawn)
const PAUL_LG = '<path d="M11 33 L37 33 L37 49 L15 54 Z M89 33 L63 33 L63 49 L85 54 Z"/>';
const PAUL_SM = '<path d="M19 37 L38 37 L38 50 L24 54 Z M81 37 L62 37 L62 50 L76 54 Z"/>';

function mksvg(cc, body) {
  return `<svg viewBox="0 0 100 100" class="piece-icon ${cc}" xmlns="http://www.w3.org/2000/svg"><g fill="currentColor">${body}</g></svg>`;
}

const ICONS = {

  // ── KING ────────────────────────────────────────────────────────────────────
  // Latin cross finial on top, bucket helmet with T-visor, wide pauldrons, cross on body
  k: (cc) => mksvg(cc, `
    <path d="M47 1 L53 1 L53 7 L60 7 L60 14 L53 14 L53 21 L47 21 L47 14 L40 14 L40 7 L47 7 Z"/>
    <path fill-rule="evenodd" d="M36 19 C36 9 64 9 64 19 L64 38 L36 38 Z ${visorHole(23, 38, 50, 22, 6, 6)}"/>
    ${PAUL_LG}
    <path fill-rule="evenodd" d="M32 38 L68 38 L68 70 L32 70 Z ${crossHole(50, 54, 7, 22, 19, 7)}"/>
    ${BASE}`),

  // ── QUEEN ───────────────────────────────────────────────────────────────────
  // 5-spike crown (clearly different from king's cross), same helmet+body
  q: (cc) => mksvg(cc, `
    <path d="M29 30 L35 10 L41 26 L50 5 L59 26 L65 10 L71 30 Z"/>
    <path fill-rule="evenodd" d="M34 28 L66 28 L66 43 L34 43 Z ${visorHole(31, 43, 50, 22, 6, 6)}"/>
    ${PAUL_LG}
    <path fill-rule="evenodd" d="M32 43 L68 43 L68 70 L32 70 Z ${crossHole(50, 57, 7, 20, 19, 7)}"/>
    ${BASE}`),

  // ── BISHOP ──────────────────────────────────────────────────────────────────
  // Tall pointed mitre with cross cutout, T-visor collar, narrow pauldrons, cross on body
  b: (cc) => mksvg(cc, `
    <path fill-rule="evenodd" d="M50 3 L64 31 L36 31 Z ${crossHole(50, 18, 4, 14, 10, 4)}"/>
    <path fill-rule="evenodd" d="M36 29 L64 29 L64 44 L36 44 Z ${visorHole(32, 44, 50, 20, 6, 6)}"/>
    ${PAUL_SM}
    <path fill-rule="evenodd" d="M33 44 L67 44 L67 70 L33 70 Z ${crossHole(50, 57, 6, 18, 17, 6)}"/>
    ${BASE}`),

  // ── KNIGHT ──────────────────────────────────────────────────────────────────
  // Classic chess horse head profile facing right with crescent mane cutout
  n: (cc) => mksvg(cc, `
    <path fill-rule="evenodd" d="
      M32 72
      C24 58 24 42 30 30
      C36 18 46 10 58 7
      C68 4 78 8 80 20
      C82 30 78 42 70 48
      C66 52 62 56 64 62
      L64 72 Z
      M44 18
      C50 12 60 8 62 12
      C58 16 52 22 48 30
      C44 40 42 52 44 62
      C40 52 38 40 40 30
      C42 24 44 18 44 18 Z
    "/>
    <circle cx="70" cy="22" r="4"/>
    <rect x="24" y="71" width="52" height="6" rx="1"/>
    <rect x="19" y="77" width="62" height="9" rx="1"/>`),

  // ── ROOK ────────────────────────────────────────────────────────────────────
  // 3-merlon battlement top, tower body with cross cutout
  r: (cc) => mksvg(cc, `
    <path d="M27 7 L38 7 L38 20 L44 20 L44 7 L56 7 L56 20 L62 20 L62 7 L73 7 L73 27 L27 27 Z"/>
    <path fill-rule="evenodd" d="M30 27 L70 27 L70 70 L30 70 Z ${crossHole(50, 49, 7, 30, 22, 8)}"/>
    ${BASE}`),

  // ── PAWN ────────────────────────────────────────────────────────────────────
  // Small dome helmet with T-visor, narrow pauldrons, cross on body
  p: (cc) => mksvg(cc, `
    <path fill-rule="evenodd" d="M38 41 C38 23 62 23 62 41 L62 51 L38 51 Z ${visorHole(31, 51, 50, 16, 5, 5)}"/>
    ${PAUL_SM}
    <path fill-rule="evenodd" d="M36 51 L64 51 L64 70 L36 70 Z ${crossHole(50, 60, 6, 16, 16, 6)}"/>
    ${BASE_SM}`),
};

const PHOTO_ASSET_FILES = {
  k: "ChatGPT Image May 4, 2026, 05_46_51 PM (1).png",
  q: "ChatGPT Image May 4, 2026, 05_46_51 PM (2).png",
  b: "ChatGPT Image May 4, 2026, 05_46_51 PM (3).png",
  n: "ChatGPT Image May 4, 2026, 05_46_52 PM (4).png",
  r: "ChatGPT Image May 4, 2026, 05_46_52 PM (5).png",
  p: "ChatGPT Image May 4, 2026, 05_46_52 PM (6).png",
};

const PHOTO_CROP = { x: 330, y: 70, w: 620, h: 860 };
const PHOTO_CACHE = new Map();
const PHOTO_LOADING = new Map();

function photoAssetUrl(type) {
  const file = PHOTO_ASSET_FILES[type] || PHOTO_ASSET_FILES.p;
  return `/assets/${encodeURIComponent(file)}`;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function recolorPixel(r, g, b, colorCode) {
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;

  if (colorCode === "b") {
    const tone = Math.max(30, Math.min(118, lum * 0.48));
    return [Math.max(0, tone - 8), Math.max(0, tone - 5), tone];
  }

  const tone = Math.max(190, Math.min(248, lum * 1.06));
  return [tone, Math.max(0, tone - 2), Math.max(0, tone - 8)];
}

function trimBounds(imageData, width, height) {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const a = imageData[(y * width + x) * 4 + 3];
      if (a === 0) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }

  if (maxX < minX || maxY < minY) {
    return { x: 0, y: 0, w: width, h: height };
  }
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

async function buildPhotoPiece(type, colorCode) {
  const img = await loadImage(photoAssetUrl(type));
  const src = document.createElement("canvas");
  src.width = PHOTO_CROP.w;
  src.height = PHOTO_CROP.h;

  const srcCtx = src.getContext("2d", { willReadFrequently: true });
  srcCtx.drawImage(
    img,
    PHOTO_CROP.x,
    PHOTO_CROP.y,
    PHOTO_CROP.w,
    PHOTO_CROP.h,
    0,
    0,
    PHOTO_CROP.w,
    PHOTO_CROP.h,
  );

  const image = srcCtx.getImageData(0, 0, PHOTO_CROP.w, PHOTO_CROP.h);
  const data = image.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (a === 0) continue;

    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    if (lum < 68) {
      data[i + 3] = 0;
      continue;
    }

    const [nr, ng, nb] = recolorPixel(r, g, b, colorCode);
    data[i] = nr;
    data[i + 1] = ng;
    data[i + 2] = nb;
  }

  srcCtx.putImageData(image, 0, 0);

  const box = trimBounds(data, PHOTO_CROP.w, PHOTO_CROP.h);
  const out = document.createElement("canvas");
  out.width = 96;
  out.height = 96;

  const outCtx = out.getContext("2d");
  const pad = 4;
  const scale = Math.min((out.width - pad * 2) / box.w, (out.height - pad * 2) / box.h);
  const drawW = box.w * scale;
  const drawH = box.h * scale;
  const dx = (out.width - drawW) / 2;
  const dy = (out.height - drawH) / 2;

  outCtx.imageSmoothingEnabled = true;
  outCtx.drawImage(src, box.x, box.y, box.w, box.h, dx, dy, drawW, drawH);

  return out.toDataURL("image/png");
}

function applyLoadedPhoto(key, dataUrl) {
  if (typeof document === "undefined") return;
  const imgs = document.querySelectorAll(`img.piece-photo[data-photo-key="${key}"]`);
  imgs.forEach((img) => {
    img.src = dataUrl;
    img.classList.add("is-ready");
    const wrap = img.closest(".piece-photo-wrap");
    if (wrap) wrap.classList.add("asset-ready");
  });
}

function ensurePhotoAsset(type, colorCode) {
  const key = `${type}:${colorCode}`;
  if (PHOTO_CACHE.has(key) || PHOTO_LOADING.has(key)) return;

  const task = buildPhotoPiece(type, colorCode)
    .then((dataUrl) => {
      PHOTO_CACHE.set(key, dataUrl);
      applyLoadedPhoto(key, dataUrl);
    })
    .catch(() => {
      // Keep SVG fallback if an asset can't be processed.
    })
    .finally(() => {
      PHOTO_LOADING.delete(key);
    });

  PHOTO_LOADING.set(key, task);
}

export function pieceMarkup(pieceSymbol) {
  if (!pieceSymbol) return "";

  const type = pieceSymbol.toLowerCase();
  const colorClass = pieceSymbol === pieceSymbol.toUpperCase() ? "piece-white" : "piece-black";
  const colorCode = colorClass === "piece-white" ? "w" : "b";
  const key = `${type}:${colorCode}`;
  const generator = ICONS[type] || ICONS.p;
  const readyPhoto = PHOTO_CACHE.get(key);

  if (!readyPhoto) {
    ensurePhotoAsset(type, colorCode);
  }

  const wrapClass = readyPhoto ? "piece-asset-wrap piece-photo-wrap asset-ready" : "piece-asset-wrap piece-photo-wrap";
  const imgClass = readyPhoto ? "piece-photo is-ready" : "piece-photo";
  const srcAttr = readyPhoto ? ` src="${readyPhoto}"` : "";

  return `<span class="${wrapClass}">${generator(colorClass)}<img class="${imgClass}" data-photo-key="${key}" alt="" draggable="false"${srcAttr}></span>`;
}

