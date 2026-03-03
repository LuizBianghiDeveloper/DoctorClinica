import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

export default async function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    redirect("/authentication");
  }
  const isAdmin = (session.user as { role?: string }).role === "admin";
  if (!isAdmin) {
    redirect("/dashboard");
  }
  return <>{children}</>;
}
