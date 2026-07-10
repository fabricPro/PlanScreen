import { useEffect, useState } from "react";
import { Pano } from "./screens/Pano";
import { CozguDetay } from "./screens/CozguDetay";
import { Gorevler } from "./screens/Gorevler";
import { Cizelge } from "./screens/Cizelge";
import { Analiz } from "./screens/Analiz";
import { temaOku, temaUygula, type Tema } from "./lib/tema";

// Gezinme:
// - "pano": ortak tezgah-şerit panosu (Faz 2 ana ekran)
// - "liste": Tezgah listesi → Tezgah detay (çözgüler) → Çözgü detay (numuneler)
// Çözgü detayına hem panodan hem listeden gidilebilir.
type Gorunum =
  | { ad: "pano" }
  | { ad: "cizelge" }
  | { ad: "analiz" }
  | { ad: "gorevler" }
  | {
      ad: "cozgu";
      cozguId: string;
      duzenleNumuneId?: string;
    };

export default function App() {
  const [gorunum, setGorunum] = useState<Gorunum>({ ad: "pano" });
  const [tema, setTema] = useState<Tema>(temaOku);

  // data-theme'i durumla senkron tut (kalıcılık toggle onClick'inde).
  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      tema === "karanlik" ? "dark" : "light",
    );
  }, [tema]);

  function temaDegistir() {
    const yeni: Tema = tema === "karanlik" ? "aydinlik" : "karanlik";
    temaUygula(yeni);
    setTema(yeni);
  }

  const sekme =
    gorunum.ad === "pano"
      ? "pano"
      : gorunum.ad === "cizelge"
        ? "cizelge"
        : gorunum.ad === "analiz"
          ? "analiz"
          : gorunum.ad === "gorevler"
            ? "gorevler"
            : "";

  return (
    <>
      <header className="app">
        <h1>NDP</h1>
        <small>Numune Dokuma Planlama</small>
        <button
          className="tema-toggle"
          onClick={temaDegistir}
          title={tema === "karanlik" ? "Aydınlık temaya geç" : "Karanlık temaya geç"}
          aria-label={
            tema === "karanlik" ? "Aydınlık temaya geç" : "Karanlık temaya geç"
          }
        >
          {tema === "karanlik" ? "☀︎" : "🌙"}
        </button>
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
      </nav>

      {gorunum.ad === "gorevler" && (
        <Gorevler
          onAc={(cozguId) =>
            setGorunum({ ad: "cozgu", cozguId })
          }
        />
      )}

      {gorunum.ad === "cizelge" && (
        <Cizelge
          onCozguAc={(cozguId) =>
            setGorunum({ ad: "cozgu", cozguId })
          }
        />
      )}

      {gorunum.ad === "analiz" && (
        <Analiz
          onCozguAc={(cozguId) =>
            setGorunum({ ad: "cozgu", cozguId })
          }
        />
      )}

      {gorunum.ad === "pano" && (
        <Pano
          onCozguAc={(cozguId, duzenleNumuneId) =>
            setGorunum({ ad: "cozgu", cozguId, duzenleNumuneId })
          }
        />
      )}

      {gorunum.ad === "cozgu" && (
        <CozguDetay
          cozguId={gorunum.cozguId}
          duzenleNumuneId={gorunum.duzenleNumuneId}
          onGeri={() => setGorunum({ ad: "pano" })}
        />
      )}
    </>
  );
}
