/**
 * Script para criar um usuário admin no banco.
 *
 * Uso: npx tsx scripts/create-admin.ts <email> <nome> <senha>
 * Exemplo: npx tsx scripts/create-admin.ts admin@clinica.com "Admin" MinhaSenha123
 *
 * Requer DATABASE_URL no .env
 */
import "dotenv/config";
import { generateRandomString, hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "../src/db/schema";
import {
  accountsTable,
  appointmentTypesTable,
  clinicsTable,
  roomsTable,
  usersTable,
  usersToClinicsTable,
} from "../src/db/schema";

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  const name = process.argv[3]?.trim();
  const password = process.argv[4];

  if (!email || !name || !password) {
    console.error(
      "Uso: npx tsx scripts/create-admin.ts <email> <nome> <senha>",
    );
    console.error('Exemplo: npx tsx scripts/create-admin.ts admin@clinica.com "Admin" MinhaSenha123');
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("Configure DATABASE_URL no .env");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool, { schema });

  // Verificar se email já existe
  const existing = await db.query.usersTable.findFirst({
    where: eq(usersTable.email, email),
    columns: { id: true },
  });
  if (existing) {
    console.error("Este e-mail já está cadastrado.");
    process.exit(1);
  }

  const now = new Date();
  const userId = generateRandomString(27, "a-z", "A-Z", "0-9");
  const hashedPassword = await hashPassword(password);

  // Criar ou obter clínica
  let clinicId: string;
  const [existingClinic] = await db
    .select({ id: clinicsTable.id })
    .from(clinicsTable)
    .limit(1);

  if (existingClinic) {
    clinicId = existingClinic.id;
    console.log(`Usando clínica existente: ${clinicId}`);
  } else {
    const [newClinic] = await db
      .insert(clinicsTable)
      .values({ name: "Clínica Principal" })
      .returning({ id: clinicsTable.id });
    if (!newClinic) {
      console.error("Erro ao criar clínica");
      process.exit(1);
    }
    clinicId = newClinic.id;

    // Criar tipos de consulta e salas padrão
    await db.insert(appointmentTypesTable).values([
      {
        clinicId,
        name: "Primeira consulta",
        durationInMinutes: 60,
        priceInCents: 15000,
        displayOrder: 0,
      },
      {
        clinicId,
        name: "Retorno",
        durationInMinutes: 30,
        priceInCents: 8000,
        displayOrder: 1,
      },
      {
        clinicId,
        name: "Procedimento",
        durationInMinutes: 45,
        priceInCents: 12000,
        displayOrder: 2,
      },
    ]);
    await db.insert(roomsTable).values([
      { clinicId, name: "Consultório 1", type: "room", displayOrder: 0 },
      { clinicId, name: "Consultório 2", type: "room", displayOrder: 1 },
    ]);
    console.log("Clínica criada com tipos de consulta e salas padrão.");
  }

  // Criar usuário
  await db.insert(usersTable).values({
    id: userId,
    name,
    email,
    emailVerified: false,
    createdAt: now,
    updatedAt: now,
  });

  const accountId = generateRandomString(32, "a-z", "A-Z", "0-9");
  await db.insert(accountsTable).values({
    id: accountId,
    accountId: userId,
    providerId: "credential",
    userId,
    password: hashedPassword,
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(usersToClinicsTable).values({
    userId,
    clinicId,
    role: "admin",
  });

  console.log("\n✅ Usuário admin criado com sucesso!");
  console.log(`   Email: ${email}`);
  console.log(`   Nome: ${name}`);
  console.log(`   Role: admin`);
  console.log("\nFaça login na aplicação com este e-mail e senha.\n");

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
