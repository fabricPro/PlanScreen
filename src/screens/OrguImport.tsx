import { useEffect, useState } from "react";
import { orguSnapshotApi } from "../api/client";
import type { OrguSnapshot } from "../lib/types";
import { parseWeaveX, WEAVEX_ORNEK } from "../lib/weavex";
import type { WeaveXSnapshotGirdi } from "../lib/weavex";

// Örgüler ekranı (CLAUDE.md §8): WeaveX JSON yapıştır → doğrula → önizle → kaydet.
// İçeri = kopya + kaynak damgası (Altın Kural). Kaydedilen snapshot immutable.
export function OrguImport() {
  const [liste, setListe] = useState<OrguSnapshot[]>([]);
  const [metin, setMetin] = useState("");
  const [onizleme, setOnizleme] = useState<WeaveXSnapshotGirdi | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [bilgi, setBilgi] = useState<string | null>(null);

  async function yukle() {
    try {
      setListe(await orguSnapshotApi.listAll());
    } catch (e) {
      setHata((e as Error).message);
    }
  }

  useEffect(() => {
    yukle();
  }, []);

  function dogrula() {
    setBilgi(null);
    const sonuc = parseWeaveX(metin);
    if (!sonuc.ok) {
      setOnizleme(null);
      setHata(sonuc.hata);
      return;
    }
    setHata(null);
    setOnizleme(sonuc.snapshot);
  }

  async function kaydet() {
    if (!onizleme) return;
    try {
      await orguSnapshotApi.create(onizleme);
      setMetin("");
      setOnizleme(null);
      setBilgi(`"${onizleme.ad}" içeri alındı.`);
      await yukle();
    } catch (e) {
      setHata((e as Error).message);
    }
  }

  async function sil(id: string) {
    try {
      await orguSnapshotApi.remove(id);
      await yukle();
    } catch (e) {
      setHata((e as Error).message);
    }
  }

  return (
    <div>
      <div className="crumbs">
        <strong>Örgüler (WeaveX import)</strong>
      </div>

      {hata && <p className="hata">⚠ {hata}</p>}
      {bilgi && <p className="mut">✓ {bilgi}</p>}

      <div className="panel">
        <h3>Örgü içeri al</h3>
        <p className="mut" style={{ fontSize: 14 }}>
          Desen uygulamasından WeaveX JSON'unu yapıştırın. Zorunlu alanlar:{" "}
          <code>ad</code>, <code>cerceve_sayisi</code>, <code>tahar_tipi</code>.
          Ham JSON kopya olarak damgalanır (kaynak + versiyon).
        </p>
        <textarea
          rows={8}
          value={metin}
          placeholder={WEAVEX_ORNEK}
          onChange={(e) => setMetin(e.target.value)}
          style={{ fontFamily: "monospace", fontSize: 13 }}
        />
        <div className="actions">
          <button onClick={dogrula} disabled={!metin.trim()}>
            Doğrula / önizle
          </button>
          <button className="small" onClick={() => setMetin(WEAVEX_ORNEK)}>
            Örnek doldur
          </button>
        </div>

        {onizleme && (
          <div className="panel" style={{ background: "#f5f8ff" }}>
            <strong>{onizleme.ad}</strong>
            <div className="meta mut">
              {onizleme.cerceveSayisi} çerçeve · {onizleme.taharTipi} tahar ·
              kaynak: {onizleme.kaynak}
              {onizleme.kaynakVersiyon ? ` (${onizleme.kaynakVersiyon})` : ""}
            </div>
            <div className="actions">
              <button className="primary" onClick={kaydet}>
                Kaydet (içeri al)
              </button>
              <button onClick={() => setOnizleme(null)}>Vazgeç</button>
            </div>
          </div>
        )}
      </div>

      <div className="panel">
        <h3>İçeri alınan örgüler ({liste.length})</h3>
        {liste.length === 0 ? (
          <p className="mut">Henüz örgü import edilmedi.</p>
        ) : (
          <div className="row">
            {liste.map((s) => (
              <div key={s.id} className="card" style={{ cursor: "default" }}>
                <div className="kod">{s.ad ?? "(adsız)"}</div>
                <div className="meta">
                  {s.cerceveSayisi ?? "—"} çerçeve · {s.taharTipi ?? "—"} tahar
                </div>
                <div className="meta">
                  <span className="badge">
                    {s.kaynak ?? "?"}
                    {s.kaynakVersiyon ? ` · ${s.kaynakVersiyon}` : ""}
                  </span>
                </div>
                <div className="actions">
                  <button className="danger small" onClick={() => sil(s.id)}>
                    Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
