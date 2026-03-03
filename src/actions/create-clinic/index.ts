"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "@/db";
import {
  appointmentTypesTable,
  clinicsTable,
  roomsTable,
  usersToClinicsTable,
} from "@/db/schema";
import { auth } from "@/lib/auth";

export const createClinic = async (name: string) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  const [clinic] = await db.insert(clinicsTable).values({ name }).returning();
  if (clinic) {
    await Promise.all([
      db.insert(appointmentTypesTable).values([
        { clinicId: clinic.id, name: "Primeira consulta", durationInMinutes: 60, priceInCents: 15000, displayOrder: 0 },
        { clinicId: clinic.id, name: "Retorno", durationInMinutes: 30, priceInCents: 8000, displayOrder: 1 },
        { clinicId: clinic.id, name: "Procedimento", durationInMinutes: 45, priceInCents: 12000, displayOrder: 2 },
      ]),
      db.insert(roomsTable).values([
        { clinicId: clinic.id, name: "Consultório 1", type: "room", displayOrder: 0 },
        { clinicId: clinic.id, name: "Consultório 2", type: "room", displayOrder: 1 },
      ]),
    ]);
  }
  await db.insert(usersToClinicsTable).values({
    userId: session.user.id,
    clinicId: clinic.id,
    role: "admin",
  });
  redirect("/dashboard");
};
