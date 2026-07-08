import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  jsonb,
  timestamp,
  boolean,
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
  // Aynı anda çalışabilecek çözgü sayısı (eşzamanlılık kapasitesi). UI 1–3 sınırlar.
  esZamanliCozgu: integer("eszamanli_cozgu").notNull().default(2),
  planTarihi: timestamp("plan_tarihi", { withTimezone: true }), // planlanan tarih
  arsivlendi: boolean("arsivlendi").notNull().default(false), // plan tamamlandı → arşiv
  sira: integer("sira").notNull().default(0), // pano sıralaması
  devir: integer("devir"),
  durum: text("durum").notNull().default("bos"), // bos | dolu | bakim
  takim: text("takim"), // takım bilgisi (ör. "8+2 sıra tahar 15 sıklık")
  aciklama: text("aciklama"), // biçimli (mini-markdown) serbest açıklama
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
  // taslak | sirada | aktif | tamam | arsiv — 'aktif' eşzamanlılık kapasitesini sayar.
  durum: text("durum").notNull().default("taslak"),
  notlar: text("notlar"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Tezgaha ait atkı ipliği havuzu — "bu tezgahta denenebilecek iplikler".
export const ndpIplik = pgTable("ndp_iplik", {
  id: uuid("id").primaryKey().defaultRandom(),
  tezgahId: uuid("tezgah_id")
    .notNull()
    .references(() => ndpTezgah.id, { onDelete: "cascade" }),
  ad: text("ad").notNull(),
  tip: text("tip"), // pamuk | polyester | ...
  renk: text("renk"), // hex (perde paletinden)
  renkAdi: text("renk_adi"), // palet adı, ör. "Bej — Orta"
  numara: text("numara"), // iplik numarası, ör. 30/2
  notlar: text("notlar"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Yapılacaklar (to-do) — çok seviyeli (parent_id self-ref).
// tezgah/numune bağı OPSİYONEL; son tarih + öncelik ile normal to-do.
export const ndpGorev = pgTable("ndp_gorev", {
  id: uuid("id").primaryKey().defaultRandom(),
  tezgahId: uuid("tezgah_id").references(() => ndpTezgah.id, {
    onDelete: "cascade",
  }), // opsiyonel bağ
  cozguId: uuid("cozgu_id").references(() => ndpCozgu.id, {
    onDelete: "set null",
  }), // opsiyonel bağ (silinince kopar)
  numuneId: uuid("numune_id").references(() => ndpNumune.id, {
    onDelete: "set null",
  }), // opsiyonel bağ (silinince kopar)
  parentId: uuid("parent_id"), // self-ref (alt görev); FK migration'da eklenir
  baslik: text("baslik").notNull(),
  tamamlandi: boolean("tamamlandi").notNull().default(false),
  sonTarih: timestamp("son_tarih", { withTimezone: true }), // termin
  oncelik: integer("oncelik").notNull().default(1), // 0 düşük · 1 normal · 2 yüksek
  sira: integer("sira").notNull().default(0),
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
  varyantSayisi: integer("varyant_sayisi").notNull().default(0), // planlanan varyant adedi
  aciklama: text("aciklama"), // biçimli (mini-markdown) serbest açıklama
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
export type Iplik = typeof ndpIplik.$inferSelect;
export type YeniIplik = typeof ndpIplik.$inferInsert;
export type Gorev = typeof ndpGorev.$inferSelect;
export type YeniGorev = typeof ndpGorev.$inferInsert;
