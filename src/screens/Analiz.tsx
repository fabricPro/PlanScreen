import { useEffect, useMemo, useState } from "react";
import { cozguApi, numuneApi, tezgahApi } from "../api/client";
import type { Cozgu, Numune, Tezgah } from "../lib/types";
import { hesaplaMetraj } from "../lib/metraj";
import { durumRengi } from "../lib/durum";
import { tarihKisa } from "../lib/gorev";
import { CozguDuzenle } from "./CozguDuzenle";
import { TezgahDuzenle } from "./TezgahDuzenle";

interface Props {
  onCozguAc?: (cozguId: string) => void;
}

// Bir çözgü + metraj özeti (analiz satırı için türetilmiş).
interface CozguSatir {
  c: Cozgu;
  numuneSayisi: number;
  kullanilanM: number;
  kalanM: number;
  butceM: number;
  doluluk: number | null; // %
  asim: boolean;
}

interface TezgahBlok {
  t: Tezgah;
  satirlar: CozguSatir[];
  toplamBoy: number;
  toplamNumune: number;
}

function num(v: number): string {
  // Tam sayıysa ondalıksız, değilse tek ondalık.
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

// CSV hücresi: tırnakla sar, içteki tırnağı çiftle.
function csvHucre(v: string | number | null | undefined): string {
  const s = v == null ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

export function Analiz({ onCozguAc }: Props) {
  const [tezgahlar, setTezgahlar] = useState<Tezgah[]>([]);
  const [cozguler, setCozguler] = useState<Cozgu[]>([]);
  const [numuneler, setNumuneler] = useState<Numune[]>([]);
  const [hata, setHata] = useState<string | null>(null);
  const [cozguDuzenle, setCozguDuzenle] = useState<{
    cozgu: Cozgu;
    x: number;
    y: number;
  } | null>(null);
  const [tezgahDuzenle, setTezgahDuzenle] = useState<{
    tezgah: Tezgah;
    x: number;
    y: number;
  } | null>(null);
  const [arsivAcik, setArsivAcik] = useState(false);

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

  // Aktif tezgah → çözgü → metraj özeti (arşivli tezgah gizli).
  const bloklar = useMemo<TezgahBlok[]>(() => {
    const gorunen = tezgahlar
      .filter((t) => !t.arsivlendi)
      .sort(
        (a, b) => a.sira - b.sira || a.createdAt.localeCompare(b.createdAt),
      );
    return gorunen.map((t) => {
      const satirlar: CozguSatir[] = cozguler
        .filter((c) => c.tezgahId === t.id)
        .sort(
          (a, b) =>
            a.tezgahSira - b.tezgahSira ||
            a.createdAt.localeCompare(b.createdAt),
        )
        .map((c) => {
          const nums = numuneler.filter((n) => n.cozguId === c.id);
          const ozet = hesaplaMetraj(c.cozguBoyuM, nums);
          const doluluk =
            ozet.butceM > 0
              ? Math.round((ozet.kullanilanM / ozet.butceM) * 100)
              : null;
          return {
            c,
            numuneSayisi: nums.length,
            kullanilanM: ozet.kullanilanM,
            kalanM: ozet.kalanM,
            butceM: ozet.butceM,
            doluluk,
            asim: ozet.asim,
          };
        });
      return {
        t,
        satirlar,
        toplamBoy: satirlar.reduce((s, x) => s + x.butceM, 0),
        toplamNumune: satirlar.reduce((s, x) => s + x.numuneSayisi, 0),
      };
    });
  }, [tezgahlar, cozguler, numuneler]);

  const bugun = useMemo(() => new Date().toLocaleDateString("tr-TR"), []);

  const arsivliler = useMemo(
    () =>
      tezgahlar
        .filter((t) => t.arsivlendi)
        .sort((a, b) => a.sira - b.sira || a.ad.localeCompare(b.ad)),
    [tezgahlar],
  );

  async function arsivdenCikar(t: Tezgah) {
    try {
      await tezgahApi.update(t.id, { arsivlendi: false });
      await yukle();
    } catch (e) {
      setHata((e as Error).message);
    }
  }

  function csvIndir() {
    const basliklar = [
      "Tezgah",
      "Takım",
      "Marka",
      "Tip",
      "Çözgü",
      "Boy (m)",
      "Tahar",
      "Çerçeve",
      "Sıklık",
      "Numune",
      "Kullanılan (m)",
      "Kalan (m)",
      "Doluluk %",
      "Durum",
      "Not",
    ];
    const satirlar: string[] = [basliklar.map(csvHucre).join(";")];
    for (const blok of bloklar) {
      if (blok.satirlar.length === 0) {
        satirlar.push(
          [blok.t.ad, blok.t.takim, blok.t.marka, blok.t.tip]
            .map(csvHucre)
            .concat(Array(11).fill('""'))
            .join(";"),
        );
        continue;
      }
      for (const s of blok.satirlar) {
        satirlar.push(
          [
            blok.t.ad,
            blok.t.takim,
            blok.t.marka,
            blok.t.tip,
            s.c.adKod,
            num(s.butceM),
            s.c.taharTipi,
            s.c.cerceveKullanim,
            s.c.cozguSikligi,
            s.numuneSayisi,
            num(s.kullanilanM),
            num(s.kalanM),
            s.doluluk == null ? "" : s.doluluk,
            s.c.durum,
            s.c.notlar,
          ]
            .map(csvHucre)
            .join(";"),
        );
      }
    }
    // BOM → Excel Türkçe karakterleri doğru okur.
    const icerik = "﻿" + satirlar.join("\r\n");
    const blob = new Blob([icerik], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const d = new Date();
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`;
    a.download = `analiz-${iso}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="analiz">
      <div className="crumbs analiz-arac">
        <strong>Analiz</strong>
        <span className="mut">· planlama listesi · {bugun}</span>
        <span className="analiz-arac-butonlar">
          <button onClick={() => window.print()}>🖨 Yazdır</button>
          <button onClick={csvIndir}>⬇ CSV indir</button>
        </span>
      </div>

      {hata && <p className="hata">⚠ {hata}</p>}

      {bloklar.length === 0 && !hata && (
        <p className="mut">Aktif tezgah yok.</p>
      )}

      {bloklar.map((blok) => {
        const t = blok.t;
        return (
          <div className="analiz-tezgah" key={t.id}>
            <div className="analiz-tezgah-bar">
              <span className="analiz-tezgah-ad">{t.ad}</span>
              <span className="analiz-takim">
                Takım: {t.takim?.trim() || "—"}
              </span>
              <span className="mut analiz-meta">
                {[t.marka, t.tip].filter(Boolean).join(" · ") || "—"} ·{" "}
                {t.cerceveSayisi} çerçeve · {t.mekikSayisi} mekik
                {t.maxTarakEniCm ? ` · ${t.maxTarakEniCm} cm` : ""}
              </span>
              {t.planTarihi && (
                <span className="badge">📅 {tarihKisa(t.planTarihi)}</span>
              )}
              <span className="badge">{t.durum}</span>
              <button
                className="analiz-duzenle-dugme"
                title="Tezgahı düzenle"
                onClick={(e) =>
                  setTezgahDuzenle({ tezgah: t, x: e.clientX, y: e.clientY })
                }
              >
                ✎
              </button>
            </div>

            <div className="analiz-tablo-sar">
              <table className="analiz-tablo">
                <thead>
                  <tr>
                    <th className="s-no">#</th>
                    <th>Çözgü</th>
                    <th className="s-sag">Boy (m)</th>
                    <th>Tahar</th>
                    <th className="s-sag">Çerçeve</th>
                    <th>Sıklık</th>
                    <th className="s-sag">Numune</th>
                    <th className="s-sag">Kullanılan</th>
                    <th className="s-sag">Kalan</th>
                    <th className="s-sag">Doluluk</th>
                    <th>Durum</th>
                    <th className="s-not">Not</th>
                    <th className="s-arac"></th>
                  </tr>
                </thead>
                <tbody>
                  {blok.satirlar.length === 0 ? (
                    <tr>
                      <td className="mut analiz-bos" colSpan={13}>
                        çözgü yok
                      </td>
                    </tr>
                  ) : (
                    blok.satirlar.map((s, i) => (
                      <tr
                        key={s.c.id}
                        className={onCozguAc ? "tiklanir" : ""}
                        onClick={() => onCozguAc?.(s.c.id)}
                      >
                        <td className="s-no mut">{i + 1}</td>
                        <td className="s-kod">{s.c.adKod}</td>
                        <td className="s-sag">{num(s.butceM) || "—"}</td>
                        <td>{s.c.taharTipi || "—"}</td>
                        <td className="s-sag">{s.c.cerceveKullanim ?? "—"}</td>
                        <td>{s.c.cozguSikligi || "—"}</td>
                        <td className="s-sag">{s.numuneSayisi}</td>
                        <td className="s-sag">{num(s.kullanilanM)}</td>
                        <td className={`s-sag${s.asim ? " analiz-uyari" : ""}`}>
                          {num(s.kalanM)}
                        </td>
                        <td className={`s-sag${s.asim ? " analiz-uyari" : ""}`}>
                          {s.doluluk == null ? "—" : `%${s.doluluk}`}
                        </td>
                        <td>
                          <span className="analiz-durum">
                            <span
                              className="analiz-durum-nokta"
                              style={{ background: durumRengi(s.c.durum) }}
                            />
                            {s.c.durum}
                          </span>
                        </td>
                        <td className="s-not mut">{s.c.notlar || ""}</td>
                        <td className="s-arac">
                          <button
                            className="analiz-duzenle-dugme"
                            title="Çözgüyü düzenle"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCozguDuzenle({
                                cozgu: s.c,
                                x: e.clientX,
                                y: e.clientY,
                              });
                            }}
                          >
                            ✎
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {blok.satirlar.length > 0 && (
                  <tfoot>
                    <tr className="analiz-toplam">
                      <td colSpan={2}>
                        {blok.satirlar.length} çözgü
                      </td>
                      <td className="s-sag">{num(blok.toplamBoy)}</td>
                      <td colSpan={3}></td>
                      <td className="s-sag">{blok.toplamNumune}</td>
                      <td colSpan={6}></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        );
      })}

      {arsivliler.length > 0 && (
        <div className="analiz-arsiv">
          <button
            className="analiz-arsiv-baslik"
            onClick={() => setArsivAcik((v) => !v)}
          >
            {arsivAcik ? "▾" : "▸"} Arşivlenenler ({arsivliler.length})
          </button>
          {arsivAcik && (
            <div className="analiz-arsiv-govde">
              {arsivliler.map((t) => (
                <div className="analiz-arsiv-satir" key={t.id}>
                  <span className="analiz-tezgah-ad">{t.ad}</span>
                  <span className="mut">Takım: {t.takim?.trim() || "—"}</span>
                  <button
                    className="analiz-arsiv-cikar"
                    onClick={() => arsivdenCikar(t)}
                  >
                    Arşivden çıkar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {cozguDuzenle && (
        <CozguDuzenle
          cozgu={cozguDuzenle.cozgu}
          x={cozguDuzenle.x}
          y={cozguDuzenle.y}
          onKapat={() => setCozguDuzenle(null)}
          onKaydedildi={yukle}
        />
      )}
      {tezgahDuzenle && (
        <TezgahDuzenle
          tezgah={tezgahDuzenle.tezgah}
          x={tezgahDuzenle.x}
          y={tezgahDuzenle.y}
          onKapat={() => setTezgahDuzenle(null)}
          onKaydedildi={yukle}
        />
      )}
    </div>
  );
}
