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
import WithAuthentication from "@/hocs/with-authentication";
import { auth } from "@/lib/auth";

import { ChangePasswordForm } from "./_components/change-password-form";

const SettingsPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) redirect("/authentication");

  return (
    <WithAuthentication mustHaveClinic>
      <PageContainer className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-32 -top-32 size-64 rounded-full bg-gradient-to-br from-indigo-500/5 to-cyan-500/5" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 size-80 rounded-full bg-gradient-to-br from-indigo-500/5 to-cyan-500/5" />
        <PageHeader className="relative">
          <PageHeaderContent>
            <PageTitle className="bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
              Configurações
            </PageTitle>
            <PageDescription>
              Gerencie suas informações e preferências da conta
            </PageDescription>
          </PageHeaderContent>
        </PageHeader>
        <PageContent className="relative">
          <div className="space-y-6">
            <ChangePasswordForm userEmail={session.user.email} />
          </div>
        </PageContent>
      </PageContainer>
    </WithAuthentication>
  );
};

export default SettingsPage;
