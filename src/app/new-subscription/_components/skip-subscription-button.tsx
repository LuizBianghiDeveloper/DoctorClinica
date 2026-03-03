"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";

import { skipSubscription } from "@/actions/skip-subscription";
import { Button } from "@/components/ui/button";

export function SkipSubscriptionButton() {
  const router = useRouter();
  const { execute, isExecuting } = useAction(skipSubscription, {
    onSuccess: () => {
      router.push("/dashboard");
    },
  });

  return (
    <Button
      type="button"
      variant="ghost"
      className="mt-4 w-full text-muted-foreground"
      onClick={() => execute(undefined)}
      disabled={isExecuting}
    >
      {isExecuting ? (
        <Loader2 className="mr-2 size-4 animate-spin" />
      ) : null}
      Continuar sem assinatura
    </Button>
  );
}
