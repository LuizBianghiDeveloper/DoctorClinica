"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import {
  doctorTimeBlocksTable,
  doctorsTable,
} from "@/db/schema";
import { createAuditLog } from "@/lib/audit";
import { protectedWithClinicActionClient } from "@/lib/next-safe-action";

import { upsertDoctorTimeBlockSchema } from "./schema";

function toTimeString(value: string): string {
  const parts = value.split(":");
  const h = parts[0]?.padStart(2, "0") ?? "00";
  const m = parts[1]?.padStart(2, "0") ?? "00";
  const s = parts[2]?.padStart(2, "0") ?? "00";
  return `${h}:${m}:${s}`;
}

export const upsertDoctorTimeBlock = protectedWithClinicActionClient
  .schema(upsertDoctorTimeBlockSchema)
  .action(async ({ parsedInput, ctx }) => {
    const doctor = await db.query.doctorsTable.findFirst({
      where: eq(doctorsTable.id, parsedInput.doctorId),
    });
    if (!doctor || doctor.clinicId !== ctx.user.clinic.id) {
      throw new Error("Profissional não encontrado");
    }

    const typeLabels = {
      interval: "Intervalo",
      lunch: "Almoço",
      day_off: "Folga",
    };

    if (parsedInput.id) {
      await db
        .update(doctorTimeBlocksTable)
        .set({
          type: parsedInput.type,
          weekDay: parsedInput.weekDay,
          blockDate: parsedInput.blockDate,
          fromTime: toTimeString(parsedInput.fromTime),
          toTime: toTimeString(parsedInput.toTime),
        })
        .where(eq(doctorTimeBlocksTable.id, parsedInput.id));
      await createAuditLog(db, {
        clinicId: ctx.user.clinic.id,
        userId: ctx.user.id,
        userEmail: ctx.user.email,
        userName: ctx.user.name ?? undefined,
        action: `Bloqueio de horário (${typeLabels[parsedInput.type]}) do profissional "${doctor.name}" atualizado`,
        entityType: "doctor_time_block",
        entityId: parsedInput.id,
      });
    } else {
      await db.insert(doctorTimeBlocksTable).values({
        doctorId: parsedInput.doctorId,
        type: parsedInput.type,
        weekDay: parsedInput.weekDay,
        blockDate: parsedInput.blockDate,
        fromTime: toTimeString(parsedInput.fromTime),
        toTime: toTimeString(parsedInput.toTime),
      });
      await createAuditLog(db, {
        clinicId: ctx.user.clinic.id,
        userId: ctx.user.id,
        userEmail: ctx.user.email,
        userName: ctx.user.name ?? undefined,
        action: `Bloqueio de horário (${typeLabels[parsedInput.type]}) adicionado ao profissional "${doctor.name}"`,
        entityType: "doctor_time_block",
        entityId: parsedInput.doctorId,
      });
    }

    revalidatePath("/doctors");
    revalidatePath(`/doctors/${parsedInput.doctorId}/editar`);
  });
