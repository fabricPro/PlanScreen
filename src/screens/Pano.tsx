import { useEffect, useMemo, useState } from "react";
import {
  cozguApi,
  gorevApi,
  iplikApi,
  numuneApi,
  orguSnapshotApi,
  tezgahApi,
} from "../api/client";
import type {
  Cozgu,
  Gorev,
  Iplik,
  Numune,
  OrguSnapshot,
  Tezgah,
} from "../lib/types";
import { hesaplaMetraj } from "../lib/metraj";
import { numuneKisitlari, uyariSayisi } from "../lib/kisitlar";
import { renkAdiBul } from "../lib/palette";
import {
  durumRengi,
  isKesin,
  isTaslak,
  oncekiDurum,
  sonrakiDurum,
} from "../lib/durum";
import { MetrajBar } from "./MetrajBar";
import { BaglamMenu } from "./BaglamMenu";
import type { MenuOge } from "./BaglamMenu";
import { HizliForm } from "./HizliForm";
import type { HizliAlan } from "./HizliForm";

interface Props {
  onCozguAc: (cozguId: string, duzenleNumuneId?: string) => void;
}

type Suru =
  | { tip: "cozgu"; id: string }
  | { tip: "numune"; id: string }
  | { tip: "tezgah"; id: string }
  | null;

