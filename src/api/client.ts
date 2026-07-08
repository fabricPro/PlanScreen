import type { Cozgu, Iplik, Numune, OrguSnapshot, Tezgah } from "../lib/types";
import type { WeaveXSnapshotGirdi } from "../lib/weavex";

const BASE = "/api";

async function req<T>(
  path: string,
  method: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${BASE}/${path}`, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { hata?: string }).hata ?? `Hata ${res.status}`);
  }
  return data as T;
}

// Tezgah
export const tezgahApi = {
  list: () => req<Tezgah[]>("tezgah", "GET"),
  get: (id: string) => req<Tezgah>(`tezgah?id=${id}`, "GET"),
  create: (b: Partial<Tezgah>) => req<Tezgah>("tezgah", "POST", b),
  update: (id: string, b: Partial<Tezgah>) =>
    req<Tezgah>(`tezgah?id=${id}`, "PUT", b),
  remove: (id: string) => req<{ silindi: string }>(`tezgah?id=${id}`, "DELETE"),
};

// Çözgü
export const cozguApi = {
  listAll: () => req<Cozgu[]>("cozgu", "GET"),
  listByTezgah: (tezgahId: string) =>
    req<Cozgu[]>(`cozgu?tezgahId=${tezgahId}`, "GET"),
  get: (id: string) => req<Cozgu>(`cozgu?id=${id}`, "GET"),
  create: (b: Partial<Cozgu>) => req<Cozgu>("cozgu", "POST", b),
  update: (id: string, b: Partial<Cozgu>) =>
    req<Cozgu>(`cozgu?id=${id}`, "PUT", b),
  remove: (id: string) => req<{ silindi: string }>(`cozgu?id=${id}`, "DELETE"),
};

// Numune
export const numuneApi = {
  listAll: () => req<Numune[]>("numune", "GET"),
  listByCozgu: (cozguId: string) =>
    req<Numune[]>(`numune?cozguId=${cozguId}`, "GET"),
  get: (id: string) => req<Numune>(`numune?id=${id}`, "GET"),
  create: (b: Partial<Numune>) => req<Numune>("numune", "POST", b),
  update: (id: string, b: Partial<Numune>) =>
    req<Numune>(`numune?id=${id}`, "PUT", b),
  remove: (id: string) => req<{ silindi: string }>(`numune?id=${id}`, "DELETE"),
};

// İplik havuzu (tezgaha ait)
export const iplikApi = {
  listAll: () => req<Iplik[]>("iplik", "GET"),
  listByTezgah: (tezgahId: string) =>
    req<Iplik[]>(`iplik?tezgahId=${tezgahId}`, "GET"),
  create: (b: Partial<Iplik>) => req<Iplik>("iplik", "POST", b),
  update: (id: string, b: Partial<Iplik>) =>
    req<Iplik>(`iplik?id=${id}`, "PUT", b),
  remove: (id: string) => req<{ silindi: string }>(`iplik?id=${id}`, "DELETE"),
};

// Örgü snapshot (immutable import — PUT yok)
export const orguSnapshotApi = {
  listAll: () => req<OrguSnapshot[]>("orgu_snapshot", "GET"),
  get: (id: string) => req<OrguSnapshot>(`orgu_snapshot?id=${id}`, "GET"),
  create: (b: WeaveXSnapshotGirdi) =>
    req<OrguSnapshot>("orgu_snapshot", "POST", b),
  remove: (id: string) =>
    req<{ silindi: string }>(`orgu_snapshot?id=${id}`, "DELETE"),
};
