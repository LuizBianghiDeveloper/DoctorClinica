import dayjs from "dayjs";
import { Calendar } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/components/ui/page-container";
import { getDashboard } from "@/data/get-dashboard";
import WithAuthentication from "@/hocs/with-authentication";
import { auth } from "@/lib/auth";

import { dashboardAppointmentsTableColumns } from "../appointments/_components/table-columns";
import AppointmentsChart from "./_components/appointments-chart";
import { BirthdayCard } from "./_components/birthday-card";
import StatsCards from "./_components/stats-cards";
import TopDoctors from "./_components/top-doctors";

interface DashboardPageProps {
  searchParams: Promise<{
    from: string;
    to: string;
  }>;
}

const DashboardPage = async ({ searchParams }: DashboardPageProps) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    redirect("/authentication");
  }
  if (!session.user.clinic) {
    redirect("/clinic-form");
  }
  const { from, to } = await searchParams;
  if (!from || !to) {
    redirect(
      `/dashboard?from=${dayjs().format("YYYY-MM-DD")}&to=${dayjs().add(1, "month").format("YYYY-MM-DD")}`,
    );
  }
  const {
    totalRevenue,
    totalAppointments,
    totalPatients,
    totalDoctors,
    topDoctors,
    todayBirthdays,
    todayAppointments,
    dailyAppointmentsData,
  } = await getDashboard({
    from,
    to,
    session: {
      user: {
        clinic: {
          id: session.user.clinic.id,
        },
      },
    },
  });

  return (
    <WithAuthentication mustHaveClinic mustHavePlan>
      <PageContainer className="relative overflow-hidden">
        <div className="absolute -right-32 -top-32 size-64 rounded-full bg-gradient-to-br from-clinic-primary/5 to-clinic-secondary/5" />
        <div className="absolute -bottom-20 -left-20 size-80 rounded-full bg-gradient-to-br from-clinic-primary/5 to-clinic-secondary/5" />
        <PageHeader className="relative">
          <PageHeaderContent>
            <PageTitle className="bg-gradient-to-r from-clinic-primary to-clinic-secondary bg-clip-text text-transparent">
              Dashboard
            </PageTitle>
            <PageDescription>
              Tenha uma visão geral da sua clínica.
            </PageDescription>
          </PageHeaderContent>
        </PageHeader>
        <PageContent>
          <StatsCards
            totalRevenue={
              totalRevenue !== null && totalRevenue.total
                ? Number(totalRevenue.total)
                : null
            }
            totalAppointments={totalAppointments.total}
            totalPatients={totalPatients.total}
            totalDoctors={totalDoctors.total}
          />
          <div
            className={
              session.user.role === "admin"
                ? "grid grid-cols-1 gap-4 lg:grid-cols-[2.25fr_1fr] lg:min-w-0"
                : "grid grid-cols-1 gap-4"
            }
          >
            {session.user.role === "admin" && (
              <div className="min-w-0">
                <AppointmentsChart
                dailyAppointmentsData={dailyAppointmentsData}
                showRevenue
              />
              </div>
            )}
            <div className="min-w-0">
              <TopDoctors doctors={topDoctors} />
            </div>
          </div>
          <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[2.25fr_1fr]">
            <Card className="min-w-0 rounded-2xl shadow-xl shadow-primary/5">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-clinic-primary to-clinic-secondary text-white shadow-md">
                    <Calendar className="size-5" />
                  </div>
                  <CardTitle className="text-base">
                    Agendamentos de hoje
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={dashboardAppointmentsTableColumns}
                  data={todayAppointments}
                />
              </CardContent>
            </Card>
            <div className="min-w-0">
              <BirthdayCard patients={todayBirthdays} />
            </div>
          </div>
        </PageContent>
      </PageContainer>
    </WithAuthentication>
  );
};

export default DashboardPage;
