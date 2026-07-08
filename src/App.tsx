import { useState } from "react";
import { Pano } from "./screens/Pano";
import { TezgahListe } from "./screens/TezgahListe";
import { TezgahDetay } from "./screens/TezgahDetay";
import { CozguDetay } from "./screens/CozguDetay";
import { OrguImport } from "./screens/OrguImport";

// Gezinme:
// - "pano": ortak tezgah-şerit panosu (Faz 2 ana ekran)
// - "liste": Tezgah listesi → Tezgah detay (çözgüler) → Çözgü detay (numuneler)
// Çözgü detayına hem panodan hem listeden gidilebilir.
type Gorunum =
  | { ad: "pano" }
  | { ad: "liste" }
  | { ad: "orguler" }
  | { ad: "tezgah"; tezgahId: string }
  | { ad: "cozgu"; cozguId: string; geri: "pano" | "tezgah"; tezgahId?: string };

export default function App() {
  const [gorunum, setGorunum] = useState<Gorunum>({ ad: "pano" });

  const sekme =
    gorunum.ad === "pano"
      ? "pano"
      : gorunum.ad === "orguler"
        ? "orguler"
        : "liste";

  return (
    <>
      <header className="app">
        <h1>NDP</h1>
        <small>Numune Dokuma Planlama · Faz 3</small>
      </header>

      <nav className="tabs">
        <button
          className={sekme === "pano" ? "aktif" : ""}
          onClick={() => setGorunum({ ad: "pano" })}
        >
          Pano
        </button>
        <button
          className={sekme === "liste" ? "aktif" : ""}
          onClick={() => setGorunum({ ad: "liste" })}
        >
          Liste
        </button>
        <button
          className={sekme === "orguler" ? "aktif" : ""}
          onClick={() => setGorunum({ ad: "orguler" })}
        >
          Örgüler
        </button>
      </nav>

      {gorunum.ad === "orguler" && <OrguImport />}

      {gorunum.ad === "pano" && (
        <Pano
          onCozguAc={(cozguId) =>
            setGorunum({ ad: "cozgu", cozguId, geri: "pano" })
          }
        />
      )}

      {gorunum.ad === "liste" && (
        <TezgahListe
          onAc={(tezgahId) => setGorunum({ ad: "tezgah", tezgahId })}
        />
      )}

      {gorunum.ad === "tezgah" && (
        <TezgahDetay
          tezgahId={gorunum.tezgahId}
          onGeri={() => setGorunum({ ad: "liste" })}
          onCozguAc={(cozguId) =>
            setGorunum({
              ad: "cozgu",
              cozguId,
              geri: "tezgah",
              tezgahId: gorunum.tezgahId,
            })
          }
        />
      )}

      {gorunum.ad === "cozgu" && (
        <CozguDetay
          cozguId={gorunum.cozguId}
          onGeri={() =>
            gorunum.geri === "tezgah" && gorunum.tezgahId
              ? setGorunum({ ad: "tezgah", tezgahId: gorunum.tezgahId })
              : setGorunum({ ad: "pano" })
          }
        />
      )}
    </>
  );
}
