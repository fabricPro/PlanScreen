import { useEffect, useMemo, useState } from "react";
import { cozguApi, gorevApi, numuneApi, tezgahApi } from "../api/client";
import type { Cozgu, Gorev, Numune, Tezgah } from "../lib/types";
import { ONCELIKLER } from "../lib/types";
import { tarihKovasi } from "../lib/gorev";
import { GorevSatir } from "./GorevSatir";
import { GorevAgaci } from "./GorevAgaci";

interface Props {
  onAc?: (cozguId: string) => void;
}

type Gruplama = "tarih" | "tezgah";

export function Gorevler({ onAc }: Props) {
  const [tezgahlar, setTezgahlar] = useState<Tezgah[]>([]);
  const [cozguler, setCozguler] = useState<Cozgu[]>([]);
  const [numuneler, setNumuneler] = useState<Numune[]>([]);
  const [gorevler, setGorevler] = useState<Gorev[]>([]);
  const [hata, setHata] = useState<string | null>(null);
  const [gruplama, setGruplama] = useState<Gruplama>("tezgah");
  const [bitenGizle, setBitenGizle] = useState(false);
  // Ekleme çubuğunda detay alanları (tarih/öncelik/bağ) açık mı.
  const [detayAcik, setDetayAcik] = useState(false);
  // Görevi olmayan çözgü alt-başlıklarını da göster.
  const [bosCozguGoster, setBosCozguGoster] = useState(false);

  // Ekleme çubuğu formu
  const [yeni, setYeni] = useState<{
    baslik: string;
    sonTarih: string;
    oncelik: number;
    tezgahId: string;
    cozguId: string;
    numuneId: string;
  }>({
    baslik: "",
    sonTarih: "",
    oncelik: 1,
    tezgahId: "",
    cozguId: "",
    numuneId: "",
  });

  async function yukle() {
    try {
      const [t, c, n, g] = await Promise.all([
        tezgahApi.list(),
        cozguApi.listAll(),
        numuneApi.listAll(),
        gorevApi.listAll(),
      ]);
      setTezgahlar(t);
      setCozguler(c);
      setNumuneler(n);
      setGorevler(g);
      setHata(null);
    } catch (e) {
      setHata((e as Error).message);
    }
  }

  useEffect(() => {
    yukle();
  }, []);

  // Bir tezgahın çözgüleri (tezgah sırasına göre).
  const tezgahinCozguleri = (tezgahId: string) =>
    cozguler
      .filter((c) => c.tezgahId === tezgahId)
      .sort(
        (a, b) =>
          a.tezgahSira - b.tezgahSira || a.createdAt.localeCompare(b.createdAt),
      );

  // Ekleme çubuğunda seçili tezgahın çözgüleri, seçili çözgünün numuneleri.
  const yeniCozguleri = yeni.tezgahId ? tezgahinCozguleri(yeni.tezgahId) : [];
  const yeniNumuneleri = yeni.cozguId
    ? numuneler
        .filter((n) => n.cozguId === yeni.cozguId)
        .sort((a, b) => a.siraNo - b.siraNo)
    : [];

  async function ekle() {
    if (!yeni.baslik.trim()) return;
    try {
      await gorevApi.create({
        baslik: yeni.baslik.trim(),
        sonTarih: yeni.sonTarih ? new Date(yeni.sonTarih).toISOString() : null,
        oncelik: yeni.oncelik,
        tezgahId: yeni.tezgahId || null,
        cozguId: yeni.cozguId || null,
        numuneId: yeni.numuneId || null,
        parentId: null,
      });
      setYeni({
        baslik: "",
        sonTarih: "",
        oncelik: 1,
        tezgahId: "",
        cozguId: "",
        numuneId: "",
      });
      await yukle();
    } catch (e) {
      setHata((e as Error).message);
    }
  }

  // Kök görevler (parentId yok). "bitenGizle" → tamamlanan kökleri gizle.
  const kokler = useMemo(() => {
    let k = gorevler.filter((g) => !g.parentId);
    if (bitenGizle) k = k.filter((g) => !g.tamamlandi);
    return k;
  }, [gorevler, bitenGizle]);

  function kokSirala(a: Gorev, b: Gorev): number {
    if (a.tamamlandi !== b.tamamlandi) return a.tamamlandi ? 1 : -1;
    if (b.oncelik !== a.oncelik) return b.oncelik - a.oncelik;
    const at = a.sonTarih ?? "9999";
    const bt = b.sonTarih ?? "9999";
    if (at !== bt) return at < bt ? -1 : 1;
    return a.createdAt.localeCompare(b.createdAt);
  }

  // Grupları oluştur: { anahtar, etiket, sira, kokler[] }
  const gruplar = useMemo(() => {
    const m = new Map<
      string,
      { anahtar: string; etiket: string; sira: number; kokler: Gorev[] }
    >();
    for (const g of kokler) {
      let anahtar: string, etiket: string, sira: number;
      if (gruplama === "tarih") {
        const kv = tarihKovasi(g.sonTarih);
        anahtar = kv.anahtar;
        etiket = kv.etiket;
        sira = kv.sira;
      } else {
        if (g.tezgahId) {
          anahtar = g.tezgahId;
          const t = tezgahlar.find((x) => x.id === g.tezgahId);
          etiket = t?.ad ?? "Tezgah";
          sira = t ? t.sira : 900;
        } else {
          anahtar = "bagimsiz";
          etiket = "Bağımsız";
          sira = 999;
        }
      }
      if (!m.has(anahtar)) m.set(anahtar, { anahtar, etiket, sira, kokler: [] });
      m.get(anahtar)!.kokler.push(g);
    }
    const arr = [...m.values()].sort(
      (a, b) => a.sira - b.sira || a.etiket.localeCompare(b.etiket),
    );
    arr.forEach((grp) => grp.kokler.sort(kokSirala));
    return arr;
  }, [kokler, gruplama, tezgahlar]);

  const toplamAcik = gorevler.filter((g) => !g.tamamlandi).length;

  // Kök görev listesini (satır + alt ağaç) çizer — çözgü blokları / düz liste ortak.
  // gizle: bağlamda (tezgah/çözgü alt-başlığı) zaten görünen çipleri satırda gizler.
  function rootlariCiz(
    rootlar: Gorev[],
    gizle?: { tezgah?: boolean; cozgu?: boolean },
  ) {
    return rootlar.map((root) => {
      const dogrudan = gorevler.filter((x) => x.parentId === root.id);
      const bitenAlt = dogrudan.filter((x) => x.tamamlandi).length;
      return (
        <div key={root.id}>
          <GorevSatir
            gorev={root}
            ilerleme={{ biten: bitenAlt, toplam: dogrudan.length }}
            tezgahlar={tezgahlar}
            cozguler={cozguler}
            numuneler={numuneler}
            onDegisti={yukle}
            onAc={onAc}
            gizleTezgah={gizle?.tezgah}
            gizleCozgu={gizle?.cozgu}
          />
          <GorevAgaci
            gorevler={gorevler}
            parentId={root.id}
            tezgahlar={tezgahlar}
            cozguler={cozguler}
            numuneler={numuneler}
            onDegisti={yukle}
            onAc={onAc}
            derinlik={1}
            gizleTezgah={gizle?.tezgah}
            gizleCozgu={gizle?.cozgu}
          />
        </div>
      );
    });
  }

  return (
    <div>
      <div className="crumbs">
        <strong>Görevler</strong>
        <span className="mut">· {toplamAcik} açık</span>
      </div>

      {hata && <p className="hata">⚠ {hata}</p>}

      {/* Ekleme çubuğu — sade tek satır; detay istek üzerine açılır */}
      <div className="gorev-ekle-bar">
        <div className="gorev-ekle-satir">
          <input
            className="gorev-ekle-baslik"
            placeholder="Yeni görev…"
            value={yeni.baslik}
            onChange={(e) => setYeni({ ...yeni, baslik: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && ekle()}
          />
          <button
            className={`gorev-detay-ac${detayAcik ? " aktif" : ""}`}
            title="Tarih, öncelik ve bağ alanları"
            onClick={() => setDetayAcik((v) => !v)}
          >
            Detay {detayAcik ? "▴" : "▾"}
          </button>
          <button className="primary" onClick={ekle}>
            ＋ Ekle
          </button>
        </div>

        {detayAcik && (
          <div className="gorev-ekle-detay">
            <label>
              Son tarih
              <input
                type="date"
                value={yeni.sonTarih}
                onChange={(e) => setYeni({ ...yeni, sonTarih: e.target.value })}
              />
            </label>
            <label>
              Öncelik
              <select
                value={yeni.oncelik}
                onChange={(e) =>
                  setYeni({ ...yeni, oncelik: Number(e.target.value) })
                }
              >
                {ONCELIKLER.map((o) => (
                  <option key={o.deger} value={o.deger}>
                    {o.ad}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tezgah
              <select
                value={yeni.tezgahId}
                onChange={(e) =>
                  setYeni({
                    ...yeni,
                    tezgahId: e.target.value,
                    cozguId: "",
                    numuneId: "",
                  })
                }
              >
                <option value="">— yok —</option>
                {tezgahlar.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.ad}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Çözgü
              <select
                value={yeni.cozguId}
                disabled={!yeni.tezgahId}
                onChange={(e) =>
                  setYeni({ ...yeni, cozguId: e.target.value, numuneId: "" })
                }
              >
                <option value="">— yok —</option>
                {yeniCozguleri.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.adKod}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Numune
              <select
                value={yeni.numuneId}
                disabled={!yeni.cozguId}
                onChange={(e) => setYeni({ ...yeni, numuneId: e.target.value })}
              >
                <option value="">— yok —</option>
                {yeniNumuneleri.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.adKod}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </div>

      {/* Gruplama + filtre */}
      <div className="gorev-ust-arac">
        <nav className="tabs mini">
          <button
            className={gruplama === "tarih" ? "aktif" : ""}
            onClick={() => setGruplama("tarih")}
          >
            Tarihe göre
          </button>
          <button
            className={gruplama === "tezgah" ? "aktif" : ""}
            onClick={() => setGruplama("tezgah")}
          >
            Tezgaha göre
          </button>
        </nav>
        <label className="gorev-filtre">
          <input
            type="checkbox"
            checked={bitenGizle}
            onChange={(e) => setBitenGizle(e.target.checked)}
          />
          Tamamlananları gizle
        </label>
        {gruplama === "tezgah" && (
          <label className="gorev-filtre">
            <input
              type="checkbox"
              checked={bosCozguGoster}
              onChange={(e) => setBosCozguGoster(e.target.checked)}
            />
            Boş çözgüleri göster
          </label>
        )}
      </div>

      {gruplar.length === 0 && (
        <p className="mut">Henüz görev yok. Yukarıdan ekleyin.</p>
      )}

      {gruplar.map((grp) => {
        const biten = grp.kokler.filter((g) => g.tamamlandi).length;
        // Tezgah modunda gerçek tezgah grubu → çözgü alt-başlıkları.
        const tezgahModu = gruplama === "tezgah" && grp.anahtar !== "bagimsiz";
        const grupCozguleri = tezgahModu ? tezgahinCozguleri(grp.anahtar) : [];
        const cozgusuz = grp.kokler
          .filter((r) => !r.cozguId)
          .sort(kokSirala);
        return (
          <div className="gorev-grup2" key={grp.anahtar}>
            <div className="gorev-grup-baslik">
              <span className={`grup-ad ${grp.anahtar}`}>{grp.etiket}</span>
              <span className="mut">
                {biten}/{grp.kokler.length}
              </span>
            </div>
            <div className="gorev-grup-govde">
              {tezgahModu ? (
                <>
                  {grupCozguleri
                    .filter(
                      (cz) =>
                        bosCozguGoster ||
                        grp.kokler.some((r) => r.cozguId === cz.id),
                    )
                    .map((cz) => {
                      const czRootlar = grp.kokler
                        .filter((r) => r.cozguId === cz.id)
                        .sort(kokSirala);
                      return (
                        <div className="gorev-cozgu-blok" key={cz.id}>
                          <div className="gorev-cozgu-baslik">
                            ▤ {cz.adKod}
                            <span className="mut"> · {czRootlar.length}</span>
                          </div>
                          {czRootlar.length > 0 ? (
                            rootlariCiz(czRootlar, { tezgah: true, cozgu: true })
                          ) : (
                            <p className="mut gorev-cozgu-bos">görev yok</p>
                          )}
                        </div>
                      );
                    })}
                  {cozgusuz.length > 0 && (
                    <div className="gorev-cozgu-blok">
                      <div className="gorev-cozgu-baslik mut">
                        Çözgüsüz (tezgah geneli) · {cozgusuz.length}
                      </div>
                      {rootlariCiz(cozgusuz, { tezgah: true })}
                    </div>
                  )}
                </>
              ) : (
                rootlariCiz(grp.kokler)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
