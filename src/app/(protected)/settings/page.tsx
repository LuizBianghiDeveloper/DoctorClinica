import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/components/ui/page-container";
import { getClinic } from "@/data/get-clinic";
import WithAuthentication from "@/hocs/with-authentication";
import { auth } from "@/lib/auth";

import { ChangePasswordForm } from "./_components/change-password-form";
import { ClinicForm } from "./_components/clinic-form";

const SettingsPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) redirect("/authentication");
  if (!session.user.clinic?.id) redirect("/clinic-form");

  const { clinic, businessHours } = await getClinic(session.user.clinic.id);

  return (
    <WithAuthentication mustHaveClinic>
      <PageContainer className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-32 -top-32 size-64 rounded-full bg-gradient-to-br from-clinic-primary/5 to-clinic-secondary/5" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 size-80 rounded-full bg-gradient-to-br from-clinic-primary/5 to-clinic-secondary/5" />
        <PageHeader className="relative">
          <PageHeaderContent>
            <PageTitle className="bg-gradient-to-r from-clinic-primary to-clinic-secondary bg-clip-text text-transparent">
              Configurações
            </PageTitle>
            <PageDescription>
              Gerencie suas informações e preferências da conta
            </PageDescription>
          </PageHeaderContent>
        </PageHeader>
        <PageContent className="relative">
          <div className="space-y-10">
            <ClinicForm clinic={clinic ?? null} businessHours={businessHours} />
            <ChangePasswordForm userEmail={session.user.email} />
          </div>
        </PageContent>
      </PageContainer>
    </WithAuthentication>
  );
};

export default SettingsPage;
