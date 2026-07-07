# NDP — Numune Dokuma Planlama · Başlangıç Brief

> Bu doküman yeni ve **bağımsız** bir uygulamanın seed spesifikasyonudur.
> Claude Code için giriş noktasıdır: implementasyona başlamadan önce buradaki
> Anayasa ve Altın Kural bölümlerine uyulmalı, kaymamalıdır.

---

## 1. Amaç ve kapsam

NDP, ARGE numune dokuma sürecinin **zaman ve kaynak planlaması** aracıdır.
Hangi numuneyi, hangi çözgüde, hangi sırayla, hangi tezgahta dokuyacağını yönetir.

**Bu uygulama ŞUDUR:** planlama · kuyruk · sıralama · çizelge.
**Bu uygulama ŞU DEĞİLDİR:** desen tasarımı. Desen tasarımı ayrı uygulamada kalır;
buraya sadece *import* edilir.

> İsim uyarısı: mevcut "Tezgah" adlı tasarım uygulamasıyla karıştırılmasın.
> Bu uygulamanın kimliği **planlama / çizelge** ekseninde kalır.

---

## 2. Anayasa (değişmez prensipler)

Diğer projelerdeki prensiplerle aynı:

1. **AI önerir / insan onaylar.** Otomatik hiçbir şey kesinleşmez.
2. **Master veri immutable + versiyon.** Import edilen veri damgalanır, üzerine yazılmaz.
3. **Türetilmiş değerler okuma anında hesaplanır** (ör. kalan metraj, kısıt kontrolleri).
   DB'de denormalize edilmez.
4. **Uygulamalar arası ayrım sadece export/import sözleşmesiyle.** Bkz. Altın Kural.
5. **Depolama disiplini — NDP sadece planlama verisi (satır/tablo) tutar.**
   Görsel/dosya gibi büyük ikili veriler DB'ye veya Supabase Storage'a **konmaz**;
   harici depolamada (ör. Cloudflare R2) tutulup URL ile referanslanır. DB'de yalnız
   `key`/URL saklanır. Bu, projenin küçük ve kota sınırlarından bağımsız kalmasını sağlar.

---

## 3. ALTIN KURAL — entegrasyon kuplajı yasak

> Bu proje çok farklı altyapıya sahip uygulamalarla aynı ekosistemde yaşıyor
> (Render, local, Cloudflare; Neon / Supabase / MSSQL). "Patlama" riski **sadece**
> veritabanlarını birbirine bağlarsan doğar.

**Kural:** NDP hiçbir dış uygulamaya canlı bağlanmaz, kimseye join atmaz,
kimsenin tablosunu okumaz. Her uygulama kendi DB'sinde kalır.

Sadece iki tip bağ vardır:

- **İçeri = kopya (snapshot).** Dış JSON import edilir → doğrulanır → NDP'nin
  *kendi* tablosuna kopyalanır, `kaynak` + `kaynak_versiyon` damgasıyla.
  Bir kez içeri girdi mi bağımsız yaşar; kaynak uygulama değişse/taşınsa/kapansa etkilenmez.
- **Dışarı = referans (link/ID).** Dış kaynağa sadece kod + deep-link URL bir text
  alanında tutulur. Tıkla-git. Veri çekilmez.

