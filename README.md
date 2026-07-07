# NDP — Numune Dokuma Planlama

ARGE numune dokuma sürecinin **zaman ve kaynak planlaması** aracı.
Hangi numuneyi, hangi çözgüde, hangi sırayla, hangi tezgahta dokuyacağını yönetir.
Detaylı spesifikasyon için [`CLAUDE.md`](./CLAUDE.md).

> Bu uygulama planlama · kuyruk · sıralama · çizelge aracıdır — desen tasarımı değil.

## Stack

- React + Vite + TypeScript (tablet-first)
- Neon (Postgres) · Drizzle ORM · `@neondatabase/serverless`
- Netlify Functions (serverless API) + Netlify deploy
- Tablo prefix: `ndp_` (izole)

## Kurulum

```bash
npm install
cp .env.example .env      # DATABASE_URL'i Neon bağlantı dizesiyle doldurun
npm run db:generate       # şemadan SQL migration üretir (offline)
npm run db:migrate        # migration'ı Neon'a uygular (WebSocket; DATABASE_URL ister)
# Proxy/egress WebSocket'i engelliyorsa HTTP driver ile uygulayın:
npm run db:migrate:http   # aynı migration'ı Neon HTTP driver ile uygular
# ...veya drizzle/*.sql içeriğini Neon panosundaki SQL Editor'e yapıştırın.
npx netlify-cli dev       # functions + frontend → http://localhost:8888
```

`netlify-cli` bilinçli olarak bağımlılık listesinde değil (ağır; hafif kur
ilkesi). Yerelde functions'ı çalıştırmak için `npx netlify-cli dev` yeterli.
Salt frontend için `npm run dev:vite` (functions proxy'si 8888'e gider).

## Kapsam

**Faz 1 — çekirdek değer**
- `ndp_tezgah` · `ndp_cozgu` (renk dizimi dahil) · `ndp_numune` CRUD
- Tezgah 1─N Çözgü 1─N Numune drill-down ("Liste" sekmesi)
- Canlı **metraj bütçesi göstergesi** (`Σ tahmini_boy_m ≤ cozgu_boyu_m`)

**Faz 2 — planlama** ("Pano" sekmesi)
- Ortak **tezgah-şerit panosu** (kanban): tezgah kolonları, çözgü kartları,
  numune satırları, çözgü başına mini metraj göstergesi
- Taşıma/sıralama: sürükle-bırak (masaüstü) + ok butonları ve "taşı" (tablet)
- **Durum yaşam döngüsü:** taslak→onaylı→sırada→dokunuyor→dokundu→değerlendirme→tamam,
  iptal/geri al
- **Taslak havuz ↔ kesin kuyruk** görsel ayrımı (onayla → dondur 🔒)

Faz 3 (kısıt zekâsı: çerçeve/tahar/mekik doğrulama, WeaveX import) sonraki adım.

## Altın Kural

NDP hiçbir dış uygulamaya canlı DB bağlanmaz. İçeri = snapshot kopya
(`kaynak`+`kaynak_versiyon`), dışarı = sadece text URL/kod referansı.
