import type { IncomingMessage, ServerResponse } from "http";
import { getApp } from "../server/app.js";

/**
 * Função serverless da Vercel.
 *
 * Todas as rotas de backend (/api/*, /patient-photos/*, /product-images/*)
 * são redirecionadas para cá pelo vercel.json. O frontend é servido como
 * arquivos estáticos direto do CDN (dist/public).
 */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const app = await getApp();
  return (app as unknown as (req: IncomingMessage, res: ServerResponse) => void)(req, res);
}
