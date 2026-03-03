import dayjs from "dayjs";
import { and, asc, eq, gte, lte, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  appointmentsTable,
  appointmentTypesTable,
  doctorsTable,
  patientsTable,
  revenueGoalsTable,
} from "@/db/schema";

/** Faturamento por período – receita bruta (total, mensal, anual) */
export async function getRevenueByPeriodReport(
  clinicId: string,
  fromDate: string,
  toDate: string,
  groupBy: "day" | "month" | "year",
) {
  const dateFormat =
    groupBy === "day"
      ? sql<string>`TO_CHAR(${appointmentsTable.date}, 'YYYY-MM-DD')`
      : groupBy === "month"
        ? sql<string>`TO_CHAR(${appointmentsTable.date}, 'YYYY-MM')`
        : sql<string>`TO_CHAR(${appointmentsTable.date}, 'YYYY')`;

  const rows = await db
    .select({
      period: dateFormat.as("period"),
      revenue: sql<number>`COALESCE(SUM(${appointmentsTable.appointmentPriceInCents}), 0)`.as(
        "revenue",
      ),
      count: sql<number>`COUNT(*)::int`.as("count"),
    })
    .from(appointmentsTable)
    .where(
      and(
        eq(appointmentsTable.clinicId, clinicId),
        eq(appointmentsTable.status, "completed"),
        gte(appointmentsTable.date, dayjs(fromDate).startOf("day").toDate()),
        lte(appointmentsTable.date, dayjs(toDate).endOf("day").toDate()),
      ),
    )
    .groupBy(dateFormat)
    .orderBy(dateFormat);

  return rows;
}

/** Faturamento por profissional (com comissão para relatório e fechamento) */
export async function getRevenueByDoctorReport(
  clinicId: string,
  fromDate: string,
  toDate: string,
) {
  const rows = await db
    .select({
      doctorId: doctorsTable.id,
      doctorName: doctorsTable.name,
      commissionPercent: doctorsTable.commissionPercent,
      specialty: sql<string>`(
        SELECT string_agg(specialty, ', ' ORDER BY display_order)
        FROM doctor_specialties
        WHERE doctor_id = doctors.id
      )`.as("specialty"),
      revenue: sql<number>`COALESCE(SUM(${appointmentsTable.appointmentPriceInCents}), 0)`.as(
        "revenue",
      ),
      count: sql<number>`COUNT(*)::int`.as("count"),
    })
    .from(appointmentsTable)
    .innerJoin(doctorsTable, eq(appointmentsTable.doctorId, doctorsTable.id))
    .where(
      and(
        eq(appointmentsTable.clinicId, clinicId),
        eq(appointmentsTable.status, "completed"),
        gte(appointmentsTable.date, dayjs(fromDate).startOf("day").toDate()),
        lte(appointmentsTable.date, dayjs(toDate).endOf("day").toDate()),
      ),
    )
    .groupBy(doctorsTable.id, doctorsTable.name, doctorsTable.commissionPercent)
    .orderBy(sql`COALESCE(SUM(${appointmentsTable.appointmentPriceInCents}), 0) DESC`);

  return rows.map((row) => ({
    ...row,
    commissionInCents:
      row.commissionPercent != null && row.commissionPercent > 0
        ? Math.round(
            (Number(row.revenue) * row.commissionPercent) / 100,
          )
        : 0,
  }));
}

/** Faturamento por tipo de consulta */
export async function getRevenueByAppointmentTypeReport(
  clinicId: string,
  fromDate: string,
  toDate: string,
) {
  const rows = await db
    .select({
      typeId: appointmentTypesTable.id,
      typeName: appointmentTypesTable.name,
      revenue: sql<number>`COALESCE(SUM(${appointmentsTable.appointmentPriceInCents}), 0)`.as(
        "revenue",
      ),
      count: sql<number>`COUNT(*)::int`.as("count"),
    })
    .from(appointmentsTable)
    .leftJoin(
      appointmentTypesTable,
      eq(appointmentsTable.appointmentTypeId, appointmentTypesTable.id),
    )
    .where(
      and(
        eq(appointmentsTable.clinicId, clinicId),
        eq(appointmentsTable.status, "completed"),
        gte(appointmentsTable.date, dayjs(fromDate).startOf("day").toDate()),
        lte(appointmentsTable.date, dayjs(toDate).endOf("day").toDate()),
      ),
    )
    .groupBy(appointmentTypesTable.id, appointmentTypesTable.name)
    .orderBy(sql`COALESCE(SUM(${appointmentsTable.appointmentPriceInCents}), 0) DESC`);

  return rows;
}

