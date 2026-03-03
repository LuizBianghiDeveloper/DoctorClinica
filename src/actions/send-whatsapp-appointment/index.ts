"use server";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { appointmentsTable } from "@/db/schema";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { protectedWithClinicActionClient } from "@/lib/next-safe-action";

import { z } from "zod";

const sendSchema = z.object({
  appointmentId: z.string().uuid(),
  type: z.enum(["confirmation", "reminder"]),
});

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
      if (parsedInput.type === "confirmation") {
        body = `Olá ${patientName}! Sua consulta foi agendada para ${dateFormatted} às ${timeFormatted} na ${clinicName}. Até lá! 🙂`;
      } else {
        body = `Olá ${patientName}! Lembrete: sua consulta é ${dateFormatted} às ${timeFormatted} na ${clinicName}. Até lá! 🙂`;
      }

      const result = await sendWhatsAppMessage(patientPhone, body);

      if (!result.success) {
        throw new Error(result.error);
      }

      return { success: true };
    },
  );
