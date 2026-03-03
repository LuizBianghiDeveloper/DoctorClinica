"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { contractTemplatesTable } from "@/db/schema";
import { createAuditLog } from "@/lib/audit";
import { protectedWithClinicActionClient } from "@/lib/next-safe-action";

import { upsertContractTemplateSchema } from "./schema";

export const upsertContractTemplate = protectedWithClinicActionClient
  .schema(upsertContractTemplateSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { id, name, content } = parsedInput;
    const payload = { name, content };

    if (id) {
      await db
        .update(contractTemplatesTable)
        .set(payload)
        .where(
          and(
            eq(contractTemplatesTable.id, id),
            eq(contractTemplatesTable.clinicId, ctx.user.clinic.id),
          ),
        );
      await createAuditLog(db, {
        clinicId: ctx.user.clinic.id,
        userId: ctx.user.id,
        userEmail: ctx.user.email,
        userName: ctx.user.name ?? undefined,
        action: `Modelo de contrato "${name}" atualizado`,
        entityType: "contract_template",
        entityId: id,
      });
    } else {
      await db.insert(contractTemplatesTable).values({
        ...payload,
        clinicId: ctx.user.clinic.id,
      });
      await createAuditLog(db, {
        clinicId: ctx.user.clinic.id,
        userId: ctx.user.id,
        userEmail: ctx.user.email,
        userName: ctx.user.name ?? undefined,
        action: `Modelo de contrato "${name}" criado`,
        entityType: "contract_template",
      });
    }
    revalidatePath("/contracts");
  });