function tarihKisa(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

type MenuDurum = { x: number; y: number; ogeler: MenuOge[] } | null;
type HizliDurum = {
  x: number;
  y: number;
  baslik: string;
  alanlar: HizliAlan[];
  onKaydet: (d: Record<string, string>) => void;
} | null;

// Tezgah-şerit panosu (CLAUDE.md §7.1, §9 Faz 2): her tezgah bir kolon;
// içinde çözgüler sırayla; her çözgünün altında numuneler.
// Sürükle-bırak (masaüstü) + ok butonları (tablet) ile taşıma/sıralama.
export function Pano({ onCozguAc }: Props) {
  const [tezgahlar, setTezgahlar] = useState<Tezgah[]>([]);
  const [cozguler, setCozguler] = useState<Cozgu[]>([]);
  const [numuneler, setNumuneler] = useState<Numune[]>([]);
  const [snapshotlar, setSnapshotlar] = useState<OrguSnapshot[]>([]);
  const [iplikler, setIplikler] = useState<Iplik[]>([]);
  const [gorevler, setGorevler] = useState<Gorev[]>([]);
  const [hata, setHata] = useState<string | null>(null);
  const [suru, setSuru] = useState<Suru>(null);
  const [hedef, setHedef] = useState<string | null>(null); // vurgulanan drop hedefi
  const [menu, setMenu] = useState<MenuDurum>(null);
  const [hizli, setHizli] = useState<HizliDurum>(null);
  const [acikCozguler, setAcikCozguler] = useState<Set<string>>(new Set());

  function cozguToggleAc(id: string) {
    setAcikCozguler((prev) => {
      const k = new Set(prev);
      if (k.has(id)) k.delete(id);
      else k.add(id);
      return k;
    });
  }
  function hepsiniAc(idler: string[]) {
    setAcikCozguler(new Set(idler));
  }
  function hepsiniKapa() {
    setAcikCozguler(new Set());
  }

  async function yukle() {
    try {
      const [t, c, n, s, ip, gv] = await Promise.all([
        tezgahApi.list(),
        cozguApi.listAll(),
        numuneApi.listAll(),
        orguSnapshotApi.listAll(),
        iplikApi.listAll(),
        gorevApi.listAll(),
      ]);
      setTezgahlar(t);
      setCozguler(c);
      setNumuneler(n);
      setSnapshotlar(s);
      setIplikler(ip);
      setGorevler(gv);
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

  const iplikHaritasi = useMemo(() => {
    const m = new Map<string, Iplik[]>();
    iplikler.forEach((ip) => {
      const arr = m.get(ip.tezgahId) ?? [];
      arr.push(ip);
      m.set(ip.tezgahId, arr);
    });
    return m;
  }, [iplikler]);

  // Panoda görünen tezgahlar: arşivlenmemiş, sıra'ya göre.
  const gorunenTezgahlar = useMemo(
    () =>
      tezgahlar
        .filter((t) => !t.arsivlendi)
        .sort((a, b) => a.sira - b.sira || a.createdAt.localeCompare(b.createdAt)),
    [tezgahlar],
  );

  // Bir numunenin kısıt uyarı sayısı (⚠ göstergesi için).
  function numuneUyari(t: Tezgah, c: Cozgu, n: Numune): number {
    const snap = n.orguSnapshotId
      ? (snapshotHaritasi.get(n.orguSnapshotId) ?? null)
      : null;
    return uyariSayisi(numuneKisitlari(t, c, n, snap));
  }

  function aktifSayisi(tezgahId: string): number {
    return cozguler.filter(
      (c) => c.tezgahId === tezgahId && c.durum === "aktif",
    ).length;
  }

  // Çözgü aktif/pasif — eşzamanlılık göstergesini besler (uyarır, engellemez).
  function aktifToggle(c: Cozgu) {
    const yeni = c.durum === "aktif" ? "taslak" : "aktif";
    calis(() => cozguApi.update(c.id, { durum: yeni }));
  }

  // Tezgah sırasını sürükle-bırakla değiştir (görünen liste üzerinde yeniden indeksle).
  function tezgahSirala(suruId: string, hedefId: string) {
    if (suruId === hedefId) return;
    const sirali = gorunenTezgahlar.slice();
    const from = sirali.findIndex((t) => t.id === suruId);
    const to = sirali.findIndex((t) => t.id === hedefId);
    if (from < 0 || to < 0) return;
    const [tasinan] = sirali.splice(from, 1);
    sirali.splice(to, 0, tasinan);
    calis(() =>
      Promise.all(
        sirali.map((t, i) =>
          t.sira === i ? null : tezgahApi.update(t.id, { sira: i }),
        ),
      ),
    );
  }

  // Panoda hızlı tezgah oluştur.
  function hizliTezgah(x: number, y: number) {
    setHizli({
      x,
      y,
      baslik: "Hızlı tezgah",
      alanlar: [
        { ad: "ad", etiket: "Tezgah adı", placeholder: "Tezgah…" },
        { ad: "planTarihi", etiket: "Plan tarihi", tip: "date" },
      ],
      onKaydet: (d) => {
        if (!d.ad?.trim()) {
          setHizli(null);
          return;
        }
        const sonSira = gorunenTezgahlar.length;
        calis(() =>
          tezgahApi.create({
            ad: d.ad.trim(),
            planTarihi: d.planTarihi
              ? new Date(d.planTarihi).toISOString()
              : null,
            sira: sonSira,
          }),
        );
        setHizli(null);
      },
    });
  }

  function tezgahArsivle(t: Tezgah) {
    if (
      !window.confirm(
        `"${t.ad}" planı tamamlandı olarak arşive alınsın mı?\nPanodan gizlenir; Liste sekmesinden geri alabilirsin.`,
      )
    )
      return;
    calis(() => tezgahApi.update(t.id, { arsivlendi: true }));
  }

  function planTarihiBelirle(t: Tezgah, x: number, y: number) {
    setHizli({
      x,
      y,
      baslik: "Plan tarihi",
      alanlar: [
        {
          ad: "planTarihi",
          etiket: "Plan tarihi",
          tip: "date",
          varsayilan: t.planTarihi ? t.planTarihi.slice(0, 10) : "",
        },
      ],
      onKaydet: (d) => {
        calis(() =>
          tezgahApi.update(t.id, {
            planTarihi: d.planTarihi
              ? new Date(d.planTarihi).toISOString()
              : null,
          }),
        );
        setHizli(null);
      },
    });
  }

  // Hızlı ekleme akışları (sağ-tık menüsünden).
  function hizliCozgu(tezgahId: string, x: number, y: number) {
    setHizli({
      x,
      y,
      baslik: "Hızlı çözgü",
      alanlar: [
        { ad: "adKod", etiket: "Ad / kod", placeholder: "ÇZG-…" },
        { ad: "cozguBoyuM", etiket: "Çözgü boyu (m)", tip: "number" },
      ],
      onKaydet: (d) => {
        const sonSira = cozgulerinTezgahi(tezgahId).length;
        calis(() =>
          cozguApi.create({
            tezgahId,
            adKod: d.adKod || "Yeni çözgü",
            cozguBoyuM: d.cozguBoyuM || null,
            tezgahSira: sonSira,
          }),
        );
        setHizli(null);
      },
    });
  }

  function hizliIplik(tezgahId: string, x: number, y: number) {
    setHizli({
      x,
      y,
      baslik: "Havuza iplik ekle",
      alanlar: [
        { ad: "ad", etiket: "Ad", placeholder: "iplik adı" },
        { ad: "numara", etiket: "Numara", placeholder: "30/2" },
        { ad: "renk", etiket: "Renk (perde paleti)", renk: true },
      ],
      onKaydet: (d) => {
        calis(() =>
          iplikApi.create({
            tezgahId,
            ad: d.ad || "İplik",
            numara: d.numara || null,
            renk: d.renk || null,
            renkAdi: d.renk ? renkAdiBul(d.renk) : null,
          }),
        );
        setHizli(null);
      },
    });
  }

  function hizliNumune(cozguId: string, x: number, y: number) {
    setHizli({
      x,
      y,
      baslik: "Hızlı numune",
      alanlar: [
        { ad: "adKod", etiket: "Ad / kod", placeholder: "NUM-…" },
        { ad: "tahminiBoyM", etiket: "Tahmini boy (m)", tip: "number" },
      ],
      onKaydet: (d) => {
        const sonSira = cozgununNumuneleri(cozguId).length;
        calis(() =>
          numuneApi.create({
            cozguId,
            adKod: d.adKod || "Yeni numune",
            tahminiBoyM: d.tahminiBoyM || null,
            siraNo: sonSira,
          }),
        );
        setHizli(null);
      },
    });
  }

  function tezgahYenidenAdlandir(t: Tezgah, x: number, y: number) {
    setHizli({
      x,
      y,
      baslik: "Tezgahı yeniden adlandır",
      alanlar: [{ ad: "ad", etiket: "Tezgah adı", varsayilan: t.ad }],
      onKaydet: (d) => {
        if (d.ad?.trim()) calis(() => tezgahApi.update(t.id, { ad: d.ad.trim() }));
        setHizli(null);
      },
    });
  }

  function tezgahSil(t: Tezgah) {
    if (
      !window.confirm(
        `"${t.ad}" tezgahı silinsin mi?\nBu tezgahın TÜM çözgüleri, numuneleri ve iplik havuzu da silinir. Geri alınamaz.`,
      )
    )
      return;
    calis(() => tezgahApi.remove(t.id));
  }

  function cozguSil(c: Cozgu) {
    if (
      !window.confirm(
        `"${c.adKod}" çözgüsü silinsin mi?\nBu çözgünün tüm numuneleri de silinir. Geri alınamaz.`,
      )
    )
      return;
    calis(() => cozguApi.remove(c.id));
  }

  function numuneSil(n: Numune) {
    if (!window.confirm(`"${n.adKod}" numunesi silinsin mi? Geri alınamaz.`))
      return;
    calis(() => numuneApi.remove(n.id));
  }

  function tezgahMenu(t: Tezgah, e: React.MouseEvent) {
    e.preventDefault();
    setMenu({
      x: e.clientX,
      y: e.clientY,
      ogeler: [
        {
          etiket: "+ Hızlı çözgü",
          onSec: () => hizliCozgu(t.id, e.clientX, e.clientY),
        },
        {
          etiket: "+ Havuza iplik ekle",
          onSec: () => hizliIplik(t.id, e.clientX, e.clientY),
        },
        {
          etiket: "Plan tarihi belirle",
          ayrac: true,
          onSec: () => planTarihiBelirle(t, e.clientX, e.clientY),
        },
        {
          etiket: "✓ Plan tamamlandı → Arşive al",
          onSec: () => tezgahArsivle(t),
        },
        {
          etiket: "Tezgahı yeniden adlandır",
          ayrac: true,
          onSec: () => tezgahYenidenAdlandir(t, e.clientX, e.clientY),
        },
        { etiket: "Tezgahı sil", tehlike: true, onSec: () => tezgahSil(t) },
      ],
    });
  }

  function cozguMenu(c: Cozgu, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setMenu({
      x: e.clientX,
      y: e.clientY,
      ogeler: [
        {
          etiket: "+ Hızlı numune",
          onSec: () => hizliNumune(c.id, e.clientX, e.clientY),
        },
        {
          etiket: c.durum === "aktif" ? "Pasifleştir" : "Aktif yap (tezgahta)",
          onSec: () => aktifToggle(c),
        },
        { etiket: "Çözgüyü aç / düzenle", onSec: () => onCozguAc(c.id) },
        {
          etiket: "Çözgüyü sil",
          tehlike: true,
          ayrac: true,
          onSec: () => cozguSil(c),
        },
      ],
    });
  }

  function numuneMenu(n: Numune, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setMenu({
      x: e.clientX,
      y: e.clientY,
      ogeler: [
        {
          etiket: "Numune düzenle / iplik ata",
          onSec: () => onCozguAc(n.cozguId, n.id),
        },
        {
          etiket: "Numune sil",
          tehlike: true,
          ayrac: true,
          onSec: () => numuneSil(n),
        },
      ],
    });
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

  return (
    <>
      <div className="pano-arac">
        <button
          className="small"
          onClick={(e) => hizliTezgah(e.clientX, e.clientY)}
        >
          + Tezgah
        </button>
        <span style={{ flex: 1 }} />
        <button
          className="small"
          onClick={() => hepsiniAc(cozguler.map((c) => c.id))}
        >
          Tümünü aç
        </button>
        <button className="small" onClick={hepsiniKapa}>
          Tümünü kapat
        </button>
      </div>

      <div className="pano">
        {gorunenTezgahlar.length === 0 && (
          <p className="mut">Panoda tezgah yok. "+ Tezgah" ile ekleyin.</p>
        )}
        {gorunenTezgahlar.map((t) => {
        const kolonCozguleri = cozgulerinTezgahi(t.id);
        const kolonIplikleri = iplikHaritasi.get(t.id) ?? [];
        const tGorev = gorevler.filter((g) => g.tezgahId === t.id);
        const acikGorev = tGorev.filter((g) => !g.tamamlandi).length;
        const aktif = aktifSayisi(t.id);
        const asim = aktif > t.esZamanliCozgu;
        return (
          <div
            key={t.id}
            className={`serit${hedef === `tz-${t.id}` ? " drop" : ""}`}
            onContextMenu={(e) => tezgahMenu(t, e)}
            onDragOver={(e) => {
              if (suru?.tip === "cozgu" || suru?.tip === "tezgah") {
                e.preventDefault();
                setHedef(`tz-${t.id}`);
              }
            }}
            onDragLeave={() => setHedef(null)}
            onDrop={(e) => {
              e.preventDefault();
              if (suru?.tip === "cozgu") cozguyuTezgahaTasi(suru.id, t.id);
              else if (suru?.tip === "tezgah") tezgahSirala(suru.id, t.id);
              setSuru(null);
              setHedef(null);
            }}
          >
            <h3>
              <span
                className="tezgah-tut"
                title="Sürükleyerek sırala"
                draggable
                onDragStart={(e) => {
                  e.stopPropagation();
                  setSuru({ tip: "tezgah", id: t.id });
                }}
                onDragEnd={() => {
                  setSuru(null);
                  setHedef(null);
                }}
              >
                ⠿
              </span>
              <span style={{ flex: 1 }}>{t.ad}</span>
              <span
                className={`kapasite${asim ? " asim" : aktif === t.esZamanliCozgu ? " dolu" : ""}`}
                title="Aynı anda çalışan çözgü / kapasite"
              >
                Aktif {aktif}/{t.esZamanliCozgu}
              </span>
            </h3>
            {t.planTarihi && (
              <div className="plan-tarih" title="Plan tarihi">
                📅 {tarihKisa(t.planTarihi)}
              </div>
            )}
            <div
              className="mut"
              style={{
                fontSize: 12,
                margin: "0 3px 6px",
                display: "flex",
                alignItems: "center",
                gap: 6,
                flexWrap: "wrap",
              }}
            >
              {kolonCozguleri.length} çözgü · {t.cerceveSayisi}çrç ·{" "}
              {t.mekikSayisi}mkk
              {tGorev.length > 0 && (
                <span
                  className={`gorev-ozet${acikGorev > 0 ? " acik" : ""}`}
                  title="Açık görev / toplam"
                >
                  ✓ {tGorev.length - acikGorev}/{tGorev.length} görev
                </span>
              )}
            </div>

            {kolonIplikleri.length > 0 && (
              <div className="serit-iplik" title="İplik havuzu">
                <span className="serit-iplik-et">İPLİK</span>
                {kolonIplikleri.map((ip) => (
                  <span
                    key={ip.id}
                    className="iplik-nokta"
                    style={{ background: ip.renk ?? "#ccc" }}
                    title={`${ip.ad}${ip.numara ? " · " + ip.numara : ""}`}
                  />
                ))}
                <span className="mut" style={{ fontSize: 11 }}>
                  {kolonIplikleri.length}
                </span>
              </div>
            )}

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
              const acik = acikCozguler.has(c.id);
              const kartUyari = cNumuneler.reduce(
                (s, n) => s + numuneUyari(t, c, n),
                0,
              );

              return (
                <div
                  key={c.id}
                  className={`cozgu-kart${
                    hedef === `cz-${c.id}` ? " drop" : ""
                  }${c.durum === "aktif" ? " aktif" : ""}`}
                  onContextMenu={(e) => cozguMenu(c, e)}
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
                    <button
                      className="katla"
                      title={acik ? "Kapat" : "Aç"}
                      onClick={() => cozguToggleAc(c.id)}
                    >
                      {acik ? "▾" : "▸"}
                    </button>
                    <span className="kod" onClick={() => onCozguAc(c.id)}>
                      {c.adKod}
                      {c.durum === "aktif" && (
                        <span className="aktif-rozet" style={{ marginLeft: 6 }}>
                          AKTİF
                        </span>
                      )}
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

                  {/* Katlanmış özet */}
                  <div className="kart-ozet" onClick={() => cozguToggleAc(c.id)}>
                    {cNumuneler.length} numune
                    {kartUyari > 0 && (
                      <span className="hata"> · ⚠ {kartUyari}</span>
                    )}
                  </div>

                  {acik && tezgahlar.length > 1 && (
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

                  {acik && (
                  <>
                  {taslaklar.length > 0 && (
                    <>
                      <div className="havuz-etiket">Taslak havuz</div>
                      {taslaklar.map((n) => (
                        <NumuneSatir
                          key={n.id}
                          n={n}
                          uyari={numuneUyari(t, c, n)}
                          onMenu={(e) => numuneMenu(n, e)}
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
                          onMenu={(e) => numuneMenu(n, e)}
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
                      onMenu={(e) => numuneMenu(n, e)}
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
                </div>
              );
            })}
          </div>
        );
      })}

      {menu && (
        <BaglamMenu
          x={menu.x}
          y={menu.y}
          ogeler={menu.ogeler}
          onKapat={() => setMenu(null)}
        />
      )}
      {hizli && (
        <HizliForm
          x={hizli.x}
          y={hizli.y}
          baslik={hizli.baslik}
          alanlar={hizli.alanlar}
          onKaydet={hizli.onKaydet}
          onKapat={() => setHizli(null)}
        />
      )}
      </div>
    </>
  );
}

// Tek numune satırı: durum noktası, ad, sıra okları, durum ilerlet/geri, onayla/iptal.
function NumuneSatir({
  n,
  uyari = 0,
  onMenu,
  onSira,
  onDurum,
  onSuruBasla,
  onSuruBitir,
}: {
  n: Numune;
  uyari?: number;
  onMenu: (e: React.MouseEvent) => void;
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
      onContextMenu={onMenu}
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
