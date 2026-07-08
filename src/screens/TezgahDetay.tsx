import { useEffect, useState } from "react";
import { cozguApi, tezgahApi } from "../api/client";
import type { Cozgu, Tezgah } from "../lib/types";
import { ESZAMANLI_TAVAN } from "../lib/kisitlar";
import { formatlaAciklama } from "../lib/aciklama";
import { IplikHavuzu } from "./IplikHavuzu";
import { GorevListesi } from "./GorevListesi";

interface Props {
  tezgahId: string;
  onGeri: () => void;
  onCozguAc: (cozguId: string) => void;
}

const bosCozgu: Partial<Cozgu> = {
  adKod: "",
  taharTipi: "duz",
  cozguBoyuM: "",
  cerceveKullanim: null,
  durum: "taslak",
};

export function TezgahDetay({ tezgahId, onGeri, onCozguAc }: Props) {
  const [tezgah, setTezgah] = useState<Tezgah | null>(null);
  const [cozguler, setCozguler] = useState<Cozgu[]>([]);
  const [form, setForm] = useState<Partial<Cozgu>>(bosCozgu);
  const [ekleAcik, setEkleAcik] = useState(false);
  const [sekme, setSekme] = useState<"cozguler" | "iplikler" | "gorevler">(
    "cozguler",
  );
  const [hata, setHata] = useState<string | null>(null);

  async function yukle() {
    try {
      const [t, cs] = await Promise.all([
        tezgahApi.get(tezgahId),
        cozguApi.listByTezgah(tezgahId),
      ]);
      setTezgah(t);
      setCozguler(cs);
      setHata(null);
    } catch (e) {
      setHata((e as Error).message);
    }
  }

  useEffect(() => {
    yukle();
  }, [tezgahId]);

  async function kaydet() {
    try {
      // Çerçeve kullanım kısıtı sadece uyarı olarak gösterilir (sert engel Faz 3).
      await cozguApi.create({
        ...form,
        tezgahId,
        toplamTel: form.toplamTel ? Number(form.toplamTel) : null,
        cerceveKullanim: form.cerceveKullanim
          ? Number(form.cerceveKullanim)
          : null,
      });
      setForm(bosCozgu);
      setEkleAcik(false);
      await yukle();
    } catch (e) {
      setHata((e as Error).message);
    }
  }

  const cerceveUyari =
    tezgah &&
    form.cerceveKullanim != null &&
    Number(form.cerceveKullanim) > tezgah.cerceveSayisi;

  async function kapasiteDegistir(deger: number) {
    if (!tezgah) return;
    try {
      const g = await tezgahApi.update(tezgah.id, { esZamanliCozgu: deger });
      setTezgah(g);
    } catch (e) {
      setHata((e as Error).message);
    }
  }

  async function tezgahGuncelle(alanlar: Partial<Tezgah>) {
    if (!tezgah) return;
    try {
      setTezgah(await tezgahApi.update(tezgah.id, alanlar));
    } catch (e) {
      setHata((e as Error).message);
    }
  }

  return (
    <div>
      <div className="crumbs">
        <button onClick={onGeri}>Tezgahlar</button>
        <span>/</span>
        <strong>{tezgah?.ad ?? "…"}</strong>
      </div>

      {hata && <p className="hata">⚠ {hata}</p>}

      {tezgah && (
        <div className="panel">
          <h3>{tezgah.ad}</h3>
          <div className="meta mut">
            {tezgah.marka ?? "—"} · {tezgah.tip ?? "—"} ·{" "}
            {tezgah.cerceveSayisi} çerçeve · {tezgah.mekikSayisi} mekik ·{" "}
            {tezgah.maxTarakEniCm ? `${tezgah.maxTarakEniCm}cm eni · ` : ""}
            <span className="badge">{tezgah.durum}</span>
          </div>
          {tezgah.takim && (
            <div className="tezgah-takim" style={{ marginTop: 8 }}>
              🧰 {tezgah.takim}
            </div>
          )}
          {tezgah.aciklama && tezgah.aciklama.trim() && (
            <div className="bicimli kart-aciklama" style={{ marginTop: 8 }}>
              {formatlaAciklama(tezgah.aciklama)}
            </div>
          )}
          <p className="mut" style={{ fontSize: "0.78rem", marginTop: 8 }}>
            Tüm alanları düzenlemek için panoda tezgaha sağ-tık → “Detay / düzenle”.
          </p>
          <div
            className="actions"
            style={{ marginTop: 12, alignItems: "center", gap: 8 }}
          >
            <label style={{ margin: 0 }}>Aynı anda çalışan çözgü kapasitesi</label>
            <select
              value={tezgah.esZamanliCozgu}
              style={{ width: "auto" }}
              onChange={(e) => kapasiteDegistir(Number(e.target.value))}
            >
              {Array.from({ length: ESZAMANLI_TAVAN }, (_, i) => i + 1).map(
                (n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ),
              )}
            </select>
            <span className="mut" style={{ fontSize: "0.8rem" }}>
              (varsayılan 2, tavan {ESZAMANLI_TAVAN})
            </span>
          </div>
          <div
            className="actions"
            style={{ marginTop: 10, alignItems: "center", gap: 8 }}
          >
            <label style={{ margin: 0 }}>Plan tarihi</label>
            <input
              type="date"
              style={{ width: "auto" }}
              value={tezgah.planTarihi ? tezgah.planTarihi.slice(0, 10) : ""}
              onChange={(e) =>
                tezgahGuncelle({
                  planTarihi: e.target.value
                    ? new Date(e.target.value).toISOString()
                    : null,
                })
              }
            />
            {tezgah.arsivlendi ? (
              <button onClick={() => tezgahGuncelle({ arsivlendi: false })}>
                Arşivden çıkar
              </button>
            ) : (
              <button
                onClick={() => tezgahGuncelle({ arsivlendi: true })}
                title="Plan tamamlandı → arşive al"
              >
                ✓ Planı arşive al
              </button>
            )}
            {tezgah.arsivlendi && <span className="badge">arşiv</span>}
          </div>
        </div>
      )}

      <nav className="tabs">
        <button
          className={sekme === "cozguler" ? "aktif" : ""}
          onClick={() => setSekme("cozguler")}
        >
          Çözgüler ({cozguler.length})
        </button>
        <button
          className={sekme === "iplikler" ? "aktif" : ""}
          onClick={() => setSekme("iplikler")}
        >
          Denenebilecek İplikler
        </button>
        <button
          className={sekme === "gorevler" ? "aktif" : ""}
          onClick={() => setSekme("gorevler")}
        >
          Görevler
        </button>
      </nav>

      {sekme === "iplikler" && tezgah && <IplikHavuzu tezgahId={tezgahId} />}
      {sekme === "gorevler" && tezgah && <GorevListesi tezgahId={tezgahId} />}

      {sekme === "cozguler" && (
      <>
      <div className="panel">
        <h3>Çözgüler ({cozguler.length})</h3>
        {cozguler.length === 0 ? (
          <p className="mut">Bu tezgaha henüz çözgü planlanmadı.</p>
        ) : (
          <div className="row">
            {cozguler.map((c) => (
              <div
                key={c.id}
                className="card"
                onClick={() => onCozguAc(c.id)}
              >
                <div className="kod">{c.adKod}</div>
                <div className="meta">
                  {c.cozguBoyuM ? `${c.cozguBoyuM} m` : "boy —"} ·{" "}
                  {c.taharTipi ?? "—"} tahar
                </div>
                <div className="meta">
                  <span className="badge">{c.durum}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {ekleAcik ? (
        <div className="panel">
          <h3>Yeni çözgü</h3>
          <div className="grid2">
            <div>
              <label>Ad / kod *</label>
              <input
                value={form.adKod ?? ""}
                onChange={(e) => setForm({ ...form, adKod: e.target.value })}
              />
            </div>
            <div>
              <label>Çözgü boyu (m) — metraj bütçesi</label>
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
                onChange={(e) =>
                  setForm({ ...form, taharTipi: e.target.value })
                }
              >
                <option value="duz">düz</option>
                <option value="kirik">kırık</option>
                <option value="dalgali">dalgalı</option>
              </select>
            </div>
            <div>
              <label>
                Çerçeve kullanım{" "}
                {tezgah && (
                  <span className="mut">(≤ {tezgah.cerceveSayisi})</span>
                )}
              </label>
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
              {cerceveUyari && (
                <p className="hata">
                  ⚠ Tezgah çerçeve sayısını ({tezgah?.cerceveSayisi}) aşıyor.
                </p>
              )}
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
              <label>Notlar</label>
              <input
                value={form.notlar ?? ""}
                onChange={(e) => setForm({ ...form, notlar: e.target.value })}
              />
            </div>
          </div>
          <p className="mut">
            Renk dizimini çözgü detayında düzenleyebilirsiniz.
          </p>
          <div className="actions">
            <button className="primary" onClick={kaydet}>
              Kaydet
            </button>
            <button
              onClick={() => {
                setEkleAcik(false);
                setForm(bosCozgu);
              }}
            >
              İptal
            </button>
          </div>
        </div>
      ) : (
        <button className="primary" onClick={() => setEkleAcik(true)}>
          + Çözgü ekle
        </button>
      )}
      </>
      )}
    </div>
  );
}
