import { useState } from "react";
import { gorevApi } from "../api/client";
import type { Cozgu, Gorev, Numune, Tezgah } from "../lib/types";
import { ONCELIKLER } from "../lib/types";
import { tarihDurum, tarihKisa } from "../lib/gorev";

interface Props {
  gorev: Gorev;
  ilerleme?: { biten: number; toplam: number };
  tezgahlar: Tezgah[];
  cozguler: Cozgu[];
  numuneler: Numune[];
  onDegisti: () => void;
  onAc?: (cozguId: string) => void;
  // Bağlam (tezgah/çözgü alt-başlığı) zaten gösteriyorsa çipleri gizle.
  gizleTezgah?: boolean;
  gizleCozgu?: boolean;
}

// Bir tezgahın çözgüleri (tezgah sırasına göre).
function tezgahCozguleri(cozguler: Cozgu[], tezgahId: string): Cozgu[] {
  return cozguler
    .filter((c) => c.tezgahId === tezgahId)
    .sort(
      (a, b) => a.tezgahSira - b.tezgahSira || a.createdAt.localeCompare(b.createdAt),
    );
}

// Tek görev satırı (paylaşılan): checkbox · başlık · öncelik · son tarih · bağ çipleri
// · alt görev / düzenle / sil. Satır-içi düzenleme + alt görev ekleme kendi içinde.
export function GorevSatir({
  gorev: g,
  ilerleme,
  tezgahlar,
  cozguler,
  numuneler,
  onDegisti,
  onAc,
  gizleTezgah,
  gizleCozgu,
}: Props) {
  const [duzenle, setDuzenle] = useState(false);
  const [altAcik, setAltAcik] = useState(false);
  const [altMetin, setAltMetin] = useState("");
  const [form, setForm] = useState<Partial<Gorev>>({});

  const onc = ONCELIKLER.find((o) => o.deger === g.oncelik) ?? ONCELIKLER[1];
  const tarDurum = tarihDurum(g.sonTarih);
  const tarKisa = tarihKisa(g.sonTarih);
  const tezgahAd = g.tezgahId
    ? tezgahlar.find((t) => t.id === g.tezgahId)?.ad ?? null
    : null;
  const cozgu = g.cozguId ? cozguler.find((c) => c.id === g.cozguId) : null;
  const numune = g.numuneId ? numuneler.find((n) => n.id === g.numuneId) : null;

  async function toggle() {
    await gorevApi.update(g.id, { tamamlandi: !g.tamamlandi });
    onDegisti();
  }
  async function sil() {
    if (!window.confirm(`"${g.baslik}" görevi (ve alt görevleri) silinsin mi?`))
      return;
    await gorevApi.remove(g.id);
    onDegisti();
  }
  function duzenleAc() {
    setForm({
      baslik: g.baslik,
      sonTarih: g.sonTarih,
      oncelik: g.oncelik,
      tezgahId: g.tezgahId,
      cozguId: g.cozguId,
      numuneId: g.numuneId,
    });
    setDuzenle(true);
  }
  async function kaydet() {
    await gorevApi.update(g.id, {
      baslik: (form.baslik ?? g.baslik).trim() || g.baslik,
      sonTarih: form.sonTarih ?? null,
      oncelik: form.oncelik ?? 1,
      tezgahId: form.tezgahId ?? null,
      cozguId: form.cozguId ?? null,
      numuneId: form.numuneId ?? null,
    });
    setDuzenle(false);
    onDegisti();
  }
  async function altEkle() {
    if (!altMetin.trim()) return;
    await gorevApi.create({
      baslik: altMetin.trim(),
      parentId: g.id,
      tezgahId: g.tezgahId,
      cozguId: g.cozguId,
      numuneId: g.numuneId,
    });
    setAltMetin("");
    setAltAcik(false);
    onDegisti();
  }

  // Düzenleme formu: seçili tezgahın çözgüleri, seçili çözgünün numuneleri.
  const formCozguleri = form.tezgahId
    ? tezgahCozguleri(cozguler, form.tezgahId)
    : [];
  const formNumuneleri = form.cozguId
    ? numuneler
        .filter((n) => n.cozguId === form.cozguId)
        .sort((a, b) => a.siraNo - b.siraNo)
    : [];

  return (
    <div className="gorev-dugum">
      <div className={`gorev-satir${g.tamamlandi ? " bitti" : ""}`}>
        <input
          type="checkbox"
          className="gorev-check"
          checked={g.tamamlandi}
          onChange={toggle}
        />
        {g.oncelik !== 1 && (
          <span
            className="oncelik-nokta"
            style={{ background: onc.renk }}
            title={`Öncelik: ${onc.ad}`}
          />
        )}
        <span className="gorev-baslik">{g.baslik}</span>

        {tarKisa && (
          <span className={`gorev-tarih ${tarDurum ?? ""}`} title="Son tarih">
            📅 {tarKisa}
          </span>
        )}
        {!gizleTezgah && tezgahAd && (
          <span className="badge gorev-bag" title="Bağlı tezgah">
            🧵 {tezgahAd}
          </span>
        )}
        {!gizleCozgu && cozgu && (
          <span
            className="badge gorev-bag tiklanir"
            title="Bağlı çözgü — aç"
            onClick={() => onAc?.(cozgu.id)}
          >
            ▤ {cozgu.adKod}
          </span>
        )}
        {numune && (
          <span
            className="badge gorev-bag tiklanir"
            title="Bağlı numune — aç"
            onClick={() => onAc?.(numune.cozguId)}
          >
            ▦ {numune.adKod}
          </span>
        )}
        {ilerleme && ilerleme.toplam > 0 && (
          <span className="gorev-ilerleme">
            {ilerleme.biten}/{ilerleme.toplam}
          </span>
        )}

        <span className="gorev-araclar">
          <button
            className="small"
            title="Alt görev ekle"
            onClick={() => setAltAcik((v) => !v)}
          >
            ＋
          </button>
          <button className="small" title="Düzenle" onClick={duzenleAc}>
            ✎
          </button>
          <button className="danger small" title="Sil" onClick={sil}>
            ✕
          </button>
        </span>
      </div>

      {duzenle && (
        <div className="gorev-duzenle gorev-alt">
          <input
            autoFocus
            placeholder="Görev başlığı"
            value={form.baslik ?? ""}
            onChange={(e) => setForm({ ...form, baslik: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && kaydet()}
          />
          <div className="gorev-duzenle-alt">
            <label>
              Son tarih
              <input
                type="date"
                value={form.sonTarih ? form.sonTarih.slice(0, 10) : ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    sonTarih: e.target.value
                      ? new Date(e.target.value).toISOString()
                      : null,
                  })
                }
              />
            </label>
            <label>
              Öncelik
              <select
                value={form.oncelik ?? 1}
                onChange={(e) =>
                  setForm({ ...form, oncelik: Number(e.target.value) })
                }
              >
                {ONCELIKLER.map((o) => (
                  <option key={o.deger} value={o.deger}>
                    {o.ad}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tezgah
              <select
                value={form.tezgahId ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    tezgahId: e.target.value || null,
                    cozguId: null,
                    numuneId: null,
                  })
                }
              >
                <option value="">— yok —</option>
                {tezgahlar.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.ad}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Çözgü
              <select
                value={form.cozguId ?? ""}
                disabled={!form.tezgahId}
                onChange={(e) =>
                  setForm({
                    ...form,
                    cozguId: e.target.value || null,
                    numuneId: null,
                  })
                }
              >
                <option value="">— yok —</option>
                {formCozguleri.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.adKod}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Numune
              <select
                value={form.numuneId ?? ""}
                disabled={!form.cozguId}
                onChange={(e) =>
                  setForm({ ...form, numuneId: e.target.value || null })
                }
              >
                <option value="">— yok —</option>
                {formNumuneleri.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.adKod}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="actions">
            <button className="primary small" onClick={kaydet}>
              Kaydet
            </button>
            <button className="small" onClick={() => setDuzenle(false)}>
              İptal
            </button>
          </div>
        </div>
      )}

      {altAcik && (
        <div className="gorev-ekle gorev-alt">
          <input
            autoFocus
            placeholder="Alt görev başlığı"
            value={altMetin}
            onChange={(e) => setAltMetin(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && altEkle()}
          />
          <button className="primary small" onClick={altEkle}>
            Ekle
          </button>
        </div>
      )}
    </div>
  );
}
