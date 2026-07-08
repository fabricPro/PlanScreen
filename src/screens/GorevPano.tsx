import { useEffect, useState } from "react";
import { gorevApi, tezgahApi } from "../api/client";
import type { Gorev, Tezgah } from "../lib/types";
import { GorevAgaci } from "./GorevAgaci";

// Görev panosu — tüm tezgahların yapılacak görevleri grup grup (her tezgah bir şerit).
export function GorevPano() {
  const [tezgahlar, setTezgahlar] = useState<Tezgah[]>([]);
  const [gorevler, setGorevler] = useState<Gorev[]>([]);
  const [metinler, setMetinler] = useState<Record<string, string>>({});
  const [hata, setHata] = useState<string | null>(null);

  async function yukle() {
    try {
      const [t, g] = await Promise.all([tezgahApi.list(), gorevApi.listAll()]);
      setTezgahlar(t);
      setGorevler(g);
      setHata(null);
    } catch (e) {
      setHata((e as Error).message);
    }
  }

  useEffect(() => {
    yukle();
  }, []);

  async function kokEkle(tezgahId: string) {
    const metin = (metinler[tezgahId] ?? "").trim();
    if (!metin) return;
    try {
      await gorevApi.create({ tezgahId, parentId: null, baslik: metin });
      setMetinler({ ...metinler, [tezgahId]: "" });
      await yukle();
    } catch (e) {
      setHata((e as Error).message);
    }
  }

  if (hata) return <p className="hata">⚠ {hata}</p>;
  if (tezgahlar.length === 0)
    return <p className="mut">Henüz tezgah yok. "Liste" sekmesinden ekleyin.</p>;

  return (
    <div className="pano">
      {tezgahlar.map((t) => {
        const tGorev = gorevler.filter((g) => g.tezgahId === t.id);
        const biten = tGorev.filter((g) => g.tamamlandi).length;
        return (
          <div key={t.id} className="serit">
            <h3>
              <span>{t.ad}</span>
              <span className="kapasite">
                {biten}/{tGorev.length} görev
              </span>
            </h3>

            <div className="gorev-grup">
              {tGorev.length === 0 ? (
                <p className="mut" style={{ fontSize: "0.85rem" }}>
                  Görev yok
                </p>
              ) : (
                <GorevAgaci
                  gorevler={tGorev}
                  parentId={null}
                  tezgahId={t.id}
                  onDegisti={yukle}
                />
              )}

              <div className="gorev-ekle" style={{ marginTop: 8 }}>
                <input
                  placeholder="Yeni görev"
                  value={metinler[t.id] ?? ""}
                  onChange={(e) =>
                    setMetinler({ ...metinler, [t.id]: e.target.value })
                  }
                  onKeyDown={(e) => e.key === "Enter" && kokEkle(t.id)}
                />
                <button className="primary small" onClick={() => kokEkle(t.id)}>
                  +
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
