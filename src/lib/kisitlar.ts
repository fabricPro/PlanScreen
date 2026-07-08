import type { Cozgu, Numune, OrguSnapshot, Tezgah } from "./types";

// Kısıt doğrulama motoru (CLAUDE.md §6) — NDP'nin "beyni".
// Türetilmiş değerler gibi OKUMA ANINDA hesaplanır; DB'de tutulmaz.
// Karar: ihlal ENGELLEMEZ, yalnız UYARIR (Anayasa 1: AI önerir/insan onaylar).

export type KisitDurum = "ok" | "uyari" | "bilgiYok";

export interface KisitSonuc {
  anahtar: "cerceve" | "tahar" | "mekik";
  durum: KisitDurum;
  mesaj: string;
}

// 1) Çerçeve zinciri: snapshot.cerceve ≤ cozgu.cerceve_kullanim ≤ tezgah.cerceve
function cerceveKisiti(
  tezgah: Tezgah,
  cozgu: Cozgu,
  snapshot: OrguSnapshot | null,
): KisitSonuc {
  const kullanim = cozgu.cerceveKullanim;
  const orgu = snapshot?.cerceveSayisi ?? null;

  if (kullanim == null) {
    return {
      anahtar: "cerceve",
      durum: "bilgiYok",
      mesaj: "Çözgü çerçeve kullanımı girilmemiş.",
    };
  }
  if (kullanim > tezgah.cerceveSayisi) {
    return {
      anahtar: "cerceve",
      durum: "uyari",
      mesaj: `Çözgü ${kullanim} çerçeve kullanıyor, tezgah ${tezgah.cerceveSayisi} çerçeveli.`,
    };
  }
  if (orgu != null && orgu > kullanim) {
    return {
      anahtar: "cerceve",
      durum: "uyari",
      mesaj: `Örgü ${orgu} çerçeve istiyor, çözgü kullanımı ${kullanim}.`,
    };
  }
  return { anahtar: "cerceve", durum: "ok", mesaj: "Çerçeve zinciri uygun." };
}

// 2) Tahar uyumu: örgünün tahar tipi çözgünün tahar tipiyle uyuşuyor mu?
function taharKisiti(cozgu: Cozgu, snapshot: OrguSnapshot | null): KisitSonuc {
  if (!snapshot || !snapshot.taharTipi || !cozgu.taharTipi) {
    return {
      anahtar: "tahar",
      durum: "bilgiYok",
      mesaj: "Örgü veya çözgü tahar tipi eksik.",
    };
  }
  if (snapshot.taharTipi !== cozgu.taharTipi) {
    return {
      anahtar: "tahar",
      durum: "uyari",
      mesaj: `Örgü tahar tipi (${snapshot.taharTipi}) çözgüyle (${cozgu.taharTipi}) uyuşmuyor.`,
    };
  }
  return { anahtar: "tahar", durum: "ok", mesaj: "Tahar tipi uyumlu." };
}

// 3) Mekik: farklı atkı rengi sayısı ≤ tezgah mekik sayısı
function mekikKisiti(tezgah: Tezgah, numune: Numune): KisitSonuc {
  const renkler = Array.isArray(numune.atkiRenkDizisi)
    ? numune.atkiRenkDizisi
    : [];
  if (renkler.length === 0) {
    return {
      anahtar: "mekik",
      durum: "bilgiYok",
      mesaj: "Atkı renkleri girilmemiş.",
    };
  }
  const farkli = new Set(renkler.map((r) => r.toLowerCase())).size;
  if (farkli > tezgah.mekikSayisi) {
    return {
      anahtar: "mekik",
      durum: "uyari",
      mesaj: `${farkli} farklı atkı rengi, tezgah ${tezgah.mekikSayisi} mekikli.`,
    };
  }
  return {
    anahtar: "mekik",
    durum: "ok",
    mesaj: `${farkli} atkı rengi ≤ ${tezgah.mekikSayisi} mekik.`,
  };
}

// Bir numune için tüm kısıtlar. Snapshot yoksa çerçeve+tahar "bilgiYok" olur.
export function numuneKisitlari(
  tezgah: Tezgah,
  cozgu: Cozgu,
  numune: Numune,
  snapshot: OrguSnapshot | null,
): KisitSonuc[] {
  return [
    cerceveKisiti(tezgah, cozgu, snapshot),
    taharKisiti(cozgu, snapshot),
    mekikKisiti(tezgah, numune),
  ];
}

// Uyarı sayısı (ihlal göstergesi için).
export function uyariSayisi(sonuclar: KisitSonuc[]): number {
  return sonuclar.filter((s) => s.durum === "uyari").length;
}
