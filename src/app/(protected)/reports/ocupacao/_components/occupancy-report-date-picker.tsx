"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import dayjs from "dayjs";
import { Calendar as CalendarIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
interface OccupancyReportDatePickerProps {
  defaultFrom: string;
  defaultTo: string;
  doctorId?: string;
  doctors?: { id: string; name: string }[];
}

export function OccupancyReportDatePicker({
  defaultFrom,
  defaultTo,
  doctorId,
  doctors = [],
}: OccupancyReportDatePickerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const fromDate = dayjs(defaultFrom).toDate();
  const toDate = dayjs(defaultTo).toDate();
  const dateRange: DateRange | undefined = {
    from: fromDate,
    to: toDate,
  };

  const handleDateSelect = (range: DateRange | undefined) => {
    if (!range?.from) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("from", format(range.from, "yyyy-MM-dd"));
    params.set(
      "to",
      range.to ? format(range.to, "yyyy-MM-dd") : format(range.from, "yyyy-MM-dd"),
    );
    router.push(`/reports/ocupacao?${params.toString()}`);
  };

  const handleDoctorChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set("doctorId", value);
    } else {
      params.delete("doctorId");
    }
    router.push(`/reports/ocupacao?${params.toString()}`);
  };

  const setPreset = (preset: "month" | "quarter" | "year") => {
    const params = new URLSearchParams(searchParams.toString());
    const end = dayjs();
    let start = dayjs();
    if (preset === "month") {
      start = end.startOf("month");
    } else if (preset === "quarter") {
      const q = Math.floor(end.month() / 3) + 1;
      start = end.month((q - 1) * 3).startOf("month");
    } else {
      start = end.startOf("year");
    }
    params.set("from", start.format("YYYY-MM-DD"));
    params.set("to", end.format("YYYY-MM-DD"));
    router.push(`/reports/ocupacao?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl border-primary/20 hover:bg-primary/5"
          onClick={() => setPreset("month")}
        >
          Este mês
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl border-primary/20 hover:bg-primary/5"
          onClick={() => setPreset("quarter")}
        >
          Este trimestre
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl border-primary/20 hover:bg-primary/5"
          onClick={() => setPreset("year")}
        >
          Este ano
        </Button>
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="h-11 min-w-[240px] justify-start rounded-xl text-left font-normal border-primary/20 hover:bg-primary/5"
          >
            <CalendarIcon className="mr-2 size-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "dd/MM/yyyy", {
                    locale: ptBR,
                  })}{" "}
                  –{" "}
                  {format(dateRange.to, "dd/MM/yyyy", {
                    locale: ptBR,
                  })}
                </>
              ) : (
                format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
              )
            ) : (
              <span className="text-muted-foreground">Selecione o período</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={handleDateSelect}
            numberOfMonths={2}
            locale={ptBR}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      {doctors.length > 0 && (
        <Select
          value={doctorId ?? "all"}
          onValueChange={handleDoctorChange}
        >
          <SelectTrigger className="h-11 w-[200px] rounded-xl">
            <SelectValue placeholder="Profissional" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {doctors.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
