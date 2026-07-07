// Numune atkı renk listesi (hex). Mekik kısıtının girdisi (§6.2).
// RenkDizimiEditor'ün sadeleştirilmişi: sadece renk, sıra/tel yok.
interface Props {
  renkler: string[];
  onChange: (r: string[]) => void;
  mekikSayisi?: number; // canlı geri bildirim için (tezgah limiti)
}

export function AtkiRenkEditor({ renkler, onChange, mekikSayisi }: Props) {
  function guncelle(i: number, renk: string) {
    const kopya = renkler.slice();
    kopya[i] = renk;
    onChange(kopya);
  }
  function sil(i: number) {
    onChange(renkler.filter((_, j) => j !== i));
  }
  function ekle() {
    onChange([...renkler, "#3366cc"]);
  }

  const farkli = new Set(renkler.map((r) => r.toLowerCase())).size;
  const asim = mekikSayisi != null && farkli > mekikSayisi;

  return (
    <div>
      <div className="row" style={{ gap: 6 }}>
        {renkler.map((r, i) => (
          <span
            key={i}
            style={{ display: "inline-flex", alignItems: "center", gap: 2 }}
          >
            <input
              type="color"
              value={r}
              onChange={(e) => guncelle(i, e.target.value)}
              style={{ width: 40, height: 34, padding: 2 }}
            />
            <button className="danger small" onClick={() => sil(i)}>
              ×
            </button>
          </span>
        ))}
        <button className="small" onClick={ekle} style={{ alignSelf: "center" }}>
          + Renk
        </button>
      </div>
      <div className="mut" style={{ fontSize: 13, marginTop: 4 }}>
        Farklı renk: <strong className={asim ? "hata" : ""}>{farkli}</strong>
        {mekikSayisi != null && <> / {mekikSayisi} mekik</>}
        {asim && <span className="hata"> ⚠ mekik sayısı aşılıyor</span>}
      </div>
    </div>
  );
}
