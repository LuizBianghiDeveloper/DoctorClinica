"use server";

import { randomUUID } from "node:crypto";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { appointmentsTable } from "@/db/schema";
import { protectedWithClinicActionClient } from "@/lib/next-safe-action";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

const sendSchema = z.object({
  appointmentId: z.string().uuid(),
  type: z.enum(["confirmation", "reminder"]),
});

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

export const sendWhatsAppAppointment =
  protectedWithClinicActionClient.schema(sendSchema).action(
    async ({ parsedInput, ctx }) => {
      const appointment = await db.query.appointmentsTable.findFirst({
        where: eq(appointmentsTable.id, parsedInput.appointmentId),
        with: {
          patient: true,
          doctor: { with: { specialties: true } },
          clinic: true,
        },
      });

      if (!appointment) {
        throw new Error("Agendamento não encontrado.");
      }
      if (appointment.clinicId !== ctx.user.clinic?.id) {
        throw new Error("Agendamento não encontrado.");
      }

      const patientPhone = appointment.patient.phoneNumber;
      if (!patientPhone?.trim()) {
        throw new Error("Paciente não possui número de telefone cadastrado.");
      }

      const clinicName = appointment.clinic?.name ?? "nossa clínica";
      const dateFormatted = format(
        new Date(appointment.date),
        "EEEE, dd/MM/yyyy",
        { locale: ptBR },
      );
      const timeFormatted = format(new Date(appointment.date), "HH:mm", {
        locale: ptBR,
      });
      const patientName = appointment.patient.name.split(" ")[0] ?? appointment.patient.name;

      let body: string;
      let token: string | null = null;
      if (parsedInput.type === "confirmation") {
        body = `Olá ${patientName}! Sua consulta foi agendada para ${dateFormatted} às ${timeFormatted} na ${clinicName}. Até lá! 🙂`;
      } else {
        token = randomUUID();
        const confirmUrl = `${baseUrl}/confirmar-presenca?token=${token}`;
        body = `Olá ${patientName}! Lembrete: sua consulta é ${dateFormatted} às ${timeFormatted} na ${clinicName}.\n\nConfirme sua presença clicando aqui: ${confirmUrl}\n\nAté lá! 🙂`;
      }

      const result = await sendWhatsAppMessage(patientPhone, body);

      if (!result.success) {
        throw new Error(result.error);
      }

      if (parsedInput.type === "reminder" && token) {
        await db
          .update(appointmentsTable)
          .set({
            reminderSentAt: new Date(),
            confirmationToken: token,
          })
          .where(eq(appointmentsTable.id, appointment.id));
      }

      return { success: true };
    },
  );
