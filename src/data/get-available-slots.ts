import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import {
  appointmentsTable,
  doctorsTable,
  doctorTimeBlocksTable,
} from "@/db/schema";
import { generateTimeSlots } from "@/helpers/time";

dayjs.extend(utc);

export type AvailableSlot = {
  value: string;
  available: boolean;
  label: string;
};

function toDateStr(d: Date | string | null | undefined): string | null {
  if (d == null) return null;
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  return String(d).slice(0, 10);
}

/** Retorna os horários disponíveis para um médico em uma data. Usado pela action e pelo addAppointment.
 * Se roomId for informado, também bloqueia horários em que a sala/recurso já esteja em uso por outro agendamento. */
export async function getAvailableSlotsForDoctorAndDate(
  doctorId: string,
  dateStr: string,
  roomId?: string | null,
): Promise<AvailableSlot[]> {
  const doctor = await db.query.doctorsTable.findFirst({
    where: eq(doctorsTable.id, doctorId),
    with: { availability: true, specialties: true },
  });
  if (!doctor) {
    throw new Error("Profissional não encontrado");
  }

  const selectedDayOfWeek = dayjs(dateStr).day();

  let slotsForDay: { from: string; to: string }[] = [];

  if (doctor.availability && doctor.availability.length > 0) {
    const daySlots = doctor.availability.filter(
      (a) => a.weekDay === selectedDayOfWeek,
    );
    if (daySlots.length === 0) return [];
    slotsForDay = daySlots.map((s) => ({
      from: s.fromTime,
      to: s.toTime,
    }));
  } else {
    const doctorIsAvailable =
      selectedDayOfWeek >= doctor.availableFromWeekDay &&
      selectedDayOfWeek <= doctor.availableToWeekDay;
    if (!doctorIsAvailable) return [];
    slotsForDay = [
      {
        from: doctor.availableFromTime,
        to: doctor.availableToTime,
      },
    ];
  }

  const doctorSpecialtyNames =
    doctor.specialties?.map((s) => s.specialty.trim().toLowerCase()) ?? [];
  const allowsMultipleClientsAtSameTime = doctorSpecialtyNames.includes(
    "pilates",
  );

  const [appointments, timeBlocks, roomAppointments] = await Promise.all([
    db.query.appointmentsTable.findMany({
      where: eq(appointmentsTable.doctorId, doctorId),
    }),
    db.query.doctorTimeBlocksTable.findMany({
      where: eq(doctorTimeBlocksTable.doctorId, doctorId),
    }),
    roomId
      ? db.query.appointmentsTable.findMany({
          where: eq(appointmentsTable.roomId, roomId),
        })
      : Promise.resolve([]),
  ]);

  const blockedSlots = new Set<string>();

  if (!allowsMultipleClientsAtSameTime) {
    for (const appointment of appointments) {
      if (!dayjs(appointment.date).isSame(dateStr, "day")) continue;
      const start = dayjs(appointment.date);
      const end = appointment.endDate
        ? dayjs(appointment.endDate)
        : start.add(30, "minute");
      let slot = start.startOf("minute");
      while (slot.isBefore(end)) {
        blockedSlots.add(slot.format("HH:mm:ss"));
        slot = slot.add(30, "minute");
      }
    }
  }

  if (roomId) {
    for (const apt of roomAppointments) {
      if (!dayjs(apt.date).isSame(dateStr, "day")) continue;
      if (apt.status === "cancelled") continue;
      const start = dayjs(apt.date);
      const end = apt.endDate
        ? dayjs(apt.endDate)
        : start.add(30, "minute");
      let slot = start.startOf("minute");
      while (slot.isBefore(end)) {
        blockedSlots.add(slot.format("HH:mm:ss"));
        slot = slot.add(30, "minute");
      }
    }
  }

  const applicableBlocks = timeBlocks.filter((block) => {
    if (block.weekDay != null && block.blockDate == null) {
      return block.weekDay === selectedDayOfWeek;
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

  const timeSlots = generateTimeSlots();
  const resultSlots: AvailableSlot[] = [];

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
    const isToday = dayjs(dateStr).isSame(dayjs(), "day");
    for (const time of inRange) {
      const slotTaken = blockedSlots.has(time);
      let available = !slotTaken;
      if (isToday && available) {
        const [h, m] = time.split(":").map(Number);
        const slotDateTime = dayjs(dateStr)
          .hour(h)
          .minute(m ?? 0)
          .second(0);
        if (slotDateTime.isBefore(dayjs())) available = false;
      }
      resultSlots.push({
        value: time,
        available,
        label: time.substring(0, 5),
      });
    }
  }

  return resultSlots;
}

/** Normaliza horário para HH:mm:ss para comparação. */
export function normalizeTimeToHHMMSS(time: string): string {
  const parts = time.split(":");
  const h = (parts[0] ?? "0").padStart(2, "0");
  const m = (parts[1] ?? "0").padStart(2, "0");
  const s = (parts[2] ?? "0").padStart(2, "0");
  return `${h}:${m}:${s}`;
}
