import { NextResponse } from "next/server";

import { runProactiveNotifications } from "@/lib/proactive-notifications";

/**
 * Cron job para notificações proativas:
 * - Lembrete 24h antes da consulta (com link de confirmação)
 * - Parabéns de aniversário
 *
 * Configure CRON_SECRET no .env. O vercel.json já define o cron para rodar a cada 2 horas.
 */
export const maxDuration = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runProactiveNotifications();
    return NextResponse.json({
      ok: true,
      reminders: result.reminders,
      birthdays: result.birthdays,
    });
  } catch (error) {
    console.error("[Cron notifications]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao executar" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
