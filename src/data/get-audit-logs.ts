import dayjs from "dayjs";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";

import { db } from "@/db";
import { auditLogTable } from "@/db/schema";

const DEFAULT_PAGE_SIZE = 20;

export async function getAuditLogsPaginated(
  clinicId: string,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  fromDate?: string,
  toDate?: string,
) {
  const offset = (Math.max(1, page) - 1) * pageSize;

  const baseWhere = eq(auditLogTable.clinicId, clinicId);
  const dateConditions = [];
  if (fromDate?.trim()) {
    dateConditions.push(
      gte(auditLogTable.createdAt, dayjs(fromDate).startOf("day").toDate()),
    );
  }
  if (toDate?.trim()) {
    dateConditions.push(
      lte(auditLogTable.createdAt, dayjs(toDate).endOf("day").toDate()),
    );
  }
  const where =
    dateConditions.length > 0 ? and(baseWhere, ...dateConditions) : baseWhere;

  const [logs, countResult] = await Promise.all([
    db.query.auditLogTable.findMany({
      where,
      orderBy: [desc(auditLogTable.createdAt)],
      limit: pageSize,
      offset,
      columns: {
        id: true,
        userEmail: true,
        userName: true,
        action: true,
        entityType: true,
        entityId: true,
        createdAt: true,
      },
    }),
    db.select({ count: sql<number>`count(*)::int` }).from(auditLogTable).where(where),
  ]);

  const totalCount = countResult[0]?.count ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return { logs, totalCount, totalPages, currentPage: page };
}

/** Busca todos os logs para exportação (período completo, sem paginação) */
export async function getAuditLogsForExport(
  clinicId: string,
  fromDate: string,
  toDate: string,
) {
  const baseWhere = eq(auditLogTable.clinicId, clinicId);
  const where = and(
    baseWhere,
    gte(auditLogTable.createdAt, dayjs(fromDate).startOf("day").toDate()),
    lte(auditLogTable.createdAt, dayjs(toDate).endOf("day").toDate()),
  );

  return db.query.auditLogTable.findMany({
    where,
    orderBy: [desc(auditLogTable.createdAt)],
    columns: {
      id: true,
      userEmail: true,
      userName: true,
      action: true,
      createdAt: true,
    },
  });
}
