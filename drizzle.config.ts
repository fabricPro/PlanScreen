import { defineConfig } from "drizzle-kit";

// Şema tek kaynak: src/db/schema.ts. Migration'lar drizzle/ altına üretilir.
// `npm run db:generate` offline çalışır (DB gerekmez); `db:migrate` DATABASE_URL ister.
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  verbose: true,
  strict: true,
});
