import "dotenv/config";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

// Pool com opções que reduzem ECONNRESET: SSL quando necessário, timeouts e limite de conexões
const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 15_000,
  // SSL: ativar se a URL tiver sslmode=require ou for um host remoto (ex.: Neon, Supabase, Vercel Postgres)
  ssl:
    connectionString.includes("sslmode=require") ||
    (connectionString.includes("localhost") ? false : { rejectUnauthorized: false }),
});

export const db = drizzle({ client: pool, schema });
