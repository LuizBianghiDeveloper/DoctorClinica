import { CheckCircle2, XCircle } from "lucide-react";

interface ConfirmarPresencaClientProps {
  status: "success" | "already_confirmed" | "error";
  message: string;
}

export function ConfirmarPresencaClient({
  status,
  message,
}: ConfirmarPresencaClientProps) {
  const isSuccess =
    status === "success" || status === "already_confirmed";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card p-8 shadow-xl">
        <div className="flex flex-col items-center text-center">
          {isSuccess ? (
            <CheckCircle2 className="text-primary mb-4 size-16 text-green-600" />
          ) : (
            <XCircle className="mb-4 size-16 text-destructive" />
          )}
          <h1 className="text-xl font-semibold">
            {isSuccess ? "Confirmação recebida" : "Oops"}
          </h1>
          <p className="mt-3 text-muted-foreground">{message}</p>
        </div>
      </div>
    </div>
  );
}
