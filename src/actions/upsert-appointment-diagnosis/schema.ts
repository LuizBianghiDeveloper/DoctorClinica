import { z } from "zod";

export const upsertAppointmentDiagnosisSchema = z.object({
  appointmentId: z.string().uuid(),
  diagnoses: z.array(
    z.object({
      id: z.string().uuid().optional(),
      icdCode: z.string().min(1, "Código CID é obrigatório"),
      description: z.string().min(1, "Descrição é obrigatória"),
    }),
  ),
});
