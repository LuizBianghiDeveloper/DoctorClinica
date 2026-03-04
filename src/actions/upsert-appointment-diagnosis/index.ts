"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import {
  appointmentDiagnosesTable,
  appointmentsTable,
} from "@/db/schema";
import { createAuditLog } from "@/lib/audit";
import { protectedWithClinicActionClient } from "@/lib/next-safe-action";

import { upsertAppointmentDiagnosisSchema } from "./schema";

export const upsertAppointmentDiagnosis = protectedWithClinicActionClient
  .schema(upsertAppointmentDiagnosisSchema)
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

    await db.delete(appointmentDiagnosesTable).where(
      eq(appointmentDiagnosesTable.appointmentId, parsedInput.appointmentId),
    );

    if (parsedInput.diagnoses.length > 0) {
      await db.insert(appointmentDiagnosesTable).values(
        parsedInput.diagnoses.map((d, i) => ({
          appointmentId: parsedInput.appointmentId,
          icdCode: d.icdCode.trim().toUpperCase(),
          description: d.description.trim(),
          displayOrder: i,
        })),
      );
    }

    await createAuditLog(db, {
      clinicId,
      userId: ctx.user.id,
      userEmail: ctx.user.email,
      userName: ctx.user.name ?? undefined,
      action: "Diagnósticos CID atualizados",
      entityType: "appointment",
      entityId: parsedInput.appointmentId,
    });

    revalidatePath("/patients");
    revalidatePath("/appointments");
  });
