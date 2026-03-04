import { type NextRequest, NextResponse } from "next/server";
import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth";

const handler = toNextJsHandler(auth);

function withErrorLogging(
  fn: (req: NextRequest, ctx?: unknown) => Promise<Response>,
) {
  return async (req: NextRequest, ctx?: unknown) => {
    try {
      return await fn(req, ctx);
    } catch (error) {
      console.error("[Auth API] Error:", error);
      const message =
        error instanceof Error ? error.message : "Unknown auth error";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  };
}

export const POST = withErrorLogging(handler.POST);
export const GET = withErrorLogging(handler.GET);
