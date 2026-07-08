// Perde sektörü renk paleti. Nötr aileler (ekru/krem/bej/kahve/gri/taş) zengin;
// bunlar en çok satan tonlar. Her ailede açık/orta/koyu + gerektiğinde ara tonlar.
// "Basılı tut → bir açık + bir koyu" özelliği tonAc/tonKoyu ile runtime hesaplanır.

export interface Ton {
  ad: string;
  hex: string;
}
export interface RenkAilesi {
  aile: string;
  tonlar: Ton[];
}

export const PERDE_PALETI: RenkAilesi[] = [
  {
    aile: "Ekru",
    tonlar: [
      { ad: "Ekru — Açık", hex: "#F6F2E7" },
      { ad: "Ekru — Orta", hex: "#EBE3CE" },
      { ad: "Ekru — Koyu", hex: "#DBCEAF" },
    ],
  },
  {
    aile: "Krem",
    tonlar: [
      { ad: "Krem — Açık", hex: "#FBF6EA" },
      { ad: "Krem — Orta", hex: "#F3E9CF" },
      { ad: "Krem — Koyu", hex: "#E7D6AF" },
    ],
  },
  {
    aile: "Bej",
    tonlar: [
      { ad: "Bej — Açık", hex: "#EDE1CB" },
      { ad: "Bej — Orta", hex: "#DCC29B" },
      { ad: "Bej — Koyu", hex: "#C4A374" },
      { ad: "Kum Beji", hex: "#D8C4A0" },
    ],
  },
  {
    aile: "Taş / Vizon",
    tonlar: [
      { ad: "Taş — Açık", hex: "#E4DCCF" },
      { ad: "Vizon — Orta", hex: "#C6B49C" },
      { ad: "Vizon — Koyu", hex: "#A28E74" },
      { ad: "Kaya", hex: "#B7A88F" },
    ],
  },
  {
    aile: "Kahve",
    tonlar: [
      { ad: "Taba — Açık", hex: "#B58A63" },
      { ad: "Kahve — Orta", hex: "#8A5A38" },
      { ad: "Kahve — Koyu", hex: "#5C3A22" },
      { ad: "Bitter", hex: "#3E2817" },
    ],
  },
  {
    aile: "Gri",
    tonlar: [
      { ad: "Gri — Açık", hex: "#E5E6E9" },
      { ad: "Gri — Orta", hex: "#B6BABF" },
      { ad: "Gri — Koyu", hex: "#888E95" },
      { ad: "Açık Gri Bej", hex: "#D6D3CB" },
    ],
  },
  {
    aile: "Füme / Antrasit",
    tonlar: [
      { ad: "Füme — Açık", hex: "#707680" },
      { ad: "Füme — Orta", hex: "#4B5058" },
      { ad: "Antrasit", hex: "#2B2F35" },
    ],
  },
  {
    aile: "Beyaz",
    tonlar: [
      { ad: "Kar Beyazı", hex: "#FFFFFF" },
      { ad: "Kırık Beyaz", hex: "#F7F3EC" },
      { ad: "Sedef", hex: "#F1ECE2" },
    ],
  },
  {
    aile: "Pudra / Gül Kurusu",
    tonlar: [
      { ad: "Pudra", hex: "#E8D3CE" },
      { ad: "Gül Kurusu", hex: "#C08E90" },
      { ad: "Koyu Gül", hex: "#95666B" },
    ],
  },
  {
    aile: "Vurgu Renkleri",
    tonlar: [
      { ad: "Hardal", hex: "#C99A2E" },
      { ad: "Terracotta", hex: "#B5623C" },
      { ad: "Zeytin", hex: "#6E6E3C" },
      { ad: "Çağla", hex: "#9CAF88" },
      { ad: "Lacivert", hex: "#26324F" },
      { ad: "Bordo", hex: "#7B2233" },
      { ad: "Petrol", hex: "#2E5A5A" },
      { ad: "Siyah", hex: "#161616" },
    ],
  },
];

/* ---------- ton hesapları (HSL lightness) ---------- */

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  return [
    parseInt(n.slice(0, 2), 16),
    parseInt(n.slice(2, 4), 16),
    parseInt(n.slice(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  const k = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v)))
      .toString(16)
      .padStart(2, "0");
  return `#${k(r)}${k(g)}${k(b)}`;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0,
    g = 0,
    b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

function tonKaydir(hex: string, dL: number): string {
  const [r, g, b] = hexToRgb(hex);
  const [h, s, l] = rgbToHsl(r, g, b);
  const yeni = Math.max(0, Math.min(1, l + dL));
  const [nr, ng, nb] = hslToRgb(h, s, yeni);
  return rgbToHex(nr, ng, nb);
}

// Bir ton açık / bir ton koyu (basılı-tut menüsü için).
export function tonAc(hex: string): string {
  return tonKaydir(hex, 0.1);
}
export function tonKoyu(hex: string): string {
  return tonKaydir(hex, -0.1);
}

// Bir hex için palette adı (varsa) — gösterim amaçlı.
export function renkAdiBul(hex: string): string | null {
  const t = hex.toLowerCase();
  for (const aile of PERDE_PALETI) {
    for (const ton of aile.tonlar) {
      if (ton.hex.toLowerCase() === t) return ton.ad;
    }
  }
  return null;
}