/** Receita total do período + metas (se existirem) */
export async function getRevenueVsGoalReport(
  clinicId: string,
  fromDate: string,
  toDate: string,
) {
  const [revenueResult, goals] = await Promise.all([
    db
      .select({
        total: sql<number>`COALESCE(SUM(${appointmentsTable.appointmentPriceInCents}), 0)`.as(
          "total",
        ),
      })
      .from(appointmentsTable)
      .where(
        and(
          eq(appointmentsTable.clinicId, clinicId),
          eq(appointmentsTable.status, "completed"),
          gte(appointmentsTable.date, dayjs(fromDate).startOf("day").toDate()),
          lte(appointmentsTable.date, dayjs(toDate).endOf("day").toDate()),
        ),
      ),
    db.query.revenueGoalsTable.findMany({
      where: eq(revenueGoalsTable.clinicId, clinicId),
    }),
  ]);

  return {
    totalRevenue: Number(revenueResult[0]?.total ?? 0),
    goals,
  };
}

/** Consultas por período */
export async function getAppointmentsByPeriodReport(
  clinicId: string,
  fromDate: string,
  toDate: string,
  groupBy: "day" | "week" | "month",
) {
  const dateFormat =
    groupBy === "day"
      ? sql<string>`DATE(${appointmentsTable.date})`
      : groupBy === "week"
        ? sql<string>`DATE_TRUNC('week', ${appointmentsTable.date})::date`
        : sql<string>`DATE_TRUNC('month', ${appointmentsTable.date})::date`;

  const rows = await db
    .select({
      period: dateFormat.as("period"),
      total: sql<number>`COUNT(*)::int`.as("total"),
      completed: sql<number>`COUNT(*) FILTER (WHERE ${appointmentsTable.status} = 'completed')::int`.as(
        "completed",
      ),
      noShow: sql<number>`COUNT(*) FILTER (WHERE ${appointmentsTable.status} = 'no_show')::int`.as(
        "no_show",
      ),
      cancelled: sql<number>`COUNT(*) FILTER (WHERE ${appointmentsTable.status} = 'cancelled')::int`.as(
        "cancelled",
      ),
    })
    .from(appointmentsTable)
    .where(
      and(
        eq(appointmentsTable.clinicId, clinicId),
        gte(appointmentsTable.date, dayjs(fromDate).startOf("day").toDate()),
        lte(appointmentsTable.date, dayjs(toDate).endOf("day").toDate()),
      ),
    )
    .groupBy(dateFormat)
    .orderBy(dateFormat);

  return rows;
}

