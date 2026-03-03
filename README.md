<div align="center">

# 🩺 Doutor Agenda

**Sistema de gestão para clínicas e consultórios médicos**

[![Next.js](https://img.shields.io/badge/Next.js-15.3-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

</div>

---

## 📋 Sobre

O **Doutor Agenda** é uma plataforma completa para gestão de clínicas e consultórios, oferecendo agendamento de consultas, cadastro de pacientes e profissionais, controle financeiro, relatórios e muito mais.

---

## ✨ Funcionalidades

### 🗓️ Gestão de agenda
- **Agendamentos** — Calendário de consultas com bloqueios e tipos de atendimento
- **Profissionais** — Cadastro de médicos com especialidades, horários e comissões
- **Salas e recursos** — Organização de ambientes e equipamentos
- **Tipos de consulta** — Primeira consulta, retorno e procedimentos com valores

### 👥 Cadastros
- **Pacientes** — Histórico, documentos, alergias e anamnese
- **Usuários** — Gestão de acesso por clínica (admin/user)
- **Contratos** — Modelos personalizados e assinatura digital

### 📊 Relatórios (administradores)
- **Financeiro** — Faturamento por período, profissional, tipo de consulta; receita vs meta; fechamento de comissões
- **Agendamentos** — Ocupação, consultas por período, no-show, horários mais procurados, tempo médio
- **Pacientes** — Novos, frequentes, inativos
- **Profissionais** — Produtividade, horários mais utilizados
- **Outros** — Aniversariantes, tipos de consulta mais realizados

### 🔒 Segurança e integração
- **Auditoria** — Registro de ações no sistema
- **Assinatura** — Planos via Stripe
- **Notificações** — Email (Resend) e WhatsApp (Twilio)
- **Autenticação** — Login com email/senha e Google (BetterAuth)

---

## 🛠️ Stack tecnológica

| Camada | Tecnologia |
|--------|------------|
| **Frontend** | Next.js 15 (App Router), React 19, Tailwind CSS 4, shadcn/ui |
| **Formulários** | React Hook Form, Zod |
| **Backend** | Next.js Server Actions, next-safe-action |
| **Banco de dados** | PostgreSQL, Drizzle ORM |
| **Autenticação** | BetterAuth |
| **Pagamentos** | Stripe |
| **Email** | Resend |
| **Mensagens** | Twilio (WhatsApp) |

---

## 📦 Pré-requisitos

- **Node.js** 18+ 
- **PostgreSQL** 14+
- **npm** ou **pnpm**

---

## 🚀 Instalação

### 1. Clone e instale dependências

```bash
git clone <url-do-repositorio> doctor-clinica
cd doctor-clinica
npm install
```

### 2. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Obrigatório
DATABASE_URL="postgresql://usuario:senha@localhost:5432/doctor_clinica"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Opcional - Autenticação Google
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Opcional - Stripe (assinaturas)
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=""
STRIPE_ESSENTIAL_PLAN_PRICE_ID=""
NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL=""

# Opcional - Email (Resend)
RESEND_API_KEY=""
RESEND_FROM_EMAIL="Doutor Agenda <noreply@seudominio.com>"

# Opcional - WhatsApp (Twilio)
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_WHATSAPP_FROM="whatsapp:+14155238886"
```

### 3. Prepare o banco de dados

```bash
npx drizzle-kit push
```

Ou, para executar migrations:

```bash
npx drizzle-kit migrate
```

### 4. Inicie o servidor

```bash
npm run dev
```

Acesse **http://localhost:3000**

---

## 📜 Scripts disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento (hot reload) |
| `npm run build` | Build de produção |
| `npm start` | Inicia o servidor em modo produção |
| `npm run lint` | Executa o ESLint |

---

## 📁 Estrutura do projeto

```
src/
├── actions/           # Server Actions
├── app/               # App Router (Next.js)
│   ├── (protected)/   # Rotas autenticadas
│   │   ├── appointments/
│   │   ├── doctors/
│   │   ├── patients/
│   │   ├── reports/
│   │   └── ...
│   └── authentication/
├── components/        # Componentes reutilizáveis
├── db/                # Drizzle schema e conexão
├── hocs/              # Higher-order components
├── lib/               # Utilitários e configurações
└── actions/           # Server Actions (next-safe-action)
```

---

## 📄 Licença

Projeto privado. Todos os direitos reservados.

---

<div align="center">

Desenvolvido com ❤️ para clínicas e consultórios

</div>
