# NDP — Numune Dokuma Planlama

ARGE numune dokuma sürecinin **zaman ve kaynak planlaması** aracı.
Hangi numuneyi, hangi çözgüde, hangi sırayla, hangi tezgahta dokuyacağını yönetir.
Detaylı spesifikasyon için [`CLAUDE.md`](./CLAUDE.md).

> Bu uygulama planlama · kuyruk · sıralama · çizelge aracıdır — desen tasarımı değil.

## Stack

- React + Vite + TypeScript (tablet-first)
- Neon (Postgres) · Drizzle ORM · `@neondatabase/serverless`
- Vercel Edge Functions (`/api`, serverless API) + Vercel deploy
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
npx vercel dev            # /api function'ları + frontend → http://localhost:3000
```

Salt frontend için `npm run dev:vite` (/api istekleri `vercel dev` portu 3000'e
proxy'lenir).

## Deploy (Vercel)

1. **vercel.com** → New Project → GitHub reposunu import et (framework: Vite
   otomatik algılanır; `vercel.json` build/output ve SPA rewrite'ı içerir).
2. **Environment Variables** → `DATABASE_URL` = Neon pooled connection string.
   `/api` Edge function'ları bunu `process.env` üzerinden okur (tarayıcıya sızmaz).
3. Deploy. `/api/*` uçları Neon'a Edge'den `@neondatabase/serverless` (HTTP) ile
   bağlanır — şema Neon'da zaten hazır, migration gerekmez.

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

**Faz 3 — akıl** ("Örgüler" sekmesi + anlık uyarılar)
- **Kısıt doğrulama** (`src/lib/kisitlar.ts`, okuma anında): çerçeve zinciri
  (§6.1), mekik/atkı renk sayısı (§6.2), tahar uyumu (§6.3). İhlal **uyarır,
  engellemez** (Anayasa 1).
- **WeaveX örgü import** → `ndp_orgu_snapshot` (doğrula → `kaynak`+`kaynak_versiyon`
  damgasıyla immutable kopya); numuneye örgü snapshot bağlama + atkı renk editörü.
- Uyarılar çözgü detayında satır satır, panoda ⚠ göstergesi olarak anlık.

Çözgü değişim optimizasyonu (§9 ops.) sonraki tura bırakıldı.

## Altın Kural

NDP hiçbir dış uygulamaya canlı DB bağlanmaz. İçeri = snapshot kopya
(`kaynak`+`kaynak_versiyon`), dışarı = sadece text URL/kod referansı.
