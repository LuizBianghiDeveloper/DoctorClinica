"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { appointmentsTable } from "@/db/schema";
import { createAuditLog } from "@/lib/audit";
import { protectedWithClinicActionClient } from "@/lib/next-safe-action";

import { z } from "zod";

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  completed: "Realizado",
  no_show: "Falta",
  cancelled: "Desmarcado",
};

const schema = z.object({
  appointmentId: z.string().uuid(),
  status: z.enum(["scheduled", "confirmed", "completed", "no_show", "cancelled"]),
});

export const updateAppointmentStatus =
  protectedWithClinicActionClient.schema(schema).action(
    async ({ parsedInput, ctx }) => {
      const appointment = await db.query.appointmentsTable.findFirst({
        where: eq(appointmentsTable.id, parsedInput.appointmentId),
        with: { patient: true },
      });

      if (!appointment) {
        throw new Error("Agendamento não encontrado.");
      }
      if (appointment.clinicId !== ctx.user.clinic?.id) {
        throw new Error("Agendamento não encontrado.");
      }

      await db
        .update(appointmentsTable)
        .set({ status: parsedInput.status })
        .where(eq(appointmentsTable.id, parsedInput.appointmentId));

      await createAuditLog(db, {
        clinicId: ctx.user.clinic.id,
        userId: ctx.user.id,
        userEmail: ctx.user.email,
        userName: ctx.user.name ?? undefined,
        action: `Status do agendamento alterado para "${STATUS_LABELS[parsedInput.status]}" (${appointment.patient.name})`,
        entityType: "appointment",
        entityId: parsedInput.appointmentId,
      });

      revalidatePath("/appointments");
      return { success: true };
    },
  );
