"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { usersTable, usersToClinicsTable } from "@/db/schema";
import { createAuditLog } from "@/lib/audit";
import { protectedWithClinicActionClient } from "@/lib/next-safe-action";

export const deleteUserFromClinic = protectedWithClinicActionClient
  .schema(
    z.object({
      userId: z.string().min(1, "ID do usuário é obrigatório."),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const userRole = (ctx.user as { role?: string }).role;
    if (userRole !== "admin") {
      throw new Error("Apenas administradores podem excluir usuários.");
    }
    if (parsedInput.userId === ctx.user.id) {
      throw new Error("Você não pode remover a si mesmo.");
    }

    const clinicId = ctx.user.clinic.id;

    const membership = await db.query.usersToClinicsTable.findFirst({
      where: and(
        eq(usersToClinicsTable.userId, parsedInput.userId),
        eq(usersToClinicsTable.clinicId, clinicId),
      ),
    });
    if (!membership) {
      throw new Error("Usuário não encontrado na clínica.");
    }

    const adminCount = await db.query.usersToClinicsTable.findMany({
      where: and(
        eq(usersToClinicsTable.clinicId, clinicId),
        eq(usersToClinicsTable.role, "admin"),
      ),
      columns: { userId: true },
    });
    if (
      membership.role === "admin" &&
      adminCount.length <= 1
    ) {
      throw new Error(
        "Não é possível remover o último administrador da clínica.",
      );
    }

    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, parsedInput.userId),
      columns: { name: true, email: true },
    });

    await db
      .delete(usersToClinicsTable)
      .where(
        and(
          eq(usersToClinicsTable.userId, parsedInput.userId),
          eq(usersToClinicsTable.clinicId, clinicId),
        ),
      );

    await createAuditLog(db, {
      clinicId,
      userId: ctx.user.id,
      userEmail: ctx.user.email,
      userName: ctx.user.name ?? undefined,
      action: `Usuário "${user?.name ?? "N/A"}" (${user?.email ?? "N/A"}) removido da clínica`,
      entityType: "user",
      entityId: parsedInput.userId,
    });
    revalidatePath("/users");
  });
