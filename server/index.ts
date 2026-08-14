import "dotenv/config";
import { createServer } from "http";
import { getApp } from "./app";
import { setupVite, serveStatic } from "./vite";
import { log } from "./logger";

/**
 * Entrypoint para rodar o projeto localmente (npm run dev)
 * ou em um servidor Node tradicional (npm run build && npm start).
 *
 * Na Vercel este arquivo NÃO é usado — lá o entrypoint é api/index.ts.
 */

async function main() {
  const app = await getApp();
  const server = createServer(app);

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    await setupVite(app, server);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  const host = process.env.HOST || "127.0.0.1";

  server.listen(port, host, () => {
    log(`servidor rodando em http://${host === "0.0.0.0" ? "localhost" : host}:${port}`);
  });
}

main().catch((err) => {
  console.error("Falha ao iniciar o servidor:", err);
  process.exit(1);
});
