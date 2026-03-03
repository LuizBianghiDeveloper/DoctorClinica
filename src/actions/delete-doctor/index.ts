"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { doctorsTable } from "@/db/schema";
import { createAuditLog } from "@/lib/audit";
import { protectedWithClinicActionClient } from "@/lib/next-safe-action";

export const deleteDoctor = protectedWithClinicActionClient
  .schema(
    z.object({
      id: z.string().uuid(),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const doctor = await db.query.doctorsTable.findFirst({
      where: eq(doctorsTable.id, parsedInput.id),
    });
    if (!doctor) {
      throw new Error("Profissional não encontrado");
    }
    if (doctor.clinicId !== ctx.user.clinic.id) {
      throw new Error("Profissional não encontrado");
    }
    await db.delete(doctorsTable).where(eq(doctorsTable.id, parsedInput.id));
    await createAuditLog(db, {
      clinicId: ctx.user.clinic.id,
      userId: ctx.user.id,
      userEmail: ctx.user.email,
      userName: ctx.user.name ?? undefined,
      action: `Profissional "${doctor.name}" removido`,
      entityType: "doctor",
      entityId: parsedInput.id,
    });
    revalidatePath("/doctors");
  });
