import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { and, eq, gte, lte } from "drizzle-orm";

import { db } from "@/db";
import {
  appointmentsTable,
  doctorTimeBlocksTable,
  doctorsTable,
} from "@/db/schema";
import { generateTimeSlots } from "@/helpers/time";

dayjs.extend(utc);

function toDateStr(d: Date | string | null | undefined): string | null {
  if (d == null) return null;
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  return String(d).slice(0, 10);
}

export type OccupancyReportRow = {
  doctorId: string;
  doctorName: string;
  specialty: string;
  totalSlots: number;
  filledSlots: number;
  occupancyPercent: number;
};

/** Calcula ocupação da agenda: % de horários preenchidos por profissional no período. */
export async function getScheduleOccupancyReport(
  clinicId: string,
  fromDate: string,
  toDate: string,
  doctorId?: string,
): Promise<OccupancyReportRow[]> {
  const doctors = await db.query.doctorsTable.findMany({
    where: doctorId
      ? and(
          eq(doctorsTable.clinicId, clinicId),
          eq(doctorsTable.id, doctorId),
        )
      : eq(doctorsTable.clinicId, clinicId),
    with: { availability: true, specialties: true },
  });

  const allAppointments = await db
    .select()
    .from(appointmentsTable)
    .where(
      and(
        eq(appointmentsTable.clinicId, clinicId),
        gte(appointmentsTable.date, dayjs(fromDate).startOf("day").toDate()),
        lte(
          appointmentsTable.date,
          dayjs(toDate).endOf("day").toDate(),
        ),
      ),
    );

  const timeBlocksByDoctor = new Map<
    string,
    Awaited<
      ReturnType<typeof db.query.doctorTimeBlocksTable.findMany>
    >
  >();
  for (const d of doctors) {
    const blocks = await db.query.doctorTimeBlocksTable.findMany({
      where: eq(doctorTimeBlocksTable.doctorId, d.id),
    });
    timeBlocksByDoctor.set(d.id, blocks);
  }

  const appointmentsByDoctor = new Map<string, typeof allAppointments>();
  for (const a of allAppointments) {
    const list = appointmentsByDoctor.get(a.doctorId) ?? [];
    list.push(a);
    appointmentsByDoctor.set(a.doctorId, list);
  }

  const timeSlots = generateTimeSlots();
  const start = dayjs(fromDate).startOf("day");
  const end = dayjs(toDate).endOf("day");
  const now = dayjs();
  const results: OccupancyReportRow[] = [];

  for (const doctor of doctors) {
    let totalSlots = 0;
    const blocks = timeBlocksByDoctor.get(doctor.id) ?? [];

    for (let d = start; d.isBefore(end) || d.isSame(end, "day"); d = d.add(1, "day")) {
      const dateStr = d.format("YYYY-MM-DD");
      const dayOfWeek = d.day();

      let slotsForDay: { from: string; to: string }[] = [];

      if (doctor.availability && doctor.availability.length > 0) {
        const daySlots = doctor.availability.filter((a) => a.weekDay === dayOfWeek);
        if (daySlots.length === 0) continue;
        slotsForDay = daySlots.map((s) => ({
          from: s.fromTime,
          to: s.toTime,
        }));
      } else {
        const isAvailable =
          dayOfWeek >= doctor.availableFromWeekDay &&
          dayOfWeek <= doctor.availableToWeekDay;
        if (!isAvailable) continue;
        slotsForDay = [
          {
            from: doctor.availableFromTime,
            to: doctor.availableToTime,
          },
        ];
      }

      const blockedSlots = new Set<string>();

      const applicableBlocks = blocks.filter((block) => {
        if (block.weekDay != null && block.blockDate == null) {
          return block.weekDay === dayOfWeek;
        }
        if (block.blockDate != null && block.weekDay == null) {
          return toDateStr(block.blockDate) === dateStr;
        }
        return false;
      });

      for (const block of applicableBlocks) {
        const fromParts = block.fromTime.split(":").map(Number);
        const toParts = block.toTime.split(":").map(Number);
        const blockStart = dayjs(dateStr)
          .set("hour", fromParts[0] ?? 0)
          .set("minute", fromParts[1] ?? 0)
          .set("second", fromParts[2] ?? 0);
        const blockEnd = dayjs(dateStr)
          .set("hour", toParts[0] ?? 0)
          .set("minute", toParts[1] ?? 0)
          .set("second", toParts[2] ?? 0);
        let slot = blockStart.startOf("minute");
        while (slot.isBefore(blockEnd) || slot.isSame(blockEnd)) {
          blockedSlots.add(slot.format("HH:mm:ss"));
          slot = slot.add(30, "minute");
        }
      }

      const isToday = d.isSame(now, "day");

      for (const range of slotsForDay) {
        const fromParts = range.from.split(":").map(Number);
        const toParts = range.to.split(":").map(Number);
        const doctorAvailableFrom = dayjs()
          .utc()
          .set("hour", fromParts[0] ?? 0)
          .set("minute", fromParts[1] ?? 0)
          .set("second", 0)
          .local();
        const doctorAvailableTo = dayjs()
          .utc()
          .set("hour", toParts[0] ?? 0)
          .set("minute", toParts[1] ?? 0)
          .set("second", 0)
          .local();

        const inRange = timeSlots.filter((time) => {
          const [h, m] = time.split(":").map(Number);
          const t = dayjs()
            .utc()
            .set("hour", h)
            .set("minute", m)
            .set("second", 0)
            .local();
          return (
            t.format("HH:mm:ss") >= doctorAvailableFrom.format("HH:mm:ss") &&
            t.format("HH:mm:ss") <= doctorAvailableTo.format("HH:mm:ss")
          );
        });

        for (const time of inRange) {
          if (blockedSlots.has(time)) continue;
          if (isToday) {
            const [h, m] = time.split(":").map(Number);
            const slotDateTime = dayjs(dateStr)
              .hour(h)
              .minute(m ?? 0)
              .second(0);
            if (slotDateTime.isBefore(now)) continue;
          }
          totalSlots++;
        }
      }
    }

    const doctorAppointments = appointmentsByDoctor.get(doctor.id) ?? [];
    const doctorSpecialtyNames =
      doctor.specialties?.map((s) => s.specialty.trim().toLowerCase()) ?? [];
    const allowsMultiple = doctorSpecialtyNames.includes("pilates");

    let filledSlots: number;
    if (allowsMultiple) {
      const uniqueSlots = new Set<string>();
      for (const apt of doctorAppointments) {
        const aptStart = dayjs(apt.date);
        const aptEnd = apt.endDate
          ? dayjs(apt.endDate)
          : aptStart.add(30, "minute");
        let slot = aptStart.startOf("minute");
        while (slot.isBefore(aptEnd)) {
          uniqueSlots.add(
            `${slot.format("YYYY-MM-DD")}_${slot.format("HH:mm:ss")}`,
          );
          slot = slot.add(30, "minute");
        }
      }
      filledSlots = uniqueSlots.size;
    } else {
      filledSlots = 0;
      for (const apt of doctorAppointments) {
        const aptStart = dayjs(apt.date);
        const aptEnd = apt.endDate
          ? dayjs(apt.endDate)
          : aptStart.add(30, "minute");
        const durationMin = aptEnd.diff(aptStart, "minute");
        filledSlots += Math.ceil(durationMin / 30);
      }
    }

    const occupancyPercent =
      totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 1000) / 10 : 0;

    results.push({
      doctorId: doctor.id,
      doctorName: doctor.name,
      specialty: doctor.specialties?.map((s) => s.specialty).join(", ") ?? "",
      totalSlots,
      filledSlots,
      occupancyPercent,
    });
  }

  return results.sort((a, b) => b.occupancyPercent - a.occupancyPercent);
}
