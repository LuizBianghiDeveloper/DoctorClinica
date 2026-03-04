import { z } from "zod";

export const upsertPatientExamSchema = z.object({
  id: z.string().uuid().optional(),
  appointmentId: z.string().uuid(),
  patientId: z.string().uuid(),
  name: z.string().min(1, "Nome do exame é obrigatório"),
  status: z.enum(["requested", "pending", "done", "cancelled"]).optional(),
  resultNotes: z.string().optional(),
});
