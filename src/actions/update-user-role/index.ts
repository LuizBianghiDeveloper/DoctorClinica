"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { usersToClinicsTable } from "@/db/schema";
import { createAuditLog } from "@/lib/audit";
import { protectedWithClinicActionClient } from "@/lib/next-safe-action";

import { updateUserRoleSchema } from "./schema";

export const updateUserRole = protectedWithClinicActionClient
  .schema(updateUserRoleSchema)
  .action(async ({ parsedInput, ctx }) => {
    const userRole = (ctx.user as { role?: string }).role;
    if (userRole !== "admin") {
      throw new Error("Apenas administradores podem alterar o grupo de usuários.");
    }
    const clinicId = ctx.user.clinic.id;
    await db
      .update(usersToClinicsTable)
      .set({ role: parsedInput.role })
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
      action: `Grupo do usuário alterado para "${parsedInput.role}"`,
      entityType: "user",
      entityId: parsedInput.userId,
    });
    revalidatePath("/users");
  });
