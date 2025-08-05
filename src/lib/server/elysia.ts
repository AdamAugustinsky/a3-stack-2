import { eq, inArray, count, gte, and } from 'drizzle-orm';
import { Elysia, t } from 'elysia';
import { db, type GenericPostgresDrizzle } from './db';
import { todo } from './db/schema/todo';

export const createElysiaApp = (db: GenericPostgresDrizzle) =>
	new Elysia({ prefix: '/api' })
		.get('/', () => 'hi')
		.post('/', ({ body }) => body, {
			body: t.Object({
				name: t.String()
			})
		})
		.group('/todo', (app) =>
			app
				.get('/', async () => db.select().from(todo))

				.post(
					'/',
					async ({ body }) =>
						db
							.insert(todo)
							.values({
								text: body.text,
								completed: !!body.completed,
								priority: body.priority ?? 'medium',
								status: body.status ?? 'todo',
								label: body.label ?? 'feature',
								createdAt: new Date(),
								updatedAt: new Date()
							})
							.returning(),
					{
						body: t.Object({
							text: t.String(),
							completed: t.Optional(t.Boolean()),
							priority: t.Optional(
								t.Union([t.Literal('low'), t.Literal('medium'), t.Literal('high')])
							),
							status: t.Optional(
								t.Union([
									t.Literal('backlog'),
									t.Literal('todo'),
									t.Literal('in progress'),
									t.Literal('done'),
									t.Literal('canceled')
								])
							),
							label: t.Optional(
								t.Union([t.Literal('bug'), t.Literal('feature'), t.Literal('documentation')])
							)
						})
					}
				)

				.patch(
					'/toggle',
					async ({ body }) =>
						db
							.update(todo)
							.set({ completed: body.completed, updatedAt: new Date() })
							.where(eq(todo.id, body.id))
							.returning(),
					{
						body: t.Object({
							id: t.Number(),
							completed: t.Boolean()
						})
					}
				)

				.patch(
					'/:id',
					async ({ params: { id }, body }) =>
						db
							.update(todo)
							.set({ ...body, updatedAt: new Date() })
							.where(eq(todo.id, Number(id)))
							.returning(),
					{
						body: t.Object({
							text: t.String(),
							label: t.Union([t.Literal('bug'), t.Literal('feature'), t.Literal('documentation')]),
							status: t.Union([
								t.Literal('backlog'),
								t.Literal('todo'),
								t.Literal('in progress'),
								t.Literal('done'),
								t.Literal('canceled')
							]),
							priority: t.Union([t.Literal('low'), t.Literal('medium'), t.Literal('high')])
						})
					}
				)

				.delete('/:id', async ({ params: { id } }) =>
					db
						.delete(todo)
						.where(eq(todo.id, Number(id)))
						.returning()
				)

				.patch(
					'/bulk',
					async ({ body }) =>
						db
							.update(todo)
							.set({ ...body.updates, updatedAt: new Date() })
							.where(inArray(todo.id, body.ids))
							.returning(),
					{
						body: t.Object({
							ids: t.Array(t.Number()),
							updates: t.Object({
								label: t.Optional(
									t.Union([t.Literal('bug'), t.Literal('feature'), t.Literal('documentation')])
								),
								status: t.Optional(
									t.Union([
										t.Literal('backlog'),
										t.Literal('todo'),
										t.Literal('in progress'),
										t.Literal('done'),
										t.Literal('canceled')
									])
								),
								priority: t.Optional(
									t.Union([t.Literal('low'), t.Literal('medium'), t.Literal('high')])
								)
							})
						})
					}
				)

				.delete(
					'/bulk',
					async ({ body }) => db.delete(todo).where(inArray(todo.id, body.ids)).returning(),
					{
						body: t.Object({
							ids: t.Array(t.Number())
						})
					}
				)
		)
		.group('/dashboard', (app) =>
			app
				.get('/stats', async () => {
					const [
						totalTodos,
						todosByStatus,
						todosByPriority,
						todosByLabel,
						completedTodos,
						inProgressTodos,
						highPriorityTodos
					] = await Promise.all([
						db.select({ count: count() }).from(todo),
						db.select({ status: todo.status, count: count() }).from(todo).groupBy(todo.status),
						db
							.select({ priority: todo.priority, count: count() })
							.from(todo)
							.groupBy(todo.priority),
						db.select({ label: todo.label, count: count() }).from(todo).groupBy(todo.label),
						db.select({ count: count() }).from(todo).where(eq(todo.status, 'done')),
						db.select({ count: count() }).from(todo).where(eq(todo.status, 'in progress')),
						db
							.select({ count: count() })
							.from(todo)
							.where(and(eq(todo.priority, 'high'), eq(todo.status, 'todo')))
					]);

					const totalCount = Number(totalTodos[0]?.count) || 0;
					const completedCount = Number(completedTodos[0]?.count) || 0;
					const completionRate = totalCount
						? Math.round((completedCount / totalCount) * 1000) / 10
						: 0;

					function toDict<
						R extends Record<string, unknown> & { count: number },
						K extends keyof R & string
					>(rows: R[], key: K): Record<string, number> {
						const acc: Record<string, number> = {};
						for (const r of rows) {
							const k = r[key];
							if (typeof k === 'string') acc[k] = Number(r.count) || 0;
						}
						return acc;
					}

					return {
						totalTodos: totalCount,
						completedTodos: completedCount,
						inProgressTodos: Number(inProgressTodos[0]?.count) || 0,
						highPriorityTodos: Number(highPriorityTodos[0]?.count) || 0,
						completionRate,
						todosByStatus: toDict(todosByStatus, 'status'),
						todosByPriority: toDict(todosByPriority, 'priority'),
						todosByLabel: toDict(todosByLabel, 'label')
					};
				})

				.get('/activity', async () => {
					// build dense 30-day window
					const end = new Date();
					const start = new Date(end);
					start.setHours(0, 0, 0, 0);
					start.setDate(start.getDate() - 29);
					const keyOf = (d: Date) => d.toISOString().slice(0, 10);
					const dayMap = new Map<
						string,
						{ date: Date; created: number; completed: number; inProgress: number; total: number }
					>();
					for (let i = 0; i < 30; i++) {
						const d = new Date(start);
						d.setDate(start.getDate() + i);
						dayMap.set(keyOf(d), { date: d, created: 0, completed: 0, inProgress: 0, total: 0 });
					}

					const [createdActivity, updatedActivity] = await Promise.all([
						db
							.select({ date: todo.createdAt, status: todo.status, count: count() })
							.from(todo)
							.where(gte(todo.createdAt, start))
							.groupBy(todo.createdAt, todo.status)
							.orderBy(todo.createdAt),
						db
							.select({ date: todo.updatedAt, status: todo.status, count: count() })
							.from(todo)
							.where(gte(todo.updatedAt, start))
							.groupBy(todo.updatedAt, todo.status)
							.orderBy(todo.updatedAt)
					]);

					for (const item of createdActivity) {
						if (!item.date) continue;
						const day = dayMap.get(keyOf(item.date));
						if (!day) continue;
						const n = Number(item.count) || 0;
						day.created += n;
						day.total += n;
					}

					for (const item of updatedActivity) {
						if (!item.date) continue;
						const day = dayMap.get(keyOf(item.date));
						if (!day) continue;
						const n = Number(item.count) || 0;
						if (item.status === 'done') day.completed += n;
						else if (item.status === 'in progress') day.inProgress += n;
					}

					return Array.from(dayMap.values());
				})
		);
export const app = createElysiaApp(db);
