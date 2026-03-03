"use server";

import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import utc from "dayjs/plugin/utc";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import {
  doctorAvailabilityTable,
  doctorSpecialtiesTable,
  doctorsTable,
} from "@/db/schema";
import { createAuditLog } from "@/lib/audit";
import { protectedWithClinicActionClient } from "@/lib/next-safe-action";

import { upsertDoctorSchema } from "./schema";

dayjs.extend(utc);
dayjs.extend(customParseFormat);

const TIME_REGEX = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;

/** Garante valor no formato HH:mm:ss para o banco (evita "Invalid Date"). */
function toTimeString(value: string | Date | null | undefined): string {
  if (value == null || value === "") return "08:00:00";
  const str = typeof value === "string" ? value : value.toString();
  const match = str.match(TIME_REGEX);
  if (match) {
    const [, h, m, s] = match;
    return `${Number(h)!.toString().padStart(2, "0")}:${m}:${(s ?? "00").padStart(2, "0")}`;
  }
  const parsed = dayjs(str, ["HH:mm:ss", "H:mm:ss", "HH:mm", "H:mm"], true);
  if (parsed.isValid()) return parsed.format("HH:mm:ss");
  return "08:00:00";
}

export const upsertDoctor = protectedWithClinicActionClient
  .schema(upsertDoctorSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { schedule, ...doctorData } = parsedInput;
    const clinicId = ctx.user.clinic.id;

    const weekDays = schedule.map((s) => s.weekDay);
    const allFromTimes = schedule.map((s) => s.fromTime);
    const allToTimes = schedule.map((s) => s.toTime);
    const availableFromWeekDay = Math.min(...weekDays);
    const availableToWeekDay = Math.max(...weekDays);
    const availableFromTime = allFromTimes.sort()[0]!;
    const availableToTime = allToTimes.sort().reverse()[0]!;

    const availableFromTimeStr = toTimeString(availableFromTime);
    const availableToTimeStr = toTimeString(availableToTime);

    let doctorId: string;

    const { specialties, commissionPercent: rawCommission, ...restDoctorData } = doctorData;
    const commissionPercent =
      rawCommission != null && rawCommission > 0 ? rawCommission : null;

    if (parsedInput.id) {
      doctorId = parsedInput.id;
      await db
        .update(doctorsTable)
        .set({
          ...restDoctorData,
          commissionPercent,
          availableFromWeekDay,
          availableToWeekDay,
          availableFromTime: availableFromTimeStr,
          availableToTime: availableToTimeStr,
        })
        .where(eq(doctorsTable.id, doctorId));
      await createAuditLog(db, {
        clinicId,
        userId: ctx.user.id,
        userEmail: ctx.user.email,
        userName: ctx.user.name ?? undefined,
        action: `Profissional "${doctorData.name}" atualizado`,
        entityType: "doctor",
        entityId: doctorId,
      });
    } else {
      const [inserted] = await db
        .insert(doctorsTable)
        .values({
          ...restDoctorData,
          commissionPercent,
          clinicId,
          availableFromWeekDay,
          availableToWeekDay,
          availableFromTime: availableFromTimeStr,
          availableToTime: availableToTimeStr,
        })
        .returning({ id: doctorsTable.id });
      if (!inserted?.id) throw new Error("Erro ao salvar profissional.");
      doctorId = inserted.id;
      await createAuditLog(db, {
        clinicId,
        userId: ctx.user.id,
        userEmail: ctx.user.email,
        userName: ctx.user.name ?? undefined,
        action: `Profissional "${doctorData.name}" criado`,
        entityType: "doctor",
        entityId: doctorId,
      });
    }

    await Promise.all([
      db.delete(doctorAvailabilityTable).where(
        eq(doctorAvailabilityTable.doctorId, doctorId),
      ),
      db.delete(doctorSpecialtiesTable).where(
        eq(doctorSpecialtiesTable.doctorId, doctorId),
      ),
    ]);

    if (specialties.length > 0) {
      await db.insert(doctorSpecialtiesTable).values(
        specialties.map((specialty, i) => ({
          doctorId,
          specialty,
          displayOrder: i,
        })),
      );
    }

    if (schedule.length > 0) {
      await db.insert(doctorAvailabilityTable).values(
        schedule.map((s) => ({
          doctorId,
          weekDay: s.weekDay,
          fromTime: toTimeString(s.fromTime),
          toTime: toTimeString(s.toTime),
        })),
      );
    }

    revalidatePath("/doctors");
  });
