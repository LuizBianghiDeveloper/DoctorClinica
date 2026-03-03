"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import {
  doctorTimeBlocksTable,
  doctorsTable,
} from "@/db/schema";
import { createAuditLog } from "@/lib/audit";
import { protectedWithClinicActionClient } from "@/lib/next-safe-action";

export const deleteDoctorTimeBlock = protectedWithClinicActionClient
  .schema(
    z.object({
      id: z.string().uuid(),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const block = await db.query.doctorTimeBlocksTable.findFirst({
      where: eq(doctorTimeBlocksTable.id, parsedInput.id),
      with: { doctor: true },
    });
    if (!block || block.doctor.clinicId !== ctx.user.clinic.id) {
      throw new Error("Bloqueio não encontrado");
    }
    await db
      .delete(doctorTimeBlocksTable)
      .where(eq(doctorTimeBlocksTable.id, parsedInput.id));
    await createAuditLog(db, {
      clinicId: ctx.user.clinic.id,
      userId: ctx.user.id,
      userEmail: ctx.user.email,
      userName: ctx.user.name ?? undefined,
      action: `Bloqueio de horário removido do profissional "${block.doctor.name}"`,
      entityType: "doctor_time_block",
      entityId: parsedInput.id,
    });
    revalidatePath("/doctors");
    revalidatePath(`/doctors/${block.doctorId}/editar`);
  });
