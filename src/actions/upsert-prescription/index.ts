"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import {
  appointmentsTable,
  prescriptionItemsTable,
  prescriptionsTable,
} from "@/db/schema";
import { createAuditLog } from "@/lib/audit";
import { protectedWithClinicActionClient } from "@/lib/next-safe-action";

import { upsertPrescriptionSchema } from "./schema";

export const upsertPrescription = protectedWithClinicActionClient
  .schema(upsertPrescriptionSchema)
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

    const [existing] = await db
      .select()
      .from(prescriptionsTable)
      .where(
        and(
          eq(prescriptionsTable.appointmentId, parsedInput.appointmentId),
          eq(prescriptionsTable.clinicId, clinicId),
        ),
      );

    if (existing) {
      await db.delete(prescriptionItemsTable).where(eq(prescriptionItemsTable.prescriptionId, existing.id));
    }

    const prescriptionData = {
      appointmentId: parsedInput.appointmentId,
      patientId: parsedInput.patientId,
      doctorId: parsedInput.doctorId,
      clinicId,
      additionalInstructions: parsedInput.additionalInstructions?.trim() || null,
    };

    let prescriptionId: string;

    if (existing) {
      await db
        .update(prescriptionsTable)
        .set(prescriptionData)
        .where(eq(prescriptionsTable.id, existing.id));
      prescriptionId = existing.id;
    } else {
      const [inserted] = await db
        .insert(prescriptionsTable)
        .values(prescriptionData)
        .returning({ id: prescriptionsTable.id });
      prescriptionId = inserted!.id;
    }

    await db.insert(prescriptionItemsTable).values(
      parsedInput.items.map((item, i) => ({
        prescriptionId,
        medication: item.medication.trim(),
        dosage: item.dosage.trim(),
        instructions: item.instructions?.trim() || null,
        displayOrder: i,
      })),
    );

    await createAuditLog(db, {
      clinicId,
      userId: ctx.user.id,
      userEmail: ctx.user.email,
      userName: ctx.user.name ?? undefined,
      action: "Prescrição atualizada",
      entityType: "prescription",
      entityId: prescriptionId,
    });

    revalidatePath("/patients");
    revalidatePath("/appointments");
  });
