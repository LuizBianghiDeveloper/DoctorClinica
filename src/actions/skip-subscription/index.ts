"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { usersTable } from "@/db/schema";
import { protectedActionClient } from "@/lib/next-safe-action";

export const skipSubscription = protectedActionClient.action(async ({ ctx }) => {
  await db
    .update(usersTable)
    .set({ plan: "essential" })
    .where(eq(usersTable.id, ctx.user.id));
  revalidatePath("/", "layout");
  return { success: true };
});
