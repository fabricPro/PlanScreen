import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Serverless (Netlify Functions) içinde Neon HTTP driver + Drizzle.
// DATABASE_URL yalnız sunucu tarafında (functions) okunur, tarayıcıya sızmaz.
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL tanımlı değil. .env dosyasına Neon bağlantı dizesini ekleyin (.env.example'a bakın).",
  );
}

const sql = neon(databaseUrl);
export const db = drizzle(sql, { schema });
export { schema };
