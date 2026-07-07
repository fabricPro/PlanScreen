import type { KisitSonuc } from "../lib/kisitlar";

// Kısıt sonuçlarını satır listesi olarak gösterir (§7.3 "kısıt uyarıları anlık").
// Sadece uyarılar öne çıkar; ok/bilgiYok sessiz (yalnız detay=true iken görünür).
export function KisitUyari({
  sonuclar,
  detay = false,
}: {
  sonuclar: KisitSonuc[];
  detay?: boolean;
}) {
  const gosterilecek = detay
    ? sonuclar
    : sonuclar.filter((s) => s.durum === "uyari");
  if (gosterilecek.length === 0) return null;

  return (
    <div style={{ marginTop: 4 }}>
      {gosterilecek.map((s) => (
        <div
          key={s.anahtar}
          className={s.durum === "uyari" ? "hata" : "mut"}
          style={{ fontSize: 13 }}
        >
          {s.durum === "uyari" ? "⚠" : s.durum === "ok" ? "✓" : "·"} {s.mesaj}
        </div>
      ))}
    </div>
  );
}
