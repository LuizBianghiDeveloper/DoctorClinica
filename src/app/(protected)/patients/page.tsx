import { and, eq, ilike, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { UsersRound } from "lucide-react";
import { Suspense } from "react";
import {
  PageActions,
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/components/ui/page-container";
import { db } from "@/db";
import { patientsTable } from "@/db/schema";
import WithAuthentication from "@/hocs/with-authentication";
import { auth } from "@/lib/auth";

import AddPatientButton from "./_components/add-patient-button";
import { PatientsPagination } from "./_components/patients-pagination";
import { PatientsSearch } from "./_components/patients-search";
import { PatientsTableWithDialog } from "./_components/patients-table-with-dialog";

const PAGE_SIZE = 10;

interface PatientsPageProps {
  searchParams: Promise<{ search?: string; page?: string }>;
}

const PatientsPage = async ({ searchParams }: PatientsPageProps) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const { search, page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page ?? "1", 10) || 1);
  const clinicId = session!.user.clinic!.id;

  const baseWhere = eq(patientsTable.clinicId, clinicId);
  const where = search?.trim()
    ? and(baseWhere, ilike(patientsTable.name, `%${search.trim()}%`))
    : baseWhere;

  const [patients, countResult] = await Promise.all([
    db.query.patientsTable.findMany({
      where,
      limit: PAGE_SIZE,
      offset: (currentPage - 1) * PAGE_SIZE,
      orderBy: (t, { asc }) => [asc(t.name)],
    }),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(patientsTable)
      .where(where),
  ]);

  const totalCount = countResult[0]?.count ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <WithAuthentication mustHaveClinic mustHavePlan>
      <PageContainer className="relative overflow-hidden">
        <div className="absolute -right-32 -top-32 size-64 rounded-full bg-gradient-to-br from-indigo-500/5 to-cyan-500/5" />
        <div className="absolute -bottom-20 -left-20 size-80 rounded-full bg-gradient-to-br from-indigo-500/5 to-cyan-500/5" />
        <PageHeader className="relative">
          <PageHeaderContent>
            <PageTitle className="bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
              Pacientes
            </PageTitle>
            <PageDescription>
              Gerencie os pacientes da sua clínica
            </PageDescription>
          </PageHeaderContent>
          <PageActions>
            <AddPatientButton />
          </PageActions>
        </PageHeader>
        <PageContent>
          <div className="space-y-4">
            <Suspense fallback={<div className="h-11 max-w-sm animate-pulse rounded-xl border border-border/50 bg-muted/30" />}>
              <PatientsSearch search={search} />
            </Suspense>
            {totalCount === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/20 py-16 text-center">
                <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20">
                  <UsersRound className="text-muted-foreground size-8" />
                </div>
                <h3 className="mb-1 text-lg font-semibold">
                  {search?.trim() ? "Nenhum resultado encontrado" : "Nenhum paciente cadastrado"}
                </h3>
                <p className="text-muted-foreground mb-6 max-w-sm text-sm">
                  {search?.trim()
                    ? "Tente buscar por outro nome ou limpe o campo de pesquisa."
                    : "Comece adicionando o primeiro paciente da sua clínica para gerenciar agendamentos e histórico."}
                </p>
                {!search?.trim() && <AddPatientButton />}
              </div>
            ) : (
              <>
                <PatientsTableWithDialog patients={patients} />
                <PatientsPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalCount={totalCount}
                  pageSize={PAGE_SIZE}
                  search={search}
                />
              </>
            )}
          </div>
        </PageContent>
      </PageContainer>
    </WithAuthentication>
  );
};

export default PatientsPage;
