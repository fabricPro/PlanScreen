import { useEffect, useRef, useState } from "react";
import { numuneApi } from "../api/client";
import type { Numune } from "../lib/types";
import { NUMUNE_DURUMLARI } from "../lib/types";
import { AciklamaEditor } from "./AciklamaEditor";

interface Props {
  numune: Numune;
  x: number;
  y: number;
  onKapat: () => void;
  onKaydedildi: () => void;
}

// Panoda/Çizelge'de numune üstünde açılan taşınabilir düzenleme + açıklama penceresi.
export function NumuneDetay({ numune, x, y, onKapat, onKaydedildi }: Props) {
  const [form, setForm] = useState<Partial<Numune>>({
    adKod: numune.adKod,
    tahminiBoyM: numune.tahminiBoyM ?? "",
    durum: numune.durum,
    varyantSayisi: numune.varyantSayisi ?? 0,
    aciklama: numune.aciklama ?? "",
  });
  const [kaydediyor, setKaydediyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  // Konum (taşınabilir) — başlangıç imleç yakınından, viewport'a clamp.
  const [poz, setPoz] = useState(() => ({
    x: Math.min(Math.max(x - 40, 8), Math.max(8, window.innerWidth - 460)),
    y: Math.min(Math.max(y - 30, 8), Math.max(8, window.innerHeight - 340)),
  }));
  const surukle = useRef<{ dx: number; dy: number } | null>(null);

  // Yalnız Escape kapatır (dış tık kapatmaz — taşınabilir pencere).
  useEffect(() => {
    function esc(e: KeyboardEvent) {
      if (e.key === "Escape") onKapat();
    }
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onKapat]);

  function barDown(e: React.PointerEvent) {
    surukle.current = { dx: e.clientX - poz.x, dy: e.clientY - poz.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function barMove(e: React.PointerEvent) {
    if (!surukle.current) return;
    const nx = Math.min(
      Math.max(e.clientX - surukle.current.dx, 0),
      window.innerWidth - 120,
    );
    const ny = Math.min(
      Math.max(e.clientY - surukle.current.dy, 0),
      window.innerHeight - 44,
    );
    setPoz({ x: nx, y: ny });
  }
  function barUp(e: React.PointerEvent) {
    surukle.current = null;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* yoksay */
    }
  }

  async function kaydet() {
    setKaydediyor(true);
    try {
      await numuneApi.update(numune.id, {
        adKod: form.adKod,
        tahminiBoyM: form.tahminiBoyM || null,
        durum: form.durum,
        varyantSayisi: Number(form.varyantSayisi) || 0,
        aciklama: form.aciklama ?? null,
      });
      onKaydedildi();
      onKapat();
    } catch (e) {
      setHata((e as Error).message);
      setKaydediyor(false);
    }
  }

  return (
    <div className="numune-detay" style={{ left: poz.x, top: poz.y }}>
      <div
        className="detay-bar"
        onPointerDown={barDown}
        onPointerMove={barMove}
        onPointerUp={barUp}
      >
        <span className="detay-baslik">Numune detayı — {numune.adKod}</span>
        <button
          className="detay-kapat"
          title="Kapat"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onKapat}
        >
          ×
        </button>
      </div>

      <div className="detay-govde">
        {hata && <p className="hata">⚠ {hata}</p>}
        <div className="detay-alanlar">
          <div className="grid2">
            <div>
              <label>Ad / kod</label>
              <input
                autoFocus
                value={form.adKod ?? ""}
                onChange={(e) => setForm({ ...form, adKod: e.target.value })}
              />
            </div>
            <div>
              <label>Tahmini boy (m)</label>
              <input
                type="number"
                value={form.tahminiBoyM ?? ""}
                onChange={(e) =>
                  setForm({ ...form, tahminiBoyM: e.target.value })
                }
              />
            </div>
            <div>
              <label>Durum</label>
              <select
                value={form.durum ?? "taslak"}
                onChange={(e) => setForm({ ...form, durum: e.target.value })}
              >
                {NUMUNE_DURUMLARI.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Varyant sayısı</label>
              <input
                type="number"
                min={0}
                value={form.varyantSayisi ?? 0}
                onChange={(e) =>
                  setForm({ ...form, varyantSayisi: Number(e.target.value) })
                }
              />
            </div>
          </div>
        </div>

        <div className="detay-aciklama">
          <label>Açıklama</label>
          <AciklamaEditor
            value={form.aciklama ?? ""}
            onChange={(v) => setForm({ ...form, aciklama: v })}
          />
        </div>
      </div>

      <div className="detay-ayak">
        <button className="primary" onClick={kaydet} disabled={kaydediyor}>
          {kaydediyor ? "Kaydediliyor…" : "Kaydet"}
        </button>
        <button onClick={onKapat}>İptal</button>
      </div>
    </div>
  );
}