Hacim düşük (ARGE numunesi) → **manuel dosya/JSON import yeterli.**
Otomatik push/senkron YOK (en azından MVP'de).

---

## 4. Teknik stack

- **Kapsam: tek kullanıcı** (yalnızca geliştirici). Çok kullanıcı, rol, RLS YOK.
  Auth minimal — gerekirse tek paylaşılan gizli anahtar veya Tunnel arkası erişim yeter.
- **Değerlendirme sürümü:** Bu bir deneme. Amaç, mevcut süreçten *daha etkili* olduğunu
  kanıtlamak. Kanıtlanmazsa terk edilir → **hafif kur, altın kaplama yapma, taahhüt üretme.**
- Frontend: React + Vite + TypeScript, PWA, tablet-first, Canvas 2D (gerektiğinde).
- **DB: Neon (Postgres)** — Supabase DEĞİL. Ücretsiz katman, ayrı ve izole, kota derdi yok.
  Spec zaten Postgres olduğu için şema birebir taşınır; ileride kanıtlanırsa aynı Postgres
  üstünde büyür (yeniden yazım gerekmez).
- Veri erişimi: Supabase'in hazır API'si olmadığı için ince bir katman gerekir →
  **Netlify Functions + Neon serverless driver** (veya Drizzle/Prisma). Hep ücretsiz, sunucusuz.
- Deploy: Netlify (frontend + functions).
- Tablo prefix: **`ndp_`** — diğer projelerden (`tzg_`, `pano_`, fas) tam izole.

---

## 5. Veri modeli

Çekirdek hiyerarşi ve kardinalite:

```
Tezgah  1 ── N  Çözgü  1 ── N  Numune  ──(onay)──►  Kesin kuyruk / Çizelge
```

Kritik: **bir çözgü → N numune.** ARGE esnekliği bu ilişkide yaşar
(bir çözgü kur, atkı+örgü varyasyonuyla çok numune çıkar).

Kısıtlar yukarıdan aşağı zincirleme miras alınır (bkz. §6).

### Tablolar (öneri şeması)

**`ndp_tezgah`**
- `id`, `ad`, `marka` (ör. Stäubli), `tip` (dobby/armür)
- `cerceve_sayisi` (int) — sert limit
- `max_tarak_eni_cm` (numeric)
- `mekik_sayisi` (int) — atkı kutusu / eşzamanlı atkı rengi limiti
- `devir` (int, ops.), `durum` (boş/dolu/bakım), `notlar`

**`ndp_cozgu`** (bir tezgaha planlanır)
- `id`, `tezgah_id` (FK), `ad_kod`
- `iplik` (text/jsonb), `tarak_no`, `cozgu_sikligi` (tel/cm), `toplam_tel` (int)
- `cozgu_boyu_m` (numeric) — metraj bütçesinin kaynağı
- `tahar_tipi` (düz/kırık/…), `cerceve_kullanim` (int, ≤ tezgah.cerceve_sayisi)
- `renk_dizimi` (jsonb) — **renk dizimi BU uygulamada tanımlanır**, sıralı bloklar:
  `[{ "iplik": "...", "renk": "#...", "tel_adedi": N }, ...]`
- `durum`, `notlar`

**`ndp_numune`** (bir çözgüye bağlı = 1 kumaş)
- `id`, `cozgu_id` (FK), `ad_kod`
- `atki_iplikleri` (jsonb), `atki_sikligi` (atkı/cm)
- `orgu_snapshot_id` (FK → ndp_orgu_snapshot, nullable)
- `atki_renk_dizisi` (jsonb) — kullanılan renkler (mekik limiti kontrolü için)
- `tahmini_boy_m` (numeric)
- `durum` enum: `taslak | onayli | sirada | dokunuyor | dokundu | degerlendirme | tamam | iptal`
- **Dış referanslar (sadece text — join yok):**
  `arge_talep_kodu`, `arge_talep_url` (NumuneAtilim), `fas_ilham_url` (FAS)
- `sira_no` (int, çözgü içi dokuma sırası), `notlar`

**`ndp_orgu_snapshot`** (desen uygulamasından import edilen kopya)
- `id`, `kaynak` (ör. 'desen-app'), `kaynak_id`, `kaynak_versiyon`
- `cerceve_sayisi` (int), `tahar_tipi`
- `weavex_json` (jsonb) — makina formatı (tahar + armür/peg)
- `ad`, `olusturma_ts`
- *Immutable: import sonrası düzenlenmez, yeni versiyon = yeni kayıt.*

### Çizelge (ortak, çok tezgahlı)

ARGE planlaması **aynı anda birden çok tezgahta** yapıldığı için çizelge tek tezgah
değil, tüm tezgahlar için ortaktır. MVP için ağır bir tablo yerine sıralama
kolonları + türetilmiş görünüm yeterli:

- Tezgah şeridi = `ndp_cozgu` filtrele `tezgah_id`, sırala `tezgah_sira` (ndp_cozgu'ya `tezgah_sira` int ekle).
- Çözgü içi numune sırası = `ndp_numune.sira_no`.
- (Ops. sonra) planlı montaj tarihleri için `ndp_cizelge_kalem` eklenebilir.

---

## 6. Kısıt doğrulama kuralları (uygulama katmanı)

Bunlar NDP'nin "beyni" — dedike araç olmanın asıl değeri. Okuma anında hesaplanır,
ihlalde **engelle veya uyar**:

1. `orgu_snapshot.cerceve_sayisi ≤ cozgu.cerceve_kullanim ≤ tezgah.cerceve_sayisi`
2. `distinct(numune.atki_renk_dizisi) ≤ tezgah.mekik_sayisi`
3. `tahar_tipi` uyumu: örgü, çözgünün tahar tipiyle dokunabilir mi?
4. **Metraj bütçesi:** `Σ(numune.tahmini_boy_m + fire) ≤ cozgu.cozgu_boyu_m`
   → canlı "kalan X m, N numune daha sığar" göstergesi.

---

## 7. Çekirdek ekranlar

1. **Tezgah-şerit panosu** (ana ekran): her tezgah bir kolon; içinde çözgüler sırayla;
   her çözgünün altında numuneler. Tablet-first sürükle-bırak (kanban).
2. **Çözgü detay + renk-dizimi editörü:** sıralı (iplik, renk, tel adedi) blok listesi.
   *Tam çizgi simülatörü (Çözgü Çizgi Denemesi) yeniden yazılmaz;* istenirse aynı JSON
   kontratıyla oradan zengin tasarım import edilir. Planlama için blok listesi yeter.
3. **Numune editörü:** atkı + örgü (import) + sıklık; kısıt uyarıları anlık.
4. **Taslak havuz ↔ kesin kuyruk:** taslakta serbest planla; onayla → kuyruğa dondur.

---

## 8. Entegrasyon kontratları

| Kaynak | Yön | Mekanizma | NDP'deki alan |
|---|---|---|---|
| Desen uygulaması | içeri | WeaveX JSON import → snapshot kopya | `ndp_orgu_snapshot` |
| NumuneAtilim | dışarı | talep kodu + deep-link URL | `arge_talep_kodu/url` |
| FAS | dışarı | ilham URL | `fas_ilham_url` |
| Çizgi deseni app | içeri (ops.) | renk-dizimi JSON import | `ndp_cozgu.renk_dizimi` |

Hepsi §3 Altın Kural'a tabidir: canlı DB bağlantısı YOK.

---

## 9. MVP fazlama

- **Faz 1 — çekirdek değer (Excel'in yerini alır):**
  `ndp_tezgah` + `ndp_cozgu` (renk dizimi dahil) + `ndp_numune` CRUD,
  1→N ilişki, metraj bütçesi göstergesi.
- **Faz 2 — planlama:** ortak tezgah-şerit panosu, taslak/kesin ayrımı,
  durum yaşam döngüsü, sıralama.
- **Faz 3 — akıl:** kısıt doğrulama (çerçeve/tahar/mekik), desen import (WeaveX),
  çözgü değişim optimizasyonu.

**İlk iş:** Faz 1 şeması + boş tezgah/çözgü/numune CRUD + metraj göstergesi.
