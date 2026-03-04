import { z } from "zod";

export const deletePatientExamSchema = z.object({
  examId: z.string().uuid(),
});
