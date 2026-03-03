import { Briefcase } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardTitle } from "@/components/ui/card";

interface TopDoctorsProps {
  doctors: {
    id: string;
    name: string;
    avatarImageUrl: string | null;
    specialty: string;
    appointments: number;
  }[];
}

export default function TopDoctors({ doctors }: TopDoctorsProps) {
  return (
    <Card className="mx-auto min-w-0 w-full overflow-hidden rounded-2xl shadow-xl shadow-primary/5">
      <CardContent>
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-white shadow-md">
              <Briefcase className="size-5" />
            </div>
            <CardTitle className="text-base">Profissionais</CardTitle>
          </div>
        </div>

        {/* Doctors List */}
        <div className="space-y-6">
          {doctors.map((doctor) => (
            <div
              key={doctor.id}
              className="flex flex-col gap-2 rounded-xl border border-border/50 bg-muted/20 px-4 py-3 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-4">
                <Avatar className="size-10 shrink-0 ring-2 ring-background">
                  <AvatarFallback className="bg-gradient-to-br from-indigo-100 to-cyan-100 text-sm font-medium text-indigo-700">
                    {doctor.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h3 className="truncate text-sm">{doctor.name}</h3>
                  <p className="text-muted-foreground truncate text-sm">
                    {doctor.specialty}
                  </p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <span className="text-muted-foreground text-sm font-medium">
                  {doctor.appointments} agend.
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
