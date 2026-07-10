import { useEffect, useRef, useState } from "react";
import { cozguApi } from "../api/client";
import type { Cozgu } from "../lib/types";

// CozguDetay ile aynı çözgü durum akışı (types.ts'de ayrı sabit yok).
const COZGU_DURUMLARI = ["taslak", "sirada", "aktif", "tamam", "arsiv"];

interface Props {
  cozgu: Cozgu;
  x: number;
  y: number;
  onKapat: () => void;
  onKaydedildi: () => void;
}

// Analiz/Pano'da çözgü üstünde açılan taşınabilir düzenleme penceresi (NumuneDetay
// deseni). Çözgü'de aciklama alanı yok → notlar düz input; AciklamaEditor kullanılmaz.
export function CozguDuzenle({ cozgu, x, y, onKapat, onKaydedildi }: Props) {
  const [form, setForm] = useState<Partial<Cozgu>>({
    adKod: cozgu.adKod,
    cozguBoyuM: cozgu.cozguBoyuM ?? "",
    taharTipi: cozgu.taharTipi ?? "duz",
    cerceveKullanim: cozgu.cerceveKullanim,
    toplamTel: cozgu.toplamTel,
    durum: cozgu.durum,
    notlar: cozgu.notlar ?? "",
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
      await cozguApi.update(cozgu.id, {
        adKod: (form.adKod ?? "").trim() || cozgu.adKod,
        cozguBoyuM: form.cozguBoyuM ? String(form.cozguBoyuM) : null,
        taharTipi: form.taharTipi || null,
        cerceveKullanim: form.cerceveKullanim
          ? Number(form.cerceveKullanim)
          : null,
        toplamTel: form.toplamTel ? Number(form.toplamTel) : null,
        durum: form.durum,
        notlar: form.notlar?.trim() ? form.notlar.trim() : null,
      });
      onKaydedildi();
      onKapat();
    } catch (e) {
      setHata((e as Error).message);
      setKaydediyor(false);
    }
  }

  return (
    <div
      className="numune-detay cozgu-duzenle"
      style={{ left: poz.x, top: poz.y }}
    >
      <div
        className="detay-bar"
        onPointerDown={barDown}
        onPointerMove={barMove}
        onPointerUp={barUp}
      >
        <span className="detay-baslik">Çözgü — {cozgu.adKod}</span>
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
              <label>Çözgü boyu (m)</label>
              <input
                type="number"
                value={form.cozguBoyuM ?? ""}
                onChange={(e) =>
                  setForm({ ...form, cozguBoyuM: e.target.value })
                }
              />
            </div>
            <div>
              <label>Tahar tipi</label>
              <select
                value={form.taharTipi ?? "duz"}
                onChange={(e) => setForm({ ...form, taharTipi: e.target.value })}
              >
                <option value="duz">düz</option>
                <option value="kirik">kırık</option>
                <option value="dalgali">dalgalı</option>
              </select>
            </div>
            <div>
              <label>Çerçeve kullanımı</label>
              <input
                type="number"
                value={form.cerceveKullanim ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    cerceveKullanim: e.target.value
                      ? Number(e.target.value)
                      : null,
                  })
                }
              />
            </div>
            <div>
              <label>Toplam tel</label>
              <input
                type="number"
                value={form.toplamTel ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    toplamTel: e.target.value ? Number(e.target.value) : null,
                  })
                }
              />
            </div>
            <div>
              <label>Durum</label>
              <select
                value={form.durum ?? "taslak"}
                onChange={(e) => setForm({ ...form, durum: e.target.value })}
              >
                {COZGU_DURUMLARI.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid2-tam">
              <label>Notlar</label>
              <input
                value={form.notlar ?? ""}
                onChange={(e) => setForm({ ...form, notlar: e.target.value })}
              />
            </div>
          </div>
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
