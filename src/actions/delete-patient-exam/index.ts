"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { patientExamsTable } from "@/db/schema";
import { createAuditLog } from "@/lib/audit";
import { protectedWithClinicActionClient } from "@/lib/next-safe-action";

import { deletePatientExamSchema } from "./schema";

export const deletePatientExam = protectedWithClinicActionClient
  .schema(deletePatientExamSchema)
  .action(async ({ parsedInput, ctx }) => {
    const clinicId = ctx.user.clinic.id;

    await db
      .delete(patientExamsTable)
      .where(
        and(
          eq(patientExamsTable.id, parsedInput.examId),
          eq(patientExamsTable.clinicId, clinicId),
        ),
      );

    await createAuditLog(db, {
      clinicId,
      userId: ctx.user.id,
      userEmail: ctx.user.email,
      userName: ctx.user.name ?? undefined,
      action: "Exame excluído",
      entityType: "exam",
      entityId: parsedInput.examId,
    });

    revalidatePath("/patients");
    revalidatePath("/appointments");
  });
