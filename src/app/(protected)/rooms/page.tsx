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
import { roomsTable } from "@/db/schema";
import WithAuthentication from "@/hocs/with-authentication";
import { auth } from "@/lib/auth";

import AddRoomButton from "./_components/add-room-button";
import RoomsList from "./_components/rooms-list";

const RoomsPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) redirect("/authentication");
  if (!session.user.clinic) redirect("/clinic-form");

  const rooms = await db.query.roomsTable.findMany({
    where: eq(roomsTable.clinicId, session.user.clinic.id),
    orderBy: (r, { asc }) => [asc(r.displayOrder), asc(r.name)],
  });

  return (
    <WithAuthentication mustHaveClinic mustHavePlan>
      <PageContainer className="relative overflow-hidden">
        <div className="absolute -right-32 -top-32 size-64 rounded-full bg-gradient-to-br from-clinic-primary/5 to-clinic-secondary/5" />
        <div className="absolute -bottom-20 -left-20 size-80 rounded-full bg-gradient-to-br from-clinic-primary/5 to-clinic-secondary/5" />
        <PageHeader className="relative">
          <PageHeaderContent>
            <PageTitle className="bg-gradient-to-r from-clinic-primary to-clinic-secondary bg-clip-text text-transparent">
              Salas e recursos
            </PageTitle>
            <PageDescription>
              Consulte consultórios e equipamentos. Evite conflitos ao agendar.
            </PageDescription>
          </PageHeaderContent>
          <PageActions>
            <AddRoomButton />
          </PageActions>
        </PageHeader>
        <PageContent className="relative">
          <RoomsList rooms={rooms} />
        </PageContent>
      </PageContainer>
    </WithAuthentication>
  );
};

export default RoomsPage;
