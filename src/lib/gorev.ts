// Görev (to-do) yardımcıları — türetilmiş gruplama/etiketler okuma anında hesaplanır.

export interface TarihKova {
  anahtar: string; // grup kimliği
  etiket: string; // başlık
  sira: number; // gösterim sırası (küçük = üstte)
  acil?: boolean; // gecikmiş/bugün → vurgulanır
}

// Gün başlangıcını verir (yerel saat).
function gunBasi(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// Bir son tarihi (ISO) bir gruba yerleştirir. Referans "şimdi" opsiyonel (test için).
export function tarihKovasi(
  sonTarih: string | null | undefined,
  simdi: Date = new Date(),
): TarihKova {
  if (!sonTarih) {
    return { anahtar: "tarihsiz", etiket: "Tarihsiz", sira: 6 };
  }
  const d = new Date(sonTarih);
  if (isNaN(d.getTime())) {
    return { anahtar: "tarihsiz", etiket: "Tarihsiz", sira: 6 };
  }
  const bugun = gunBasi(simdi);
  const hedef = gunBasi(d);
  const gunFark = Math.round(
    (hedef.getTime() - bugun.getTime()) / 86400000,
  );
  if (gunFark < 0) return { anahtar: "gecikmis", etiket: "Gecikmiş", sira: 0, acil: true };
  if (gunFark === 0) return { anahtar: "bugun", etiket: "Bugün", sira: 1, acil: true };
  if (gunFark === 1) return { anahtar: "yarin", etiket: "Yarın", sira: 2 };
  if (gunFark <= 7) return { anahtar: "bu-hafta", etiket: "Bu hafta", sira: 3 };
  if (gunFark <= 30) return { anahtar: "bu-ay", etiket: "Bu ay", sira: 4 };
  return { anahtar: "sonra", etiket: "Sonra", sira: 5 };
}

// Bir son tarih çipi için görsel durum: gecikmiş / bugün-yakın / normal.
export function tarihDurum(
  sonTarih: string | null | undefined,
  simdi: Date = new Date(),
): "gecikmis" | "yakin" | "normal" | null {
  if (!sonTarih) return null;
  const kova = tarihKovasi(sonTarih, simdi);
  if (kova.anahtar === "gecikmis") return "gecikmis";
  if (kova.anahtar === "bugun" || kova.anahtar === "yarin") return "yakin";
  return "normal";
}

// Kısa tarih (tr-TR) — boş/geçersiz → null.
export function tarihKisa(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? null
    : d.toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "2-digit",
      });
}
