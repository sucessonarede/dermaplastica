import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../shared/schema.js";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL não definida. Copie .env.example para .env e preencha a connection string do Supabase."
  );
}

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

/**
 * O Supabase exige SSL. Um Postgres local (docker/localhost) normalmente não
 * tem SSL — por isso desligamos automaticamente nesse caso. Para forçar,
 * defina PGSSL=require ou PGSSL=disable.
 */
function resolveSsl(): { rejectUnauthorized: boolean } | false {
  const forced = process.env.PGSSL;
  if (forced === "disable") return false;
  if (forced === "require") return { rejectUnauthorized: false };

  const url = process.env.DATABASE_URL || "";
  const isLocal = /@(localhost|127\.0\.0\.1|host\.docker\.internal|db|postgres)[:/]/.test(url);
  return isLocal ? false : { rejectUnauthorized: false };
}

/**
 * Em ambiente serverless cada invocação pode criar um novo módulo; guardamos o
 * pool no globalThis para reaproveitar conexões entre invocações "quentes" e
 * limitamos o tamanho do pool (use a connection string do POOLER do Supabase,
 * porta 6543, para não estourar o limite de conexões).
 */
const globalForDb = globalThis as unknown as { __dermaliftPool?: Pool };

export const pool =
  globalForDb.__dermaliftPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: resolveSsl(),
    max: isServerless ? 5 : 10,
    idleTimeoutMillis: isServerless ? 10_000 : 30_000,
    connectionTimeoutMillis: 15_000,
  });

if (!globalForDb.__dermaliftPool) {
  globalForDb.__dermaliftPool = pool;
  pool.on("error", (err) => {
    console.error("[db] erro inesperado no pool do Postgres:", err);
  });
}

export const db = drizzle({ client: pool, schema });
