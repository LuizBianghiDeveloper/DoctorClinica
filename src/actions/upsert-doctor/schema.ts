import { z } from "zod";

const dayScheduleSchema = z
  .object({
    weekDay: z.number().min(0).max(6),
    fromTime: z.string().min(1, { message: "Hora de início é obrigatória." }),
    toTime: z.string().min(1, { message: "Hora de término é obrigatória." }),
  })
  .refine((data) => data.fromTime < data.toTime, {
    message: "O horário de início deve ser anterior ao de término.",
    path: ["toTime"],
  });

export const upsertDoctorSchema = z
  .object({
    id: z.string().uuid().optional(),
    name: z.string().trim().min(1, {
      message: "Nome é obrigatório.",
    }),
    specialties: z
      .array(z.string().trim().min(1))
      .min(1, { message: "Adicione ao menos uma especialidade." }),
    appointmentPriceInCents: z.number().min(1, {
      message: "Preço da consulta é obrigatório.",
    }),
    commissionPercent: z
      .number()
      .min(0, { message: "Comissão deve ser 0 ou mais." })
      .max(100, { message: "Comissão deve ser no máximo 100%." })
      .optional()
      .nullable(),
    schedule: z
      .array(dayScheduleSchema)
      .min(1, { message: "Adicione ao menos um dia de trabalho." }),
  })
  .refine(
    (data) => {
      const days = new Set(data.schedule.map((s) => s.weekDay));
      return days.size === data.schedule.length;
    },
    { message: "Não pode haver mais de um horário por dia.", path: ["schedule"] },
  );

export type UpsertDoctorSchema = z.infer<typeof upsertDoctorSchema>;
