import { useState } from "react";
import { TezgahListe } from "./screens/TezgahListe";
import { TezgahDetay } from "./screens/TezgahDetay";
import { CozguDetay } from "./screens/CozguDetay";

// Faz 1 gezinme: Tezgah listesi → Tezgah detay (çözgüler) → Çözgü detay (numuneler).
// Kanban panosu (Faz 2) yerine basit drill-down.
type Gorunum =
  | { ad: "tezgahlar" }
  | { ad: "tezgah"; tezgahId: string }
  | { ad: "cozgu"; cozguId: string; tezgahId: string };

export default function App() {
  const [gorunum, setGorunum] = useState<Gorunum>({ ad: "tezgahlar" });

  return (
    <>
      <header className="app">
        <h1>NDP</h1>
        <small>Numune Dokuma Planlama · Faz 1</small>
      </header>

      {gorunum.ad === "tezgahlar" && (
        <TezgahListe
          onAc={(tezgahId) => setGorunum({ ad: "tezgah", tezgahId })}
        />
      )}

      {gorunum.ad === "tezgah" && (
        <TezgahDetay
          tezgahId={gorunum.tezgahId}
          onGeri={() => setGorunum({ ad: "tezgahlar" })}
          onCozguAc={(cozguId) =>
            setGorunum({ ad: "cozgu", cozguId, tezgahId: gorunum.tezgahId })
          }
        />
      )}

      {gorunum.ad === "cozgu" && (
        <CozguDetay
          cozguId={gorunum.cozguId}
          onGeri={() =>
            setGorunum({ ad: "tezgah", tezgahId: gorunum.tezgahId })
          }
        />
      )}
    </>
  );
}
