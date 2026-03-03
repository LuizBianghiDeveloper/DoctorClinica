"use server";

import dayjs from "dayjs";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { appointmentsTable, patientsTable } from "@/db/schema";
import { createAuditLog } from "@/lib/audit";
import { protectedWithClinicActionClient } from "@/lib/next-safe-action";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

import {
  getAvailableSlotsForDoctorAndDate,
  normalizeTimeToHHMMSS,
} from "@/data/get-available-slots";
import { addAppointmentSchema } from "./schema";

const createOneAppointment = async (
  parsedInput: {
    patientId: string;
    doctorId: string;
    appointmentTypeId?: string;
    roomId?: string | null;
    time: string;
    durationInMinutes: number;
    appointmentPriceInCents: number;
  },
  ctx: {
    user: {
      clinic: { id: string; name?: string };
      id: string;
      email: string;
      name?: string | null;
    };
  },
  date: Date,
) => {
  const appointmentDateTime = dayjs(date)
    .set("hour", parseInt(parsedInput.time.split(":")[0]))
    .set("minute", parseInt(parsedInput.time.split(":")[1]))
    .toDate();
  const endDateTime = dayjs(appointmentDateTime)
    .add(parsedInput.durationInMinutes ?? 30, "minute")
    .toDate();

  const [inserted] = await db
    .insert(appointmentsTable)
    .values({
      patientId: parsedInput.patientId,
      doctorId: parsedInput.doctorId,
      appointmentTypeId: parsedInput.appointmentTypeId ?? null,
      roomId: parsedInput.roomId ?? null,
      appointmentPriceInCents: parsedInput.appointmentPriceInCents,
      status: "scheduled",
      clinicId: ctx.user.clinic.id,
      date: appointmentDateTime,
      endDate: endDateTime,
      notes: null,
    })
    .returning({ id: appointmentsTable.id });

  await createAuditLog(db, {
    clinicId: ctx.user.clinic.id,
    userId: ctx.user.id,
    userEmail: ctx.user.email,
    userName: ctx.user.name ?? undefined,
    action: "Agendamento criado",
    entityType: "appointment",
    entityId: inserted?.id,
  });
};

/** Gera as datas da série: múltiplos dias da semana (ex.: seg e qua) e intervalo 1 ou 2 semanas. */
function generateRecurrenceDates(
  startDate: Date,
  recurrenceCount: number,
  recurrenceWeekDays: number[] | undefined,
  recurrenceIntervalWeeks: 1 | 2,
): Date[] {
  const start = dayjs(startDate).startOf("day");
  const weekdays =
    (recurrenceWeekDays?.length ?? 0) > 0
      ? [...(recurrenceWeekDays ?? [])].sort((a, b) => a - b)
      : [start.day()]; // 0=dom, 1=seg, ..., 6=sáb
  const mondayOfStart = start.day(1); // segunda-feira da semana da data inicial
  const dates: Date[] = [];
  const maxIterations =
    recurrenceCount * Math.max(weekdays.length, 1) * recurrenceIntervalWeeks +
    50;
  let i = 0;
  while (dates.length < recurrenceCount) {
    const weekBlock = Math.floor(i / weekdays.length);
    const dayIndex = i % weekdays.length;
    const weekOffset = weekBlock * recurrenceIntervalWeeks;
    const d = weekdays[dayIndex]!;
    const candidate = mondayOfStart
      .add(weekOffset, "week")
      .day(d)
      .startOf("day")
      .toDate();
    if (candidate >= start.toDate()) {
      dates.push(candidate);
    }
    i++;
    if (i > maxIterations) break; // proteção
  }
  return dates.slice(0, recurrenceCount);
}

export const addAppointment = protectedWithClinicActionClient
  .schema(addAppointmentSchema)
  .action(async ({ parsedInput, ctx }) => {
    const count = parsedInput.recurrenceCount ?? 1;
    const intervalWeeks = parsedInput.recurrenceIntervalWeeks ?? 1;
    const startDate = parsedInput.date;

    const dates =
      count > 1
        ? generateRecurrenceDates(
            startDate,
            count,
            parsedInput.recurrenceWeekDays,
            intervalWeeks,
          )
        : [dayjs(startDate).startOf("day").toDate()];

    let firstAppointmentDate: Date | undefined;

    for (const date of dates) {
      const dateStr = dayjs(date).format("YYYY-MM-DD");

      const availableSlots = await getAvailableSlotsForDoctorAndDate(
        parsedInput.doctorId,
        dateStr,
        parsedInput.roomId ?? undefined,
      );
      const normalizedTime = normalizeTimeToHHMMSS(parsedInput.time);
      const slot = availableSlots.find((s) => s.value === normalizedTime);
      if (!slot || !slot.available) {
        throw new Error(
          `O horário ${parsedInput.time} não está disponível em ${dateStr}. Ajuste as datas ou escolha outro horário.`,
        );
      }

      await createOneAppointment(
        {
          patientId: parsedInput.patientId,
          doctorId: parsedInput.doctorId,
          appointmentTypeId: parsedInput.appointmentTypeId ?? undefined,
          roomId: parsedInput.roomId ?? undefined,
          time: parsedInput.time,
          durationInMinutes: parsedInput.durationInMinutes ?? 30,
          appointmentPriceInCents: parsedInput.appointmentPriceInCents,
        },
        ctx,
        date,
      );
      if (!firstAppointmentDate) firstAppointmentDate = date;
    }

    let whatsAppSent = false;
    let whatsAppError: string | undefined;

    if (parsedInput.sendWhatsAppConfirmation && firstAppointmentDate) {
      const [patient] = await db
        .select({ phoneNumber: patientsTable.phoneNumber, name: patientsTable.name })
        .from(patientsTable)
        .where(eq(patientsTable.id, parsedInput.patientId))
        .limit(1);

      if (patient?.phoneNumber?.trim()) {
        const clinicName = ctx.user.clinic.name ?? "nossa clínica";
        const dateFormatted = format(
          firstAppointmentDate,
          "EEEE, dd/MM/yyyy",
          { locale: ptBR },
        );
        const timeFormatted = parsedInput.time.slice(0, 5);
        const patientName = patient.name.split(" ")[0] ?? patient.name;
        const body = `Olá ${patientName}! Sua consulta foi agendada para ${dateFormatted} às ${timeFormatted} na ${clinicName}. Até lá! 🙂`;

        const result = await sendWhatsAppMessage(patient.phoneNumber, body);
        if (result.success) {
          whatsAppSent = true;
        } else {
          whatsAppError = result.error;
        }
      }
    }

    revalidatePath("/appointments");
    revalidatePath("/dashboard");

    return { whatsAppSent, whatsAppError };
  });
