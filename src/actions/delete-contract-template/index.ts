"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { contractTemplatesTable } from "@/db/schema";
import { createAuditLog } from "@/lib/audit";
import { protectedWithClinicActionClient } from "@/lib/next-safe-action";

export const deleteContractTemplate = protectedWithClinicActionClient
  .schema(
    z.object({
      id: z.string().uuid(),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const template = await db.query.contractTemplatesTable.findFirst({
      where: eq(contractTemplatesTable.id, parsedInput.id),
    });
    if (!template) {
      throw new Error("Modelo não encontrado");
    }
    if (template.clinicId !== ctx.user.clinic.id) {
      throw new Error("Modelo não encontrado");
    }
    await db
      .delete(contractTemplatesTable)
      .where(
        and(
          eq(contractTemplatesTable.id, parsedInput.id),
          eq(contractTemplatesTable.clinicId, ctx.user.clinic.id),
        ),
      );
    await createAuditLog(db, {
      clinicId: ctx.user.clinic.id,
      userId: ctx.user.id,
      userEmail: ctx.user.email,
      userName: ctx.user.name ?? undefined,
      action: `Modelo de contrato "${template.name}" removido`,
      entityType: "contract_template",
      entityId: parsedInput.id,
    });
    revalidatePath("/contracts");
  });
