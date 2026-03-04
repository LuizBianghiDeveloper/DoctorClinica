import { KeyRound, Stethoscope } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import { ResetPasswordForm } from "./_components/reset-password-form";

interface RedefinirSenhaPageProps {
  searchParams: Promise<{ token?: string; error?: string }>;
}

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Painel esquerdo - Branding */}
      <div className="relative hidden w-[480px] flex-shrink-0 overflow-hidden bg-gradient-to-b from-clinic-primary via-clinic-primary/90 to-clinic-secondary lg:block">
        <div className="absolute -left-16 -top-16 size-64 rounded-full bg-white/10" />
        <div className="absolute -right-20 top-1/3 size-80 rounded-full bg-white/5" />
        <div className="absolute bottom-20 left-1/4 size-40 rounded-full bg-white/8" />
        <div className="absolute left-0 top-0 size-32 rounded-full border border-white/20" />
        <div className="absolute left-4 top-8 flex gap-1 opacity-40">
          <svg className="size-6 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z" />
          </svg>
          <svg className="size-5 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z" />
          </svg>
        </div>
        <div className="absolute bottom-1/3 left-1/2 flex -translate-x-1/2 gap-2 opacity-30">
          <svg className="size-8 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z" />
          </svg>
          <svg className="size-6 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z" />
          </svg>
        </div>
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: "24px 24px",
          }}
        />
        <div className="relative flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-2">
            <div className="relative flex size-10 items-center justify-center rounded-full border-2 border-white bg-white/10">
              <Stethoscope className="size-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-semibold tracking-widest text-white">
              DOUTOR AGENDA
            </span>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl border-2 border-white/30 bg-white/10">
              <KeyRound className="size-8 text-white" strokeWidth={2} />
            </div>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-white">
              Nova senha
            </h1>
            <p className="mt-4 max-w-sm text-base text-white/90">
              Crie uma senha segura para acessar sua conta. Use pelo menos 8 caracteres.
            </p>
          </div>
        </div>
      </div>

      {/* Painel direito - Formulário */}
      <div className="flex flex-1 flex-col items-center justify-center bg-muted/30 p-6 sm:p-12 lg:bg-background">
        <div className="w-full max-w-[420px] animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground lg:hidden">
              Doutor Agenda
            </h2>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

export default async function RedefinirSenhaPage({
  searchParams,
}: RedefinirSenhaPageProps) {
  const params = await searchParams;
  const token = params.token ?? "";
  const error = params.error;

  if (error === "INVALID_TOKEN" || !token) {
    return (
      <AuthLayout>
        <div className="space-y-6 rounded-xl border border-border/50 bg-card p-8 shadow-lg sm:p-10">
          <div className="flex justify-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-destructive/10">
              <KeyRound className="size-6 text-destructive" strokeWidth={2} />
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold">Link inválido ou expirado</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              O link de recuperação expirou ou já foi utilizado. Solicite um novo
              link na página de recuperar senha.
            </p>
          </div>
          <Button asChild className="w-full">
            <Link href="/authentication/recuperar-senha">
              Solicitar novo link
            </Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="space-y-6 rounded-xl border border-border/50 bg-card p-8 shadow-lg sm:p-10">
        <div>
          <h1 className="text-xl font-semibold">Criar nova senha</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Digite sua nova senha abaixo. Use pelo menos 8 caracteres.
          </p>
        </div>
        <ResetPasswordForm token={token} />
        <Button asChild variant="ghost" className="w-full">
          <Link href="/authentication">Voltar ao login</Link>
        </Button>
      </div>
    </AuthLayout>
  );
}
