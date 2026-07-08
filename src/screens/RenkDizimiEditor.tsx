import type { RenkBlok } from "../lib/types";
import { RenkSecici } from "./RenkSecici";

// Renk dizimi BU uygulamada tanımlanır (CLAUDE.md §5, §7.2).
// Sıralı (iplik, renk, tel_adedi) blok listesi. Zengin çizgi simülatörü değil.
interface Props {
  bloklar: RenkBlok[];
  onChange: (b: RenkBlok[]) => void;
}

export function RenkDizimiEditor({ bloklar, onChange }: Props) {
  function guncelle(i: number, patch: Partial<RenkBlok>) {
    const kopya = bloklar.slice();
    kopya[i] = { ...kopya[i], ...patch };
    onChange(kopya);
  }
  function sil(i: number) {
    onChange(bloklar.filter((_, j) => j !== i));
  }
  function ekle() {
    onChange([...bloklar, { iplik: "", renk: "#3366cc", tel_adedi: 1 }]);
  }

  const toplamTel = bloklar.reduce((a, b) => a + (Number(b.tel_adedi) || 0), 0);

  return (
    <div>
      {bloklar.length > 0 && (
        <div className="renk-blok mut">
          <span>iplik</span>
          <span>renk</span>
          <span>tel</span>
          <span />
        </div>
      )}
      {bloklar.map((b, i) => (
        <div className="renk-blok" key={i}>
          <input
            placeholder="iplik"
            value={b.iplik}
            onChange={(e) => guncelle(i, { iplik: e.target.value })}
          />
          <RenkSecici
            value={b.renk}
            onChange={(hex) => guncelle(i, { renk: hex })}
          />
          <input
            type="number"
            min={1}
            value={b.tel_adedi}
            onChange={(e) =>
              guncelle(i, { tel_adedi: Number(e.target.value) || 0 })
            }
          />
          <button className="danger small" onClick={() => sil(i)}>
            ×
          </button>
        </div>
      ))}
      <div className="actions">
        <button className="small" onClick={ekle}>
          + Blok
        </button>
        <span className="mut" style={{ alignSelf: "center" }}>
          Toplam tel: <strong>{toplamTel}</strong>
        </span>
      </div>
    </div>
  );
}
