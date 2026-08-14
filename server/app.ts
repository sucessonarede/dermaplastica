import express, { type Express, type Request, type Response, type NextFunction } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import createMemoryStore from "memorystore";
import { registerRoutes } from "./routes";
import { log } from "./logger";
import { pool } from "./db";

/**
 * Monta a aplicação Express (middlewares + rotas de API).
 *
 * Este módulo NÃO abre porta e NÃO conhece o Vite — assim o mesmo app é
 * reaproveitado tanto pelo servidor local (server/index.ts) quanto pela
 * função serverless da Vercel (api/index.ts).
 */

let appPromise: Promise<Express> | null = null;

function buildSessionConfig(): session.SessionOptions {
  const isProduction = process.env.NODE_ENV === "production";

  const config: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "dermalift-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction,
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 dias
      sameSite: "lax",
    },
  };

  // Em produção (e em qualquer ambiente serverless) a sessão precisa ficar no
  // Postgres: cada invocação da função é um processo novo, então memória não serve.
  const useDatabaseStore =
    isProduction || Boolean(process.env.VERCEL) || process.env.SESSION_STORE === "postgres";

  if (useDatabaseStore) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL é obrigatório para armazenar sessões em produção.");
    }
    const PgStore = connectPg(session);
    // Reaproveita o pool do Drizzle (já configurado com SSL para o Supabase).
    config.store = new PgStore({
      pool,
      createTableIfMissing: true,
      tableName: "session",
    });
  } else {
    const MemoryStore = createMemoryStore(session);
    config.store = new MemoryStore({ checkPeriod: 86400000 });
  }

  return config;
}

export async function createApp(): Promise<Express> {
  const app = express();

  // Necessário para cookies "secure" atrás do proxy da Vercel.
  app.set("trust proxy", 1);

  app.use(express.json({ limit: "12mb" }));
  app.use(express.urlencoded({ extended: false, limit: "12mb" }));
  app.use(session(buildSessionConfig()));

  // Log das chamadas de API
  app.use((req, res, next) => {
    const start = Date.now();
    const reqPath = req.path;
    let capturedJsonResponse: Record<string, any> | undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (reqPath.startsWith("/api")) {
        let logLine = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }
        if (logLine.length > 160) {
          logLine = logLine.slice(0, 159) + "…";
        }
        log(logLine);
      }
    });

    next();
  });

  // Healthcheck — útil para validar o deploy na Vercel
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ ok: true, env: process.env.NODE_ENV || "development" });
  });

  await registerRoutes(app);

  // Tratamento de erros
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("[error]", err);
    if (!res.headersSent) {
      res.status(status).json({ message });
    }
  });

  return app;
}

/** Instância única — evita reconstruir o app a cada invocação serverless. */
export function getApp(): Promise<Express> {
  if (!appPromise) {
    appPromise = createApp();
  }
  return appPromise;
}
