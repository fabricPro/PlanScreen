import { useEffect, useRef, useState } from "react";
import { tezgahApi } from "../api/client";
import type { Tezgah } from "../lib/types";
import { TEZGAH_DURUMLARI } from "../lib/types";
import { AciklamaEditor } from "./AciklamaEditor";

interface Props {
  tezgah: Tezgah;
  x: number;
  y: number;
  onKapat: () => void;
  onKaydedildi: () => void;
}

// Panoda tezgah üstünde açılan taşınabilir tam-düzenleme + açıklama penceresi
// (NumuneDetay deseni). Tüm tezgah alanları + takım + açıklama.
export function TezgahDuzenle({ tezgah, x, y, onKapat, onKaydedildi }: Props) {
  const [form, setForm] = useState<Partial<Tezgah>>({
    ad: tezgah.ad,
    marka: tezgah.marka ?? "",
    tip: tezgah.tip ?? "dobby",
    durum: tezgah.durum,
    cerceveSayisi: tezgah.cerceveSayisi,
    mekikSayisi: tezgah.mekikSayisi,
    maxTarakEniCm: tezgah.maxTarakEniCm ?? "",
    esZamanliCozgu: tezgah.esZamanliCozgu,
    devir: tezgah.devir,
    planTarihi: tezgah.planTarihi,
    takim: tezgah.takim ?? "",
    aciklama: tezgah.aciklama ?? "",
  });
  const [kaydediyor, setKaydediyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [poz, setPoz] = useState(() => ({
    x: Math.min(Math.max(x - 40, 8), Math.max(8, window.innerWidth - 460)),
    y: Math.min(Math.max(y - 30, 8), Math.max(8, window.innerHeight - 340)),
  }));
  const surukle = useRef<{ dx: number; dy: number } | null>(null);

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
      await tezgahApi.update(tezgah.id, {
        ad: (form.ad ?? "").trim() || tezgah.ad,
        marka: form.marka?.trim() ? form.marka.trim() : null,
        tip: form.tip || null,
        durum: form.durum,
        cerceveSayisi: Number(form.cerceveSayisi) || 0,
        mekikSayisi: Number(form.mekikSayisi) || 1,
        maxTarakEniCm: form.maxTarakEniCm ? String(form.maxTarakEniCm) : null,
        esZamanliCozgu: Number(form.esZamanliCozgu) || 2,
        devir: form.devir == null ? null : Number(form.devir),
        planTarihi: form.planTarihi ?? null,
        takim: form.takim?.trim() ? form.takim.trim() : null,
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
    <div className="numune-detay tezgah-duzenle" style={{ left: poz.x, top: poz.y }}>
      <div
        className="detay-bar"
        onPointerDown={barDown}
        onPointerMove={barMove}
        onPointerUp={barUp}
      >
        <span className="detay-baslik">Tezgah — {tezgah.ad}</span>
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
              <label>Ad</label>
              <input
                autoFocus
                value={form.ad ?? ""}
                onChange={(e) => setForm({ ...form, ad: e.target.value })}
              />
            </div>
            <div>
              <label>Takım bilgisi</label>
              <input
                placeholder="ör. 8+2 sıra tahar 15 sıklık"
                value={form.takim ?? ""}
                onChange={(e) => setForm({ ...form, takim: e.target.value })}
              />
            </div>
            <div>
              <label>Marka</label>
              <input
                value={form.marka ?? ""}
                onChange={(e) => setForm({ ...form, marka: e.target.value })}
              />
            </div>
            <div>
              <label>Tip</label>
              <select
                value={form.tip ?? "dobby"}
                onChange={(e) => setForm({ ...form, tip: e.target.value })}
              >
                <option value="dobby">dobby</option>
                <option value="armur">armür</option>
              </select>
            </div>
            <div>
              <label>Durum</label>
              <select
                value={form.durum ?? "bos"}
                onChange={(e) => setForm({ ...form, durum: e.target.value })}
              >
                {TEZGAH_DURUMLARI.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Çerçeve sayısı</label>
              <input
                type="number"
                value={form.cerceveSayisi ?? 0}
                onChange={(e) =>
                  setForm({ ...form, cerceveSayisi: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <label>Mekik sayısı</label>
              <input
                type="number"
                value={form.mekikSayisi ?? 1}
                onChange={(e) =>
                  setForm({ ...form, mekikSayisi: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <label>Makina eni (cm)</label>
              <input
                type="number"
                value={form.maxTarakEniCm ?? ""}
                onChange={(e) =>
                  setForm({ ...form, maxTarakEniCm: e.target.value })
                }
              />
            </div>
            <div>
              <label>Eşzamanlı çözgü kapasitesi</label>
              <input
                type="number"
                min={1}
                max={3}
                value={form.esZamanliCozgu ?? 2}
                onChange={(e) =>
                  setForm({ ...form, esZamanliCozgu: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <label>Devir</label>
              <input
                type="number"
                value={form.devir ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    devir: e.target.value ? Number(e.target.value) : null,
                  })
                }
              />
            </div>
            <div>
              <label>Plan tarihi</label>
              <input
                type="date"
                value={form.planTarihi ? form.planTarihi.slice(0, 10) : ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    planTarihi: e.target.value
                      ? new Date(e.target.value).toISOString()
                      : null,
                  })
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
