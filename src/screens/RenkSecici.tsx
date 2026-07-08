import { useEffect, useRef, useState } from "react";
import { PERDE_PALETI, renkAdiBul, tonAc, tonKoyu } from "../lib/palette";

// Perde paleti renk seçici. Kısa dokunuş = tonu seç.
// Basılı tut (~350ms) → o tonun bir açık + bir koyu hâli çıkar, seçilebilir.
interface Props {
  value: string;
  onChange: (hex: string) => void;
  boyut?: number; // tetikleyici swatch boyutu
}

export function RenkSecici({ value, onChange, boyut = 34 }: Props) {
  const [acik, setAcik] = useState(false);
  const [tonMenu, setTonMenu] = useState<{ hex: string; key: string } | null>(
    null,
  );
  const kokRef = useRef<HTMLDivElement>(null);
  const basiliTimer = useRef<number | null>(null);
  const uzunBasti = useRef(false);

  useEffect(() => {
    if (!acik) return;
    function disari(e: MouseEvent) {
      if (kokRef.current && !kokRef.current.contains(e.target as Node)) {
        setAcik(false);
        setTonMenu(null);
      }
    }
    function esc(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setAcik(false);
        setTonMenu(null);
      }
    }
    document.addEventListener("mousedown", disari);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", disari);
      document.removeEventListener("keydown", esc);
    };
  }, [acik]);

  function sec(hex: string) {
    onChange(hex);
    setAcik(false);
    setTonMenu(null);
  }

  function basla(hex: string, key: string) {
    uzunBasti.current = false;
    basiliTimer.current = window.setTimeout(() => {
      uzunBasti.current = true;
      setTonMenu({ hex, key });
    }, 350);
  }
  function bitir(hex: string) {
    if (basiliTimer.current) {
      clearTimeout(basiliTimer.current);
      basiliTimer.current = null;
    }
    // Uzun basılmadıysa kısa dokunuş = seç.
    if (!uzunBasti.current) sec(hex);
    uzunBasti.current = false;
  }
  function iptal() {
    if (basiliTimer.current) {
      clearTimeout(basiliTimer.current);
      basiliTimer.current = null;
    }
  }

  const ad = renkAdiBul(value);

  return (
    <div className="renk-secici" ref={kokRef}>
      <button
        type="button"
        className="renk-tetik"
        style={{ width: boyut, height: boyut, background: value }}
        title={ad ?? value}
        onClick={() => setAcik((a) => !a)}
      />
      {acik && (
        <div className="renk-pop">
          {PERDE_PALETI.map((aile) => (
            <div key={aile.aile} className="renk-aile">
              <div className="renk-aile-ad">{aile.aile}</div>
              <div className="renk-swatch-satir">
                {aile.tonlar.map((ton) => {
                  const key = `${aile.aile}-${ton.hex}`;
                  return (
                    <div key={key} className="renk-swatch-hucre">
                      <button
                        type="button"
                        className={`renk-swatch${
                          ton.hex.toLowerCase() === value.toLowerCase()
                            ? " secili"
                            : ""
                        }`}
                        style={{ background: ton.hex }}
                        title={`${ton.ad} — basılı tut: ton`}
                        onPointerDown={() => basla(ton.hex, key)}
                        onPointerUp={() => bitir(ton.hex)}
                        onPointerLeave={iptal}
                        onPointerCancel={iptal}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setTonMenu({ hex: ton.hex, key });
                        }}
                      />
                      {tonMenu?.key === key && (
                        <div className="ton-menu">
                          <button
                            type="button"
                            style={{ background: tonAc(ton.hex) }}
                            title="Bir ton açık"
                            onClick={() => sec(tonAc(ton.hex))}
                          />
                          <button
                            type="button"
                            className="orta"
                            style={{ background: ton.hex }}
                            title={ton.ad}
                            onClick={() => sec(ton.hex)}
                          />
                          <button
                            type="button"
                            style={{ background: tonKoyu(ton.hex) }}
                            title="Bir ton koyu"
                            onClick={() => sec(tonKoyu(ton.hex))}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="renk-ipucu">
            İpucu: bir renge <strong>basılı tut</strong> (veya sağ-tık) →
            açık/koyu tonu.
          </div>
        </div>
      )}
    </div>
  );
}
