import { eq } from "drizzle-orm";

import { db } from "@/db";
import { roomsTable } from "@/db/schema";

export async function getRooms(clinicId: string) {
  return db.query.roomsTable.findMany({
    where: eq(roomsTable.clinicId, clinicId),
    orderBy: (r, { asc }) => [asc(r.displayOrder), asc(r.name)],
  });
}
