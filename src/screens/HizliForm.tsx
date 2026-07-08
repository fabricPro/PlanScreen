import { useEffect, useRef, useState } from "react";
import { RenkSecici } from "./RenkSecici";

// İmleç yanında açılan mini hızlı-ekle formu (numune / iplik / çözgü).
export interface HizliAlan {
  ad: string;
  etiket: string;
  placeholder?: string;
  tip?: "text" | "number";
  renk?: boolean; // RenkSecici alanı
  varsayilan?: string;
}

interface Props {
  x: number;
  y: number;
  baslik: string;
  alanlar: HizliAlan[];
  onKaydet: (degerler: Record<string, string>) => void;
  onKapat: () => void;
}

export function HizliForm({ x, y, baslik, alanlar, onKaydet, onKapat }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [degerler, setDegerler] = useState<Record<string, string>>(() =>
    Object.fromEntries(alanlar.map((a) => [a.ad, a.varsayilan ?? ""])),
  );

  useEffect(() => {
    function disari(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onKapat();
    }
    function esc(e: KeyboardEvent) {
      if (e.key === "Escape") onKapat();
    }
    document.addEventListener("mousedown", disari);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", disari);
      document.removeEventListener("keydown", esc);
    };
  }, [onKapat]);

  const sol = Math.min(x, window.innerWidth - 260);
  const ust = Math.min(y, window.innerHeight - 260);

  return (
    <div className="hizli-form" ref={ref} style={{ left: sol, top: ust }}>
      <h4>{baslik}</h4>
      {alanlar.map((a) => (
        <div key={a.ad}>
          <label>{a.etiket}</label>
          {a.renk ? (
            <RenkSecici
              value={degerler[a.ad] || "#DCC29B"}
              onChange={(hex) => setDegerler((d) => ({ ...d, [a.ad]: hex }))}
            />
          ) : (
            <input
              autoFocus={a === alanlar[0]}
              type={a.tip ?? "text"}
              placeholder={a.placeholder}
              value={degerler[a.ad]}
              onChange={(e) =>
                setDegerler((d) => ({ ...d, [a.ad]: e.target.value }))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") onKaydet(degerler);
              }}
            />
          )}
        </div>
      ))}
      <div className="actions">
        <button className="primary" onClick={() => onKaydet(degerler)}>
          Kaydet
        </button>
        <button onClick={onKapat}>İptal</button>
      </div>
    </div>
  );
}
