"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { patientsTable } from "@/db/schema";
import { createAuditLog } from "@/lib/audit";
import { protectedWithClinicActionClient } from "@/lib/next-safe-action";

export const deletePatient = protectedWithClinicActionClient
  .schema(
    z.object({
      id: z.string().uuid(),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const patient = await db.query.patientsTable.findFirst({
      where: eq(patientsTable.id, parsedInput.id),
    });
    if (!patient) {
      throw new Error("Paciente não encontrado");
    }
    if (patient.clinicId !== ctx.user.clinic.id) {
      throw new Error("Paciente não encontrado");
    }
    await db.delete(patientsTable).where(eq(patientsTable.id, parsedInput.id));
    await createAuditLog(db, {
      clinicId: ctx.user.clinic.id,
      userId: ctx.user.id,
      userEmail: ctx.user.email,
      userName: ctx.user.name ?? undefined,
      action: `Paciente "${patient.name}" removido`,
      entityType: "patient",
      entityId: parsedInput.id,
    });
    revalidatePath("/patients");
  });
