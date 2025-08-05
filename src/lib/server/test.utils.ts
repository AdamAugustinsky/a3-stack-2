import * as schema from '$lib/server/db/schema';
import { PGlite } from '@electric-sql/pglite';
import { treaty } from '@elysiajs/eden';
import { drizzle } from 'drizzle-orm/pglite';
import { createElysiaApp } from './elysia';
import { migrate } from 'drizzle-orm/pglite/migrator';
import path from 'node:path';

export const createTestDb = async () => {
	console.time('time to create the pglite database');
	const client = new PGlite();
	const db = drizzle({ client, schema });

	const cleanup = () => {
		client.close();
	};

	await migrate(db, {
		migrationsFolder: path.join(process.cwd(), 'drizzle')
	});
	console.timeEnd('time to create the pglite database');
	return { db, cleanup };
};

export const createElysiaEdenTestApp = async () => {
	const { db, cleanup } = await createTestDb();
	const testElysiaApp = createElysiaApp(db);
	const eden = treaty(testElysiaApp);
	return { eden, cleanup, db };
};
