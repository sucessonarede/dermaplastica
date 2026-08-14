# Deploy do Dermalift na Vercel

Guia completo, do zero ao ar. Tempo estimado: 15–20 minutos.

---

## Como o projeto ficou montado na Vercel

O projeto era um servidor Express único (jeito Replit). Na Vercel ele foi
dividido em duas partes que rodam juntas no mesmo domínio:

| Parte                        | Onde roda                     | Arquivo                |
| ---------------------------- | ----------------------------- | ---------------------- |
| Frontend (React)             | CDN estático da Vercel        | build em `dist/public` |
| Backend (API Express)        | 1 função serverless Node      | `api/index.ts`         |

O `vercel.json` faz o roteamento: `/api/*`, `/patient-photos/*` e
`/product-images/*` vão para a função; todo o resto cai no `index.html` (SPA).

---

## Passo 1 — Criar o bucket no Supabase Storage

O Replit Object Storage não existe fora do Replit, então as fotos de pacientes e
as imagens de produtos passaram a usar o **Supabase Storage**.

1. No painel do Supabase, vá em **Storage → New bucket**
2. Nome: `dermalift`
3. Deixe **Public bucket DESMARCADO** (os arquivos são servidos pela API, que
   valida o acesso)
4. Clique em **Create bucket**

> Não é preciso criar policies: o backend usa a `service_role` key, que ignora RLS.

---

## Passo 2 — Coletar as variáveis de ambiente

No painel do Supabase:

| Variável                    | Onde encontrar                                                       |
| --------------------------- | -------------------------------------------------------------------- |
| `DATABASE_URL`              | **Settings → Database → Connection string → URI**, aba **Transaction pooler** (porta **6543**) |
| `SUPABASE_URL`              | **Settings → API → Project URL**                                      |
| `SUPABASE_SERVICE_ROLE_KEY` | **Settings → API → Project API keys → `service_role`** (clique em Reveal) |
| `SUPABASE_STORAGE_BUCKET`   | `dermalift`                                                           |
| `PRIVATE_OBJECT_DIR`        | `private`                                                             |
| `SESSION_SECRET`            | Gere: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |

> ⚠️ **Use o pooler (porta 6543), não a conexão direta (5432).** Cada requisição
> serverless abre conexão nova; sem o pooler o Supabase derruba o banco por
> excesso de conexões.

> 🔒 A `service_role` key é secreta. Ela só existe no backend — nunca é enviada
> para o navegador.

---

## Passo 3 — Subir o código para o GitHub

```bash
cd Dermalift
git add .
git commit -m "Adapta projeto para deploy na Vercel"
git remote add origin https://github.com/SEU-USUARIO/dermalift.git
git push -u origin main
```

> O `.gitignore` já bloqueia `.env`, `node_modules`, `dist`, `.vercel` e
> `.local-storage`. Confirme que o `.env` **não** aparece no `git status`.

---

## Passo 4 — Importar na Vercel

1. Acesse [vercel.com/new](https://vercel.com/new)
2. **Import Git Repository** → selecione o repositório
3. Em **Framework Preset**, deixe **Other** (o `vercel.json` já define tudo)
4. **Não** altere Build Command / Output Directory — eles vêm do `vercel.json`
5. Antes de clicar em Deploy, abra **Environment Variables** e adicione:

```
DATABASE_URL               = postgresql://postgres.xxxx:SENHA@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
SESSION_SECRET             = <valor aleatório gerado>
SUPABASE_URL               = https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY  = eyJhbGciOi...
SUPABASE_STORAGE_BUCKET    = dermalift
PRIVATE_OBJECT_DIR         = private
```

Marque as três environments: **Production, Preview, Development**.

6. Clique em **Deploy**

---

## Passo 5 — Banco de dados

**O banco deste projeto já existe e está populado** (o mesmo que era usado no
Replit). Não é preciso criar nada.

> ⚠️ **NÃO rode `npm run db:push` contra esse banco sem necessidade.** O comando
> compara o `shared/schema.ts` com o banco e aplica diferenças — se houver
> qualquer divergência, ele pode alterar ou remover colunas com dados.

Se um dia precisar aplicar uma mudança de schema, rode **sem** `--force` primeiro
e leia o plano antes de confirmar:

```bash
npx drizzle-kit push
```

A tabela `session` (login) é criada sozinha pelo servidor no primeiro acesso, se
ainda não existir.

> 💡 Rodando localmente com essa `DATABASE_URL`, você está mexendo nos **dados
> reais** da clínica. Para testar cadastros à vontade, crie um projeto separado
> no Supabase e aponte o `.env` local para ele.

---

## Passo 6 — Testar

Com a URL do deploy em mãos:

1. `https://SEU-APP.vercel.app/api/health` → deve retornar `{"ok":true,"env":"production"}`
2. Abra a raiz, crie uma conta e faça login (valida banco + sessão)
3. Cadastre um paciente e envie uma foto (valida o Supabase Storage)

---

## Problemas comuns

**`FUNCTION_INVOCATION_FAILED` / erro 500 em tudo**
Falta variável de ambiente. Veja o log em **Deployments → clique no deploy → Functions → Logs**.

**`too many connections` ou timeout no banco**
Você usou a connection string direta (5432). Troque pela do **Transaction pooler** (6543).

**Login não persiste / desloga sozinho**
`SESSION_SECRET` não definido, ou definido com valores diferentes entre
Production e Preview. Use o mesmo valor nos três environments.

**Upload de foto retorna 500**
`SUPABASE_URL` ou `SUPABASE_SERVICE_ROLE_KEY` ausente, ou o bucket `dermalift`
não existe. Confira o Passo 1.

**Página em branco ao recarregar uma rota interna (ex.: `/pacientes`)**
O rewrite de SPA está no `vercel.json` — confirme que o arquivo foi commitado.

---

## O que mudou em relação à versão Replit

| Antes (Replit)                              | Agora                                                    |
| ------------------------------------------- | -------------------------------------------------------- |
| Replit Object Storage (sidecar + GCS)       | Supabase Storage (disco local como fallback em dev)       |
| Plugins `@replit/vite-*`                    | Removidos                                                 |
| `server/index.ts` monolítico com `listen()`  | `server/app.ts` (app puro) + `server/index.ts` (local) + `api/index.ts` (Vercel) |
| `bcrypt` (módulo nativo)                    | `bcryptjs` (JS puro — hashes existentes continuam válidos) |
| Sessão em memória em dev, PG em prod        | Igual, mas força PG sempre que rodar serverless           |
| Pool do Postgres sem limite                 | Pool reaproveitado e limitado para serverless             |
| SSL do Postgres sempre ligado               | Automático (desliga em `localhost`, liga no Supabase)     |
| Imports `@shared/*` no servidor             | Caminhos relativos (resolvem em qualquer bundler)          |
| `package-lock.json` apontando p/ registry do Replit | Registry oficial do npm                            |
