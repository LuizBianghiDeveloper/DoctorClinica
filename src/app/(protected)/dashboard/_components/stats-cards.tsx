import {
  CalendarIcon,
  DollarSignIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrencyInCents } from "@/helpers/currency";

interface StatsCardsProps {
  totalRevenue: number | null;
  totalAppointments: number;
  totalPatients: number;
  totalDoctors: number;
}

const StatsCards = ({
  totalRevenue,
  totalAppointments,
  totalPatients,
  totalDoctors,
}: StatsCardsProps) => {
  const stats = [
    ...(totalRevenue !== null
      ? [
          {
            title: "Faturamento",
            value: formatCurrencyInCents(totalRevenue),
            icon: DollarSignIcon,
            iconBg: "bg-gradient-to-br from-emerald-500 to-cyan-500",
          },
        ]
      : []),
    {
      title: "Agendamentos",
      value: totalAppointments.toString(),
      icon: CalendarIcon,
      iconBg: "bg-gradient-to-br from-indigo-500 to-blue-500",
    },
    {
      title: "Pacientes",
      value: totalPatients.toString(),
      icon: UserIcon,
      iconBg: "bg-gradient-to-br from-violet-500 to-purple-500",
    },
    {
      title: "Profissionais",
      value: totalDoctors.toString(),
      icon: UsersIcon,
      iconBg: "bg-gradient-to-br from-indigo-500 to-cyan-500",
    },
  ];

  const gridCols =
    stats.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3";

  return (
    <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 ${gridCols}`}>
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card
            key={stat.title}
            className="rounded-2xl shadow-xl shadow-primary/5 transition-shadow hover:shadow-2xl hover:shadow-primary/10"
          >
            <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
              <div
                className={`flex size-11 items-center justify-center rounded-xl text-white shadow-md ${stat.iconBg}`}
              >
                <Icon className="size-5" />
              </div>
              <CardTitle className="text-muted-foreground text-sm font-medium">
                {stat.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight">
                {stat.value}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default StatsCards;
