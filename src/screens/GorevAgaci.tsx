import { useState } from "react";
import { gorevApi } from "../api/client";
import type { Gorev } from "../lib/types";

// Özyinelemeli görev ağacı. Verilen parentId'nin çocuklarını çizer; her düğüm
// kendini parentId=düğüm.id ile tekrar çağırır (çok seviye).
interface Props {
  gorevler: Gorev[];
  parentId: string | null;
  tezgahId: string;
  onDegisti: () => void;
  derinlik?: number;
}

export function GorevAgaci({
  gorevler,
  parentId,
  tezgahId,
  onDegisti,
  derinlik = 0,
}: Props) {
  const [ekleAcikId, setEkleAcikId] = useState<string | null>(null);
  const [metin, setMetin] = useState("");

  const cocuklar = gorevler
    .filter((g) => (g.parentId ?? null) === parentId)
    .sort((a, b) => a.sira - b.sira || a.createdAt.localeCompare(b.createdAt));

  if (cocuklar.length === 0) return null;

  async function toggle(g: Gorev) {
    await gorevApi.update(g.id, { tamamlandi: !g.tamamlandi });
    onDegisti();
  }
  async function sil(g: Gorev) {
    await gorevApi.remove(g.id);
    onDegisti();
  }
  async function altEkle(parent: Gorev) {
    if (!metin.trim()) return;
    await gorevApi.create({ tezgahId, parentId: parent.id, baslik: metin.trim() });
    setMetin("");
    setEkleAcikId(null);
    onDegisti();
  }

  return (
    <div className={derinlik > 0 ? "gorev-alt" : ""}>
      {cocuklar.map((g) => {
        const dogrudan = gorevler.filter((x) => x.parentId === g.id);
        const bitenAlt = dogrudan.filter((x) => x.tamamlandi).length;
        return (
          <div key={g.id} className="gorev-dugum">
            <div className={`gorev-satir${g.tamamlandi ? " bitti" : ""}`}>
              <input
                type="checkbox"
                className="gorev-check"
                checked={g.tamamlandi}
                onChange={() => toggle(g)}
              />
              <span className="gorev-baslik">{g.baslik}</span>
              {dogrudan.length > 0 && (
                <span className="gorev-ilerleme">
                  {bitenAlt}/{dogrudan.length}
                </span>
              )}
              <button
                className="small"
                title="Alt görev ekle"
                onClick={() =>
                  setEkleAcikId(ekleAcikId === g.id ? null : g.id)
                }
              >
                ＋ alt
              </button>
              <button
                className="danger small"
                title="Sil"
                onClick={() => sil(g)}
              >
                ✕
              </button>
            </div>

            {ekleAcikId === g.id && (
              <div className="gorev-ekle gorev-alt">
                <input
                  autoFocus
                  placeholder="Alt görev başlığı"
                  value={metin}
                  onChange={(e) => setMetin(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && altEkle(g)}
                />
                <button className="primary small" onClick={() => altEkle(g)}>
                  Ekle
                </button>
              </div>
            )}

            {/* Alt görevler (özyineleme) */}
            <GorevAgaci
              gorevler={gorevler}
              parentId={g.id}
              tezgahId={tezgahId}
              onDegisti={onDegisti}
              derinlik={derinlik + 1}
            />
          </div>
        );
      })}
    </div>
  );
}
