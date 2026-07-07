// Paylaşılan tipler — jsonb şekilleri ve durum enum'ları.
// Frontend ve functions aynı sözleşmeyi kullanır.

export const NUMUNE_DURUMLARI = [
  "taslak",
  "onayli",
  "sirada",
  "dokunuyor",
  "dokundu",
  "degerlendirme",
  "tamam",
  "iptal",
] as const;
export type NumuneDurum = (typeof NUMUNE_DURUMLARI)[number];

export const TEZGAH_DURUMLARI = ["bos", "dolu", "bakim"] as const;
export type TezgahDurum = (typeof TEZGAH_DURUMLARI)[number];

// renk_dizimi: sıralı bloklar — renk dizimi BU uygulamada tanımlanır (CLAUDE.md §5).
export interface RenkBlok {
  iplik: string;
  renk: string; // #RRGGBB
  tel_adedi: number;
}

// Domain tipleri (API üzerinden gelen JSON — numeric alanlar string olabilir).
export interface Tezgah {
  id: string;
  ad: string;
  marka: string | null;
  tip: string | null;
  cerceveSayisi: number;
  maxTarakEniCm: string | null;
  mekikSayisi: number;
  devir: number | null;
  durum: string;
  notlar: string | null;
  createdAt: string;
}

export interface Cozgu {
  id: string;
  tezgahId: string;
  adKod: string;
  iplik: string | null;
  tarakNo: string | null;
  cozguSikligi: string | null;
  toplamTel: number | null;
  cozguBoyuM: string | null;
  taharTipi: string | null;
  cerceveKullanim: number | null;
  renkDizimi: RenkBlok[] | null;
  tezgahSira: number;
  durum: string;
  notlar: string | null;
  createdAt: string;
}

export interface Numune {
  id: string;
  cozguId: string;
  adKod: string;
  atkiIplikleri: unknown | null;
  atkiSikligi: string | null;
  orguSnapshotId: string | null;
  atkiRenkDizisi: unknown | null;
  tahminiBoyM: string | null;
  durum: string;
  argeTalepKodu: string | null;
  argeTalepUrl: string | null;
  fasIlhamUrl: string | null;
  siraNo: number;
  notlar: string | null;
  createdAt: string;
}
