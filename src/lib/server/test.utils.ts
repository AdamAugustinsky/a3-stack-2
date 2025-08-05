import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import * as schema from '$lib/server/db/schema';
import { migrate } from 'drizzle-orm/pglite/migrator';
import path from 'node:path';
import { createElysiaApp } from './elysia';
import { treaty } from '@elysiajs/eden';

export const createTestDb = async () => {
	const client = new PGlite();
	const db = drizzle({ client, schema });

	const cleanup = () => {
		client.close();
	};

	await migrate(db, {
		migrationsFolder: path.join(process.cwd(), 'drizzle')
	});
	return { db, cleanup };
};

export const createElysiaEdenTestApp = async () => {
	const { db, cleanup } = await createTestDb();
	const testElysiaApp = createElysiaApp(db);
	const eden = treaty(testElysiaApp);
	return { eden, cleanup };
};
