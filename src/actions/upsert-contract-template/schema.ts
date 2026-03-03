import { z } from "zod";

export const upsertContractTemplateSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Nome é obrigatório."),
  content: z.string().min(1, "Conteúdo é obrigatório."),
});
