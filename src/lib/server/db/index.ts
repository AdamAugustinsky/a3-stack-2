import { drizzle } from 'drizzle-orm/bun-sql';
import * as schema from './schema';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';

if (!Bun.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

export const db = drizzle(Bun.env.DATABASE_URL, { schema });

export type GenericPostgresDrizzle = PgDatabase<PgQueryResultHKT, typeof schema>;
