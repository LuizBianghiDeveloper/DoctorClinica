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
import { usersToClinicsTable } from "@/db/schema";
import WithAuthentication from "@/hocs/with-authentication";
import { auth } from "@/lib/auth";

import CreateUserButton from "./_components/create-user-button";
import UsersTable from "./_components/users-table";

const UsersPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    redirect("/authentication");
  }
  if (!session.user.clinic) {
    redirect("/clinic-form");
  }
  const isAdmin = (session.user as { role?: string }).role === "admin";
  const members = await db.query.usersToClinicsTable.findMany({
    where: eq(usersToClinicsTable.clinicId, session.user.clinic.id),
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          email: true,
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
              Usuários
            </PageTitle>
            <PageDescription>
              Gerencie os usuários com acesso à clínica
            </PageDescription>
          </PageHeaderContent>
          <PageActions>
            {isAdmin && <CreateUserButton />}
          </PageActions>
        </PageHeader>
        <PageContent className="relative">
          <UsersTable
            members={members.map((m) => ({
              id: m.userId,
              name: m.user.name,
              email: m.user.email,
              role: m.role,
            }))}
            isAdmin={isAdmin}
            currentUserId={session.user.id}
          />
        </PageContent>
      </PageContainer>
    </WithAuthentication>
  );
};

export default UsersPage;