/** Taxa de no-show */
export async function getNoShowRateReport(
  clinicId: string,
  fromDate: string,
  toDate: string,
  doctorId?: string,
) {
  const rows = await db
    .select({
      total: sql<number>`COUNT(*)::int`.as("total"),
      noShow: sql<number>`COUNT(*) FILTER (WHERE ${appointmentsTable.status} = 'no_show')::int`.as(
        "no_show",
      ),
      completed: sql<number>`COUNT(*) FILTER (WHERE ${appointmentsTable.status} = 'completed')::int`.as(
        "completed",
      ),
    })
    .from(appointmentsTable)
    .where(
      and(
        eq(appointmentsTable.clinicId, clinicId),
        ...(doctorId ? [eq(appointmentsTable.doctorId, doctorId)] : []),
        gte(appointmentsTable.date, dayjs(fromDate).startOf("day").toDate()),
        lte(appointmentsTable.date, dayjs(toDate).endOf("day").toDate()),
      ),
    );

  const byDoctor = await db
    .select({
      doctorId: doctorsTable.id,
      doctorName: doctorsTable.name,
      total: sql<number>`COUNT(*)::int`.as("total"),
      noShow: sql<number>`COUNT(*) FILTER (WHERE ${appointmentsTable.status} = 'no_show')::int`.as(
        "no_show",
      ),
    })
    .from(appointmentsTable)
    .innerJoin(doctorsTable, eq(appointmentsTable.doctorId, doctorsTable.id))
    .where(
      and(
        eq(appointmentsTable.clinicId, clinicId),
        gte(appointmentsTable.date, dayjs(fromDate).startOf("day").toDate()),
        lte(appointmentsTable.date, dayjs(toDate).endOf("day").toDate()),
      ),
    )
    .groupBy(doctorsTable.id, doctorsTable.name);

  return { summary: rows[0], byDoctor };
}

/** Horários mais procurados (dia da semana + hora) */
export async function getPopularTimeSlotsReport(
  clinicId: string,
  fromDate: string,
  toDate: string,
) {
  const rows = await db
    .select({
      weekDay: sql<number>`EXTRACT(DOW FROM ${appointmentsTable.date})::int`.as(
        "week_day",
      ),
      hour: sql<number>`EXTRACT(HOUR FROM ${appointmentsTable.date})::int`.as(
        "hour",
      ),
      count: sql<number>`COUNT(*)::int`.as("count"),
    })
    .from(appointmentsTable)
    .where(
      and(
        eq(appointmentsTable.clinicId, clinicId),
        eq(appointmentsTable.status, "completed"),
        gte(appointmentsTable.date, dayjs(fromDate).startOf("day").toDate()),
        lte(appointmentsTable.date, dayjs(toDate).endOf("day").toDate()),
      ),
    )
    .groupBy(
      sql`EXTRACT(DOW FROM ${appointmentsTable.date})`,
      sql`EXTRACT(HOUR FROM ${appointmentsTable.date})`,
    )
    .orderBy(sql`COUNT(*) DESC`);

  return rows;
}

/** Tempo médio de consulta */
export async function getAverageConsultationTimeReport(
  clinicId: string,
  fromDate: string,
  toDate: string,
  groupBy: "doctor" | "type",
) {
  if (groupBy === "doctor") {
    return db
      .select({
        doctorId: doctorsTable.id,
        doctorName: doctorsTable.name,
        avgMinutes: sql<number>`COALESCE(AVG(EXTRACT(EPOCH FROM (${appointmentsTable.endDate} - ${appointmentsTable.date})) / 60), 0)::int`.as(
          "avg_minutes",
        ),
        count: sql<number>`COUNT(*)::int`.as("count"),
      })
      .from(appointmentsTable)
      .innerJoin(doctorsTable, eq(appointmentsTable.doctorId, doctorsTable.id))
      .where(
        and(
          eq(appointmentsTable.clinicId, clinicId),
          eq(appointmentsTable.status, "completed"),
          sql`${appointmentsTable.endDate} IS NOT NULL`,
          gte(appointmentsTable.date, dayjs(fromDate).startOf("day").toDate()),
          lte(appointmentsTable.date, dayjs(toDate).endOf("day").toDate()),
        ),
      )
      .groupBy(doctorsTable.id, doctorsTable.name);
  }

  return db
    .select({
      typeId: appointmentTypesTable.id,
      typeName: appointmentTypesTable.name,
      avgMinutes: sql<number>`COALESCE(AVG(EXTRACT(EPOCH FROM (${appointmentsTable.endDate} - ${appointmentsTable.date})) / 60), 0)::int`.as(
        "avg_minutes",
      ),
      count: sql<number>`COUNT(*)::int`.as("count"),
    })
    .from(appointmentsTable)
    .leftJoin(
      appointmentTypesTable,
      eq(appointmentsTable.appointmentTypeId, appointmentTypesTable.id),
    )
    .where(
      and(
        eq(appointmentsTable.clinicId, clinicId),
        eq(appointmentsTable.status, "completed"),
        sql`${appointmentsTable.endDate} IS NOT NULL`,
        gte(appointmentsTable.date, dayjs(fromDate).startOf("day").toDate()),
        lte(appointmentsTable.date, dayjs(toDate).endOf("day").toDate()),
      ),
    )
    .groupBy(appointmentTypesTable.id, appointmentTypesTable.name);
}

