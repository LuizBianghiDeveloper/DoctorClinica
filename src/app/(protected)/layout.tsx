import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

import { AppSidebar } from "./_components/app-sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
        <AppSidebar />
      <main className="relative flex min-h-screen w-full min-w-0 flex-col overflow-x-hidden bg-gradient-to-br from-background via-background to-muted/20">
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b border-border/40 bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
          <SidebarTrigger />
        </header>
        <div className="flex min-w-0 flex-1 overflow-x-hidden">{children}</div>
      </main>
    </SidebarProvider>
  );
}
