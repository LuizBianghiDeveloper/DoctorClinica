import { Stethoscope } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

import { AuthenticationClient } from "./components/authentication-client";

const AuthenticationPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (session?.user) {
    redirect("/dashboard");
  }
  return (
    <div className="flex min-h-screen">
      {/* Painel esquerdo - Branding (estilo do print) */}
      <div className="relative hidden w-[480px] flex-shrink-0 overflow-hidden bg-gradient-to-b from-indigo-700 via-indigo-600 to-cyan-500 lg:block">
        {/* Formas geométricas decorativas */}
        <div className="absolute -left-16 -top-16 size-64 rounded-full bg-white/10" />
        <div className="absolute -right-20 top-1/3 size-80 rounded-full bg-white/5" />
        <div className="absolute bottom-20 left-1/4 size-40 rounded-full bg-white/8" />
        <div className="absolute left-0 top-0 size-32 rounded-full border border-white/20" />
        {/* Chevrons */}
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
        {/* Padrão de pontos */}
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
            <h1 className="text-4xl font-bold tracking-tight text-white">
              Olá, bem-vindo!
            </h1>
            <p className="mt-4 max-w-sm text-base text-white/90">
              Gerencie sua clínica de forma inteligente. Agende consultas, acompanhe pacientes e acesse relatórios em um só lugar.
            </p>
          </div>
        </div>
      </div>

      {/* Painel direito - Formulário */}
      <div className="flex flex-1 flex-col items-center justify-center bg-muted/30 p-6 sm:p-12 lg:bg-background">
        <AuthenticationClient />
      </div>
    </div>
  );
};

export default AuthenticationPage;
