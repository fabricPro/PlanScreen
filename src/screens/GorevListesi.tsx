import { useEffect, useState } from "react";
import { gorevApi } from "../api/client";
import type { Gorev } from "../lib/types";
import { GorevAgaci } from "./GorevAgaci";

// Bir tezgahın görev (to-do) listesi — tezgah detayındaki "Görevler" sekmesi.
export function GorevListesi({ tezgahId }: { tezgahId: string }) {
  const [gorevler, setGorevler] = useState<Gorev[]>([]);
  const [kokMetin, setKokMetin] = useState("");
  const [hata, setHata] = useState<string | null>(null);

  async function yukle() {
    try {
      setGorevler(await gorevApi.listByTezgah(tezgahId));
      setHata(null);
    } catch (e) {
      setHata((e as Error).message);
    }
  }

  useEffect(() => {
    yukle();
  }, [tezgahId]);

  async function kokEkle() {
    if (!kokMetin.trim()) return;
    try {
      await gorevApi.create({
        tezgahId,
        parentId: null,
        baslik: kokMetin.trim(),
      });
      setKokMetin("");
      await yukle();
    } catch (e) {
      setHata((e as Error).message);
    }
  }

  const kokler = gorevler.filter((g) => !g.parentId);
  const biten = gorevler.filter((g) => g.tamamlandi).length;

  return (
    <div className="panel">
      <h3>
        Görevler{" "}
        <span className="mut" style={{ fontSize: "0.85rem", fontWeight: 400 }}>
          ({biten}/{gorevler.length} tamamlandı)
        </span>
      </h3>

      {hata && <p className="hata">⚠ {hata}</p>}

      {kokler.length === 0 ? (
        <p className="mut">Bu tezgah için henüz görev yok.</p>
      ) : (
        <GorevAgaci
          gorevler={gorevler}
          parentId={null}
          tezgahId={tezgahId}
          onDegisti={yukle}
        />
      )}

      <div className="gorev-ekle" style={{ marginTop: 12 }}>
        <input
          placeholder="Yeni görev başlığı"
          value={kokMetin}
          onChange={(e) => setKokMetin(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && kokEkle()}
        />
        <button className="primary" onClick={kokEkle}>
          + Görev ekle
        </button>
      </div>
    </div>
  );
}
