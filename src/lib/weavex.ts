// WeaveX örgü import doğrulaması (CLAUDE.md §8).
// Gerçek desen-app formatı henüz sabit değil → makul minimal şema.
// İçeri = doğrula → kopya. Ham JSON tümüyle weavex_json'a yazılır (immutable).

// ndp_orgu_snapshot'a insert edilecek doğrulanmış kayıt (kolonlara maplenmiş).
export interface WeaveXSnapshotGirdi {
  kaynak: string;
  kaynakId: string | null;
  kaynakVersiyon: string | null;
  cerceveSayisi: number;
  taharTipi: string;
  ad: string;
  weavexJson: unknown; // ham blob (kopya)
}

export type WeaveXSonuc =
  | { ok: true; snapshot: WeaveXSnapshotGirdi }
  | { ok: false; hata: string };

function metin(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

export function parseWeaveX(raw: unknown): WeaveXSonuc {
  let obj = raw;
  if (typeof raw === "string") {
    try {
      obj = JSON.parse(raw);
    } catch {
      return { ok: false, hata: "Geçersiz JSON — ayrıştırılamadı." };
    }
  }
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    return { ok: false, hata: "Beklenen bir JSON nesnesi (obje) değil." };
  }
  const o = obj as Record<string, unknown>;

  const ad = metin(o.ad);
  if (!ad) return { ok: false, hata: "'ad' alanı zorunlu." };

  const taharTipi = metin(o.tahar_tipi);
  if (!taharTipi) return { ok: false, hata: "'tahar_tipi' alanı zorunlu." };

  const cerceveSayisi = Number(o.cerceve_sayisi);
  if (!Number.isInteger(cerceveSayisi) || cerceveSayisi <= 0) {
    return { ok: false, hata: "'cerceve_sayisi' pozitif tam sayı olmalı." };
  }

  return {
    ok: true,
    snapshot: {
      kaynak: metin(o.kaynak) ?? "desen-app",
      kaynakId: metin(o.kaynak_id),
      kaynakVersiyon: metin(o.kaynak_versiyon),
      cerceveSayisi,
      taharTipi,
      ad,
      weavexJson: obj, // ham kopya
    },
  };
}

// Örgüler ekranındaki "yapıştır" alanı için örnek şablon.
export const WEAVEX_ORNEK = JSON.stringify(
  {
    ad: "Örnek örgü — 8 çerçeve düz",
    kaynak: "desen-app",
    kaynak_id: "DSN-1024",
    kaynak_versiyon: "v3",
    cerceve_sayisi: 8,
    tahar_tipi: "duz",
    tahar: [1, 2, 3, 4, 5, 6, 7, 8],
    armur: [
      [1, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 0, 0, 0, 0, 0, 0],
    ],
  },
  null,
  2,
);
