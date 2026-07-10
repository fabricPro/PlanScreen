import { useState } from "react";
import { Pano } from "./screens/Pano";
import { TezgahListe } from "./screens/TezgahListe";
import { TezgahDetay } from "./screens/TezgahDetay";
import { CozguDetay } from "./screens/CozguDetay";
import { OrguImport } from "./screens/OrguImport";
import { Gorevler } from "./screens/Gorevler";
import { Cizelge } from "./screens/Cizelge";
import { Analiz } from "./screens/Analiz";

// Gezinme:
// - "pano": ortak tezgah-şerit panosu (Faz 2 ana ekran)
// - "liste": Tezgah listesi → Tezgah detay (çözgüler) → Çözgü detay (numuneler)
// Çözgü detayına hem panodan hem listeden gidilebilir.
type Gorunum =
  | { ad: "pano" }
  | { ad: "cizelge" }
  | { ad: "analiz" }
  | { ad: "liste" }
  | { ad: "orguler" }
  | { ad: "gorevler" }
  | { ad: "tezgah"; tezgahId: string }
  | {
      ad: "cozgu";
      cozguId: string;
      geri: "pano" | "tezgah";
      tezgahId?: string;
      duzenleNumuneId?: string;
    };

export default function App() {
  const [gorunum, setGorunum] = useState<Gorunum>({ ad: "pano" });

  const sekme =
    gorunum.ad === "pano"
      ? "pano"
      : gorunum.ad === "cizelge"
        ? "cizelge"
        : gorunum.ad === "analiz"
          ? "analiz"
          : gorunum.ad === "orguler"
          ? "orguler"
          : gorunum.ad === "gorevler"
            ? "gorevler"
            : "liste";

  return (
    <>
      <header className="app">
        <h1>NDP</h1>
        <small>Numune Dokuma Planlama</small>
      </header>

      <nav className="tabs">
        <button
          className={sekme === "pano" ? "aktif" : ""}
          onClick={() => setGorunum({ ad: "pano" })}
        >
          Pano
        </button>
        <button
          className={sekme === "gorevler" ? "aktif" : ""}
          onClick={() => setGorunum({ ad: "gorevler" })}
        >
          Görevler
        </button>
        <button
          className={sekme === "cizelge" ? "aktif" : ""}
          onClick={() => setGorunum({ ad: "cizelge" })}
        >
          Çizelge
        </button>
        <button
          className={sekme === "analiz" ? "aktif" : ""}
          onClick={() => setGorunum({ ad: "analiz" })}
        >
          Analiz
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

      {gorunum.ad === "gorevler" && (
        <Gorevler
          onAc={(cozguId) =>
            setGorunum({ ad: "cozgu", cozguId, geri: "pano" })
          }
        />
      )}
      {gorunum.ad === "orguler" && <OrguImport />}

      {gorunum.ad === "cizelge" && (
        <Cizelge
          onCozguAc={(cozguId) =>
            setGorunum({ ad: "cozgu", cozguId, geri: "pano" })
          }
        />
      )}

      {gorunum.ad === "analiz" && (
        <Analiz
          onCozguAc={(cozguId) =>
            setGorunum({ ad: "cozgu", cozguId, geri: "pano" })
          }
        />
      )}

      {gorunum.ad === "pano" && (
        <Pano
          onCozguAc={(cozguId, duzenleNumuneId) =>
            setGorunum({ ad: "cozgu", cozguId, geri: "pano", duzenleNumuneId })
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
          duzenleNumuneId={gorunum.duzenleNumuneId}
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
