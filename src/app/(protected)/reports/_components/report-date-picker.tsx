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
import { cn } from "@/lib/utils";

interface GroupByOption {
  value: string;
  label: string;
}

interface ReportDatePickerProps {
  basePath: string;
  defaultFrom: string;
  defaultTo: string;
  doctorId?: string;
  doctors?: { id: string; name: string }[];
  groupBy?: string;
  showGroupBy?: boolean;
  groupByOptions?: GroupByOption[];
  monthsInactive?: number;
}

export function ReportDatePicker({
  basePath,
  defaultFrom,
  defaultTo,
  doctorId,
  doctors = [],
  groupBy,
  showGroupBy = false,
  groupByOptions,
  monthsInactive,
}: ReportDatePickerProps) {
  const defaultGroupByOptions: GroupByOption[] = [
    { value: "day", label: "Por dia" },
    { value: "week", label: "Por semana" },
    { value: "month", label: "Por mês" },
    { value: "year", label: "Por ano" },
  ];
  const options = groupByOptions ?? defaultGroupByOptions;
  const router = useRouter();
  const searchParams = useSearchParams();

  const fromDate = dayjs(defaultFrom).toDate();
  const toDate = dayjs(defaultTo).toDate();
  const dateRange: DateRange | undefined = {
    from: fromDate,
    to: toDate,
  };

  const buildParams = () => {
    const params = new URLSearchParams(searchParams.toString());
    return params;
  };

  const handleDateSelect = (range: DateRange | undefined) => {
    if (!range?.from) return;
    const params = buildParams();
    params.set("from", format(range.from, "yyyy-MM-dd"));
    params.set(
      "to",
      range.to ? format(range.to, "yyyy-MM-dd") : format(range.from, "yyyy-MM-dd"),
    );
    router.push(`${basePath}?${params.toString()}`);
  };

  const handleDoctorChange = (value: string) => {
    const params = buildParams();
    if (value && value !== "all") {
      params.set("doctorId", value);
    } else {
      params.delete("doctorId");
    }
    router.push(`${basePath}?${params.toString()}`);
  };

  const handleGroupByChange = (value: string) => {
    const params = buildParams();
    if (value) params.set("groupBy", value);
    else params.delete("groupBy");
    router.push(`${basePath}?${params.toString()}`);
  };

  const handleMonthsInactiveChange = (value: string) => {
    const params = buildParams();
    if (value) params.set("months", value);
    else params.delete("months");
    router.push(`${basePath}?${params.toString()}`);
  };

  const setPreset = (preset: "month" | "quarter" | "year") => {
    const params = buildParams();
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
    router.push(`${basePath}?${params.toString()}`);
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
            className={cn(
              "h-11 min-w-[240px] justify-start rounded-xl text-left font-normal border-primary/20 hover:bg-primary/5",
              !dateRange?.from && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 size-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })}{" "}
                  –{" "}
                  {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                </>
              ) : (
                format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
              )
            ) : (
              <span>Selecione o período</span>
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
        <Select value={doctorId ?? "all"} onValueChange={handleDoctorChange}>
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
      {showGroupBy && (
        <Select
          value={groupBy ?? options[0]?.value}
          onValueChange={handleGroupByChange}
        >
          <SelectTrigger className="h-11 w-[180px] rounded-xl">
            <SelectValue placeholder="Agrupar por" />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {monthsInactive !== undefined && (
        <Select value={String(monthsInactive)} onValueChange={handleMonthsInactiveChange}>
          <SelectTrigger className="h-11 w-[220px] rounded-xl">
            <SelectValue placeholder="Sem consulta há" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">3 meses</SelectItem>
            <SelectItem value="6">6 meses</SelectItem>
            <SelectItem value="12">12 meses</SelectItem>
            <SelectItem value="24">24 meses</SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
