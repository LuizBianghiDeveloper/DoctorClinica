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
import {
  appointmentTypesTable,
  appointmentsTable,
  doctorsTable,
  patientsTable,
  roomsTable,
} from "@/db/schema";
import { cn } from "@/lib/utils";
import { Dialog } from "@/components/ui/dialog";
import AddAppointmentForm from "./add-appointment-form";

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

type Patient = (typeof patientsTable.$inferSelect);
type DoctorWithAvailability = (typeof doctorsTable.$inferSelect);
type AppointmentType = typeof appointmentTypesTable.$inferSelect;
type Room = typeof roomsTable.$inferSelect;

type ClinicBusinessHour = { weekDay: number; openTime: string; closeTime: string };

interface AppointmentsDayCalendarProps {
  appointments: AppointmentWithRelations[];
  doctors: { id: string; name: string }[];
  businessHours: ClinicBusinessHour[];
  patients: Patient[];
  doctorsWithAvailability: DoctorWithAvailability[];
  appointmentTypes: AppointmentType[];
  rooms: Room[];
}

function getDoctorColorIndex(doctorId: string, doctors: { id: string }[]): number {
  const index = doctors.findIndex((d) => d.id === doctorId);
  return index >= 0 ? index % DOCTOR_COLORS.length : 0;
}

