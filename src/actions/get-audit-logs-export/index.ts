"use server";

import dayjs from "dayjs";
import { z } from "zod";

import { getAuditLogsForExport } from "@/data/get-audit-logs";
import { protectedWithClinicActionClient } from "@/lib/next-safe-action";

const schema = z.object({
  from: z.string().min(1, "Data inicial é obrigatória."),
  to: z.string().min(1, "Data final é obrigatória."),
});

export const getAuditLogsExportAction =
  protectedWithClinicActionClient.schema(schema).action(
    async ({ parsedInput, ctx }) => {
      const userRole = (ctx.user as { role?: string }).role;
      if (userRole !== "admin") {
        throw new Error("Apenas administradores podem exportar auditoria.");
      }

      const logs = await getAuditLogsForExport(
        ctx.user.clinic.id,
        parsedInput.from,
        parsedInput.to,
      );

      return logs.map((log) => ({
        data: dayjs(log.createdAt).format("DD/MM/YYYY HH:mm"),
        alteracao: log.action,
        usuario: log.userName?.trim() || log.userEmail,
      }));
    },
  );