/** Novos pacientes por período */
export async function getNewPatientsReport(
  clinicId: string,
  fromDate: string,
  toDate: string,
  groupBy: "month" | "year",
) {
  const dateFormat =
    groupBy === "month"
      ? sql<string>`TO_CHAR(${patientsTable.createdAt}, 'YYYY-MM')`
      : sql<string>`TO_CHAR(${patientsTable.createdAt}, 'YYYY')`;

  return db
    .select({
      period: dateFormat.as("period"),
      count: sql<number>`COUNT(*)::int`.as("count"),
    })
    .from(patientsTable)
    .where(
      and(
        eq(patientsTable.clinicId, clinicId),
        gte(patientsTable.createdAt, dayjs(fromDate).startOf("day").toDate()),
        lte(patientsTable.createdAt, dayjs(toDate).endOf("day").toDate()),
      ),
    )
    .groupBy(dateFormat)
    .orderBy(dateFormat);
}

/** Pacientes mais frequentes */
export async function getMostFrequentPatientsReport(
  clinicId: string,
  fromDate: string,
  toDate: string,
  limit = 20,
) {
  const rows = await db
    .select({
      patientId: patientsTable.id,
      patientName: patientsTable.name,
      count: sql<number>`COUNT(${appointmentsTable.id})::int`.as("count"),
    })
    .from(appointmentsTable)
    .innerJoin(patientsTable, eq(appointmentsTable.patientId, patientsTable.id))
    .where(
      and(
        eq(appointmentsTable.clinicId, clinicId),
        eq(appointmentsTable.status, "completed"),
        gte(appointmentsTable.date, dayjs(fromDate).startOf("day").toDate()),
        lte(appointmentsTable.date, dayjs(toDate).endOf("day").toDate()),
      ),
    )
    .groupBy(patientsTable.id, patientsTable.name)
    .orderBy(sql`COUNT(${appointmentsTable.id}) DESC`)
    .limit(limit);

  return rows;
}

/** Pacientes inativos (sem consulta há X meses) */
export async function getInactivePatientsReport(
  clinicId: string,
  monthsInactive: number,
) {
  const cutoffDate = dayjs().subtract(monthsInactive, "month").toDate();

  const rows = await db
    .select({
      patientId: patientsTable.id,
      patientName: patientsTable.name,
      lastAppointment: sql<Date>`MAX(${appointmentsTable.date})`.as(
        "last_appointment",
      ),
    })
    .from(patientsTable)
    .leftJoin(
      appointmentsTable,
      and(
        eq(appointmentsTable.patientId, patientsTable.id),
        eq(appointmentsTable.clinicId, clinicId),
      ),
    )
    .where(eq(patientsTable.clinicId, clinicId))
    .groupBy(patientsTable.id, patientsTable.name)
    .having(sql`MAX(${appointmentsTable.date}) < ${cutoffDate} OR MAX(${appointmentsTable.date}) IS NULL`);

  return rows;
}

