"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { appointmentsTable, clinicalEvolutionsTable } from "@/db/schema";
import { createAuditLog } from "@/lib/audit";
import { protectedWithClinicActionClient } from "@/lib/next-safe-action";

import { upsertClinicalEvolutionSchema } from "./schema";

export const upsertClinicalEvolution = protectedWithClinicActionClient
  .schema(upsertClinicalEvolutionSchema)
  .action(async ({ parsedInput, ctx }) => {
    const clinicId = ctx.user.clinic.id;

    const data = {
      subjective: parsedInput.subjective?.trim() || null,
      objective: parsedInput.objective?.trim() || null,
      assessment: parsedInput.assessment?.trim() || null,
      plan: parsedInput.plan?.trim() || null,
    };

    const existingEvolution = await db.query.clinicalEvolutionsTable.findFirst({
      where: eq(clinicalEvolutionsTable.appointmentId, parsedInput.appointmentId),
    });

    const [appointment] = await db
      .select({ id: appointmentsTable.id })
      .from(appointmentsTable)
      .where(
        and(
          eq(appointmentsTable.id, parsedInput.appointmentId),
          eq(appointmentsTable.clinicId, clinicId),
        ),
      );

    if (!appointment) throw new Error("Agendamento não encontrado");

    if (existingEvolution) {
      await db
        .update(clinicalEvolutionsTable)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(clinicalEvolutionsTable.id, existingEvolution.id));
    } else {
      await db.insert(clinicalEvolutionsTable).values({
        appointmentId: parsedInput.appointmentId,
        ...data,
      });
    }

    await createAuditLog(db, {
      clinicId,
      userId: ctx.user.id,
      userEmail: ctx.user.email,
      userName: ctx.user.name ?? undefined,
      action: "Evolução clínica atualizada",
      entityType: "appointment",
      entityId: parsedInput.appointmentId,
    });

    revalidatePath("/patients");
    revalidatePath("/appointments");
  });
