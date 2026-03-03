import { z } from "zod";

export const upsertDoctorTimeBlockSchema = z
  .object({
    id: z.string().uuid().optional(),
    doctorId: z.string().uuid(),
    type: z.enum(["interval", "lunch", "day_off"]),
    weekDay: z.number().min(0).max(6).nullable(),
    blockDate: z.string().date().nullable(),
    fromTime: z.string().min(1),
    toTime: z.string().min(1),
  })
  .refine(
    (data) =>
      (data.weekDay != null && data.blockDate == null) ||
      (data.weekDay == null && data.blockDate != null),
    {
      message:
        "Informe o dia da semana (recorrente) ou a data específica (única).",
      path: ["weekDay"],
    },
  )
  .refine((data) => data.fromTime < data.toTime, {
    message: "O horário de início deve ser anterior ao de término.",
    path: ["toTime"],
  });
