"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { appointmentsTable, patientExamsTable } from "@/db/schema";
import { createAuditLog } from "@/lib/audit";
import { protectedWithClinicActionClient } from "@/lib/next-safe-action";

import { upsertPatientExamSchema } from "./schema";

export const upsertPatientExam = protectedWithClinicActionClient
  .schema(upsertPatientExamSchema)
  .action(async ({ parsedInput, ctx }) => {
    const clinicId = ctx.user.clinic.id;

    const [appointment] = await db
      .select()
      .from(appointmentsTable)
      .where(
        and(
          eq(appointmentsTable.id, parsedInput.appointmentId),
          eq(appointmentsTable.clinicId, clinicId),
        ),
      );

    if (!appointment) throw new Error("Agendamento não encontrado");

    if (parsedInput.id) {
      await db
        .update(patientExamsTable)
        .set({
          name: parsedInput.name.trim(),
          status: parsedInput.status,
          resultNotes: parsedInput.resultNotes?.trim() || null,
          completedAt: parsedInput.status === "done" ? new Date() : null,
        })
        .where(
          and(
            eq(patientExamsTable.id, parsedInput.id),
            eq(patientExamsTable.clinicId, clinicId),
          ),
        );
    } else {
      await db.insert(patientExamsTable).values({
        appointmentId: parsedInput.appointmentId,
        patientId: parsedInput.patientId,
        clinicId,
        name: parsedInput.name.trim(),
        status: parsedInput.status ?? "requested",
      });
    }

    await createAuditLog(db, {
      clinicId,
      userId: ctx.user.id,
      userEmail: ctx.user.email,
      userName: ctx.user.name ?? undefined,
      action: parsedInput.id ? "Exame atualizado" : "Exame solicitado",
      entityType: "exam",
      entityId: parsedInput.id ?? undefined,
    });

    revalidatePath("/patients");
    revalidatePath("/appointments");
  });
