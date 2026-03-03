import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import * as schema from "@/db/schema";
import { auditLogTable } from "@/db/schema";

type Db = NodePgDatabase<typeof schema>;

export type CreateAuditLogParams = {
  clinicId: string;
  userId: string;
  userEmail: string;
  userName?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
};

export async function createAuditLog(
  db: Db,
  params: CreateAuditLogParams,
): Promise<void> {
  await db.insert(auditLogTable).values({
    clinicId: params.clinicId,
    userId: params.userId,
    userEmail: params.userEmail,
    userName: params.userName ?? null,
    action: params.action,
    entityType: params.entityType ?? null,
    entityId: params.entityId ?? null,
  });
}
