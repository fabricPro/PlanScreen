import { useRef } from "react";
import { formatlaAciklama } from "../lib/aciklama";

interface Props {
  value: string;
  onChange: (v: string) => void;
  satir?: number; // textarea yüksekliği (satır)
}

// Açıklama editörü: textarea + biçim araç çubuğu + canlı önizleme.
// Kalın (**), İtalik (*), Madde (satır başı "* ") işaretlerini seçime uygular.
export function AciklamaEditor({ value, onChange, satir = 4 }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Seçili metni verilen işaretle sarar (yoksa imlece boş işaret koyar).
  function sar(isaret: string, kapanis = isaret) {
    const el = ref.current;
    if (!el) return;
    const bas = el.selectionStart;
    const son = el.selectionEnd;
    const secili = value.slice(bas, son) || "metin";
    const yeni = value.slice(0, bas) + isaret + secili + kapanis + value.slice(son);
    onChange(yeni);
    // Seçimi işaretlerin içine geri koy (bir sonraki tick'te).
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = bas + isaret.length;
      el.selectionEnd = bas + isaret.length + secili.length;
    });
  }

  // Seçili satırların başına "* " ekler (madde).
  function madde() {
    const el = ref.current;
    if (!el) return;
    const bas = el.selectionStart;
    const son = el.selectionEnd;
    const satirBasi = value.lastIndexOf("\n", bas - 1) + 1;
    const blok = value.slice(satirBasi, son);
    const isaretli = blok
      .split("\n")
      .map((s) => (s.startsWith("* ") ? s : "* " + s))
      .join("\n");
    const yeni = value.slice(0, satirBasi) + isaretli + value.slice(son);
    onChange(yeni);
    requestAnimationFrame(() => el.focus());
  }

  const onizleme = formatlaAciklama(value);

  return (
    <div>
      <div className="aciklama-arac">
        <button type="button" title="Kalın" onClick={() => sar("**")}>
          <strong>K</strong>
        </button>
        <button type="button" title="İtalik" onClick={() => sar("*")}>
          <em>İ</em>
        </button>
        <button type="button" title="Madde işareti" onClick={madde}>
          • Madde
        </button>
        <span className="mut" style={{ fontSize: "0.72rem" }}>
          **kalın** · *italik* · satır başı * madde
        </span>
      </div>
      <textarea
        ref={ref}
        rows={satir}
        value={value}
        placeholder="Açıklama… (satır satır yazabilirsiniz)"
        onChange={(e) => onChange(e.target.value)}
      />
      {onizleme && (
        <div className="aciklama-onizleme">
          <span className="mut onizleme-etiket">önizleme</span>
          <div className="bicimli">{onizleme}</div>
        </div>
      )}
    </div>
  );
}
