import { useEffect, useMemo, useState } from "react";
import { cozguApi, numuneApi } from "../api/client";
import type { Cozgu, Numune, RenkBlok } from "../lib/types";
import { NUMUNE_DURUMLARI } from "../lib/types";
import { hesaplaMetraj } from "../lib/metraj";
import { MetrajBar } from "./MetrajBar";
import { RenkDizimiEditor } from "./RenkDizimiEditor";

interface Props {
  cozguId: string;
  onGeri: () => void;
}

const bosNumune: Partial<Numune> = {
  adKod: "",
  tahminiBoyM: "",
  atkiSikligi: "",
  durum: "taslak",
  argeTalepKodu: "",
  argeTalepUrl: "",
  fasIlhamUrl: "",
};

export function CozguDetay({ cozguId, onGeri }: Props) {
  const [cozgu, setCozgu] = useState<Cozgu | null>(null);
  const [numuneler, setNumuneler] = useState<Numune[]>([]);
  const [renkDizimi, setRenkDizimi] = useState<RenkBlok[]>([]);
  const [renkKaydedildi, setRenkKaydedildi] = useState(false);
  const [numForm, setNumForm] = useState<Partial<Numune>>(bosNumune);
  const [ekleAcik, setEkleAcik] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  async function yukle() {
    try {
      const [c, ns] = await Promise.all([
        cozguApi.get(cozguId),
        numuneApi.listByCozgu(cozguId),
      ]);
      setCozgu(c);
      setRenkDizimi(Array.isArray(c.renkDizimi) ? c.renkDizimi : []);
      setNumuneler(ns);
      setHata(null);
    } catch (e) {
      setHata((e as Error).message);
    }
  }

  useEffect(() => {
    yukle();
  }, [cozguId]);

  const metraj = useMemo(
    () => hesaplaMetraj(cozgu?.cozguBoyuM, numuneler),
    [cozgu?.cozguBoyuM, numuneler],
  );

  async function renkKaydet() {
    try {
      await cozguApi.update(cozguId, { renkDizimi });
      setRenkKaydedildi(true);
      setTimeout(() => setRenkKaydedildi(false), 1500);
    } catch (e) {
      setHata((e as Error).message);
    }
  }

  async function numuneKaydet() {
    try {
      await numuneApi.create({ ...numForm, cozguId });
      setNumForm(bosNumune);
      setEkleAcik(false);
      await yukle();
    } catch (e) {
      setHata((e as Error).message);
    }
  }

  async function numuneSil(id: string) {
    try {
      await numuneApi.remove(id);
      await yukle();
    } catch (e) {
      setHata((e as Error).message);
    }
  }

  return (
    <div>
      <div className="crumbs">
        <button onClick={onGeri}>← Geri</button>
        <span>/</span>
        <strong>{cozgu?.adKod ?? "…"}</strong>
      </div>

      {hata && <p className="hata">⚠ {hata}</p>}

      {cozgu && (
        <div className="panel">
          <h3>Çözgü {cozgu.adKod}</h3>
          <div className="meta mut">
            {cozgu.cozguBoyuM ? `${cozgu.cozguBoyuM} m boy` : "boy —"} ·{" "}
            {cozgu.taharTipi ?? "—"} tahar ·{" "}
            {cozgu.cerceveKullanim ?? "—"} çerçeve
          </div>

          {/* Metraj bütçesi göstergesi — Faz 1 çekirdek değeri */}
          <div style={{ marginTop: 12 }}>
            <MetrajBar ozet={metraj} />
          </div>
        </div>
      )}

      <div className="panel">
        <h3>Renk dizimi</h3>
        <RenkDizimiEditor bloklar={renkDizimi} onChange={setRenkDizimi} />
        <div className="actions">
          <button className="primary" onClick={renkKaydet}>
            Renk dizimini kaydet
          </button>
          {renkKaydedildi && <span className="mut">✓ kaydedildi</span>}
        </div>
      </div>

      <div className="panel">
        <h3>Numuneler ({numuneler.length})</h3>
        {numuneler.length === 0 ? (
          <p className="mut">Bu çözgüde henüz numune yok.</p>
        ) : (
          <div className="row">
            {numuneler.map((n) => (
              <div key={n.id} className="card" style={{ cursor: "default" }}>
                <div className="kod">{n.adKod}</div>
                <div className="meta">
                  {n.tahminiBoyM ? `${n.tahminiBoyM} m` : "boy —"} ·{" "}
                  <span className="badge">{n.durum}</span>
                </div>
                {(n.argeTalepUrl || n.fasIlhamUrl) && (
                  <div className="meta">
                    {n.argeTalepUrl && (
                      <a href={n.argeTalepUrl} target="_blank" rel="noreferrer">
                        ARGE talep
                      </a>
                    )}{" "}
                    {n.fasIlhamUrl && (
                      <a href={n.fasIlhamUrl} target="_blank" rel="noreferrer">
                        FAS ilham
                      </a>
                    )}
                  </div>
                )}
                <div className="actions">
                  <button
                    className="danger small"
                    onClick={() => numuneSil(n.id)}
                  >
                    Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {ekleAcik ? (
        <div className="panel">
          <h3>Yeni numune</h3>
          <div className="grid2">
            <div>
              <label>Ad / kod *</label>
              <input
                value={numForm.adKod ?? ""}
                onChange={(e) =>
                  setNumForm({ ...numForm, adKod: e.target.value })
                }
              />
            </div>
            <div>
              <label>Tahmini boy (m)</label>
              <input
                type="number"
                value={numForm.tahminiBoyM ?? ""}
                onChange={(e) =>
                  setNumForm({ ...numForm, tahminiBoyM: e.target.value })
                }
              />
            </div>
            <div>
              <label>Atkı sıklığı (atkı/cm)</label>
              <input
                type="number"
                value={numForm.atkiSikligi ?? ""}
                onChange={(e) =>
                  setNumForm({ ...numForm, atkiSikligi: e.target.value })
                }
              />
            </div>
            <div>
              <label>Durum</label>
              <select
                value={numForm.durum ?? "taslak"}
                onChange={(e) =>
                  setNumForm({ ...numForm, durum: e.target.value })
                }
              >
                {NUMUNE_DURUMLARI.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>ARGE talep kodu (dış ref.)</label>
              <input
                value={numForm.argeTalepKodu ?? ""}
                onChange={(e) =>
                  setNumForm({ ...numForm, argeTalepKodu: e.target.value })
                }
              />
            </div>
            <div>
              <label>ARGE talep URL (dış ref.)</label>
              <input
                value={numForm.argeTalepUrl ?? ""}
                onChange={(e) =>
                  setNumForm({ ...numForm, argeTalepUrl: e.target.value })
                }
              />
            </div>
            <div>
              <label>FAS ilham URL (dış ref.)</label>
              <input
                value={numForm.fasIlhamUrl ?? ""}
                onChange={(e) =>
                  setNumForm({ ...numForm, fasIlhamUrl: e.target.value })
                }
              />
            </div>
          </div>
          <div className="actions">
            <button className="primary" onClick={numuneKaydet}>
              Kaydet
            </button>
            <button
              onClick={() => {
                setEkleAcik(false);
                setNumForm(bosNumune);
              }}
            >
              İptal
            </button>
          </div>
        </div>
      ) : (
        <button className="primary" onClick={() => setEkleAcik(true)}>
          + Numune ekle
        </button>
      )}
    </div>
  );
}
