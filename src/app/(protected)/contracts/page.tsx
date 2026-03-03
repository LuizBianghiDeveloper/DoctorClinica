import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

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
import { contractTemplatesTable, patientsTable } from "@/db/schema";
import WithAuthentication from "@/hocs/with-authentication";
import { auth } from "@/lib/auth";

import AddContractTemplateButton from "./_components/add-contract-template-button";
import ContractsList from "./_components/contracts-list";

const ContractsPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) redirect("/authentication");
  if (!session.user.clinic) redirect("/clinic-form");

  const [templates, patients] = await Promise.all([
    db.query.contractTemplatesTable.findMany({
      where: eq(contractTemplatesTable.clinicId, session.user.clinic.id),
      orderBy: (t, { asc }) => [asc(t.name)],
    }),
    db.query.patientsTable.findMany({
      where: eq(patientsTable.clinicId, session.user.clinic.id),
      columns: { id: true, name: true, email: true, phoneNumber: true, birthDate: true },
      orderBy: (t, { asc }) => [asc(t.name)],
    }),
  ]);

  const patientsForSelect = patients.map((p) => ({
    id: p.id,
    name: p.name,
    email: p.email,
    phoneNumber: p.phoneNumber,
    birthDate: p.birthDate ? String(p.birthDate).slice(0, 10) : null,
  }));

  return (
    <WithAuthentication mustHaveClinic mustHavePlan>
      <PageContainer className="relative overflow-hidden">
        <div className="absolute -right-32 -top-32 size-64 rounded-full bg-gradient-to-br from-clinic-primary/5 to-clinic-secondary/5" />
        <div className="absolute -bottom-20 -left-20 size-80 rounded-full bg-gradient-to-br from-clinic-primary/5 to-clinic-secondary/5" />
        <PageHeader className="relative">
          <PageHeaderContent>
            <PageTitle className="bg-gradient-to-r from-clinic-primary to-clinic-secondary bg-clip-text text-transparent">
              Contratos
            </PageTitle>
            <PageDescription>
              Modelos de contrato e geração de PDF
            </PageDescription>
          </PageHeaderContent>
          <PageActions>
            <AddContractTemplateButton />
          </PageActions>
        </PageHeader>
        <PageContent>
          <ContractsList
            templates={templates}
            clinicName={session.user.clinic.name}
            patients={patientsForSelect}
          />
        </PageContent>
      </PageContainer>
    </WithAuthentication>
  );
};

export default ContractsPage;
