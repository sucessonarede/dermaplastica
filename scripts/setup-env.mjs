#!/usr/bin/env node
/**
 * Configuração assistida do .env — `npm run setup`
 *
 * Pergunta a senha do banco e a service_role key direto no terminal (digitação
 * oculta), monta as connection strings com o encoding correto, grava o .env e
 * testa a conexão. Nada é exibido na tela nem enviado para lugar nenhum.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import readline from "node:readline";

const ROOT = path.resolve(import.meta.dirname, "..");
const ENV_PATH = path.join(ROOT, ".env");

const PROJECT_REF = "zjqxytnwjyvdafnrujph";
const REGION_HOST = "aws-1-sa-east-1.pooler.supabase.com";
const BUCKET = "dermalift";

const c = {
  reset: "\x1b[0m", bold: "\x1b[1m", dim: "\x1b[2m",
  green: "\x1b[32m", red: "\x1b[31m", yellow: "\x1b[33m", cyan: "\x1b[36m",
};
const ok = (m) => console.log(`${c.green}✓${c.reset} ${m}`);
const err = (m) => console.log(`${c.red}✗${c.reset} ${m}`);
const info = (m) => console.log(`${c.dim}  ${m}${c.reset}`);

/* ---------------------------------------------------------------- input --- */

let sharedRl = null;
function getRl() {
  if (!sharedRl) {
    sharedRl = readline.createInterface({ input: process.stdin, output: process.stdout });
  }
  return sharedRl;
}
function closeRl() {
  if (sharedRl) { sharedRl.close(); sharedRl = null; }
}

function ask(question) {
  return new Promise((resolve) => getRl().question(question, (a) => resolve(a.trim())));
}

/** Lê sem ecoar na tela (mostra * por caractere). Suporta colar (chunk multi-char). */
function askSecret(question) {
  return new Promise((resolve) => {
    if (!process.stdin.isTTY) return ask(question).then(resolve);

    process.stdout.write(question);
    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    let value = "";
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      stdin.setRawMode(false);
      stdin.pause();
      stdin.removeListener("data", onData);
      process.stdout.write("\n");
      resolve(value.trim());
    };

    // O chunk pode conter vários caracteres de uma vez (colar), então
    // percorremos caractere a caractere em vez de comparar o chunk inteiro.
    const onData = (chunk) => {
      for (const ch of chunk) {
        if (done) return;
        if (ch === "\r" || ch === "\n" || ch === "\u0004") return finish();
        if (ch === "\u0003") { process.stdout.write("\n"); process.exit(1); }
        if (ch === "\u007f" || ch === "\b") {
          if (value.length) { value = value.slice(0, -1); process.stdout.write("\b \b"); }
          continue;
        }
        if (ch >= " ") { value += ch; process.stdout.write("*"); }
      }
    };

    stdin.on("data", onData);
  });
}

/* ----------------------------------------------------------------- main --- */

console.log(`\n${c.bold}Configuração do Dermalift${c.reset}`);
console.log(`${c.dim}Vou montar o arquivo .env. O que você digitar não aparece na tela.${c.reset}\n`);

