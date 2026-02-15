# Projeto Loja MVP

Sistema web para controle de clientes, produtos, vendas e pagamentos (`PIX`, `CARTAO`, `MES_SEGUINTE`).

## Regras principais

- `MES_SEGUINTE`: cria `PENDENTE` com vencimento automatico no dia 10 do mes seguinte.
- Se passou do vencimento e nao foi pago: `ATRASADO`.
- Ao confirmar pagamento (`paid_at`): `CONFIRMADO`.
- Venda suporta multiplos itens no mesmo lancamento.
- Tela `Cliente 360` com historico e fiado unificados.
- Contas a receber com filtros por status, metodo, cliente e periodo.
- Tela `Operacao` unificada com produto, venda e fiado no mesmo fluxo.
- Tela `Relatorios` com graficos rapidos e exportacao CSV (vendas/pagamentos).

## Setup local

1. Instale Node.js 20+.
2. Na pasta do projeto: `npm install`
3. Crie `.env.local` com:

```env
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_ANON_KEY=SUA_CHAVE_PUBLISHABLE
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_PUBLISHABLE
```

4. Rode `npm run dev`.
5. Abra `http://localhost:3000`.

## Banco no Supabase

No SQL Editor, rode nesta ordem:

1. `supabase/migrations/0001_init.sql`
2. `supabase/migrations/0002_auth_policies.sql`
3. `supabase/migrations/0003_performance_indexes.sql`

## Login (voce e seu primo)

- Acesse `/login`.
- Clique em `Criar nova conta` para criar cada usuario.
- Depois, ambos entram com email/senha e usam os mesmos dados do sistema.
- Para recuperar senha, use `Esqueci minha senha` e abra o link enviado para `/reset-password`.

## Deploy na Vercel

1. Suba o projeto para GitHub.
2. Na Vercel, importe o repositorio.
3. Configure as variaveis de ambiente:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy.
5. No Supabase Auth, em `URL Configuration`, adicione:
   - Site URL da Vercel
   - Redirect URL `https://SEU-DOMINIO/login`
   - Redirect URL `https://SEU-DOMINIO/reset-password`

## Estrutura

- `app/`: telas e APIs
- `middleware.ts`: protecao de rotas (exige login)
- `lib/supabase-server.ts`: cliente Supabase server-side
- `lib/supabase-browser.ts`: cliente Supabase client-side
- `supabase/migrations/`: schema e politicas de seguranca
