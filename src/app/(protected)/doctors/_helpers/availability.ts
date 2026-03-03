import "dayjs/locale/pt-br";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import { doctorsTable } from "@/db/schema";

dayjs.extend(utc);
dayjs.locale("pt-br");

export type DoctorWithAvailability = typeof doctorsTable.$inferSelect & {
  availability?: { weekDay: number; fromTime: string; toTime: string }[];
  specialties?: { specialty: string }[];
};

export const getAvailability = (doctor: DoctorWithAvailability) => {
  if (doctor.availability && doctor.availability.length > 0) {
    const sorted = [...doctor.availability].sort((a, b) => a.weekDay - b.weekDay);
    const first = sorted[0]!;
    const last = sorted[sorted.length - 1]!;
    const from = dayjs()
      .utc()
      .day(first.weekDay)
      .set("hour", Number(first.fromTime.split(":")[0]))
      .set("minute", Number(first.fromTime.split(":")[1]))
      .set("second", Number(first.fromTime.split(":")[2] || 0))
      .local();
    const to = dayjs()
      .utc()
      .day(last.weekDay)
      .set("hour", Number(last.toTime.split(":")[0]))
      .set("minute", Number(last.toTime.split(":")[1]))
      .set("second", Number(last.toTime.split(":")[2] || 0))
      .local();
    return { from, to, byDay: doctor.availability };
  }
  const from = dayjs()
    .utc()
    .day(doctor.availableFromWeekDay)
    .set("hour", Number(doctor.availableFromTime.split(":")[0]))
    .set("minute", Number(doctor.availableFromTime.split(":")[1]))
    .set("second", Number(doctor.availableFromTime.split(":")[2] || 0))
    .local();
  const to = dayjs()
    .utc()
    .day(doctor.availableToWeekDay)
    .set("hour", Number(doctor.availableToTime.split(":")[0]))
    .set("minute", Number(doctor.availableToTime.split(":")[1]))
    .set("second", Number(doctor.availableToTime.split(":")[2] || 0))
    .local();
  return { from, to, byDay: undefined };
};

/** Retorna array de { weekDay, fromTime, toTime } para o formulário (legado ou nova tabela). */
export function getScheduleFromDoctor(
  doctor: DoctorWithAvailability,
): { weekDay: number; fromTime: string; toTime: string }[] {
  if (doctor.availability && doctor.availability.length > 0) {
    return doctor.availability.map((a) => ({
      weekDay: a.weekDay,
      fromTime: a.fromTime,
      toTime: a.toTime,
    }));
  }
  const list: { weekDay: number; fromTime: string; toTime: string }[] = [];
  for (let d = doctor.availableFromWeekDay; d <= doctor.availableToWeekDay; d++) {
    list.push({
      weekDay: d,
      fromTime: doctor.availableFromTime,
      toTime: doctor.availableToTime,
    });
  }
  return list;
}
