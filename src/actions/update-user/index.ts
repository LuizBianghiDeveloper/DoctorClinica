"use server";

import { hashPassword } from "better-auth/crypto";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { accountsTable, usersTable, usersToClinicsTable } from "@/db/schema";
import { createAuditLog } from "@/lib/audit";
import { protectedWithClinicActionClient } from "@/lib/next-safe-action";

import { updateUserSchema } from "./schema";

export const updateUser = protectedWithClinicActionClient
  .schema(updateUserSchema)
  .action(async ({ parsedInput, ctx }) => {
    const userRole = (ctx.user as { role?: string }).role;
    if (userRole !== "admin") {
      throw new Error("Apenas administradores podem editar usuários.");
    }
    const clinicId = ctx.user.clinic.id;
    const email = parsedInput.email.trim().toLowerCase();

    const membership = await db.query.usersToClinicsTable.findFirst({
      where: and(
        eq(usersToClinicsTable.userId, parsedInput.userId),
        eq(usersToClinicsTable.clinicId, clinicId),
      ),
    });
    if (!membership) {
      throw new Error("Usuário não encontrado na clínica.");
    }

    const existingByEmail = await db.query.usersTable.findFirst({
      where: eq(usersTable.email, email),
      columns: { id: true },
    });
    if (existingByEmail && existingByEmail.id !== parsedInput.userId) {
      throw new Error("Este e-mail já está cadastrado.");
    }

    const now = new Date();
    await db
      .update(usersTable)
      .set({
        name: parsedInput.name.trim(),
        email,
        updatedAt: now,
      })
      .where(eq(usersTable.id, parsedInput.userId));

    await db
      .update(usersToClinicsTable)
      .set({ role: parsedInput.role })
      .where(
        and(
          eq(usersToClinicsTable.userId, parsedInput.userId),
          eq(usersToClinicsTable.clinicId, clinicId),
        ),
      );

    if (
      parsedInput.password &&
      parsedInput.password.trim().length >= 8
    ) {
      const hashedPassword = await hashPassword(parsedInput.password);
      await db
        .update(accountsTable)
        .set({ password: hashedPassword, updatedAt: now })
        .where(
          and(
            eq(accountsTable.userId, parsedInput.userId),
            eq(accountsTable.providerId, "credential"),
          ),
        );
    }

    await createAuditLog(db, {
      clinicId,
      userId: ctx.user.id,
      userEmail: ctx.user.email,
      userName: ctx.user.name ?? undefined,
      action: `Usuário "${parsedInput.name}" (${email}) atualizado`,
      entityType: "user",
      entityId: parsedInput.userId,
    });
    revalidatePath("/users");
  });
