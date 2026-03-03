# Guia de Deploy — Doutor Agenda

Este guia detalha o passo a passo para colocar o projeto na nuvem usando **Vercel + Neon** (opção gratuita e barata).

---

## Pré-requisitos

- Conta no [GitHub](https://github.com)
- Conta na [Vercel](https://vercel.com)
- Conta no [Neon](https://neon.tech)

---

## Parte 1: Banco de dados (Neon)

### 1.1 Criar conta e projeto

1. Acesse [console.neon.tech](https://console.neon.tech)
2. Faça login com GitHub
3. Clique em **New Project**
4. Dê um nome (ex: `doutor-agenda`)
5. Escolha a região mais próxima (ex: `São Paulo` ou `US East`)
6. Clique em **Create Project**

### 1.2 Obter a connection string

1. Na tela do projeto, vá em **Connection Details**
2. Copie a **Connection string** (formato: `postgresql://usuario:senha@host/database?sslmode=require`)
3. **Importante:** Neon usa SSL por padrão. A URL já deve incluir `?sslmode=require`

**Exemplo de URL:**
```
postgresql://usuario:senha123@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### 1.3 Rodar as migrações

No seu computador, rode as migrações para criar as tabelas no Neon:

```bash
# Configure temporariamente a DATABASE_URL do Neon
set DATABASE_URL="sua-url-do-neon-aqui"

# Rode as migrações
npx drizzle-kit push
```

No PowerShell (Windows):
```powershell
$env:DATABASE_URL="sua-url-do-neon-aqui"
npx drizzle-kit push
```

Ou crie um arquivo `.env.production` com a URL do Neon e rode:
```bash
npx dotenv -e .env.production -- drizzle-kit push
```

---

## Parte 2: Hospedagem da aplicação (Vercel)

### 2.1 Conectar o repositório

1. Acesse [vercel.com](https://vercel.com)
2. Faça login com GitHub
3. Clique em **Add New...** → **Project**
4. Importe o repositório do Doutor Agenda
5. Clique em **Import**

### 2.2 Configurar o projeto

Na tela de configuração:

| Campo | Valor |
|-------|-------|
| Framework Preset | Next.js (detectado automaticamente) |
| Root Directory | `./` (deixe vazio) |
| Build Command | `next build` (padrão) |
| Output Directory | `.next` (padrão) |
| Install Command | `npm install` (padrão) |

### 2.3 Variáveis de ambiente

Antes de fazer o deploy, clique em **Environment Variables** e adicione:

#### Obrigatórias (todas as variáveis)

| Nome | Valor | Ambiente |
|------|-------|----------|
| `DATABASE_URL` | Cole a URL do Neon (Parte 1.2) | Production, Preview, Development |
| `BETTER_AUTH_SECRET` | Gere uma string aleatória com 32+ caracteres | Production, Preview |
| `BETTER_AUTH_URL` | `https://seu-projeto.vercel.app` (veja abaixo) | Production, Preview |
| `NEXT_PUBLIC_APP_URL` | `https://seu-projeto.vercel.app` | Production, Preview |

**Como gerar BETTER_AUTH_SECRET:**
```bash
# No terminal (Node.js)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Ou use um gerador online: [randomkeygen.com](https://randomkeygen.com)

**Importante:** Na primeira vez, use um placeholder para `BETTER_AUTH_URL` e `NEXT_PUBLIC_APP_URL` (ex: `https://doutor-agenda.vercel.app`). Depois do primeiro deploy, a Vercel mostrará a URL real. Se for diferente, edite as variáveis.

#### Recuperação de senha (Resend)

| Nome | Valor | Ambiente |
|------|-------|----------|
| `RESEND_API_KEY` | Sua chave da [Resend](https://resend.com) | Production |
| `RESEND_FROM_EMAIL` | `onboarding@resend.dev` (teste) ou seu domínio | Production |

#### Google OAuth (opcional)

| Nome | Valor | Ambiente |
|------|-------|----------|
| `GOOGLE_CLIENT_ID` | Client ID do Google Cloud Console | Production |
| `GOOGLE_CLIENT_SECRET` | Client Secret do Google Cloud Console | Production |

No [Google Cloud Console](https://console.cloud.google.com):
- Crie um projeto
- APIs e Serviços → Credenciais → Criar credenciais → ID do cliente OAuth
- Adicione a URL de redirecionamento: `https://seu-dominio.vercel.app/api/auth/callback/google`

#### Stripe (opcional, para assinaturas)

| Nome | Valor | Ambiente |
|------|-------|----------|
| `STRIPE_SECRET_KEY` | `sk_live_...` ou `sk_test_...` | Production |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret | Production |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` ou `pk_test_...` | Production |
| `NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL` | URL do portal do cliente | Production |
| `STRIPE_ESSENTIAL_PLAN_PRICE_ID` | ID do preço do plano | Production |

#### WhatsApp / Twilio (opcional)

| Nome | Valor | Ambiente |
|------|-------|----------|
| `TWILIO_ACCOUNT_SID` | Account SID | Production |
| `TWILIO_AUTH_TOKEN` | Auth Token | Production |
| `TWILIO_WHATSAPP_FROM` | Número no formato `whatsapp:+5511999999999` | Production |

#### Notificações proativas (cron)

| Nome | Valor | Ambiente |
|------|-------|----------|
| `CRON_SECRET` | String aleatória para proteger o endpoint de cron | Production |

Usado pelas notificações automáticas: lembrete 24h antes da consulta, confirmação de presença e parabéns de aniversário. O `vercel.json` já está configurado para rodar o cron a cada 2 horas.

### 2.4 Deploy

1. Clique em **Deploy**
2. Aguarde o build (cerca de 1–2 minutos)
3. Ao finalizar, acesse a URL gerada (ex: `https://doutor-agenda-xxx.vercel.app`)

### 2.5 Ajustar URLs após o primeiro deploy

1. Vá em **Settings** → **Environment Variables**
2. Atualize `BETTER_AUTH_URL` e `NEXT_PUBLIC_APP_URL` para a URL real do deploy
3. Faça um novo deploy (Deployments → ⋮ → Redeploy)

---

## Parte 3: Domínio customizado (opcional)

1. No projeto na Vercel, vá em **Settings** → **Domains**
2. Adicione seu domínio (ex: `app.suaclinica.com.br`)
3. Siga as instruções para configurar o DNS no seu provedor
4. Atualize `BETTER_AUTH_URL` e `NEXT_PUBLIC_APP_URL` com o novo domínio

---

## Parte 4: Melhor Auth com domínio customizado

Se usar domínio próprio, configure no [Better Auth](https://www.better-auth.com):

No Google OAuth, adicione:
```
https://seu-dominio.com/api/auth/callback/google
```

No Stripe (webhooks), adicione:
```
https://seu-dominio.com/api/webhooks/stripe
```

---

## Checklist pós-deploy

- [ ] Acessar a URL e testar o login
- [ ] Testar cadastro de paciente e profissional
- [ ] Testar "Esqueci minha senha" (se configurou Resend)
- [ ] Testar login com Google (se configurou)
- [ ] Conferir se os dados estão sendo salvos no Neon

---

## Comandos úteis

```bash
# Rodar migrações localmente apontando para o Neon
$env:DATABASE_URL="postgresql://..."; npx drizzle-kit push

# Ver logs na Vercel (via dashboard ou CLI)
vercel logs
```

---

## Troubleshooting

### Erro de conexão com o banco
- Verifique se a `DATABASE_URL` está correta e com `?sslmode=require`
- No Neon, confira se o IP está liberado (Neon costuma aceitar qualquer IP por padrão)

### Erro 500 ao fazer login
- Confirme que `BETTER_AUTH_URL` e `NEXT_PUBLIC_APP_URL` batem com a URL do deploy
- Confirme que `BETTER_AUTH_SECRET` está definido

### Migrações não rodaram
- Rode `npx drizzle-kit push` localmente com a `DATABASE_URL` do Neon
- Ou use o job de build da Vercel (veja [Vercel + Drizzle](https://orm.drizzle.team/docs/guides/vercel))

---

## Custos estimados (começando)

| Serviço | Plano | Custo |
|---------|-------|-------|
| Vercel | Hobby (gratuito) | R$ 0 |
| Neon | Free tier (0.5 GB) | R$ 0 |
| **Total** | | **R$ 0** |

Quando o uso crescer:
- Neon: ~US$ 19/mês (Pro)
- Vercel: Pro a partir de ~US$ 20/mês (se precisar)
