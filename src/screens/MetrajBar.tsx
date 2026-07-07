import type { MetrajOzet } from "../lib/metraj";

// Metraj bütçesi göstergesi — Faz 1'in çekirdek değeri (CLAUDE.md §6.4, §9).
// "kalan X m · N numune daha sığar"; aşımda kırmızı uyarı (engelleme değil).
export function MetrajBar({ ozet }: { ozet: MetrajOzet }) {
  const { butceM, kullanilanM, kalanM, asim, sigabilecekEkNumune } = ozet;
  const oran = butceM > 0 ? Math.min(100, (kullanilanM / butceM) * 100) : 0;

  return (
    <div className={`metraj${asim ? " asim" : ""}`}>
      <div className="bar">
        <div className="fill" style={{ width: `${oran}%` }} />
      </div>
      <div className="legend">
        <span>
          Kullanılan {kullanilanM.toFixed(1)} m / bütçe {butceM.toFixed(1)} m
        </span>
        <span className="kalan">
          {asim
            ? `⚠ ${Math.abs(kalanM).toFixed(1)} m aşım`
            : `kalan ${kalanM.toFixed(1)} m` +
              (sigabilecekEkNumune != null
                ? ` · ~${sigabilecekEkNumune} numune daha sığar`
                : "")}
        </span>
      </div>
    </div>
  );
}
