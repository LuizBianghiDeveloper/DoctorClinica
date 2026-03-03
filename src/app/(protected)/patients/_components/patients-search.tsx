"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Input } from "@/components/ui/input";

interface PatientsSearchProps {
  search?: string;
}

export function PatientsSearch({ search }: PatientsSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(search ?? "");
  useEffect(() => {
    setValue(search ?? "");
  }, [search]);

  const updateSearch = useCallback(
    (newSearch: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (newSearch.trim()) {
        params.set("search", newSearch.trim());
      } else {
        params.delete("search");
      }
      params.delete("page");
      router.push(`/patients?${params.toString()}`);
    },
    [router, searchParams],
  );

  return (
    <div className="relative max-w-sm">
      <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
      <Input
        type="search"
        placeholder="Buscar por nome..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            updateSearch(value);
          }
        }}
        onBlur={() => updateSearch(value)}
        className="h-11 rounded-xl border-primary/20 pl-9 shadow-sm transition-colors focus-visible:border-primary/40"
      />
    </div>
  );
}
