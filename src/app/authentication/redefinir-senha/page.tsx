import Link from "next/link";

import { Button } from "@/components/ui/button";

import { ResetPasswordForm } from "./_components/reset-password-form";

interface RedefinirSenhaPageProps {
  searchParams: Promise<{ token?: string; error?: string }>;
}

export default async function RedefinirSenhaPage({
  searchParams,
}: RedefinirSenhaPageProps) {
  const params = await searchParams;
  const token = params.token ?? "";
  const error = params.error;

  if (error === "INVALID_TOKEN" || !token) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6">
        <div className="w-full max-w-[420px] space-y-6 rounded-xl border border-border/50 bg-card p-8 shadow-lg">
          <div>
            <h1 className="text-xl font-semibold">Link inválido ou expirado</h1>
            <p className="mt-1 text-sm text-muted-foreground">
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
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-[420px] space-y-6 rounded-xl border border-border/50 bg-card p-8 shadow-lg">
        <div>
          <h1 className="text-xl font-semibold">Nova senha</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Digite sua nova senha abaixo. Use pelo menos 8 caracteres.
          </p>
        </div>
        <ResetPasswordForm token={token} />
        <Button asChild variant="ghost" className="w-full">
          <Link href="/authentication">Voltar ao login</Link>
        </Button>
      </div>
    </div>
  );
}