export function AppointmentsDayCalendar({
  appointments,
  doctors,
  businessHours,
  patients,
  doctorsWithAvailability,
  appointmentTypes,
  rooms,
}: AppointmentsDayCalendarProps) {
  type ViewMode = "day" | "week" | "month";

  const [selectedDate, setSelectedDate] = useState(() => dayjs().startOf("day").toDate());
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createInitialDate, setCreateInitialDate] = useState<Date | undefined>(undefined);
  const [createInitialTime, setCreateInitialTime] = useState<string | undefined>(undefined);

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

  const goPrev = () => {
    setSelectedDate((d) =>
      viewMode === "month"
        ? dayjs(d).subtract(1, "month").toDate()
        : viewMode === "week"
          ? dayjs(d).subtract(1, "week").toDate()
          : dayjs(d).subtract(1, "day").toDate(),
    );
  };

  const goNext = () => {
    setSelectedDate((d) =>
      viewMode === "month"
        ? dayjs(d).add(1, "month").toDate()
        : viewMode === "week"
          ? dayjs(d).add(1, "week").toDate()
          : dayjs(d).add(1, "day").toDate(),
    );
  };

  const goToday = () => setSelectedDate(dayjs().startOf("day").toDate());

  const isToday = dayjs(selectedDate).isSame(dayjs(), "day");

  const weekDays = useMemo(() => {
    if (viewMode !== "week") return [];
    // Semana começando na segunda-feira
    const base = dayjs(selectedDate);
    const monday = base.startOf("week").add(1, "day");
    return Array.from({ length: 7 }, (_, i) => monday.add(i, "day"));
  }, [selectedDate, viewMode]);

  const weekAppointmentsByDay = useMemo(() => {
    if (viewMode !== "week") return new Map<string, AppointmentWithRelations[]>();
    const result = new Map<string, AppointmentWithRelations[]>();
    if (weekDays.length === 0) return result;
    const start = weekDays[0]!.startOf("day");
    const end = weekDays[weekDays.length - 1]!.endOf("day");
    appointments.forEach((a) => {
      if (a.status === "cancelled") return;
      const d = dayjs(a.date);
      if (d.isBefore(start) || d.isAfter(end)) return;
      const key = d.format("YYYY-MM-DD");
      const list = result.get(key) ?? [];
      list.push(a);
      result.set(key, list);
    });
    // ordenar por horário
    for (const [key, list] of result.entries()) {
      list.sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());
      result.set(key, list);
    }
    return result;
  }, [appointments, viewMode, weekDays]);

  const monthAppointmentsByDay = useMemo(() => {
    if (viewMode !== "month") return new Map<string, AppointmentWithRelations[]>();
    const result = new Map<string, AppointmentWithRelations[]>();
    appointments.forEach((a) => {
      if (a.status === "cancelled") return;
      const key = dayjs(a.date).format("YYYY-MM-DD");
      const list = result.get(key) ?? [];
      list.push(a);
      result.set(key, list);
    });
    return result;
  }, [appointments, viewMode]);

  const handleSlotClick = (hour: number, min: number) => {
    const base = dayjs(selectedDate).hour(hour).minute(min).second(0).millisecond(0);
    setCreateInitialDate(base.toDate());
    setCreateInitialTime(base.format("HH:mm"));
    setIsCreateOpen(true);
  };

  const handleMonthDaySelect = (date: Date | undefined) => {
    if (!date) return;
    // No modo Mês, apenas atualizamos o dia selecionado para filtrar/listar,
    // sem trocar automaticamente para a visão de Dia.
    setSelectedDate(dayjs(date).startOf("day").toDate());
  };

  return (
    <React.Fragment>
      <div className="space-y-4">
        {/* Navegação, modos de visualização e legenda */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-xl border-primary/20 hover:bg-primary/5"
              onClick={goPrev}
              aria-label="Período anterior"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="min-w-[200px] justify-center rounded-xl border-primary/20 font-medium hover:bg-primary/5"
                >
                  {viewMode === "month"
                    ? format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR })
                    : format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => d && setSelectedDate(dayjs(d).startOf("day").toDate())}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
            <Button
              variant="outline"
              size="icon"
              className="rounded-xl border-primary/20 hover:bg-primary/5"
              onClick={goNext}
              aria-label="Próximo período"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
            {!isToday && (
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-primary/20 hover:bg-primary/5"
                onClick={goToday}
              >
                Hoje
              </Button>
            )}
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-muted/40 p-1">
            {[
              { id: "day" as ViewMode, label: "Dia" },
              { id: "week" as ViewMode, label: "Semana" },
              { id: "month" as ViewMode, label: "Mês" },
            ].map((option) => (
              <Button
                key={option.id}
                type="button"
                variant={viewMode === option.id ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "h-8 rounded-lg px-3 text-xs",
                  viewMode === option.id
                    ? "bg-gradient-to-r from-clinic-primary to-clinic-secondary text-white shadow-sm"
                    : "text-muted-foreground hover:bg-primary/5",
                )}
                onClick={() => setViewMode(option.id)}
              >
                {option.label}
              </Button>
            ))}
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

        {/* Visão DIA: grade com horários */}
        {viewMode === "day" && (
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
                      <button
                        type="button"
                        onClick={() => handleSlotClick(slot.hour, slot.min)}
                        className="flex-1 px-2 text-left text-xs text-muted-foreground/80 hover:bg-primary/5 hover:text-primary transition-colors"
                      >
                        Clique para marcar neste horário
                      </button>
                    </div>
                  ))}
                  <div className="pointer-events-none absolute inset-0">
                    <div className="pointer-events-none absolute left-16 right-0 top-0 bottom-0 pl-1 pr-1">
                      {dayAppointments.map((appointment) => {
                        const { top, height } = getBlockStyle(
                          appointment.date,
                          appointment.endDate ?? null,
                          firstHour,
                          firstMin,
                        );
                        const { column, total } =
                          overlapColumns.get(appointment) ?? {
                            column: 0,
                            total: 1,
                          };
                        const gapPx = total > 1 ? 2 : 0;
                        const leftPct = (column / total) * 100;
                        const widthPct = 100 / total;
                        const colorIndex = getDoctorColorIndex(
                          appointment.doctorId,
                          doctors,
                        );
                        const colorClass = DOCTOR_COLORS[colorIndex];
                        return (
                          <Link
                            key={appointment.id}
                            href={`/patients/${appointment.patient.id}/historico`}
                            title="Abrir prontuário"
                            className={cn(
                              "pointer-events-auto absolute flex flex-col justify-center gap-y-0.5 rounded-xl border px-2 py-1.5 text-left text-white shadow-md transition-shadow hover:shadow-lg cursor-pointer",
                              colorClass,
                            )}
                            style={{
                              top: `${top}px`,
                              height: `${Math.max(height, 56)}px`,
                              left:
                                total > 1
                                  ? `calc(${leftPct}% + ${column * gapPx}px)`
                                  : "2px",
                              width:
                                total > 1
                                  ? `calc(${widthPct}% - ${gapPx}px)`
                                  : "calc(100% - 4px)",
                            }}
                          >
                            <span className="flex items-center gap-1.5">
                              <span className="min-w-0 truncate text-xs font-medium leading-tight">
                                {appointment.patient.name}
                              </span>
                              <FileTextIcon
                                className="size-3.5 shrink-0 opacity-90"
                                aria-hidden
                              />
                            </span>
                            <span className="text-[11px] leading-tight opacity-90">
                              {appointment.endDate
                                ? `${format(new Date(appointment.date), "HH:mm", {
                                    locale: ptBR,
                                  })} - ${format(new Date(appointment.endDate), "HH:mm", {
                                    locale: ptBR,
                                  })}`
                                : format(new Date(appointment.date), "HH:mm", {
                                    locale: ptBR,
                                  })}
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
        )}

        {/* Visão SEMANA: lista de dias com agendamentos */}
        {viewMode === "week" && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {weekDays.map((day) => {
              const key = day.format("YYYY-MM-DD");
              const items = weekAppointmentsByDay.get(key) ?? [];
              return (
                <div
                  key={key}
                  className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">
                      {format(day.toDate(), "EEEE", { locale: ptBR })}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {format(day.toDate(), "dd/MM", { locale: ptBR })}
                    </span>
                  </div>
                  {items.length === 0 ? (
                    <p className="text-muted-foreground text-xs">
                      Nenhum agendamento.
                    </p>
                  ) : (
                    <ul className="space-y-2 text-xs">
                      {items.map((appointment) => {
                        const colorIndex = getDoctorColorIndex(
                          appointment.doctorId,
                          doctors,
                        );
                        const colorClass = DOCTOR_COLORS[colorIndex];
                        return (
                          <li key={appointment.id}>
                            <Link
                              href={`/patients/${appointment.patient.id}/historico`}
                              className={cn(
                                "relative block rounded-xl border border-border/60 bg-muted/40 px-3 py-2 pl-3.5 hover:border-clinic-primary/60 hover:bg-primary/5",
                              )}
                            >
                              <span
                                className={cn(
                                  "absolute left-1 top-2 h-8 w-1 rounded-full border",
                                  colorClass,
                                )}
                              />
                              <div className="ml-1 flex items-center justify-between gap-2">
                                <span className="font-medium">
                                  {format(appointment.date, "HH:mm", {
                                    locale: ptBR,
                                  })}
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                  {appointment.doctor.name}
                                </span>
                              </div>
                              <div className="ml-1 text-[11px]">
                                {appointment.patient.name}
                              </div>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Visão MÊS: calendário mensal + lista de agendamentos do dia selecionado ocupando melhor a tela */}
        {viewMode === "month" && (
          <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-xl shadow-primary/5">
            <div className="grid items-start gap-6 md:grid-cols-[minmax(260px,320px)_1fr] lg:grid-cols-[320px_1fr]">
              <div className="space-y-2">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleMonthDaySelect}
                  locale={ptBR}
                  modifiers={{
                    hasAppointments: (date) =>
                      !!monthAppointmentsByDay.get(dayjs(date).format("YYYY-MM-DD")),
                  }}
                  classNames={{
                    day: cn(
                      "relative",
                      "size-8 p-0 font-normal aria-selected:opacity-100",
                    ),
                    cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
                  }}
                />
                {/* Indicador visual nos dias com agendamento */}
                <style>{`
                  .rdp-day_hasAppointments::after {
                    content: "";
                    position: absolute;
                    bottom: 4px;
                    left: 50%;
                    width: 6px;
                    height: 6px;
                    transform: translateX(-50%);
                    border-radius: 9999px;
                    background-color: rgb(56 189 248);
                  }
                `}</style>
                <p className="text-muted-foreground text-xs">
                  Clique em um dia para ver os agendamentos detalhados ao lado.
                </p>
              </div>

              <div className="max-h-[50vh] min-h-[220px] space-y-3 overflow-y-auto rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-3">
                {monthAppointmentsByDay.size === 0 ? (
                  <p className="text-muted-foreground text-xs">
                    Nenhum agendamento neste mês.
                  </p>
                ) : (
                  (() => {
                    const selectedKey = dayjs(selectedDate).format("YYYY-MM-DD");
                    const items = monthAppointmentsByDay.get(selectedKey) ?? [];
                    if (items.length === 0) {
                      return (
                        <p className="text-muted-foreground text-xs">
                          Nenhum agendamento neste dia.
                        </p>
                      );
                    }
                    return (
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-muted-foreground">
                            {format(selectedDate, "dd/MM (EEEE)", {
                              locale: ptBR,
                            })}
                          </span>
                          <span className="text-muted-foreground/80">
                            {items.length} agendamento
                            {items.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <ul className="space-y-2">
                          {items.map((appointment) => {
                            const colorIndex = getDoctorColorIndex(
                              appointment.doctorId,
                              doctors,
                            );
                            const colorClass = DOCTOR_COLORS[colorIndex];
                            return (
                              <li key={appointment.id}>
                                <Link
                                  href={`/patients/${appointment.patient.id}/historico`}
                                  className={cn(
                                    "flex flex-col gap-1 rounded-xl border border-border/60 bg-background px-3 py-2 hover:border-clinic-primary/60 hover:bg-primary/5",
                                    colorClass,
                                  )}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-medium">
                                      {format(appointment.date, "HH:mm", {
                                        locale: ptBR,
                                      })}
                                    </span>
                                    <span className="text-[11px] text-white/90">
                                      {appointment.doctor.name}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-white">
                                    {appointment.patient.name}
                                  </div>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        {isCreateOpen && (
          <AddAppointmentForm
            isOpen={isCreateOpen}
            patients={patients}
            doctors={doctorsWithAvailability}
            appointmentTypes={appointmentTypes}
            rooms={rooms}
            onSuccess={() => setIsCreateOpen(false)}
            initialDate={createInitialDate}
            initialTime={createInitialTime}
          />
        )}
      </Dialog>
    </React.Fragment>
  );
}
