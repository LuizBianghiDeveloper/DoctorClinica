import { z } from "zod";

const businessHoursItemSchema = z.object({
  weekDay: z.number().min(0).max(6),
  openTime: z.string().regex(/^\d{1,2}:\d{2}(?::\d{2})?$/),
  closeTime: z.string().regex(/^\d{1,2}:\d{2}(?::\d{2})?$/),
  isClosed: z.boolean(),
});

export const upsertClinicSchema = z.object({
  name: z.string().trim().min(1, { message: "Nome é obrigatório" }),
  address: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  cnpj: z.string().trim().optional(),
  website: z.string().trim().optional(),
  logoUrl: z.string().trim().optional(),
  primaryColor: z
    .string()
    .trim()
    .optional()
    .refine(
      (v) => !v || /^#[0-9A-Fa-f]{6}$/.test(v ?? ""),
      { message: "Cor deve ser em formato hexadecimal (ex: #4f46e5)" },
    ),
  secondaryColor: z
    .string()
    .trim()
    .optional()
    .refine(
      (v) => !v || /^#[0-9A-Fa-f]{6}$/.test(v ?? ""),
      { message: "Cor deve ser em formato hexadecimal (ex: #06b6d4)" },
    ),
  businessHours: z.array(businessHoursItemSchema).length(7),
});

export type UpsertClinicInput = z.infer<typeof upsertClinicSchema>;
