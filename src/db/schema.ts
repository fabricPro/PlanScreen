import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";

// NDP çekirdek hiyerarşi: Tezgah 1─N Çözgü 1─N Numune.
// Tüm tablolar `ndp_` prefix ile izole (CLAUDE.md §4).
// Master veri immutable + versiyon; türetilmiş değerler (metraj) DB'de tutulmaz.

// jsonb şekilleri lib/types.ts içinde tiplenir; burada esnek jsonb olarak saklanır.

export const ndpTezgah = pgTable("ndp_tezgah", {
  id: uuid("id").primaryKey().defaultRandom(),
  ad: text("ad").notNull(),
  marka: text("marka"),
  tip: text("tip"), // dobby | armür
  cerceveSayisi: integer("cerceve_sayisi").notNull().default(0), // sert limit
  maxTarakEniCm: numeric("max_tarak_eni_cm"),
  mekikSayisi: integer("mekik_sayisi").notNull().default(1), // atkı kutusu limiti
  devir: integer("devir"),
  durum: text("durum").notNull().default("bos"), // bos | dolu | bakim
  notlar: text("notlar"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Örgü snapshot — desen uygulamasından import edilen KOPYA (Faz 3 import UI).
// Faz 1'de sadece şema; immutable (import sonrası düzenlenmez, yeni versiyon = yeni kayıt).
export const ndpOrguSnapshot = pgTable("ndp_orgu_snapshot", {
  id: uuid("id").primaryKey().defaultRandom(),
  kaynak: text("kaynak"), // ör. 'desen-app'
  kaynakId: text("kaynak_id"),
  kaynakVersiyon: text("kaynak_versiyon"),
  cerceveSayisi: integer("cerceve_sayisi"),
  taharTipi: text("tahar_tipi"),
  weavexJson: jsonb("weavex_json"), // makina formatı (tahar + armür/peg)
  ad: text("ad"),
  olusturmaTs: timestamp("olusturma_ts", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const ndpCozgu = pgTable("ndp_cozgu", {
  id: uuid("id").primaryKey().defaultRandom(),
  tezgahId: uuid("tezgah_id")
    .notNull()
    .references(() => ndpTezgah.id, { onDelete: "cascade" }),
  adKod: text("ad_kod").notNull(),
  iplik: text("iplik"),
  tarakNo: text("tarak_no"),
  cozguSikligi: numeric("cozgu_sikligi"), // tel/cm
  toplamTel: integer("toplam_tel"),
  cozguBoyuM: numeric("cozgu_boyu_m"), // metraj bütçesinin kaynağı
  taharTipi: text("tahar_tipi"), // düz | kırık | ...
  cerceveKullanim: integer("cerceve_kullanim"), // ≤ tezgah.cerceve_sayisi
  renkDizimi: jsonb("renk_dizimi"), // [{ iplik, renk, tel_adedi }, ...]
  tezgahSira: integer("tezgah_sira").notNull().default(0), // Faz 2 panosu için
  durum: text("durum").notNull().default("taslak"),
  notlar: text("notlar"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const ndpNumune = pgTable("ndp_numune", {
  id: uuid("id").primaryKey().defaultRandom(),
  cozguId: uuid("cozgu_id")
    .notNull()
    .references(() => ndpCozgu.id, { onDelete: "cascade" }),
  adKod: text("ad_kod").notNull(),
  atkiIplikleri: jsonb("atki_iplikleri"),
  atkiSikligi: numeric("atki_sikligi"), // atkı/cm
  // Faz 1'de örgü snapshot olmadan numune girilebilir → nullable FK.
  orguSnapshotId: uuid("orgu_snapshot_id").references(() => ndpOrguSnapshot.id, {
    onDelete: "set null",
  }),
  atkiRenkDizisi: jsonb("atki_renk_dizisi"), // mekik limiti kontrolü (Faz 3) için
  tahminiBoyM: numeric("tahmini_boy_m"), // metraj göstergesinin girdisi
  durum: text("durum").notNull().default("taslak"),
  // taslak | onayli | sirada | dokunuyor | dokundu | degerlendirme | tamam | iptal
  // Dış referanslar — SADECE text, join yok (Altın Kural §3):
  argeTalepKodu: text("arge_talep_kodu"),
  argeTalepUrl: text("arge_talep_url"),
  fasIlhamUrl: text("fas_ilham_url"),
  siraNo: integer("sira_no").notNull().default(0), // çözgü içi dokuma sırası
  notlar: text("notlar"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Tezgah = typeof ndpTezgah.$inferSelect;
export type YeniTezgah = typeof ndpTezgah.$inferInsert;
export type Cozgu = typeof ndpCozgu.$inferSelect;
export type YeniCozgu = typeof ndpCozgu.$inferInsert;
export type Numune = typeof ndpNumune.$inferSelect;
export type YeniNumune = typeof ndpNumune.$inferInsert;
export type OrguSnapshot = typeof ndpOrguSnapshot.$inferSelect;
