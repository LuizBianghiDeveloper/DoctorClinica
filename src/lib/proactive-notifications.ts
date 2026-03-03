/**
 * Notificações proativas: lembrete 24h, confirmação de presença, parabéns aniversário.
 * Executado via cron (vercel.json) ou chamada manual ao API /api/cron/notifications.
 */

import { randomUUID } from "node:crypto";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { and, eq, gte, isNull, lte, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  appointmentsTable,
  notificationLogTable,
  patientsTable,
} from "@/db/schema";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

export interface NotificationResult {
  reminders: { sent: number; failed: number };
  birthdays: { sent: number; failed: number };
}

/** Envia lembrete 24h antes + link de confirmação para agendamentos elegíveis. */
async function sendAppointmentReminders(): Promise<{ sent: number; failed: number }> {
  const now = new Date();
  const in24h = new Date(now.getTime() + 23 * 60 * 60 * 1000);
  const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  const rows = await db
    .select({
      appointment: appointmentsTable,
      patient: patientsTable,
    })
    .from(appointmentsTable)
    .innerJoin(patientsTable, eq(appointmentsTable.patientId, patientsTable.id))
    .where(
      and(
        eq(appointmentsTable.status, "scheduled"),
        isNull(appointmentsTable.reminderSentAt),
        gte(appointmentsTable.date, in24h),
        lte(appointmentsTable.date, in25h),
      ),
    );

  let sent = 0;
  let failed = 0;

  for (const row of rows) {
    const appointment = row.appointment;
    const patient = row.patient;
    if (!patient.phoneNumber?.trim()) continue;

    const clinic = await db.query.clinicsTable.findFirst({
      where: (t, { eq }) => eq(t.id, appointment.clinicId),
      columns: { name: true },
    });
    const clinicName = clinic?.name ?? "nossa clínica";

    const confirmationToken = randomUUID();
    const confirmUrl = `${baseUrl}/confirmar-presenca?token=${confirmationToken}`;

    const dateFormatted = format(new Date(appointment.date), "EEEE, dd/MM/yyyy", {
      locale: ptBR,
    });
    const timeFormatted = format(new Date(appointment.date), "HH:mm", {
      locale: ptBR,
    });
    const patientName = patient.name.split(" ")[0] ?? patient.name;

    const body = `Olá ${patientName}! Lembrete: sua consulta é ${dateFormatted} às ${timeFormatted} na ${clinicName}.\n\nConfirme sua presença clicando aqui: ${confirmUrl}\n\nAté lá! 🙂`;

    const result = await sendWhatsAppMessage(patient.phoneNumber, body);

    if (result.success) {
      await db
        .update(appointmentsTable)
        .set({
          reminderSentAt: new Date(),
          confirmationToken,
        })
        .where(eq(appointmentsTable.id, appointment.id));
      sent++;
    } else {
      failed++;
      console.error("[ProactiveNotifications] Reminder failed:", result.error);
    }
  }

  return { sent, failed };
}

/** Envia parabéns de aniversário para pacientes que fazem aniversário hoje. */
async function sendBirthdayMessages(): Promise<{ sent: number; failed: number }> {
  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();

  const allPatients = await db
    .select()
    .from(patientsTable)
    .where(
      and(
        sql`EXTRACT(MONTH FROM ${patientsTable.birthDate}) = ${month}`,
        sql`EXTRACT(DAY FROM ${patientsTable.birthDate}) = ${day}`,
      ),
    );

  const patients = allPatients.filter(
    (p) => p.phoneNumber?.trim(),
  );

  let sent = 0;
  let failed = 0;
  const todayStr = format(today, "yyyy-MM-dd");

  for (const patient of patients) {
    const alreadySent = await db
      .select()
      .from(notificationLogTable)
      .where(
        and(
          eq(notificationLogTable.type, "birthday"),
          eq(notificationLogTable.referenceId, patient.id),
          sql`${notificationLogTable.sentAt}::date = ${todayStr}::date`,
        ),
      );

    if (alreadySent.length > 0) continue;

    const clinic = await db.query.clinicsTable.findFirst({
      where: (t, { eq }) => eq(t.id, patient.clinicId),
      columns: { name: true },
    });
    const clinicName = clinic?.name ?? "nossa clínica";

    const patientName = patient.name.split(" ")[0] ?? patient.name;
    const body = `Olá ${patientName}! A equipe da ${clinicName} deseja um feliz aniversário! 🎂🎉 Que este dia seja repleto de alegria e saúde. Parabéns!`;

    const result = await sendWhatsAppMessage(patient.phoneNumber, body);

    if (result.success) {
      await db.insert(notificationLogTable).values({
        clinicId: patient.clinicId,
        type: "birthday",
        referenceId: patient.id,
      });
      sent++;
    } else {
      failed++;
      console.error("[ProactiveNotifications] Birthday failed:", result.error);
    }
  }

  return { sent, failed };
}

export async function runProactiveNotifications(): Promise<NotificationResult> {
  const [reminders, birthdays] = await Promise.all([
    sendAppointmentReminders(),
    sendBirthdayMessages(),
  ]);

  return {
    reminders,
    birthdays,
  };
}
