import type { ReactNode } from "react";

// Mini-markdown → güvenli React düğümleri (asla dangerouslySetInnerHTML).
// Desteklenen:
//   - Satır başı "* " veya "- "  → madde (ardışıklar tek <ul> içinde <li>)
//   - Satır içi **kalın**         → <strong>
//   - Satır içi *italik* / _italik_ → <em>
//   - Boş satır                   → paragraf aralığı
//   - Diğer satırlar              → <p>

// Satır-içi biçim: **kalın**, *italik*, _italik_. Metni parçalara böler.
function satirIci(metin: string, anahtar: string): ReactNode[] {
  const parcalar: ReactNode[] = [];
  // Sırayla ** ... **, * ... *, _ ... _ yakalar. ** önce gelmeli.
  const desen = /\*\*([^*]+)\*\*|\*([^*\n]+)\*|_([^_\n]+)_/g;
  let sonIndex = 0;
  let eslesme: RegExpExecArray | null;
  let i = 0;
  while ((eslesme = desen.exec(metin)) !== null) {
    if (eslesme.index > sonIndex) {
      parcalar.push(metin.slice(sonIndex, eslesme.index));
    }
    if (eslesme[1] !== undefined) {
      parcalar.push(<strong key={`${anahtar}-b${i}`}>{eslesme[1]}</strong>);
    } else if (eslesme[2] !== undefined) {
      parcalar.push(<em key={`${anahtar}-i${i}`}>{eslesme[2]}</em>);
    } else if (eslesme[3] !== undefined) {
      parcalar.push(<em key={`${anahtar}-u${i}`}>{eslesme[3]}</em>);
    }
    sonIndex = desen.lastIndex;
    i++;
  }
  if (sonIndex < metin.length) parcalar.push(metin.slice(sonIndex));
  return parcalar;
}

// Tam metni bloklara çevirir. Sonucu bir sarmalayıcıya koymak arayanın işi.
export function formatlaAciklama(metin: string | null | undefined): ReactNode {
  if (!metin || !metin.trim()) return null;
  const satirlar = metin.replace(/\r\n/g, "\n").split("\n");
  const bloklar: ReactNode[] = [];
  let maddeler: ReactNode[] = [];
  let anahtar = 0;

  function maddeleriBosalt() {
    if (maddeler.length > 0) {
      bloklar.push(<ul key={`ul${anahtar++}`}>{maddeler}</ul>);
      maddeler = [];
    }
  }

  for (const ham of satirlar) {
    const satir = ham.trimEnd();
    const madde = /^\s*[*-]\s+(.*)$/.exec(satir);
    if (madde) {
      maddeler.push(
        <li key={`li${anahtar++}`}>{satirIci(madde[1], `li${anahtar}`)}</li>,
      );
      continue;
    }
    maddeleriBosalt();
    if (satir.trim() === "") continue; // boş satır → sadece ayraç
    bloklar.push(
      <p key={`p${anahtar++}`}>{satirIci(satir, `p${anahtar}`)}</p>,
    );
  }
  maddeleriBosalt();
  return bloklar.length > 0 ? bloklar : null;
}
