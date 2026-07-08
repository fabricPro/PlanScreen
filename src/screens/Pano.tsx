import { useEffect, useMemo, useState } from "react";
import {
  cozguApi,
  numuneApi,
  orguSnapshotApi,
  tezgahApi,
} from "../api/client";
import type { Cozgu, Numune, OrguSnapshot, Tezgah } from "../lib/types";
import { hesaplaMetraj } from "../lib/metraj";
import { numuneKisitlari, uyariSayisi } from "../lib/kisitlar";
import {
  durumRengi,
  isKesin,
  isTaslak,
  oncekiDurum,
  sonrakiDurum,
} from "../lib/durum";
import { MetrajBar } from "./MetrajBar";

interface Props {
  onCozguAc: (cozguId: string) => void;
}

type Suru =
  | { tip: "cozgu"; id: string }
  | { tip: "numune"; id: string }
  | null;

// Tezgah-şerit panosu (CLAUDE.md §7.1, §9 Faz 2): her tezgah bir kolon;
// içinde çözgüler sırayla; her çözgünün altında numuneler.
// Sürükle-bırak (masaüstü) + ok butonları (tablet) ile taşıma/sıralama.
export function Pano({ onCozguAc }: Props) {
  const [tezgahlar, setTezgahlar] = useState<Tezgah[]>([]);
  const [cozguler, setCozguler] = useState<Cozgu[]>([]);
  const [numuneler, setNumuneler] = useState<Numune[]>([]);
  const [snapshotlar, setSnapshotlar] = useState<OrguSnapshot[]>([]);
  const [hata, setHata] = useState<string | null>(null);
  const [suru, setSuru] = useState<Suru>(null);
  const [hedef, setHedef] = useState<string | null>(null); // vurgulanan drop hedefi

  async function yukle() {
    try {
      const [t, c, n, s] = await Promise.all([
        tezgahApi.list(),
        cozguApi.listAll(),
        numuneApi.listAll(),
        orguSnapshotApi.listAll(),
      ]);
      setTezgahlar(t);
      setCozguler(c);
      setNumuneler(n);
      setSnapshotlar(s);
      setHata(null);
    } catch (e) {
      setHata((e as Error).message);
    }
  }

  useEffect(() => {
    yukle();
  }, []);

  const snapshotHaritasi = useMemo(() => {
    const m = new Map<string, OrguSnapshot>();
    snapshotlar.forEach((s) => m.set(s.id, s));
    return m;
  }, [snapshotlar]);

  // Bir numunenin kısıt uyarı sayısı (⚠ göstergesi için).
  function numuneUyari(t: Tezgah, c: Cozgu, n: Numune): number {
    const snap = n.orguSnapshotId
      ? (snapshotHaritasi.get(n.orguSnapshotId) ?? null)
      : null;
    return uyariSayisi(numuneKisitlari(t, c, n, snap));
  }

  function cozgulerinTezgahi(tezgahId: string): Cozgu[] {
    return cozguler
      .filter((c) => c.tezgahId === tezgahId)
      .sort(
        (a, b) =>
          a.tezgahSira - b.tezgahSira || a.createdAt.localeCompare(b.createdAt),
      );
  }

  function cozgununNumuneleri(cozguId: string): Numune[] {
    return numuneler
      .filter((n) => n.cozguId === cozguId)
      .sort(
        (a, b) => a.siraNo - b.siraNo || a.createdAt.localeCompare(b.createdAt),
      );
  }

  async function calis(fn: () => Promise<unknown>) {
    try {
      await fn();
      await yukle();
    } catch (e) {
      setHata((e as Error).message);
    }
  }

  // Sıralama: kardeşleri yeniden indeksle, değişen sira alanlarını PUT et.
  function tasiIndeks<T>(arr: T[], from: number, dir: -1 | 1): T[] {
    const to = from + dir;
    if (to < 0 || to >= arr.length) return arr;
    const kopya = arr.slice();
    [kopya[from], kopya[to]] = [kopya[to], kopya[from]];
    return kopya;
  }

  function cozguSirala(tezgahId: string, cozguId: string, dir: -1 | 1) {
    const sirali = cozgulerinTezgahi(tezgahId);
    const i = sirali.findIndex((c) => c.id === cozguId);
    const yeni = tasiIndeks(sirali, i, dir);
    if (yeni === sirali) return;
    calis(() =>
      Promise.all(
        yeni.map((c, idx) =>
          c.tezgahSira === idx
            ? null
            : cozguApi.update(c.id, { tezgahSira: idx }),
        ),
      ),
    );
  }

  function numuneSirala(cozguId: string, numuneId: string, dir: -1 | 1) {
    const sirali = cozgununNumuneleri(cozguId);
    const i = sirali.findIndex((n) => n.id === numuneId);
    const yeni = tasiIndeks(sirali, i, dir);
    if (yeni === sirali) return;
    calis(() =>
      Promise.all(
        yeni.map((n, idx) =>
          n.siraNo === idx ? null : numuneApi.update(n.id, { siraNo: idx }),
        ),
      ),
    );
  }

  // Taşıma (drag-drop veya select): çözgüyü başka tezgaha, numuneyi başka çözgüye.
  function cozguyuTezgahaTasi(cozguId: string, tezgahId: string) {
    const mevcut = cozguler.find((c) => c.id === cozguId);
    if (!mevcut || mevcut.tezgahId === tezgahId) return;
    const sonSira = cozgulerinTezgahi(tezgahId).length;
    calis(() => cozguApi.update(cozguId, { tezgahId, tezgahSira: sonSira }));
  }

  function numuneyiCozguyeTasi(numuneId: string, cozguId: string) {
    const mevcut = numuneler.find((n) => n.id === numuneId);
    if (!mevcut || mevcut.cozguId === cozguId) return;
    const sonSira = cozgununNumuneleri(cozguId).length;
    calis(() => numuneApi.update(numuneId, { cozguId, siraNo: sonSira }));
  }

  function durumDegistir(n: Numune, hedefDurum: string | null) {
    if (!hedefDurum) return;
    calis(() => numuneApi.update(n.id, { durum: hedefDurum }));
  }

  if (hata) return <p className="hata">⚠ {hata}</p>;

  if (tezgahlar.length === 0) {
    return (
      <p className="mut">
        Henüz tezgah yok. "Liste" sekmesinden tezgah ve çözgü ekleyin.
      </p>
    );
  }

  return (
    <div className="pano">
      {tezgahlar.map((t) => {
        const kolonCozguleri = cozgulerinTezgahi(t.id);
        return (
          <div
            key={t.id}
            className={`serit${hedef === `tz-${t.id}` ? " drop" : ""}`}
            onDragOver={(e) => {
              if (suru?.tip === "cozgu") {
                e.preventDefault();
                setHedef(`tz-${t.id}`);
              }
            }}
            onDragLeave={() => setHedef(null)}
            onDrop={(e) => {
              e.preventDefault();
              if (suru?.tip === "cozgu") cozguyuTezgahaTasi(suru.id, t.id);
              setSuru(null);
              setHedef(null);
            }}
          >
            <h3>
              <span>{t.ad}</span>
              <span className="mut" style={{ fontSize: 13 }}>
                {kolonCozguleri.length} çözgü · {t.cerceveSayisi}çrç ·{" "}
                {t.mekikSayisi}mkk
              </span>
            </h3>

            {kolonCozguleri.length === 0 && (
              <p className="mut" style={{ fontSize: 13 }}>
                Çözgü yok
              </p>
            )}

            {kolonCozguleri.map((c, ci) => {
              const cNumuneler = cozgununNumuneleri(c.id);
              const metraj = hesaplaMetraj(c.cozguBoyuM, cNumuneler);
              const taslaklar = cNumuneler.filter((n) => isTaslak(n.durum));
              const kesinler = cNumuneler.filter((n) => isKesin(n.durum));
              const iptaller = cNumuneler.filter(
                (n) => !isTaslak(n.durum) && !isKesin(n.durum),
              );

              return (
                <div
                  key={c.id}
                  className={`cozgu-kart${
                    hedef === `cz-${c.id}` ? " drop" : ""
                  }`}
                  draggable
                  onDragStart={(e) => {
                    e.stopPropagation();
                    setSuru({ tip: "cozgu", id: c.id });
                  }}
                  onDragEnd={() => {
                    setSuru(null);
                    setHedef(null);
                  }}
                  onDragOver={(e) => {
                    if (suru?.tip === "numune") {
                      e.preventDefault();
                      e.stopPropagation();
                      setHedef(`cz-${c.id}`);
                    }
                  }}
                  onDrop={(e) => {
                    if (suru?.tip === "numune") {
                      e.preventDefault();
                      e.stopPropagation();
                      numuneyiCozguyeTasi(suru.id, c.id);
                      setSuru(null);
                      setHedef(null);
                    }
                  }}
                >
                  <div className="kart-baslik">
                    <span className="kod" onClick={() => onCozguAc(c.id)}>
                      {c.adKod}
                    </span>
                    <span className="mini-araclar">
                      <button
                        title="Yukarı"
                        disabled={ci === 0}
                        onClick={() => cozguSirala(t.id, c.id, -1)}
                      >
                        ↑
                      </button>
                      <button
                        title="Aşağı"
                        disabled={ci === kolonCozguleri.length - 1}
                        onClick={() => cozguSirala(t.id, c.id, 1)}
                      >
                        ↓
                      </button>
                    </span>
                  </div>

                  <div style={{ margin: "6px 0" }}>
                    <MetrajBar ozet={metraj} />
                  </div>

                  {tezgahlar.length > 1 && (
                    <select
                      className="tasi"
                      value=""
                      onChange={(e) =>
                        e.target.value &&
                        cozguyuTezgahaTasi(c.id, e.target.value)
                      }
                    >
                      <option value="">↪ tezgaha taşı…</option>
                      {tezgahlar
                        .filter((x) => x.id !== t.id)
                        .map((x) => (
                          <option key={x.id} value={x.id}>
                            {x.ad}
                          </option>
                        ))}
                    </select>
                  )}

                  {taslaklar.length > 0 && (
                    <>
                      <div className="havuz-etiket">Taslak havuz</div>
                      {taslaklar.map((n) => (
                        <NumuneSatir
                          key={n.id}
                          n={n}
                          uyari={numuneUyari(t, c, n)}
                          onSira={(d) => numuneSirala(c.id, n.id, d)}
                          onDurum={(hd) => durumDegistir(n, hd)}
                          onSuruBasla={() => setSuru({ tip: "numune", id: n.id })}
                          onSuruBitir={() => {
                            setSuru(null);
                            setHedef(null);
                          }}
                        />
                      ))}
                    </>
                  )}

                  {kesinler.length > 0 && (
                    <>
                      <div className="havuz-etiket">
                        Kesin kuyruk <span className="kilit">🔒</span>
                      </div>
                      {kesinler.map((n) => (
                        <NumuneSatir
                          key={n.id}
                          n={n}
                          uyari={numuneUyari(t, c, n)}
                          onSira={(d) => numuneSirala(c.id, n.id, d)}
                          onDurum={(hd) => durumDegistir(n, hd)}
                          onSuruBasla={() => setSuru({ tip: "numune", id: n.id })}
                          onSuruBitir={() => {
                            setSuru(null);
                            setHedef(null);
                          }}
                        />
                      ))}
                    </>
                  )}

                  {iptaller.map((n) => (
                    <NumuneSatir
                      key={n.id}
                      n={n}
                      uyari={numuneUyari(t, c, n)}
                      onSira={(d) => numuneSirala(c.id, n.id, d)}
                      onDurum={(hd) => durumDegistir(n, hd)}
                      onSuruBasla={() => setSuru({ tip: "numune", id: n.id })}
                      onSuruBitir={() => {
                        setSuru(null);
                        setHedef(null);
                      }}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// Tek numune satırı: durum noktası, ad, sıra okları, durum ilerlet/geri, onayla/iptal.
function NumuneSatir({
  n,
  uyari = 0,
  onSira,
  onDurum,
  onSuruBasla,
  onSuruBitir,
}: {
  n: Numune;
  uyari?: number;
  onSira: (dir: -1 | 1) => void;
  onDurum: (hedefDurum: string | null) => void;
  onSuruBasla: () => void;
  onSuruBitir: () => void;
}) {
  const sonra = sonrakiDurum(n.durum);
  const once = oncekiDurum(n.durum);
  const iptalDurumu = n.durum === "iptal";

  return (
    <div
      className="numune-satir"
      draggable
      onDragStart={(e) => {
        e.stopPropagation();
        onSuruBasla();
      }}
      onDragEnd={onSuruBitir}
    >
      <span
        className="durum-nokta"
        style={{ background: durumRengi(n.durum) }}
        title={n.durum}
      />
      <span className="ad" title={n.adKod}>
        {uyari > 0 && (
          <span
            className="hata"
            title={`${uyari} kısıt uyarısı`}
            style={{ marginRight: 3 }}
          >
            ⚠
          </span>
        )}
        {n.adKod}
        {n.tahminiBoyM ? ` · ${n.tahminiBoyM}m` : ""}
      </span>
      <span className="mini-araclar">
        <button title="Yukarı" onClick={() => onSira(-1)}>
          ↑
        </button>
        <button title="Aşağı" onClick={() => onSira(1)}>
          ↓
        </button>
        {iptalDurumu ? (
          <button title="Taslağa geri al" onClick={() => onDurum("taslak")}>
            ↺
          </button>
        ) : (
          <>
            {once && (
              <button title={`← ${once}`} onClick={() => onDurum(once)}>
                ‹
              </button>
            )}
            {n.durum === "taslak" ? (
              <button
                className="primary"
                title="Onayla → kesin kuyruk"
                onClick={() => onDurum("onayli")}
              >
                ✓
              </button>
            ) : (
              sonra && (
                <button title={`→ ${sonra}`} onClick={() => onDurum(sonra)}>
                  ›
                </button>
              )
            )}
            <button
              className="danger"
              title="İptal"
              onClick={() => onDurum("iptal")}
            >
              ×
            </button>
          </>
        )}
      </span>
    </div>
  );
}
