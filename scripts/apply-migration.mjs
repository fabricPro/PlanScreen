// Migration'ı Neon HTTP driver (fetch/HTTPS) ile uygular.
// drizzle-kit migrate WebSocket kullanır ve proxy'de 403 alır; HTTP driver proxy'den geçer.
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL yok");

const here = dirname(fileURLToPath(import.meta.url));
const drizzleDir = join(here, "..", "drizzle");
const files = readdirSync(drizzleDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

const sql = neon(url);

// neon HTTP driver 0.10.x yalnız tagged-template kabul eder; ham DDL için
// TemplateStringsArray taklidi (raw = [stmt], değer yok).
function rawSql(stmt) {
  const strings = Object.assign([stmt], { raw: [stmt] });
  return sql(strings);
}

for (const file of files) {
  const raw = readFileSync(join(drizzleDir, file), "utf8");
  const statements = raw
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter(Boolean);
  console.log(`\n${file}: ${statements.length} statement`);
  for (const stmt of statements) {
    await rawSql(stmt);
    console.log("  ✓", stmt.split("\n")[0].slice(0, 60));
  }
}

const tables = await rawSql(
  "select table_name from information_schema.tables where table_schema='public' and table_name like 'ndp_%' order by table_name",
);
console.log(
  "\nOluşan tablolar:",
  tables.map((t) => t.table_name).join(", "),
);
