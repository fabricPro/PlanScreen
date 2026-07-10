// Aydınlık / Karanlık tema yardımcıları. Tek kaynak: <html data-theme="light|dark">.
// Seçim localStorage['ndp-tema']'de saklanır; yoksa cihaz tercihinden türetilir.
export type Tema = "aydinlik" | "karanlik";

const ANAHTAR = "ndp-tema";

export function temaOku(): Tema {
  try {
    const t = localStorage.getItem(ANAHTAR);
    if (t === "aydinlik" || t === "karanlik") return t;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "karanlik"
      : "aydinlik";
  } catch {
    return "aydinlik";
  }
}

// Niteliği ayarla; sadece kullanıcı seçince çağrılır (seçilene dek OS izlenir).
export function temaUygula(t: Tema): void {
  document.documentElement.setAttribute(
    "data-theme",
    t === "karanlik" ? "dark" : "light",
  );
  try {
    localStorage.setItem(ANAHTAR, t);
  } catch {
    /* yoksay */
  }
}
