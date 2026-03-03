import { z } from "zod";

/** Dias da semana (0 = domingo, 1 = segunda, ..., 6 = sábado). */
const weekDaySchema = z.number().min(0).max(6);

export const addAppointmentSchema = z.object({
  patientId: z.string().uuid({
    message: "Paciente é obrigatório.",
  }),
  doctorId: z.string().uuid({
    message: "Profissional é obrigatório.",
  }),
  appointmentTypeId: z.string().uuid().optional().nullable(),
  date: z.date({
    message: "Data é obrigatória.",
  }),
  time: z.string().min(1, {
    message: "Horário é obrigatório.",
  }),
  durationInMinutes: z.number().min(15).max(240).default(30),
  appointmentPriceInCents: z.number().min(1, {
    message: "Valor da consulta é obrigatório.",
  }),
  /** Número de consultas da série. 1 = apenas uma consulta; 2–260 = série. */
  recurrenceCount: z.number().min(1).max(260).optional().default(1),
  /** Em quais dias da semana repetir (0–6). Se vazio quando count > 1, usa o dia da data selecionada. */
  recurrenceWeekDays: z.array(weekDaySchema).optional(),
  /** Intervalo em semanas: 1 = toda semana, 2 = semana sim, semana não. */
  recurrenceIntervalWeeks: z.union([z.literal(1), z.literal(2)]).optional().default(1),
  /** Sala ou recurso (consultório, equipamento). Opcional. */
  roomId: z.string().uuid().optional().nullable(),
  /** Enviar confirmação por WhatsApp ao criar. */
  sendWhatsAppConfirmation: z.boolean().optional().default(false),
});
