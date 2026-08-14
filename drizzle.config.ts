import "dotenv/config";
import { defineConfig } from "drizzle-kit";

/**
 * Para DDL (criar/alterar tabelas) o ideal é a conexão em *session mode*
 * (porta 5432 do pooler). O transaction pooler (6543) usado pela aplicação
 * não mantém estado entre comandos e pode falhar em migrações.
 *
 * Por isso usamos DIRECT_URL quando existir, caindo para DATABASE_URL.
 */
const url = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!url) {
  throw new Error(
    "DATABASE_URL não definida. Copie .env.example para .env e preencha a connection string."
  );
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: { url },
});
