import type { Numune } from "./types";

// Metraj bütçesi — CLAUDE.md §6.4. Türetilmiş değer: okuma anında hesaplanır,
// DB'de denormalize edilmez. Faz 1 kararı: fire = 0 (Σ tahmini_boy_m ≤ cozgu_boyu_m).
// `fire` ileride eklenirse burası tek değişim noktası.

export interface MetrajOzet {
  butceM: number; // çözgü boyu (bütçe)
  kullanilanM: number; // Σ numune tahmini boy
  kalanM: number; // bütçe − kullanılan
  asim: boolean; // kalan < 0
  ortalamaNumuneM: number | null; // sığdırma tahmini için
  sigabilecekEkNumune: number | null; // kalan / ortalama
}

function toNum(v: string | number | null | undefined): number {
  if (v == null) return 0;
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

export function hesaplaMetraj(
  cozguBoyuM: string | number | null | undefined,
  numuneler: Pick<Numune, "tahminiBoyM">[],
): MetrajOzet {
  const butceM = toNum(cozguBoyuM);
  const boylar = numuneler.map((n) => toNum(n.tahminiBoyM));
  const kullanilanM = boylar.reduce((a, b) => a + b, 0);
  const kalanM = butceM - kullanilanM;

  const boyluNumuneler = boylar.filter((b) => b > 0);
  const ortalamaNumuneM =
    boyluNumuneler.length > 0
      ? boyluNumuneler.reduce((a, b) => a + b, 0) / boyluNumuneler.length
      : null;

  const sigabilecekEkNumune =
    ortalamaNumuneM && ortalamaNumuneM > 0
      ? Math.max(0, Math.floor(kalanM / ortalamaNumuneM))
      : null;

  return {
    butceM,
    kullanilanM,
    kalanM,
    asim: kalanM < 0,
    ortalamaNumuneM,
    sigabilecekEkNumune,
  };
}
