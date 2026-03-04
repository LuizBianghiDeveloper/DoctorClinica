/**
 * Corrige a senha de um usuário criado via SQL (que usa bcrypt).
 * Better Auth usa Scrypt por padrão, então senhas criadas com pgcrypto não funcionam.
 *
 * Uso: npx tsx scripts/fix-user-password.ts <email> <nova-senha>
 * Exemplo: npx tsx scripts/fix-user-password.ts luizbianghi@gmail.com Luiz@1996
 *
 * Requer DATABASE_URL no .env
 */
import "dotenv/config";
import { hashPassword } from "better-auth/crypto";
import { and, eq } from "drizzle-orm";

import { db } from "../src/db";
import { accountsTable, usersTable } from "../src/db/schema";

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.error("Uso: npx tsx scripts/fix-user-password.ts <email> <nova-senha>");
    console.error("Exemplo: npx tsx scripts/fix-user-password.ts luizbianghi@gmail.com MinhaSenha123");
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("Configure DATABASE_URL no .env");
    process.exit(1);
  }

  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.email, email),
    columns: { id: true, name: true },
  });

  if (!user) {
    console.error("Usuário não encontrado:", email);
    process.exit(1);
  }

  const hashedPassword = await hashPassword(newPassword);

  await db
    .update(accountsTable)
    .set({
      password: hashedPassword,
      updatedAt: new Date(),
    })
    .where(and(eq(accountsTable.userId, user.id), eq(accountsTable.providerId, "credential")));

  console.log("\n✅ Senha atualizada com sucesso!");
  console.log(`   Usuário: ${user.name} (${email})`);
  console.log("\nFaça login com a nova senha.\n");

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
