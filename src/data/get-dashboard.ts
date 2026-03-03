import dayjs from "dayjs";
import { and, count, desc, eq, gte, lte, sql, sum } from "drizzle-orm";

import { db } from "@/db";
import {
  appointmentsTable,
  doctorsTable,
  patientsTable,
} from "@/db/schema";

interface Params {
  from: string;
  to: string;
  session: {
    user: {
      clinic: {
        id: string;
      };
      role?: "admin" | "user";
    };
  };
}

export const getDashboard = async ({ from, to, session }: Params) => {
  const chartStartDate = dayjs().subtract(10, "days").startOf("day").toDate();
  const chartEndDate = dayjs().add(10, "days").endOf("day").toDate();
  const today = dayjs();
  const currentMonth = today.month() + 1;
  const currentDay = today.date();

  const isAdmin = session.user.role === "admin";

  const [
    [totalRevenue],
    [totalAppointments],
    [totalPatients],
    [totalDoctors],
    topDoctors,
    todayBirthdays,
    todayAppointments,
    dailyAppointmentsData,
  ] = await Promise.all([
    db
      .select({
        total: sum(appointmentsTable.appointmentPriceInCents),
      })
      .from(appointmentsTable)
      .where(
        and(
          eq(appointmentsTable.clinicId, session.user.clinic.id),
          gte(appointmentsTable.date, new Date(from)),
          lte(appointmentsTable.date, new Date(to)),
        ),
      ),
    db
      .select({
        total: count(),
      })
      .from(appointmentsTable)
      .where(
        and(
          eq(appointmentsTable.clinicId, session.user.clinic.id),
          gte(appointmentsTable.date, new Date(from)),
          lte(appointmentsTable.date, new Date(to)),
        ),
      ),
    db
      .select({
        total: count(),
      })
      .from(patientsTable)
      .where(eq(patientsTable.clinicId, session.user.clinic.id)),
    db
      .select({
        total: count(),
      })
      .from(doctorsTable)
      .where(eq(doctorsTable.clinicId, session.user.clinic.id)),
    db
      .select({
        id: doctorsTable.id,
        name: doctorsTable.name,
        avatarImageUrl: doctorsTable.avatarImageUrl,
        specialty: sql<string>`(
          SELECT string_agg(specialty, ', ' ORDER BY display_order)
          FROM doctor_specialties
          WHERE doctor_id = ${doctorsTable.id}
        )`.as("specialty"),
        appointments: count(appointmentsTable.id),
      })
      .from(doctorsTable)
      .leftJoin(
        appointmentsTable,
        and(
          eq(appointmentsTable.doctorId, doctorsTable.id),
          gte(appointmentsTable.date, new Date(from)),
          lte(appointmentsTable.date, new Date(to)),
        ),
      )
      .where(eq(doctorsTable.clinicId, session.user.clinic.id))
      .groupBy(doctorsTable.id, doctorsTable.name, doctorsTable.avatarImageUrl)
      .orderBy(desc(count(appointmentsTable.id)))
      .limit(10),
    db.query.patientsTable.findMany({
      where: and(
        eq(patientsTable.clinicId, session.user.clinic.id),
        sql`EXTRACT(MONTH FROM ${patientsTable.birthDate}) = ${currentMonth}`,
        sql`EXTRACT(DAY FROM ${patientsTable.birthDate}) = ${currentDay}`,
      ),
      columns: {
        id: true,
        name: true,
        birthDate: true,
        phoneNumber: true,
      },
    }),
    db.query.appointmentsTable.findMany({
      where: and(
        eq(appointmentsTable.clinicId, session.user.clinic.id),
        gte(appointmentsTable.date, today.startOf("day").toDate()),
        lte(appointmentsTable.date, today.endOf("day").toDate()),
      ),
      with: {
        patient: true,
        doctor: { with: { specialties: true } },
        appointmentType: true,
      },
    }),
    db
      .select({
        date: sql<string>`DATE(${appointmentsTable.date})`.as("date"),
        appointments: count(appointmentsTable.id),
        revenue:
          sql<number>`COALESCE(SUM(${appointmentsTable.appointmentPriceInCents}), 0)`.as(
            "revenue",
          ),
      })
      .from(appointmentsTable)
      .where(
        and(
          eq(appointmentsTable.clinicId, session.user.clinic.id),
          gte(appointmentsTable.date, chartStartDate),
          lte(appointmentsTable.date, chartEndDate),
        ),
      )
      .groupBy(sql`DATE(${appointmentsTable.date})`)
      .orderBy(sql`DATE(${appointmentsTable.date})`),
  ]);
  return {
    totalRevenue: isAdmin ? totalRevenue : null,
    totalAppointments,
    totalPatients,
    totalDoctors,
    topDoctors,
    todayBirthdays,
    todayAppointments,
    dailyAppointmentsData,
  };
};
