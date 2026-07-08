import { useEffect, useState } from "react";
import { iplikApi } from "../api/client";
import type { Iplik } from "../lib/types";
import { renkAdiBul } from "../lib/palette";
import { RenkSecici } from "./RenkSecici";

// Tezgaha ait atkı ipliği havuzu (Tezgah > ... > İplik). "Bu tezgahta denenebilecek iplikler."
interface Props {
  tezgahId: string;
  // Dışarıdan (ör. Pano hızlı ekle) tetiklenen yenilemeler için sürüm anahtarı.
  yenile?: number;
}

const bosIplik: Partial<Iplik> = {
  ad: "",
  tip: "pamuk",
  renk: "#DCC29B",
  numara: "",
};

export function IplikHavuzu({ tezgahId, yenile = 0 }: Props) {
  const [liste, setListe] = useState<Iplik[]>([]);
  const [form, setForm] = useState<Partial<Iplik>>(bosIplik);
  const [ekleAcik, setEkleAcik] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  async function yukle() {
    try {
      setListe(await iplikApi.listByTezgah(tezgahId));
      setHata(null);
    } catch (e) {
      setHata((e as Error).message);
    }
  }

  useEffect(() => {
    yukle();
  }, [tezgahId, yenile]);

  async function kaydet() {
    try {
      await iplikApi.create({
        ...form,
        tezgahId,
        renkAdi: form.renk ? renkAdiBul(form.renk) : null,
      });
      setForm(bosIplik);
      setEkleAcik(false);
      await yukle();
    } catch (e) {
      setHata((e as Error).message);
    }
  }

  async function sil(id: string) {
    try {
      await iplikApi.remove(id);
      await yukle();
    } catch (e) {
      setHata((e as Error).message);
    }
  }

  return (
    <div className="panel">
      <h3>Denenebilecek iplikler ({liste.length})</h3>
      <p className="mut" style={{ fontSize: "0.86rem", marginTop: 0 }}>
        Bu tezgahta denenebilecek atkı iplikleri. Numune eklerken buradan seçilir.
      </p>

      {hata && <p className="hata">⚠ {hata}</p>}

      {liste.length === 0 ? (
        <p className="mut">Havuz boş.</p>
      ) : (
        <div className="row" style={{ gap: 8 }}>
          {liste.map((ip) => (
            <span key={ip.id} className="iplik-chip" title={ip.tip ?? ""}>
              <span
                className="iplik-nokta"
                style={{ background: ip.renk ?? "#ccc" }}
              />
              <span>
                {ip.ad}
                {ip.numara ? ` · ${ip.numara}` : ""}
              </span>
              <button
                className="danger small"
                style={{ padding: "1px 7px" }}
                onClick={() => sil(ip.id)}
                title="Sil"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {ekleAcik ? (
        <div className="panel" style={{ marginTop: 12, marginBottom: 0 }}>
          <div className="grid2">
            <div>
              <label>Ad *</label>
              <input
                value={form.ad ?? ""}
                onChange={(e) => setForm({ ...form, ad: e.target.value })}
              />
            </div>
            <div>
              <label>Tip</label>
              <input
                value={form.tip ?? ""}
                placeholder="pamuk / polyester / …"
                onChange={(e) => setForm({ ...form, tip: e.target.value })}
              />
            </div>
            <div>
              <label>Numara</label>
              <input
                value={form.numara ?? ""}
                placeholder="ör. 30/2"
                onChange={(e) => setForm({ ...form, numara: e.target.value })}
              />
            </div>
            <div>
              <label>Renk (perde paleti)</label>
              <div>
                <RenkSecici
                  value={form.renk ?? "#DCC29B"}
                  onChange={(hex) => setForm({ ...form, renk: hex })}
                />
              </div>
            </div>
          </div>
          <div className="actions">
            <button className="primary" onClick={kaydet}>
              Kaydet
            </button>
            <button
              onClick={() => {
                setEkleAcik(false);
                setForm(bosIplik);
              }}
            >
              İptal
            </button>
          </div>
        </div>
      ) : (
        <div className="actions">
          <button onClick={() => setEkleAcik(true)}>+ İplik ekle</button>
        </div>
      )}
    </div>
  );
}
