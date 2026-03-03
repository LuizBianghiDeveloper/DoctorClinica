"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { appointmentsTable } from "@/db/schema";

import { AppointmentsDayCalendar } from "./appointments-day-calendar";
import { appointmentsTableColumns } from "./table-columns";

const LIST_PAGE_SIZE = 15;

type AppointmentWithRelations = (typeof appointmentsTable.$inferSelect) & {
  patient: { id: string; name: string; email: string; phoneNumber: string; sex: "male" | "female" };
  doctor: { id: string; name: string; specialties?: { specialty: string }[] };
};

interface AppointmentsViewProps {
  appointments: AppointmentWithRelations[];
  doctors: { id: string; name: string }[];
  columns: ColumnDef<AppointmentWithRelations>[];
}

export function AppointmentsView({
  appointments,
  doctors,
  columns,
}: AppointmentsViewProps) {
  const searchParams = useSearchParams();
  const viewFromUrl = searchParams.get("view");
  const pageFromUrl = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);

  const isListView = viewFromUrl === "list";
  const listPage = isListView ? pageFromUrl : 1;

  const paginatedAppointments = useMemo(() => {
    const start = (listPage - 1) * LIST_PAGE_SIZE;
    return appointments.slice(start, start + LIST_PAGE_SIZE);
  }, [appointments, listPage]);

  const totalPages = Math.ceil(appointments.length / LIST_PAGE_SIZE) || 1;
  const start = (listPage - 1) * LIST_PAGE_SIZE + 1;
  const end = Math.min(listPage * LIST_PAGE_SIZE, appointments.length);

  const buildListHref = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", "list");
    params.set("page", String(page));
    return `/appointments?${params.toString()}`;
  };

  const buildCalendarHref = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("view");
    params.delete("page");
    const qs = params.toString();
    return qs ? `/appointments?${qs}` : "/appointments";
  };

  return (
    <Tabs
      defaultValue={isListView ? "list" : "calendar"}
      value={isListView ? "list" : "calendar"}
      className="w-full"
    >
      <TabsList className="h-11 rounded-xl bg-muted/50 p-1">
        <TabsTrigger value="calendar" asChild className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white">
          <Link href={buildCalendarHref()}>Calendário</Link>
        </TabsTrigger>
        <TabsTrigger value="list" asChild className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white">
          <Link href={buildListHref(1)}>Lista</Link>
        </TabsTrigger>
      </TabsList>
      <TabsContent value="calendar" className="mt-4">
        <AppointmentsDayCalendar appointments={appointments} doctors={doctors} />
      </TabsContent>
      <TabsContent value="list" className="mt-4 space-y-4">
        <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card shadow-xl shadow-primary/5">
          <DataTable data={paginatedAppointments} columns={columns} />
        </div>
        {appointments.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-muted-foreground text-sm">
              Mostrando {start} a {end} de {appointments.length} agendamento
              {appointments.length !== 1 ? "s" : ""}
            </p>
            <div className="flex items-center gap-2">
              {listPage <= 1 ? (
                <Button
                  variant="outline"
                  size="icon"
                  className="border-primary/20"
                  disabled
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="size-4" />
                </Button>
              ) : (
                <Button variant="outline" size="icon" className="border-primary/20 hover:bg-primary/5" asChild>
                  <Link
                    href={buildListHref(listPage - 1)}
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="size-4" />
                  </Link>
                </Button>
              )}
              <span className="text-muted-foreground min-w-[6rem] text-center text-sm">
                Página {listPage} de {totalPages}
              </span>
              {listPage >= totalPages ? (
                <Button
                  variant="outline"
                  size="icon"
                  className="border-primary/20"
                  disabled
                  aria-label="Próxima página"
                >
                  <ChevronRight className="size-4" />
                </Button>
              ) : (
                <Button variant="outline" size="icon" className="border-primary/20 hover:bg-primary/5" asChild>
                  <Link
                    href={buildListHref(listPage + 1)}
                    aria-label="Próxima página"
                  >
                    <ChevronRight className="size-4" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
