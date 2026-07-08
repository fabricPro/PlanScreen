import type { Gorev, Numune, Tezgah } from "../lib/types";
import { GorevSatir } from "./GorevSatir";

// Özyinelemeli görev ağacı. Verilen parentId'nin çocuklarını çizer; her düğüm
// kendini parentId=düğüm.id ile tekrar çağırır (çok seviye). Satır = GorevSatir.
interface Props {
  gorevler: Gorev[];
  parentId: string | null;
  tezgahlar: Tezgah[];
  numuneler: Numune[];
  numuneTezgahId: (numuneId: string) => string | null;
  onDegisti: () => void;
  onAc?: (cozguId: string) => void;
  derinlik?: number;
}

export function GorevAgaci({
  gorevler,
  parentId,
  tezgahlar,
  numuneler,
  numuneTezgahId,
  onDegisti,
  onAc,
  derinlik = 0,
}: Props) {
  const cocuklar = gorevler
    .filter((g) => (g.parentId ?? null) === parentId)
    .sort((a, b) => a.sira - b.sira || a.createdAt.localeCompare(b.createdAt));

  if (cocuklar.length === 0) return null;

  return (
    <div className={derinlik > 0 ? "gorev-alt" : ""}>
      {cocuklar.map((g) => {
        const dogrudan = gorevler.filter((x) => x.parentId === g.id);
        const bitenAlt = dogrudan.filter((x) => x.tamamlandi).length;
        return (
          <div key={g.id}>
            <GorevSatir
              gorev={g}
              ilerleme={{ biten: bitenAlt, toplam: dogrudan.length }}
              tezgahlar={tezgahlar}
              numuneler={numuneler}
              numuneTezgahId={numuneTezgahId}
              onDegisti={onDegisti}
              onAc={onAc}
            />
            {/* Alt görevler (özyineleme) */}
            <GorevAgaci
              gorevler={gorevler}
              parentId={g.id}
              tezgahlar={tezgahlar}
              numuneler={numuneler}
              numuneTezgahId={numuneTezgahId}
              onDegisti={onDegisti}
              onAc={onAc}
              derinlik={derinlik + 1}
            />
          </div>
        );
      })}
    </div>
  );
}
