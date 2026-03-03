"use server";

import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { appointmentsTable } from "@/db/schema";
import { createAuditLog } from "@/lib/audit";
import { protectedWithClinicActionClient } from "@/lib/next-safe-action";

import { updateAppointmentNotesSchema } from "./schema";

export const updateAppointmentNotes = protectedWithClinicActionClient
  .schema(updateAppointmentNotesSchema)
  .action(async ({ parsedInput, ctx }) => {
    const clinicId = ctx.user.clinic.id;
    await db
      .update(appointmentsTable)
      .set({
        notes: parsedInput.notes?.trim() || null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(appointmentsTable.id, parsedInput.appointmentId),
          eq(appointmentsTable.clinicId, clinicId),
        ),
      );
    await createAuditLog(db, {
      clinicId,
      userId: ctx.user.id,
      userEmail: ctx.user.email,
      userName: ctx.user.name ?? undefined,
      action: "Anotações do agendamento atualizadas",
      entityType: "appointment",
      entityId: parsedInput.appointmentId,
    });
    revalidatePath("/patients");
    revalidatePath("/appointments");
  });
