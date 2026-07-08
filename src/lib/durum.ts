import type { NumuneDurum } from "./types";

// Numune durum yaşam döngüsü (CLAUDE.md §5, §9 Faz 2).
// Doğrusal akış; `iptal` her aşamadan sapma, geri alınca taslağa döner.
export const NUMUNE_DURUM_AKISI: NumuneDurum[] = [
  "taslak",
  "onayli",
  "sirada",
  "dokunuyor",
  "dokundu",
  "degerlendirme",
  "tamam",
];

export function sonrakiDurum(d: string): NumuneDurum | null {
  const i = NUMUNE_DURUM_AKISI.indexOf(d as NumuneDurum);
  if (i < 0 || i >= NUMUNE_DURUM_AKISI.length - 1) return null;
  return NUMUNE_DURUM_AKISI[i + 1];
}

export function oncekiDurum(d: string): NumuneDurum | null {
  const i = NUMUNE_DURUM_AKISI.indexOf(d as NumuneDurum);
  if (i <= 0) return null;
  return NUMUNE_DURUM_AKISI[i - 1];
}

// Taslak = serbest havuz; onaylı ve sonrası = kesin kuyruk (dondurulmuş).
export function isTaslak(d: string): boolean {
  return d === "taslak";
}
export function isKesin(d: string): boolean {
  return d !== "taslak" && d !== "iptal";
}
export function isIptal(d: string): boolean {
  return d === "iptal";
}

// Durum → kısa görsel etiket rengi (badge sınıfı için).
export function durumRengi(d: string): string {
  if (isIptal(d)) return "#9aa3ad";
  if (d === "tamam") return "#1f9d55";
  if (d === "taslak") return "#b0872a";
  return "#2f6fed"; // kesin kuyruktaki ara durumlar
}
