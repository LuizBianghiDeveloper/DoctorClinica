import { z } from "zod";

const prescriptionItemSchema = z.object({
  medication: z.string().min(1, "Medicamento é obrigatório"),
  dosage: z.string().min(1, "Dosagem é obrigatória"),
  instructions: z.string().optional(),
});

export const upsertPrescriptionSchema = z.object({
  appointmentId: z.string().uuid(),
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  additionalInstructions: z.string().optional(),
  items: z.array(prescriptionItemSchema).min(1, "Adicione pelo menos um medicamento"),
});

export type UpsertPrescriptionInput = z.infer<typeof upsertPrescriptionSchema>;
