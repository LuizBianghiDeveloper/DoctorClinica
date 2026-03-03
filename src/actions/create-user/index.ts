"use server";

import { generateRandomString,hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { accountsTable, usersTable, usersToClinicsTable } from "@/db/schema";
import { createAuditLog } from "@/lib/audit";
import { protectedWithClinicActionClient } from "@/lib/next-safe-action";

import { createUserSchema } from "./schema";

export const createUser = protectedWithClinicActionClient
  .schema(createUserSchema)
  .action(async ({ parsedInput, ctx }) => {
    const userRole = (ctx.user as { role?: string }).role;
    if (userRole !== "admin") {
      throw new Error("Apenas administradores podem criar usuários.");
    }
    const clinicId = ctx.user.clinic.id;
    const email = parsedInput.email.trim().toLowerCase();

    const existing = await db.query.usersTable.findFirst({
      where: eq(usersTable.email, email),
      columns: { id: true },
    });
    if (existing) {
      throw new Error("Este e-mail já está cadastrado.");
    }

    const now = new Date();
    const userId = generateRandomString(27, "a-z", "A-Z", "0-9");
    const hashedPassword = await hashPassword(parsedInput.password);

    await db.insert(usersTable).values({
      id: userId,
      name: parsedInput.name.trim(),
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
      role: parsedInput.role,
    });
    await createAuditLog(db, {
      clinicId,
      userId: ctx.user.id,
      userEmail: ctx.user.email,
      userName: ctx.user.name ?? undefined,
      action: `Usuário "${parsedInput.name}" (${parsedInput.email}) criado`,
      entityType: "user",
      entityId: userId,
    });
    revalidatePath("/users");
    return { id: userId };
  });
