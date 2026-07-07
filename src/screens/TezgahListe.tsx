import { useEffect, useState } from "react";
import { tezgahApi } from "../api/client";
import type { Tezgah } from "../lib/types";
import { TEZGAH_DURUMLARI } from "../lib/types";

interface Props {
  onAc: (tezgahId: string) => void;
}

const bosForm: Partial<Tezgah> = {
  ad: "",
  marka: "",
  tip: "dobby",
  cerceveSayisi: 0,
  mekikSayisi: 1,
  durum: "bos",
  notlar: "",
};

export function TezgahListe({ onAc }: Props) {
  const [liste, setListe] = useState<Tezgah[]>([]);
  const [form, setForm] = useState<Partial<Tezgah>>(bosForm);
  const [ekleAcik, setEkleAcik] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  async function yukle() {
    setYukleniyor(true);
    try {
      setListe(await tezgahApi.list());
      setHata(null);
    } catch (e) {
      setHata((e as Error).message);
    } finally {
      setYukleniyor(false);
    }
  }

  useEffect(() => {
    yukle();
  }, []);

  async function kaydet() {
    try {
      await tezgahApi.create({
        ...form,
        cerceveSayisi: Number(form.cerceveSayisi) || 0,
        mekikSayisi: Number(form.mekikSayisi) || 1,
      });
      setForm(bosForm);
      setEkleAcik(false);
      await yukle();
    } catch (e) {
      setHata((e as Error).message);
    }
  }

  return (
    <div>
      <div className="crumbs">
        <strong>Tezgahlar</strong>
      </div>

      {hata && <p className="hata">⚠ {hata}</p>}

      <div className="panel">
        {yukleniyor ? (
          <p className="mut">Yükleniyor…</p>
        ) : liste.length === 0 ? (
          <p className="mut">Henüz tezgah yok. Aşağıdan ekleyin.</p>
        ) : (
          <div className="row">
            {liste.map((t) => (
              <div key={t.id} className="card" onClick={() => onAc(t.id)}>
                <div className="kod">{t.ad}</div>
                <div className="meta">
                  {t.marka ?? "—"} · {t.tip ?? "—"} · {t.cerceveSayisi} çerçeve ·{" "}
                  {t.mekikSayisi} mekik
                </div>
                <div className="meta">
                  <span className="badge">{t.durum}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {ekleAcik ? (
        <div className="panel">
          <h3>Yeni tezgah</h3>
          <div className="grid2">
            <div>
              <label>Ad *</label>
              <input
                value={form.ad ?? ""}
                onChange={(e) => setForm({ ...form, ad: e.target.value })}
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
              <label>Çerçeve sayısı (sert limit)</label>
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
          </div>
          <div className="actions">
            <button className="primary" onClick={kaydet}>
              Kaydet
            </button>
            <button
              onClick={() => {
                setEkleAcik(false);
                setForm(bosForm);
              }}
            >
              İptal
            </button>
          </div>
        </div>
      ) : (
        <button className="primary" onClick={() => setEkleAcik(true)}>
          + Tezgah ekle
        </button>
      )}
    </div>
  );
}
