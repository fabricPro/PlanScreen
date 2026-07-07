// Netlify Functions v2 için ortak JSON yardımcıları.
// Altın Kural §3: bu handler'lar YALNIZ NDP'nin kendi Neon DB'sine bağlanır.

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export function hata(mesaj: string, status = 400): Response {
  return json({ hata: mesaj }, status);
}

export async function govde<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new Error("Geçersiz JSON gövdesi");
  }
}

export function idParam(req: Request): string | null {
  return new URL(req.url).searchParams.get("id");
}
