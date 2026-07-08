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
  const [gruplama, setGruplama] = useState<Gruplama>("tarih");
  const [bitenGizle, setBitenGizle] = useState(false);

  // Ekleme çubuğu formu
  const [yeni, setYeni] = useState<{
    baslik: string;
    sonTarih: string;
    oncelik: number;
    tezgahId: string;
    numuneId: string;
  }>({ baslik: "", sonTarih: "", oncelik: 1, tezgahId: "", numuneId: "" });

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

  // numuneId → tezgahId (numune → çözgü → tezgah).
  const cozguTezgah = useMemo(() => {
    const m = new Map<string, string>();
    cozguler.forEach((c) => m.set(c.id, c.tezgahId));
    return m;
  }, [cozguler]);
  const numuneTezgah = useMemo(() => {
    const m = new Map<string, string>();
    numuneler.forEach((n) => {
      const tz = cozguTezgah.get(n.cozguId);
      if (tz) m.set(n.id, tz);
    });
    return m;
  }, [numuneler, cozguTezgah]);
  const numuneTezgahId = (numuneId: string) => numuneTezgah.get(numuneId) ?? null;

  // Ekleme çubuğunda seçili tezgahın numuneleri.
  const yeniNumuneleri = yeni.tezgahId
    ? numuneler.filter((n) => numuneTezgahId(n.id) === yeni.tezgahId)
    : [];

  async function ekle() {
    if (!yeni.baslik.trim()) return;
    try {
      await gorevApi.create({
        baslik: yeni.baslik.trim(),
        sonTarih: yeni.sonTarih ? new Date(yeni.sonTarih).toISOString() : null,
        oncelik: yeni.oncelik,
        tezgahId: yeni.tezgahId || null,
        numuneId: yeni.numuneId || null,
        parentId: null,
      });
      setYeni({ baslik: "", sonTarih: "", oncelik: 1, tezgahId: "", numuneId: "" });
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

  return (
    <div>
      <div className="crumbs">
        <strong>Görevler</strong>
        <span className="mut">· {toplamAcik} açık</span>
      </div>

      {hata && <p className="hata">⚠ {hata}</p>}

      {/* Ekleme çubuğu */}
      <div className="gorev-ekle-bar">
        <input
          className="gorev-ekle-baslik"
          placeholder="Yeni görev…"
          value={yeni.baslik}
          onChange={(e) => setYeni({ ...yeni, baslik: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && ekle()}
        />
        <input
          type="date"
          title="Son tarih"
          value={yeni.sonTarih}
          onChange={(e) => setYeni({ ...yeni, sonTarih: e.target.value })}
        />
        <select
          title="Öncelik"
          value={yeni.oncelik}
          onChange={(e) => setYeni({ ...yeni, oncelik: Number(e.target.value) })}
        >
          {ONCELIKLER.map((o) => (
            <option key={o.deger} value={o.deger}>
              {o.ad}
            </option>
          ))}
        </select>
        <select
          title="Tezgah"
          value={yeni.tezgahId}
          onChange={(e) =>
            setYeni({ ...yeni, tezgahId: e.target.value, numuneId: "" })
          }
        >
          <option value="">Tezgah — yok</option>
          {tezgahlar.map((t) => (
            <option key={t.id} value={t.id}>
              {t.ad}
            </option>
          ))}
        </select>
        <select
          title="Numune"
          value={yeni.numuneId}
          disabled={!yeni.tezgahId}
          onChange={(e) => setYeni({ ...yeni, numuneId: e.target.value })}
        >
          <option value="">Numune — yok</option>
          {yeniNumuneleri.map((n) => (
            <option key={n.id} value={n.id}>
              {n.adKod}
            </option>
          ))}
        </select>
        <button className="primary" onClick={ekle}>
          + Ekle
        </button>
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
      </div>

      {gruplar.length === 0 && (
        <p className="mut">Henüz görev yok. Yukarıdan ekleyin.</p>
      )}

      {gruplar.map((grp) => {
        const biten = grp.kokler.filter((g) => g.tamamlandi).length;
        return (
          <div className="gorev-grup2" key={grp.anahtar}>
            <div className="gorev-grup-baslik">
              <span className={`grup-ad ${grp.anahtar}`}>{grp.etiket}</span>
              <span className="mut">
                {biten}/{grp.kokler.length}
              </span>
            </div>
            <div className="gorev-grup-govde">
              {grp.kokler.map((root) => {
                const dogrudan = gorevler.filter((x) => x.parentId === root.id);
                const bitenAlt = dogrudan.filter((x) => x.tamamlandi).length;
                return (
                  <div key={root.id}>
                    <GorevSatir
                      gorev={root}
                      ilerleme={{ biten: bitenAlt, toplam: dogrudan.length }}
                      tezgahlar={tezgahlar}
                      numuneler={numuneler}
                      numuneTezgahId={numuneTezgahId}
                      onDegisti={yukle}
                      onAc={onAc}
                    />
                    <GorevAgaci
                      gorevler={gorevler}
                      parentId={root.id}
                      tezgahlar={tezgahlar}
                      numuneler={numuneler}
                      numuneTezgahId={numuneTezgahId}
                      onDegisti={yukle}
                      onAc={onAc}
                      derinlik={1}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
