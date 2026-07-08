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

// Panoda numune üstünde açılan, aynı sayfada düzenleme + açıklama paneli.
export function NumuneDetay({ numune, x, y, onKapat, onKaydedildi }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState<Partial<Numune>>({
    adKod: numune.adKod,
    tahminiBoyM: numune.tahminiBoyM ?? "",
    durum: numune.durum,
    varyantSayisi: numune.varyantSayisi ?? 0,
    aciklama: numune.aciklama ?? "",
  });
  const [kaydediyor, setKaydediyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

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

  const sol = Math.min(x, window.innerWidth - 400);
  const ust = Math.min(Math.max(y - 40, 12), window.innerHeight - 460);

  return (
    <div className="numune-detay" ref={ref} style={{ left: sol, top: ust }}>
      <h4>Numune detayı</h4>
      {hata && <p className="hata">⚠ {hata}</p>}
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
            onChange={(e) => setForm({ ...form, tahminiBoyM: e.target.value })}
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

      <div style={{ marginTop: 8 }}>
        <label>Açıklama</label>
        <AciklamaEditor
          value={form.aciklama ?? ""}
          onChange={(v) => setForm({ ...form, aciklama: v })}
        />
      </div>

      <div className="actions">
        <button className="primary" onClick={kaydet} disabled={kaydediyor}>
          {kaydediyor ? "Kaydediliyor…" : "Kaydet"}
        </button>
        <button onClick={onKapat}>İptal</button>
      </div>
    </div>
  );
}
