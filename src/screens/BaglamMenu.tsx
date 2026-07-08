import { useEffect, useRef } from "react";

// Sağ-tık bağlam menüsü. İmleç konumunda açılır; dışına tıkla/Esc ile kapanır.
export interface MenuOge {
  etiket: string;
  onSec: () => void;
  tehlike?: boolean;
  ayrac?: boolean; // bu öğeden önce ayraç çiz
}

interface Props {
  x: number;
  y: number;
  ogeler: MenuOge[];
  onKapat: () => void;
}

export function BaglamMenu({ x, y, ogeler, onKapat }: Props) {
  const ref = useRef<HTMLDivElement>(null);

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

  // Ekran kenarından taşmayı hafifçe önle.
  const sol = Math.min(x, window.innerWidth - 210);
  const ust = Math.min(y, window.innerHeight - ogeler.length * 40 - 20);

  return (
    <div className="baglam-menu" ref={ref} style={{ left: sol, top: ust }}>
      {ogeler.map((o, i) => (
        <div key={i}>
          {o.ayrac && <div className="ayrac" />}
          <button
            className={o.tehlike ? "danger" : ""}
            onClick={() => {
              o.onSec();
              onKapat();
            }}
          >
            {o.etiket}
          </button>
        </div>
      ))}
    </div>
  );
}
