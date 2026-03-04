import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, customSession } from "better-auth/plugins";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { usersTable, usersToClinicsTable } from "@/db/schema";

const baseURL =
  process.env.BETTER_AUTH_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

export const auth = betterAuth({
  baseURL,
  trustedOrigins: baseURL ? [baseURL] : undefined,
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,
    schema,
  }),
  ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? {
        socialProviders: {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        },
      }
    : {}),
  plugins: [
    admin(),
    customSession(async ({ user, session }) => {
      // TODO: colocar cache
      const [userData, clinics] = await Promise.all([
        db.query.usersTable.findFirst({
          where: eq(usersTable.id, user.id),
        }),
        db.query.usersToClinicsTable.findMany({
          where: eq(usersToClinicsTable.userId, user.id),
          with: {
            clinic: true,
            user: true,
          },
        }),
      ]);
      // TODO: Ao adaptar para o usuário ter múltiplas clínicas, deve-se mudar esse código
      const clinic = clinics?.[0];
      const role = (clinic as { role?: string } | undefined)?.role ?? "user";
      const clinicData = clinic?.clinic;
      return {
        user: {
          ...user,
          plan: userData?.plan,
          clinic: clinic?.clinicId && clinicData
            ? {
                id: clinic.clinicId,
                name: clinicData.name,
                logoUrl: clinicData.logoUrl ?? undefined,
                primaryColor: clinicData.primaryColor ?? undefined,
                secondaryColor: clinicData.secondaryColor ?? undefined,
              }
            : undefined,
          role: role as "admin" | "user",
        },
        session,
      };
    }),
  ],
  user: {
    modelName: "usersTable",
    additionalFields: {
      stripeCustomerId: {
        type: "string",
        fieldName: "stripeCustomerId",
        required: false,
      },
      stripeSubscriptionId: {
        type: "string",
        fieldName: "stripeSubscriptionId",
        required: false,
      },
      plan: {
        type: "string",
        fieldName: "plan",
        required: false,
      },
    },
  },
  session: {
    // cookieCache desabilitado: customSession depende de usersToClinics, que muda
    // quando o usuário cria/vincula uma clínica. Com cache, a sessão ficava
    // desatualizada (sem clinic/role) após o primeiro login com Google.
    modelName: "sessionsTable",
  },
  account: {
    modelName: "accountsTable",
  },
  verification: {
    modelName: "verificationsTable",
  },
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      const { sendPasswordResetEmail } = await import("@/lib/send-email");
      void sendPasswordResetEmail({
        to: user.email,
        subject: "Redefinir senha - Doutor Agenda",
        html: `
          <p>Olá${user.name ? ` ${user.name}` : ""},</p>
          <p>Você solicitou a redefinição de senha. Clique no link abaixo para criar uma nova senha:</p>
          <p><a href="${url}" style="color: #4f46e5; text-decoration: underline;">Redefinir minha senha</a></p>
          <p>Ou copie e cole este link no navegador:</p>
          <p style="word-break: break-all; color: #6b7280;">${url}</p>
          <p>Este link expira em 1 hora.</p>
          <p>Se você não solicitou essa alteração, ignore este email.</p>
          <p>— Equipe Doutor Agenda</p>
        `,
        text: `Redefina sua senha clicando em: ${url}\n\nEste link expira em 1 hora.`,
      });
    },
  },
});
