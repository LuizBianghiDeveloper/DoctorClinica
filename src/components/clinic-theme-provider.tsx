"use client";

import { authClient } from "@/lib/auth-client";

const DEFAULT_PRIMARY = "#4f46e5";
const DEFAULT_SECONDARY = "#06b6d4";

export function ClinicThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = authClient.useSession();
  const clinic = (session.data?.user as { clinic?: { primaryColor?: string; secondaryColor?: string } } | undefined)?.clinic;
  const primary = clinic?.primaryColor ?? DEFAULT_PRIMARY;
  const secondary = clinic?.secondaryColor ?? DEFAULT_SECONDARY;

  return (
    <div
      className="min-h-full"
      style={
        {
          "--clinic-primary": primary,
          "--clinic-secondary": secondary,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
