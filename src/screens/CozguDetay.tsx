import { useEffect, useMemo, useState } from "react";
import {
  cozguApi,
  iplikApi,
  numuneApi,
  orguSnapshotApi,
  tezgahApi,
} from "../api/client";
import type {
  AtkiIplikRef,
  Cozgu,
  Iplik,
  Numune,
  OrguSnapshot,
  RenkBlok,
  Tezgah,
} from "../lib/types";
import { NUMUNE_DURUMLARI } from "../lib/types";
import { hesaplaMetraj } from "../lib/metraj";
import { numuneKisitlari } from "../lib/kisitlar";
import { MetrajBar } from "./MetrajBar";
import { RenkDizimiEditor } from "./RenkDizimiEditor";
import { KisitUyari } from "./KisitUyari";

interface Props {
  cozguId: string;
  onGeri: () => void;
}

const bosNumune: Partial<Numune> = {
  adKod: "",
  tahminiBoyM: "",
  atkiSikligi: "",
  durum: "taslak",
  orguSnapshotId: null,
  atkiIplikleri: [],
  atkiRenkDizisi: [],
  argeTalepKodu: "",
  argeTalepUrl: "",
  fasIlhamUrl: "",
};

// Seçilen ipliklerin renklerinden atkı renk dizisini türet (mekik kontrolü girdisi).
function renklerdenDizi(iplikler: AtkiIplikRef[]): string[] {
  return iplikler.map((i) => i.renk).filter(Boolean);
}

export function CozguDetay({ cozguId, onGeri }: Props) {
  const [cozgu, setCozgu] = useState<Cozgu | null>(null);
  const [tezgah, setTezgah] = useState<Tezgah | null>(null);
  const [numuneler, setNumuneler] = useState<Numune[]>([]);
  const [snapshotlar, setSnapshotlar] = useState<OrguSnapshot[]>([]);
  const [iplikler, setIplikler] = useState<Iplik[]>([]);
  const [renkDizimi, setRenkDizimi] = useState<RenkBlok[]>([]);
  const [renkKaydedildi, setRenkKaydedildi] = useState(false);
  const [numForm, setNumForm] = useState<Partial<Numune>>(bosNumune);
  const [ekleAcik, setEkleAcik] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  async function yukle() {
    try {
      const c = await cozguApi.get(cozguId);
      const [t, ns, ss, ip] = await Promise.all([
        tezgahApi.get(c.tezgahId),
        numuneApi.listByCozgu(cozguId),
        orguSnapshotApi.listAll(),
        iplikApi.listByTezgah(c.tezgahId),
      ]);
      setCozgu(c);
      setTezgah(t);
      setRenkDizimi(Array.isArray(c.renkDizimi) ? c.renkDizimi : []);
      setNumuneler(ns);
      setSnapshotlar(ss);
      setIplikler(ip);
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

  const snapshotHaritasi = useMemo(() => {
    const m = new Map<string, OrguSnapshot>();
    snapshotlar.forEach((s) => m.set(s.id, s));
    return m;
  }, [snapshotlar]);

  const seciliIplikler = numForm.atkiIplikleri ?? [];

  function iplikToggle(ip: Iplik) {
    const varMi = seciliIplikler.some((s) => s.iplikId === ip.id);
    const yeni: AtkiIplikRef[] = varMi
      ? seciliIplikler.filter((s) => s.iplikId !== ip.id)
      : [...seciliIplikler, { iplikId: ip.id, ad: ip.ad, renk: ip.renk ?? "#999999" }];
    setNumForm({
      ...numForm,
      atkiIplikleri: yeni,
      atkiRenkDizisi: renklerdenDizi(yeni),
    });
  }

  // Formdaki numune için anlık kısıt önizlemesi.
  const formKisitlari = useMemo(() => {
    if (!tezgah || !cozgu) return [];
    const onizleme = {
      ...bosNumune,
      ...numForm,
      atkiRenkDizisi: renklerdenDizi(numForm.atkiIplikleri ?? []),
    } as Numune;
    const snap = numForm.orguSnapshotId
      ? (snapshotHaritasi.get(numForm.orguSnapshotId) ?? null)
      : null;
    return numuneKisitlari(tezgah, cozgu, onizleme, snap);
  }, [tezgah, cozgu, numForm, snapshotHaritasi]);

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
            {tezgah ? `${tezgah.ad} · ` : ""}
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
            {numuneler.map((n) => {
              const snap = n.orguSnapshotId
                ? (snapshotHaritasi.get(n.orguSnapshotId) ?? null)
                : null;
              const kisitlar =
                tezgah && cozgu
                  ? numuneKisitlari(tezgah, cozgu, n, snap)
                  : [];
              return (
                <div key={n.id} className="card" style={{ cursor: "default" }}>
                  <div className="kod">{n.adKod}</div>
                  <div className="meta">
                    {n.tahminiBoyM ? `${n.tahminiBoyM} m` : "boy —"} ·{" "}
                    <span className="badge">{n.durum}</span>
                    {snap && (
                      <>
                        {" · "}
                        <span className="badge">örgü: {snap.ad ?? "—"}</span>
                      </>
                    )}
                  </div>
                  {(n.argeTalepUrl || n.fasIlhamUrl) && (
                    <div className="meta">
                      {n.argeTalepUrl && (
                        <a
                          href={n.argeTalepUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
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
                  <KisitUyari sonuclar={kisitlar} />
                  <div className="actions">
                    <button
                      className="danger small"
                      onClick={() => numuneSil(n.id)}
                    >
                      Sil
                    </button>
                  </div>
                </div>
              );
            })}
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
              <label>Örgü (import edilmiş snapshot)</label>
              <select
                value={numForm.orguSnapshotId ?? ""}
                onChange={(e) =>
                  setNumForm({
                    ...numForm,
                    orguSnapshotId: e.target.value || null,
                  })
                }
              >
                <option value="">— yok —</option>
                {snapshotlar.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.ad ?? s.id} ({s.cerceveSayisi ?? "?"}çrç, {s.taharTipi})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginTop: 8 }}>
            <label>
              Atkı iplikleri (havuzdan seç — mekik kontrolü)
              {tezgah && (
                <span className="mut">
                  {" "}· {new Set(seciliIplikler.map((s) => s.renk.toLowerCase())).size}/
                  {tezgah.mekikSayisi} renk
                </span>
              )}
            </label>
            {iplikler.length === 0 ? (
              <p className="mut" style={{ fontSize: "0.84rem" }}>
                Bu tezgahın iplik havuzu boş. Tezgah detayından iplik ekleyin.
              </p>
            ) : (
              <div className="row" style={{ gap: 8 }}>
                {iplikler.map((ip) => {
                  const secili = seciliIplikler.some(
                    (s) => s.iplikId === ip.id,
                  );
                  return (
                    <span
                      key={ip.id}
                      className={`iplik-chip${secili ? " secili" : ""}`}
                      onClick={() => iplikToggle(ip)}
                    >
                      <span
                        className="iplik-nokta"
                        style={{ background: ip.renk ?? "#ccc" }}
                      />
                      {ip.ad}
                      {secili ? " ✓" : ""}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid2" style={{ marginTop: 8 }}>
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

          {/* Anlık kısıt uyarıları (§7.3) */}
          <KisitUyari sonuclar={formKisitlari} detay />

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
