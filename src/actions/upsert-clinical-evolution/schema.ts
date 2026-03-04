import { z } from "zod";

export const upsertClinicalEvolutionSchema = z.object({
  appointmentId: z.string().uuid(),
  subjective: z.string().optional(),
  objective: z.string().optional(),
  assessment: z.string().optional(),
  plan: z.string().optional(),
});
