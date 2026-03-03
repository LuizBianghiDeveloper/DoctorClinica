"use client";

import {
  BarChart3,
  CalendarDays,
  DoorOpen,
  FileSignature,
  FileText,
  Gem,
  LayoutDashboard,
  Loader2,
  LogOut,
  Settings,
  Stethoscope,
  UserCog,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";

const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Agendamentos",
    url: "/appointments",
    icon: CalendarDays,
  },
  {
    title: "Profissionais",
    url: "/doctors",
    icon: Stethoscope,
  },
  {
    title: "Pacientes",
    url: "/patients",
    icon: UsersRound,
  },
  {
    title: "Contratos",
    url: "/contracts",
    icon: FileSignature,
  },
  {
    title: "Salas e recursos",
    url: "/rooms",
    icon: DoorOpen,
  },
];

export function AppSidebar() {
  const router = useRouter();
  const session = authClient.useSession();
  const pathname = usePathname();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push("/authentication");
          },
        },
      });
    } finally {
      setIsSigningOut(false);
    }
  };
  return (
    <Sidebar>
      <SidebarHeader
        className={
          (session.data?.user as { clinic?: { primaryColor?: string } } | undefined)?.clinic
            ?.primaryColor
            ? "border-b border-sidebar-border/50 px-4 py-5"
            : "border-b border-sidebar-border/50 bg-gradient-to-br from-clinic-primary/10 via-transparent to-clinic-secondary/10 px-4 py-5"
        }
        style={
          (session.data?.user as { clinic?: { primaryColor?: string; secondaryColor?: string } } | undefined)
            ?.clinic?.primaryColor
            ? {
                background: `linear-gradient(to bottom right, ${(session.data?.user as { clinic?: { primaryColor?: string } })?.clinic?.primaryColor}15, transparent, ${(session.data?.user as { clinic?: { secondaryColor?: string } })?.clinic?.secondaryColor}15)`,
              }
            : undefined
        }
      >
        <Link href="/dashboard" className="flex items-center gap-2.5">
          {(session.data?.user as { clinic?: { logoUrl?: string } } | undefined)
            ?.clinic?.logoUrl ? (
            <div className="relative size-9 shrink-0 overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={(session.data?.user as { clinic?: { logoUrl?: string } })?.clinic?.logoUrl ?? ""}
                alt="Logo da clínica"
                className="size-full object-cover"
              />
            </div>
          ) : (
            <div
              className={
                (session.data?.user as { clinic?: { primaryColor?: string } } | undefined)?.clinic
                  ?.primaryColor
                  ? "relative flex size-9 shrink-0 items-center justify-center rounded-xl text-white shadow-md"
                  : "relative flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-clinic-primary to-clinic-secondary text-white shadow-md"
              }
              style={
                (session.data?.user as { clinic?: { primaryColor?: string; secondaryColor?: string } } | undefined)
                  ?.clinic?.primaryColor
                  ? {
                      background: `linear-gradient(to bottom right, ${(session.data?.user as { clinic?: { primaryColor?: string } })?.clinic?.primaryColor}, ${(session.data?.user as { clinic?: { secondaryColor?: string } })?.clinic?.secondaryColor ?? (session.data?.user as { clinic?: { primaryColor?: string } })?.clinic?.primaryColor})`,
                    }
                  : undefined
              }
            >
              <Stethoscope className="size-5" strokeWidth={2.5} />
            </div>
          )}
          <span className="text-base font-semibold tracking-tight text-foreground">
            Doutor Agenda
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="gap-1 px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {items.map((item) => {
                const isActive =
                  pathname === item.url ||
                  (item.url === "/contracts" &&
                    pathname.startsWith("/contracts")) ||
                  (item.url === "/rooms" && pathname.startsWith("/rooms"));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={
                        isActive
                          ? "rounded-xl bg-gradient-to-r from-clinic-primary/15 to-clinic-secondary/15 font-medium text-foreground [&>svg]:text-clinic-primary"
                          : "rounded-xl transition-colors hover:bg-clinic-primary/5 [&>svg]:text-muted-foreground"
                      }
                    >
                      <Link href={item.url}>
                        <item.icon className="size-4 shrink-0" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              {(session.data?.user as { role?: string } | undefined)?.role ===
                "admin" && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={
                        pathname === "/reports" ||
                        pathname.startsWith("/reports")
                      }
                      className={
                        pathname === "/reports" ||
                        pathname.startsWith("/reports")
                          ? "rounded-xl bg-gradient-to-r from-clinic-primary/15 to-clinic-secondary/15 font-medium [&>svg]:text-clinic-primary"
                          : "rounded-xl hover:bg-clinic-primary/5 [&>svg]:text-muted-foreground"
                      }
                    >
                      <Link href="/reports">
                        <BarChart3 className="size-4 shrink-0" />
                        <span>Relatórios</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === "/users"}
                      className={
                        pathname === "/users"
                          ? "rounded-xl bg-gradient-to-r from-clinic-primary/15 to-clinic-secondary/15 font-medium [&>svg]:text-clinic-primary"
                          : "rounded-xl hover:bg-clinic-primary/5 [&>svg]:text-muted-foreground"
                      }
                    >
                      <Link href="/users">
                        <UserCog className="size-4 shrink-0" />
                        <span>Usuários</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === "/auditoria"}
                      className={
                        pathname === "/auditoria"
                          ? "rounded-xl bg-gradient-to-r from-clinic-primary/15 to-clinic-secondary/15 font-medium [&>svg]:text-clinic-primary"
                          : "rounded-xl hover:bg-clinic-primary/5 [&>svg]:text-muted-foreground"
                      }
                    >
                      <Link href="/auditoria">
                        <FileText className="size-4 shrink-0" />
                        <span>Auditoria</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Outros
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/settings"}
                  className={
                    pathname === "/settings"
                      ? "rounded-xl bg-gradient-to-r from-clinic-primary/15 to-clinic-secondary/15 font-medium [&>svg]:text-clinic-primary"
                      : "rounded-xl hover:bg-clinic-primary/5 [&>svg]:text-muted-foreground"
                  }
                >
                  <Link href="/settings">
                    <Settings className="size-4 shrink-0" />
                    <span>Configurações</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/subscription"}
                  className={
                    pathname === "/subscription"
                      ? "rounded-xl bg-gradient-to-r from-clinic-primary/15 to-clinic-secondary/15 font-medium [&>svg]:text-clinic-primary"
                      : "rounded-xl hover:bg-clinic-primary/5 [&>svg]:text-muted-foreground"
                  }
                >
                  <Link href="/subscription">
                    <Gem className="size-4 shrink-0" />
                    <span>Assinatura</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="rounded-xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive [&>svg]:text-current"
                >
                  {isSigningOut ? (
                    <Loader2 className="size-4 shrink-0 animate-spin" />
                  ) : (
                    <LogOut className="size-4 shrink-0" />
                  )}
                  <span>{isSigningOut ? "Saindo..." : "Sair"}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/50 bg-gradient-to-br from-clinic-primary/5 via-transparent to-clinic-secondary/5 p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="rounded-xl border border-border/50 bg-card/50 shadow-sm transition-all hover:bg-card hover:shadow-md"
                >
                  <Avatar className="size-10 ring-2 ring-background">
                    <AvatarFallback className="bg-gradient-to-br from-clinic-primary to-clinic-secondary text-sm font-semibold text-white">
                      {session.data?.user?.clinic?.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2) ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 truncate text-left">
                    <p className="truncate text-sm font-medium">
                      {session.data?.user?.clinic?.name ?? "Clínica"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {session.data?.user?.email}
                    </p>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 size-4" />
                    Configurações
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                >
                  {isSigningOut ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <LogOut />
                  )}
                  {isSigningOut ? "Saindo..." : "Sair"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
