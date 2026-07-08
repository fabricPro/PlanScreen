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
  esZamanliCozgu: number; // aynı anda çalışabilecek çözgü sayısı (kapasite)
  devir: number | null;
  durum: string;
  notlar: string | null;
  createdAt: string;
}

// Numunenin seçtiği atkı ipliği (havuzdan) — atkiIplikleri jsonb içinde.
export interface AtkiIplikRef {
  iplikId: string;
  ad: string;
  renk: string; // hex
}

// Tezgaha ait yapılacak (to-do) — çok seviyeli (parentId self-ref).
export interface Gorev {
  id: string;
  tezgahId: string;
  parentId: string | null;
  baslik: string;
  tamamlandi: boolean;
  sira: number;
  createdAt: string;
}

// Tezgaha ait atkı ipliği havuzu.
export interface Iplik {
  id: string;
  tezgahId: string;
  ad: string;
  tip: string | null;
  renk: string | null; // hex
  renkAdi: string | null;
  numara: string | null;
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
  atkiIplikleri: AtkiIplikRef[] | null; // havuzdan seçilen atkı iplikleri
  atkiSikligi: string | null;
  orguSnapshotId: string | null;
  atkiRenkDizisi: string[] | null; // kullanılan atkı renkleri (hex) — mekik kontrolü
  tahminiBoyM: string | null;
  durum: string;
  argeTalepKodu: string | null;
  argeTalepUrl: string | null;
  fasIlhamUrl: string | null;
  siraNo: number;
  notlar: string | null;
  createdAt: string;
}

// Desen uygulamasından import edilen örgü KOPYASI (immutable, Altın Kural §3).
export interface OrguSnapshot {
  id: string;
  kaynak: string | null;
  kaynakId: string | null;
  kaynakVersiyon: string | null;
  cerceveSayisi: number | null;
  taharTipi: string | null;
  weavexJson: unknown | null; // ham WeaveX blob
  ad: string | null;
  olusturmaTs: string;
}
