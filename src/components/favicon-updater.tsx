"use client";

import { useEffect } from "react";

import { authClient } from "@/lib/auth-client";

const DEFAULT_FAVICON = "/icon";

export function FaviconUpdater() {
  const session = authClient.useSession();
  const logoUrl = (session.data?.user as { clinic?: { logoUrl?: string } } | undefined)
    ?.clinic?.logoUrl;

  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (link) {
      link.href = logoUrl ?? DEFAULT_FAVICON;
    }
  }, [logoUrl]);

  return null;
}