// Preserva valores já existentes
const existing = {};
if (fs.existsSync(ENV_PATH)) {
  for (const line of fs.readFileSync(ENV_PATH, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#") || !t.includes("=")) continue;
    const [k, ...rest] = t.split("=");
    existing[k.trim()] = rest.join("=").trim().replace(/^["']|["']$/g, "");
  }
  info(`.env encontrado — valores válidos serão mantidos.\n`);
}

// 1. Senha do banco
console.log(`${c.bold}1/2 — Senha do banco de dados${c.reset}`);
info("No Supabase: Settings → Database. Se não souber, dá para resetar lá.");

let password = "";
while (!password) {
  password = await askSecret("   Senha: ");
  if (!password) { err("Não pode ficar vazia."); continue; }
  if (password.includes("*")) {
    err("Essa senha contém '*' — é a versão mascarada do painel, não a real.");
    password = "";
    continue;
  }
  const confirm = await askSecret("   Repita:  ");
  if (confirm !== password) { err("As duas não bateram, vamos de novo.\n"); password = ""; }
}
// encodeURIComponent resolve @ # / ? & e afins na connection string
const pwd = encodeURIComponent(password);
ok(`Senha registrada (${password.length} caracteres).\n`);

// 2. service_role key
console.log(`${c.bold}2/2 — Supabase service_role key${c.reset}`);
info("Settings → API → service_role → Reveal. Necessária só para upload de fotos.");
info("Pode deixar em branco e configurar depois (Enter para pular).");
let serviceKey = await askSecret("   Key:   ");
if (!serviceKey && existing.SUPABASE_SERVICE_ROLE_KEY) {
  serviceKey = existing.SUPABASE_SERVICE_ROLE_KEY;
  info("Mantendo a key que já estava no .env.");
}
if (serviceKey && !/^(eyJ|sb_)/.test(serviceKey)) {
  console.log(`${c.yellow}!${c.reset} Essa key tem formato incomum — confira se copiou a service_role inteira.`);
}
console.log(serviceKey ? `${c.green}✓${c.reset} Key registrada.\n` : `${c.dim}  Pulado — upload de fotos usará disco local.${c.reset}\n`);

// 3. Escreve o .env
const sessionSecret =
  existing.SESSION_SECRET && existing.SESSION_SECRET.length >= 32
    ? existing.SESSION_SECRET
    : crypto.randomBytes(48).toString("hex");

const content = `# Gerado por "npm run setup". Não versionar — está no .gitignore.

# Aplicação (transaction pooler, porta 6543)
DATABASE_URL="postgresql://postgres.${PROJECT_REF}:${pwd}@${REGION_HOST}:6543/postgres"

# Migrações (session pooler, porta 5432) — usado só pelo drizzle-kit
DIRECT_URL="postgresql://postgres.${PROJECT_REF}:${pwd}@${REGION_HOST}:5432/postgres"

SESSION_SECRET=${sessionSecret}

SUPABASE_URL=https://${PROJECT_REF}.supabase.co
SUPABASE_SERVICE_ROLE_KEY=${serviceKey}
SUPABASE_STORAGE_BUCKET=${BUCKET}
PRIVATE_OBJECT_DIR=private

PORT=5000
HOST=127.0.0.1
`;

closeRl();

fs.writeFileSync(ENV_PATH, content, { mode: 0o600 });
ok(`.env gravado em ${ENV_PATH}`);
info("Permissão 600 — só o seu usuário consegue ler.\n");

// 4. Testa a conexão
console.log(`${c.bold}Testando a conexão...${c.reset}`);
let pg;
try {
  pg = (await import("pg")).default;
} catch {
  console.log(`${c.yellow}!${c.reset} Dependências ainda não instaladas. Rode ${c.cyan}npm install${c.reset} e depois ${c.cyan}npm run setup${c.reset} de novo para testar.`);
  process.exit(0);
}

const pool = new pg.Pool({
  connectionString: `postgresql://postgres.${PROJECT_REF}:${pwd}@${REGION_HOST}:6543/postgres`,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 20000,
  max: 1,
});

try {
  const { rows } = await pool.query(`
    select table_name, (xpath('/row/c/text()',
      query_to_xml(format('select count(*) as c from %I.%I', table_schema, table_name),
      false, true, '')))[1]::text::int as total
    from information_schema.tables
    where table_schema = 'public' and table_type = 'BASE TABLE'
    order by table_name
  `);
  ok("Conectado ao banco.\n");
  if (rows.length) {
    console.log(`${c.bold}  Tabelas encontradas:${c.reset}`);
    for (const r of rows) console.log(`   ${r.table_name.padEnd(22)} ${String(r.total).padStart(6)} registros`);
    console.log();
  } else {
    console.log(`${c.yellow}!${c.reset} Nenhuma tabela no schema public — confira se é o projeto certo.\n`);
  }
  console.log(`${c.bold}Tudo pronto.${c.reset} Rode ${c.cyan}npm run dev${c.reset} e abra ${c.cyan}http://localhost:5000${c.reset}\n`);
} catch (e) {
  const msg = String(e.message || e);
  err(`Não consegui conectar: ${msg}\n`);
  if (/password authentication failed|SASL|SCRAM/i.test(msg)) {
    info("A senha está incorreta. Rode 'npm run setup' de novo, ou resete em");
    info("Supabase → Settings → Database → Reset database password (não apaga dados).");
  } else if (/ENOTFOUND|EAI_AGAIN|getaddrinfo/i.test(msg)) {
    info("Host não resolvido — verifique sua internet, ou se a região do projeto é outra.");
  } else if (/timeout|ETIMEDOUT/i.test(msg)) {
    info("Timeout — pode ser firewall/VPN bloqueando a porta 6543.");
  } else if (/Tenant or user not found/i.test(msg)) {
    info(`O project ref pode estar errado (usei "${PROJECT_REF}").`);
  }
  process.exitCode = 1;
} finally {
  await pool.end().catch(() => {});
}
