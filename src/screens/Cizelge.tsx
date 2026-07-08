import { useEffect, useMemo, useRef, useState } from "react";
import { cozguApi, numuneApi, tezgahApi } from "../api/client";
import type { Cozgu, Numune, Tezgah } from "../lib/types";
import { hesaplaMetraj } from "../lib/metraj";
import { durumRengi } from "../lib/durum";
import { formatlaAciklama } from "../lib/aciklama";
import { NumuneDetay } from "./NumuneDetay";

interface Props {
  onCozguAc: (cozguId: string) => void;
}

const SOL_ETIKET = 190; // sol sticky etiket kolonu (px)

function toNum(v: string | number | null | undefined): number {
  if (v == null) return 0;
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

// pxM'e göre "güzel" metre tik adımı (etiketli tikler ~100px arayla).
function tikAdimi(pxM: number): number {
  const hamM = pxM > 0 ? 100 / pxM : 100;
  const adaylar = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000];
  for (const a of adaylar) if (a >= hamM) return a;
  return 5000;
}

function tarihKisa(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d.toLocaleDateString("tr-TR");
}

export function Cizelge({ onCozguAc }: Props) {
  const [tezgahlar, setTezgahlar] = useState<Tezgah[]>([]);
  const [cozguler, setCozguler] = useState<Cozgu[]>([]);
  const [numuneler, setNumuneler] = useState<Numune[]>([]);
  const [hata, setHata] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [trackW, setTrackW] = useState(1000);
  const [ipucu, setIpucu] = useState<{ n: Numune; x: number; y: number } | null>(
    null,
  );
  const [detay, setDetay] = useState<{ n: Numune; x: number; y: number } | null>(
    null,
  );
  const sarRef = useRef<HTMLDivElement>(null);

  async function yukle() {
    try {
      const [t, c, n] = await Promise.all([
        tezgahApi.list(),
        cozguApi.listAll(),
        numuneApi.listAll(),
      ]);
      setTezgahlar(t);
      setCozguler(c);
      setNumuneler(n);
      setHata(null);
    } catch (e) {
      setHata((e as Error).message);
    }
  }

  useEffect(() => {
    yukle();
  }, []);

  // Kapsayıcı genişliğini ölç (responsive ölçek için).
  useEffect(() => {
    function olc() {
      if (sarRef.current) setTrackW(sarRef.current.clientWidth);
    }
    olc();
    const ro =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(olc) : null;
    if (ro && sarRef.current) ro.observe(sarRef.current);
    window.addEventListener("resize", olc);
    return () => {
      window.removeEventListener("resize", olc);
      ro?.disconnect();
    };
  }, []);

  // Tezgah → çözgü → numune ağacı (arşivli tezgah gizli).
  const gruplar = useMemo(() => {
    const gorunen = tezgahlar
      .filter((t) => !t.arsivlendi)
      .sort(
        (a, b) => a.sira - b.sira || a.createdAt.localeCompare(b.createdAt),
      );
    return gorunen.map((t) => {
      const cs = cozguler
        .filter((c) => c.tezgahId === t.id)
        .sort(
          (a, b) =>
            a.tezgahSira - b.tezgahSira ||
            a.createdAt.localeCompare(b.createdAt),
        )
        .map((c) => {
          const nums = numuneler
            .filter((n) => n.cozguId === c.id)
            .sort(
              (a, b) =>
                a.siraNo - b.siraNo || a.createdAt.localeCompare(b.createdAt),
            );
          const ozet = hesaplaMetraj(c.cozguBoyuM, nums);
          // Bütçe yoksa bar metresi = kullanılan (fallback).
          const barM = ozet.butceM > 0 ? ozet.butceM : ozet.kullanilanM;
          return { c, nums, ozet, barM, boyTanimsiz: ozet.butceM <= 0 };
        });
      return { t, cozguler: cs };
    });
  }, [tezgahlar, cozguler, numuneler]);

  const maxBoy = useMemo(() => {
    let m = 1;
    for (const g of gruplar)
      for (const l of g.cozguler)
        m = Math.max(m, l.barM, l.ozet.kullanilanM);
    return m;
  }, [gruplar]);

  const kullanilirPx = Math.max(200, trackW - SOL_ETIKET - 8);
  const tabanPxM = kullanilirPx / maxBoy;
  const pxM = Math.max(0.5, tabanPxM * zoom);
  const adim = tikAdimi(pxM);
  const adimPx = adim * pxM;
  const cetvelGenislik = maxBoy * pxM;

  const tikler: number[] = [];
  for (let m = 0; m <= maxBoy + 0.001; m += adim) tikler.push(Math.round(m));

  const bosMu = gruplar.every((g) => g.cozguler.length === 0);

  return (
    <div className="cizelge">
      <div className="crumbs">
        <strong>Çizelge — metre eksenli çözgü/numune iş yükü</strong>
      </div>

      {hata && <p className="hata">⚠ {hata}</p>}

      <div className="cizelge-arac">
        <span className="mut">Yakınlaştır</span>
        <button
          title="Uzaklaştır"
          onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}
        >
          −
        </button>
        <input
          type="range"
          min={0.5}
          max={4}
          step={0.25}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
        />
        <button
          title="Yakınlaştır"
          onClick={() => setZoom((z) => Math.min(4, +(z + 0.25).toFixed(2)))}
        >
          +
        </button>
        <button onClick={() => setZoom(1)}>Sığdır</button>
        <span className="mut" style={{ marginLeft: 4 }}>
          1m ≈ {pxM.toFixed(1)}px
        </span>
        <span className="cizelge-lejant">
          <i style={{ background: durumRengi("taslak") }} /> taslak
          <i style={{ background: durumRengi("onayli") }} /> kesin
          <i style={{ background: durumRengi("tamam") }} /> tamam
          <i style={{ background: durumRengi("iptal") }} /> iptal
        </span>
      </div>

      <div className="cizelge-sar" ref={sarRef}>
        <div
          className="cizelge-icerik"
          style={{ ["--adim" as string]: `${adimPx}px` }}
        >
          {/* Cetvel */}
          <div className="cizelge-cetvel">
            <div className="cetvel-bos" />
            <div className="cetvel-track" style={{ width: cetvelGenislik }}>
              {tikler.map((m) => (
                <span
                  key={m}
                  className="cetvel-tik"
                  style={{ left: m * pxM }}
                >
                  {m}m
                </span>
              ))}
            </div>
          </div>

          {bosMu && <p className="mut">Gösterilecek çözgü yok.</p>}

          {gruplar.map((g) => (
            <div className="cizelge-grup" key={g.t.id}>
              <div className="grup-baslik">
                <span className="grup-ad">{g.t.ad}</span>
                {g.t.planTarihi && (
                  <span className="badge">📅 {tarihKisa(g.t.planTarihi)}</span>
                )}
                <span className="mut">{g.cozguler.length} çözgü</span>
              </div>

              {g.cozguler.length === 0 && (
                <div className="cizelge-lane">
                  <div className="lane-etiket mut">— çözgü yok —</div>
                  <div className="lane-track" />
                </div>
              )}

              {g.cozguler.map((l) => {
                const dolulukPct =
                  l.barM > 0
                    ? Math.round((l.ozet.kullanilanM / l.barM) * 100)
                    : 0;
                const icerikM = Math.max(l.barM, l.ozet.kullanilanM);
                let offset = 0; // kümülatif metre
                return (
                  <div className="cizelge-lane" key={l.c.id}>
                    <div
                      className="lane-etiket"
                      title="Çözgü detayına git"
                      onClick={() => onCozguAc(l.c.id)}
                    >
                      <span className="lane-kod">{l.c.adKod}</span>
                      <span className="mut lane-alt">
                        {l.boyTanimsiz
                          ? "boy —"
                          : `${l.barM}m · %${dolulukPct}`}
                      </span>
                    </div>
                    <div
                      className="lane-track"
                      style={{ width: Math.max(icerikM * pxM, 4) }}
                    >
                      {/* Bütçe aşımı bölgesi */}
                      {l.ozet.asim && (
                        <div
                          className="lane-asim"
                          style={{
                            left: l.barM * pxM,
                            width: (l.ozet.kullanilanM - l.barM) * pxM,
                          }}
                          title={`Bütçe aşımı: ${(
                            l.ozet.kullanilanM - l.barM
                          ).toFixed(1)}m`}
                        />
                      )}
                      {/* Bütçe sınır çizgisi */}
                      {!l.boyTanimsiz && (
                        <div
                          className="lane-butce"
                          style={{ left: l.barM * pxM }}
                        />
                      )}
                      {/* Boş kalan */}
                      {l.ozet.kalanM > 0 && (
                        <div
                          className="lane-bos"
                          style={{
                            left: l.ozet.kullanilanM * pxM,
                            width: l.ozet.kalanM * pxM,
                          }}
                        >
                          {l.ozet.kalanM * pxM > 46 && (
                            <span>boş {Math.round(l.ozet.kalanM)}m</span>
                          )}
                        </div>
                      )}
                      {/* Numune iş emirleri */}
                      {l.nums.map((n) => {
                        const boy = toNum(n.tahminiBoyM);
                        const sol = offset * pxM;
                        const gen = Math.max(boy * pxM, boy > 0 ? 2 : 3);
                        offset += boy;
                        const genis = gen > 42;
                        return (
                          <div
                            key={n.id}
                            className="is-emri"
                            style={{
                              left: sol,
                              width: gen,
                              background: durumRengi(n.durum),
                            }}
                            onMouseEnter={(e) =>
                              setIpucu({ n, x: e.clientX, y: e.clientY })
                            }
                            onMouseLeave={() => setIpucu(null)}
                            onClick={(e) => {
                              setIpucu(null);
                              setDetay({ n, x: e.clientX, y: e.clientY });
                            }}
                          >
                            {genis && (
                              <span className="is-emri-et">
                                {n.adKod}
                                {gen > 90 && boy > 0 ? ` ·${boy}m` : ""}
                                {n.varyantSayisi > 0 ? ` ⎇${n.varyantSayisi}` : ""}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Hover ipucu */}
      {ipucu && (
        <div
          className="numune-ipucu"
          style={{
            left: Math.min(ipucu.x + 14, window.innerWidth - 340),
            top: Math.min(ipucu.y + 12, window.innerHeight - 220),
          }}
        >
          <div className="ipucu-baslik">{ipucu.n.adKod}</div>
          <div className="mut" style={{ fontSize: "0.78rem", marginBottom: 4 }}>
            {toNum(ipucu.n.tahminiBoyM)}m · {ipucu.n.durum}
            {ipucu.n.varyantSayisi > 0 ? ` · ⎇${ipucu.n.varyantSayisi} varyant` : ""}
          </div>
          {ipucu.n.aciklama && ipucu.n.aciklama.trim() && (
            <div className="bicimli">{formatlaAciklama(ipucu.n.aciklama)}</div>
          )}
        </div>
      )}

      {/* Detay / düzenle */}
      {detay && (
        <NumuneDetay
          numune={detay.n}
          x={detay.x}
          y={detay.y}
          onKapat={() => setDetay(null)}
          onKaydedildi={yukle}
        />
      )}
    </div>
  );
}
