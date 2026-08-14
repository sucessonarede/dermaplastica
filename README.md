# Dermalift

Plataforma de gestão para clínicas de estética (React + Express + Postgres/Supabase).

---

## Rodando localmente

### 1. Pré-requisitos

- Node.js 20 ou superior (`node -v`)
- Uma connection string de Postgres (Supabase ou Postgres local)

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Abra o `.env` e preencha, no mínimo:

| Variável         | Onde pegar                                                        |
| ---------------- | ----------------------------------------------------------------- |
| `DATABASE_URL`   | Supabase → **Settings → Database → Connection string → URI**        |
| `SESSION_SECRET` | Gere com `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |

As chaves do Supabase Storage (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) são
**opcionais em desenvolvimento** — sem elas, fotos e imagens de produtos são
gravadas na pasta local `.local-storage/`.

### 4. Banco de dados

O banco deste projeto **já existe e está populado** — não rode `npm run db:push`.
Esse comando altera o schema e pode mexer em dados reais. Use apenas quando
precisar aplicar uma mudança em `shared/schema.ts`, e rode antes sem `--force`
(`npx drizzle-kit push`) para revisar o plano.

### 5. Subir o servidor

```bash
npm run dev
```

Acesse **http://localhost:5000**. O Express serve a API e o Vite (com HMR) na
mesma porta.

### Simular produção localmente

```bash
npm run build
npm start
```

---

## Scripts

| Script                 | O que faz                                                        |
| ---------------------- | ---------------------------------------------------------------- |
| `npm run dev`          | Servidor de desenvolvimento (Express + Vite em middleware mode)   |
| `npm run build`        | Build do frontend (`dist/public`) + do servidor Node (`dist/index.js`) |
| `npm run vercel-build` | Build usado pela Vercel (só o frontend — a API vira função)        |
| `npm start`            | Roda o build de produção como servidor Node tradicional            |
| `npm run check`        | Checagem de tipos (TypeScript)                                     |
| `npm run db:push`      | Aplica o schema do Drizzle no banco                                |

---

## Estrutura

```
api/index.ts        → função serverless da Vercel (só reexporta o app Express)
client/             → frontend React (Vite)
server/
  app.ts            → monta o app Express (middlewares + rotas). Sem porta, sem Vite.
  index.ts          → entrypoint local/Node: abre a porta e liga o Vite ou os estáticos
  routes.ts         → todas as rotas da API
  storage.ts        → acesso ao banco (Drizzle)
  objectStorage.ts  → upload/leitura de arquivos (Supabase Storage ou disco local)
  db.ts             → pool do Postgres
shared/schema.ts    → schema Drizzle + Zod compartilhado entre client e server
```

---

## Deploy

Veja **[DEPLOY-VERCEL.md](./DEPLOY-VERCEL.md)**.