/** Produtividade por profissional */
export async function getDoctorProductivityReport(
  clinicId: string,
  fromDate: string,
  toDate: string,
) {
  return db
    .select({
      doctorId: doctorsTable.id,
      doctorName: doctorsTable.name,
      specialty: sql<string>`(
        SELECT string_agg(specialty, ', ' ORDER BY display_order)
        FROM doctor_specialties
        WHERE doctor_id = doctors.id
      )`.as("specialty"),
      count: sql<number>`COUNT(${appointmentsTable.id})::int`.as("count"),
      revenue: sql<number>`COALESCE(SUM(${appointmentsTable.appointmentPriceInCents}), 0)`.as(
        "revenue",
      ),
    })
    .from(doctorsTable)
    .leftJoin(
      appointmentsTable,
      and(
        eq(appointmentsTable.doctorId, doctorsTable.id),
        eq(appointmentsTable.status, "completed"),
        gte(appointmentsTable.date, dayjs(fromDate).startOf("day").toDate()),
        lte(appointmentsTable.date, dayjs(toDate).endOf("day").toDate()),
      ),
    )
    .where(eq(doctorsTable.clinicId, clinicId))
    .groupBy(doctorsTable.id, doctorsTable.name)
    .orderBy(sql`COUNT(${appointmentsTable.id}) DESC`);
}

/** Horários mais utilizados por profissional */
export async function getDoctorPeakHoursReport(
  clinicId: string,
  fromDate: string,
  toDate: string,
  doctorId?: string,
) {
  const rows = await db
    .select({
      doctorId: doctorsTable.id,
      doctorName: doctorsTable.name,
      weekDay: sql<number>`EXTRACT(DOW FROM ${appointmentsTable.date})::int`.as(
        "week_day",
      ),
      hour: sql<number>`EXTRACT(HOUR FROM ${appointmentsTable.date})::int`.as(
        "hour",
      ),
      count: sql<number>`COUNT(*)::int`.as("count"),
    })
    .from(appointmentsTable)
    .innerJoin(doctorsTable, eq(appointmentsTable.doctorId, doctorsTable.id))
    .where(
      and(
        eq(appointmentsTable.clinicId, clinicId),
        eq(appointmentsTable.status, "completed"),
        ...(doctorId ? [eq(appointmentsTable.doctorId, doctorId)] : []),
        gte(appointmentsTable.date, dayjs(fromDate).startOf("day").toDate()),
        lte(appointmentsTable.date, dayjs(toDate).endOf("day").toDate()),
      ),
    )
    .groupBy(
      doctorsTable.id,
      doctorsTable.name,
      sql`EXTRACT(DOW FROM ${appointmentsTable.date})`,
      sql`EXTRACT(HOUR FROM ${appointmentsTable.date})`,
    )
    .orderBy(doctorsTable.name, sql`COUNT(*) DESC`);

  return rows;
}

/** Aniversariantes por mês */
export async function getBirthdaysReport(clinicId: string, month: number) {
  return db
    .select()
    .from(patientsTable)
    .where(
      and(
        eq(patientsTable.clinicId, clinicId),
        sql`EXTRACT(MONTH FROM ${patientsTable.birthDate}) = ${month}`,
        sql`${patientsTable.birthDate} IS NOT NULL`,
      ),
    )
    .orderBy(asc(sql`EXTRACT(DAY FROM ${patientsTable.birthDate})`));
}

/** Tipos de consulta mais realizados */
export async function getAppointmentTypesReport(
  clinicId: string,
  fromDate: string,
  toDate: string,
) {
  const rows = await db
    .select({
      typeId: appointmentTypesTable.id,
      typeName: appointmentTypesTable.name,
      count: sql<number>`COUNT(*)::int`.as("count"),
      revenue: sql<number>`COALESCE(SUM(${appointmentsTable.appointmentPriceInCents}), 0)`.as(
        "revenue",
      ),
    })
    .from(appointmentsTable)
    .leftJoin(
      appointmentTypesTable,
      eq(appointmentsTable.appointmentTypeId, appointmentTypesTable.id),
    )
    .where(
      and(
        eq(appointmentsTable.clinicId, clinicId),
        eq(appointmentsTable.status, "completed"),
        gte(appointmentsTable.date, dayjs(fromDate).startOf("day").toDate()),
        lte(appointmentsTable.date, dayjs(toDate).endOf("day").toDate()),
      ),
    )
    .groupBy(appointmentTypesTable.id, appointmentTypesTable.name)
    .orderBy(sql`COUNT(*) DESC`);

  return rows;
}
