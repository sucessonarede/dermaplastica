#!/usr/bin/env node
/**
 * Diagnóstico de imagens (produtos do receituário e fotos de pacientes).
 *
 * Para cada registro que tem URL de imagem no banco, verifica se o arquivo
 * realmente existe no storage configurado (Supabase ou disco local).
 *
 * Uso:  node scripts/check-images.mjs
 *
 * Não altera nada — só lê e imprime um relatório.
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL não definida. Rode a partir da raiz do projeto, com o .env preenchido.");
  process.exit(1);
}

const PRIVATE_DIR = (process.env.PRIVATE_OBJECT_DIR || "private").replace(/^\/+/, "");
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "dermalift";
const LOCAL_DIR = process.env.LOCAL_STORAGE_DIR || ".local-storage";

const isLocalDb = /@(localhost|127\.0\.0\.1)/.test(DATABASE_URL);

let checkExists;
let storageLabel;

if (SUPABASE_URL && SUPABASE_KEY) {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  storageLabel = `Supabase Storage · bucket "${BUCKET}" · prefixo "${PRIVATE_DIR}"`;
  checkExists = async (key) => {
    const dir = path.posix.dirname(key);
    const base = path.posix.basename(key);
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(dir === "." ? "" : dir, { search: base, limit: 100 });
    if (error) return false;
    return (data || []).some((e) => e.name === base);
  };
} else {
  storageLabel = `disco local · pasta "${LOCAL_DIR}" · prefixo "${PRIVATE_DIR}"`;
  checkExists = async (key) => fs.existsSync(path.resolve(LOCAL_DIR, key));
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: isLocalDb ? false : { rejectUnauthorized: false },
});

/** Converte a URL salva no banco na chave usada no storage. */
function toKey(url, folder) {
  const rel = url.replace(`/${folder}/`, "");
  return `${PRIVATE_DIR}/${folder}/${rel}`;
}

async function auditar(titulo, rows, folder) {
  console.log(`\n${titulo}`);
  console.log("─".repeat(72));

  if (!rows.length) {
    console.log("  (nenhum registro com imagem)");
    return { ok: 0, faltando: 0, externas: 0, itens: [] };
  }

  let ok = 0;
  let faltando = 0;
  let externas = 0;
  const itens = [];

  for (const row of rows) {
    const url = row.url;
    if (/^https?:\/\//i.test(url)) {
      externas++;
      console.log(`  🔗 EXTERNA   ${row.label}`);
      console.log(`              ${url}`);
      continue;
    }
    const key = toKey(url, folder);
    const existe = await checkExists(key);
    if (existe) {
      ok++;
      console.log(`  ✅ OK        ${row.label}`);
    } else {
      faltando++;
      itens.push(row.label);
      console.log(`  ❌ SUMIU     ${row.label}`);
      console.log(`              banco: ${url}`);
      console.log(`              chave: ${key}`);
    }
  }

  return { ok, faltando, externas, itens };
}

try {
  console.log(`\nBanco:   ${DATABASE_URL.replace(/:[^:@/]+@/, ":***@")}`);
  console.log(`Storage: ${storageLabel}`);

  const produtos = await pool.query(
    `SELECT id, name, image_url FROM skincare_products
      WHERE image_url IS NOT NULL AND image_url <> ''
      ORDER BY display_order, name`
  );
  const fotos = await pool.query(
    `SELECT p.id, p.photo_url, COALESCE(pa.name, p.patient_id) AS paciente
       FROM patient_photos p
       LEFT JOIN patients pa ON pa.id = p.patient_id
      ORDER BY pa.name NULLS LAST`
  );

  const rProd = await auditar(
    "PRODUTOS DO RECEITUÁRIO",
    produtos.rows.map((r) => ({ label: r.name, url: r.image_url })),
    "product-images"
  );

  const rFotos = await auditar(
    "FOTOS DE PACIENTES",
    fotos.rows.map((r) => ({ label: r.paciente, url: r.photo_url })),
    "patient-photos"
  );

  console.log("\nRESUMO");
  console.log("─".repeat(72));
  console.log(
    `  Produtos: ${rProd.ok} ok · ${rProd.faltando} sumiram · ${rProd.externas} externas`
  );
  console.log(
    `  Fotos:    ${rFotos.ok} ok · ${rFotos.faltando} sumiram · ${rFotos.externas} externas`
  );

  const total = rProd.faltando + rFotos.faltando;
  if (total > 0) {
    console.log(
      `\n  ${total} arquivo(s) constam no banco mas não estão no storage.\n` +
        "  Provável causa: os arquivos ficaram no Object Storage do Replit e não\n" +
        "  foram migrados para o Supabase. É preciso reenviar as imagens."
    );
  } else {
    console.log("\n  Nenhum arquivo faltando. 🎉");
  }
  console.log("");
} catch (err) {
  console.error("\nErro no diagnóstico:", err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
