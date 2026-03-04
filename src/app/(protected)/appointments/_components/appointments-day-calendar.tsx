"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import dayjs from "dayjs";
import { ChevronLeftIcon, ChevronRightIcon, FileTextIcon } from "lucide-react";
import Link from "next/link";
import React, { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { appointmentsTable } from "@/db/schema";
import { cn } from "@/lib/utils";

const DOCTOR_COLORS = [
  "bg-blue-500/90 border-blue-600",
  "bg-emerald-500/90 border-emerald-600",
  "bg-amber-500/90 border-amber-600",
  "bg-rose-500/90 border-rose-600",
  "bg-violet-500/90 border-violet-600",
  "bg-teal-500/90 border-teal-600",
  "bg-orange-500/90 border-orange-600",
  "bg-clinic-primary/90 border-clinic-primary",
  "bg-pink-500/90 border-pink-600",
  "bg-clinic-secondary/90 border-clinic-secondary",
];

const ROW_HEIGHT_PX = 60;
const DEFAULT_FIRST_HOUR = 8;
const DEFAULT_LAST_HOUR = 22;

function parseTimeToMinutes(timeStr: string): number {
  const s = String(timeStr).slice(0, 8);
  const [h, m] = s.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function buildTimeSlots(
  firstHour: number,
  firstMin: number,
  lastHour: number,
  lastMin: number,
): { hour: number; min: number; label: string }[] {
  const startMinutes = firstHour * 60 + firstMin;
  const endMinutes = lastHour * 60 + lastMin;
  const slots: { hour: number; min: number; label: string }[] = [];
  for (let mins = startMinutes; mins < endMinutes; mins += 30) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    slots.push({
      hour: h,
      min: m,
      label: `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`,
    });
  }
  return slots;
}

function getBlockStyle(
  date: Date,
  endDate: Date | null,
  firstHour: number,
  firstMin: number,
): { top: number; height: number } {
  const start = dayjs(date);
  const end = endDate ? dayjs(endDate) : start.add(30, "minute");
  const durationMinutes = Math.max(30, end.diff(start, "minute"));
  const slotCount = Math.ceil(durationMinutes / 30);
  const startMinutes = start.hour() * 60 + start.minute() - (firstHour * 60 + firstMin);
  const slotIndex = Math.max(0, startMinutes / 30);
  return {
    top: slotIndex * ROW_HEIGHT_PX + 2,
    height: slotCount * ROW_HEIGHT_PX,
  };
}

/** Retorna o índice da "coluna" para blocos que se sobrepõem ficarem lado a lado */
function getOverlapColumns<T extends { date: Date; endDate: Date | null }>(
  items: T[],
): Map<T, { column: number; total: number }> {
  const result = new Map<T, { column: number; total: number }>();
  const sorted = [...items].sort(
    (a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf(),
  );
  const columnsEnd: number[] = [];
  for (const item of sorted) {
    const end = item.endDate
      ? dayjs(item.endDate).valueOf()
      : dayjs(item.date).add(30, "minute").valueOf();
    const start = dayjs(item.date).valueOf();
    let col = 0;
    while (col < columnsEnd.length && columnsEnd[col]! > start) col++;
    if (col === columnsEnd.length) columnsEnd.push(end);
    else columnsEnd[col] = end;
    result.set(item, { column: col, total: 0 });
  }
  const maxCols = columnsEnd.length;
  for (const v of result.values()) v.total = maxCols;
  return result;
}

type AppointmentWithRelations = (typeof appointmentsTable.$inferSelect) & {
  patient: { id: string; name: string };
  doctor: { id: string; name: string; specialties?: { specialty: string }[] };
};

type ClinicBusinessHour = { weekDay: number; openTime: string; closeTime: string };

interface AppointmentsDayCalendarProps {
  appointments: AppointmentWithRelations[];
  doctors: { id: string; name: string }[];
  businessHours: ClinicBusinessHour[];
}

function getDoctorColorIndex(doctorId: string, doctors: { id: string }[]): number {
  const index = doctors.findIndex((d) => d.id === doctorId);
  return index >= 0 ? index % DOCTOR_COLORS.length : 0;
}

export function AppointmentsDayCalendar({
  appointments,
  doctors,
  businessHours,
}: AppointmentsDayCalendarProps) {
  const [selectedDate, setSelectedDate] = useState(() => dayjs().startOf("day").toDate());

  const { timeSlots, firstHour, firstMin, isClosed } = useMemo(() => {
    const weekDay = dayjs(selectedDate).day();
    const hoursForDay = businessHours.find((h) => h.weekDay === weekDay);
    if (hoursForDay) {
      const openMins = parseTimeToMinutes(hoursForDay.openTime);
      const closeMins = parseTimeToMinutes(hoursForDay.closeTime);
      const firstH = Math.floor(openMins / 60);
      const firstM = openMins % 60;
      const lastH = Math.floor(closeMins / 60);
      const lastM = closeMins % 60;
      const slots = buildTimeSlots(firstH, firstM, lastH, lastM);
      return { timeSlots: slots, firstHour: firstH, firstMin: firstM, isClosed: false };
    }
    if (businessHours.length > 0) {
      return {
        timeSlots: [],
        firstHour: DEFAULT_FIRST_HOUR,
        firstMin: 0,
        isClosed: true,
      };
    }
    const slots = buildTimeSlots(DEFAULT_FIRST_HOUR, 0, DEFAULT_LAST_HOUR, 0);
    return { timeSlots: slots, firstHour: DEFAULT_FIRST_HOUR, firstMin: 0, isClosed: false };
  }, [selectedDate, businessHours]);

  const dayAppointments = useMemo(() => {
    const start = dayjs(selectedDate).startOf("day");
    const end = dayjs(selectedDate).endOf("day");
    return appointments.filter((a) => {
      if (a.status === "cancelled") return false;
      const d = dayjs(a.date);
      return d.isSame(start, "day") || (d.isAfter(start) && d.isBefore(end));
    });
  }, [appointments, selectedDate]);

  const overlapColumns = useMemo(
    () => getOverlapColumns(dayAppointments),
    [dayAppointments],
  );

  const goPrevDay = () => setSelectedDate((d) => dayjs(d).subtract(1, "day").toDate());
  const goNextDay = () => setSelectedDate((d) => dayjs(d).add(1, "day").toDate());
  const goToday = () => setSelectedDate(dayjs().startOf("day").toDate());

  const isToday = dayjs(selectedDate).isSame(dayjs(), "day");

  return (
    <React.Fragment>
      <div className="space-y-4">
        {/* Navegação e legenda */}
        <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="rounded-xl border-primary/20 hover:bg-primary/5" onClick={goPrevDay} aria-label="Dia anterior">
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="min-w-[180px] justify-center rounded-xl font-medium border-primary/20 hover:bg-primary/5">
                {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => d && setSelectedDate(d)}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="icon" className="rounded-xl border-primary/20 hover:bg-primary/5" onClick={goNextDay} aria-label="Próximo dia">
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
          {!isToday && (
            <Button variant="outline" size="sm" className="rounded-xl border-primary/20 hover:bg-primary/5" onClick={goToday}>
              Hoje
            </Button>
          )}
        </div>
        </div>
        {/* Legenda por profissional */}
        <div className="flex flex-wrap gap-4 text-sm">
          {doctors.map((doctor, i) => (
          <div key={doctor.id} className="flex items-center gap-2">
            <span
              className={cn(
                "h-4 w-6 rounded border",
                DOCTOR_COLORS[i % DOCTOR_COLORS.length],
              )}
            />
            <span className="text-muted-foreground">{doctor.name}</span>
          </div>
          ))}
        </div>

        {/* Grid do dia: faixas de horário + blocos do início ao fim */}
      <div className="rounded-2xl border border-border/60 bg-card shadow-xl shadow-primary/5">
        <div className="max-h-[60vh] overflow-y-auto">
          {isClosed ? (
            <div className="flex min-h-[200px] items-center justify-center py-12 text-muted-foreground">
              Clínica fechada neste dia
            </div>
          ) : (
          <div
            className="relative"
            style={{ minHeight: timeSlots.length * ROW_HEIGHT_PX }}
          >
            {timeSlots.map((slot) => (
              <div
                key={slot.label}
                className="flex border-b last:border-b-0"
                style={{ height: ROW_HEIGHT_PX }}
              >
                <div className="w-16 shrink-0 border-r py-2 pl-2 text-right text-sm text-muted-foreground">
                  {slot.label}
                </div>
                <div className="flex-1" />
              </div>
            ))}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute left-16 right-0 top-0 bottom-0 pl-1 pr-1 pointer-events-auto">
                {dayAppointments.map((appointment) => {
                  const { top, height } = getBlockStyle(
                    appointment.date,
                    appointment.endDate ?? null,
                    firstHour,
                    firstMin,
                  );
                  const { column, total } = overlapColumns.get(appointment) ?? {
                    column: 0,
                    total: 1,
                  };
                  const gapPx = total > 1 ? 2 : 0;
                  const leftPct = (column / total) * 100;
                  const widthPct = 100 / total;
                  const colorIndex = getDoctorColorIndex(appointment.doctorId, doctors);
                  const colorClass = DOCTOR_COLORS[colorIndex];
                  return (
                    <Link
                      key={appointment.id}
                      href={`/patients/${appointment.patient.id}/historico`}
                      title="Abrir prontuário"
                      className={cn(
                        "absolute flex flex-col justify-center gap-y-0.5 rounded-xl border px-2 py-1.5 text-left text-white shadow-md transition-shadow hover:shadow-lg cursor-pointer",
                        colorClass,
                      )}
                      style={{
                        top: `${top}px`,
                        height: `${Math.max(height, 56)}px`,
                        left: total > 1 ? `calc(${leftPct}% + ${column * gapPx}px)` : "2px",
                        width: total > 1 ? `calc(${widthPct}% - ${gapPx}px)` : "calc(100% - 4px)",
                      }}
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-xs font-medium leading-tight min-w-0">
                          {appointment.patient.name}
                        </span>
                        <FileTextIcon className="size-3.5 shrink-0 opacity-90" aria-hidden />
                      </span>
                      <span className="text-[11px] leading-tight opacity-90">
                        {appointment.endDate
                          ? `${format(new Date(appointment.date), "HH:mm", { locale: ptBR })} - ${format(new Date(appointment.endDate), "HH:mm", { locale: ptBR })}`
                          : format(new Date(appointment.date), "HH:mm", { locale: ptBR })}
                      </span>
                      <span className="truncate text-[11px] leading-tight opacity-80">
                        {appointment.doctor.name}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
    </React.Fragment>
  );
}
