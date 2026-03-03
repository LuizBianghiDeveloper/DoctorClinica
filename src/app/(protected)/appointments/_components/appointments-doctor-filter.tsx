"use client";

import { useRouter, useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AppointmentsDoctorFilterProps {
  doctors: { id: string; name: string }[];
  selectedDoctorId: string | null;
}

export function AppointmentsDoctorFilter({
  doctors,
  selectedDoctorId,
}: AppointmentsDoctorFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("doctorId", value);
    } else {
      params.delete("doctorId");
    }
    router.push(`/appointments?${params.toString()}`);
  };

  return (
    <Select
      value={selectedDoctorId ?? "all"}
      onValueChange={(v) => handleChange(v === "all" ? "" : v)}
    >
      <SelectTrigger className="h-11 w-[220px] rounded-xl">
        <SelectValue placeholder="Filtrar por profissional" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todos os profissionais</SelectItem>
        {doctors.map((d) => (
          <SelectItem key={d.id} value={d.id}>
            {d.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
