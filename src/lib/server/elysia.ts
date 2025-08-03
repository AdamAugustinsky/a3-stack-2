import { eq, inArray, count, and, gte } from 'drizzle-orm';
import { Elysia, t } from 'elysia';
import { db } from './db';
import { todo } from './db/schema/todo';

export const app = new Elysia({ prefix: '/api' })
	.get('/', () => 'hi')
	.post('/', ({ body }) => body, {
		body: t.Object({
			name: t.String()
		})
	})
	.group('/todo', (app) =>
		app
			.get('/', async () => {
				return await db.select().from(todo);
			})

			.post(
				'/',
				async ({ body }) => {
					const now = new Date();
					const todoData = {
						text: body.text,
						completed: body.completed ?? false,
						priority: body.priority ?? 'medium',
						status: body.status ?? 'todo',
						label: body.label ?? 'feature',
						createdAt: now,
						updatedAt: now
					};
					return await db.insert(todo).values(todoData);
				},
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
				async ({ body }) => {
					return await db
						.update(todo)
						.set({
							completed: body.completed,
							updatedAt: new Date()
						})
						.where(eq(todo.id, body.id));
				},
				{
					body: t.Object({
						id: t.Number(),
						completed: t.Boolean()
					})
				}
			)

			.patch(
				'/:id',
				async ({ params: { id }, body }) => {
					return await db
						.update(todo)
						.set({
							...body,
							updatedAt: new Date()
						})
						.where(eq(todo.id, Number(id)));
				},
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

			.delete('/:id', async ({ params: { id } }) => {
				return await db.delete(todo).where(eq(todo.id, Number(id)));
			})

			.patch(
				'/bulk',
				async ({ body }) => {
					const { ids, updates } = body;
					return await db
						.update(todo)
						.set({
							...updates,
							updatedAt: new Date()
						})
						.where(inArray(todo.id, ids));
				},
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
				async ({ body }) => {
					const { ids } = body;
					return await db.delete(todo).where(inArray(todo.id, ids));
				},
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
				// Get total todos
				const totalTodos = await db.select({ count: count() }).from(todo);

				// Get todos by status
				const todosByStatus = await db
					.select({
						status: todo.status,
						count: count()
					})
					.from(todo)
					.groupBy(todo.status);

				// Get todos by priority
				const todosByPriority = await db
					.select({
						priority: todo.priority,
						count: count()
					})
					.from(todo)
					.groupBy(todo.priority);

				// Get todos by label
				const todosByLabel = await db
					.select({
						label: todo.label,
						count: count()
					})
					.from(todo)
					.groupBy(todo.label);

				// Calculate completion rate
				const completedTodos = await db
					.select({ count: count() })
					.from(todo)
					.where(eq(todo.status, 'done'));

				const totalCount = totalTodos[0]?.count || 0;
				const completedCount = completedTodos[0]?.count || 0;
				const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

				// Get in progress count
				const inProgressTodos = await db
					.select({ count: count() })
					.from(todo)
					.where(eq(todo.status, 'in progress'));

				// Get high priority count
				const highPriorityTodos = await db
					.select({ count: count() })
					.from(todo)
					.where(and(eq(todo.priority, 'high'), eq(todo.status, 'todo')));

				return {
					totalTodos: totalCount,
					completedTodos: completedCount,
					inProgressTodos: inProgressTodos[0]?.count || 0,
					highPriorityTodos: highPriorityTodos[0]?.count || 0,
					completionRate: Math.round(completionRate * 10) / 10,
					todosByStatus: todosByStatus.reduce(
						(acc, item) => {
							acc[item.status] = item.count;
							return acc;
						},
						{} as Record<string, number>
					),
					todosByPriority: todosByPriority.reduce(
						(acc, item) => {
							acc[item.priority] = item.count;
							return acc;
						},
						{} as Record<string, number>
					),
					todosByLabel: todosByLabel.reduce(
						(acc, item) => {
							acc[item.label] = item.count;
							return acc;
						},
						{} as Record<string, number>
					)
				};
			})

			.get('/activity', async () => {
				// Get actual activity data based on creation and update timestamps
				const thirtyDaysAgo = new Date();
				thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

				// Get todos created in the last 30 days grouped by date
				const createdActivity = await db
					.select({
						date: todo.createdAt,
						status: todo.status,
						count: count()
					})
					.from(todo)
					.where(gte(todo.createdAt, thirtyDaysAgo))
					.groupBy(todo.createdAt, todo.status)
					.orderBy(todo.createdAt);

				// Get todos updated in the last 30 days
				const updatedActivity = await db
					.select({
						date: todo.updatedAt,
						status: todo.status,
						count: count()
					})
					.from(todo)
					.where(gte(todo.updatedAt, thirtyDaysAgo))
					.groupBy(todo.updatedAt, todo.status)
					.orderBy(todo.updatedAt);

				// Group by day and aggregate counts
				const activityMap = new Map();

				// Process created todos
				createdActivity.forEach((item) => {
					const dateKey = item.date.toISOString().split('T')[0];
					if (!activityMap.has(dateKey)) {
						activityMap.set(dateKey, {
							date: item.date,
							created: 0,
							completed: 0,
							inProgress: 0,
							total: 0
						});
					}
					const dayData = activityMap.get(dateKey);
					dayData.created += item.count;
					dayData.total += item.count;
				});

				// Process status changes (approximate completion/progress from updates)
				updatedActivity.forEach((item) => {
					const dateKey = item.date.toISOString().split('T')[0];
					if (!activityMap.has(dateKey)) {
						activityMap.set(dateKey, {
							date: item.date,
							created: 0,
							completed: 0,
							inProgress: 0,
							total: 0
						});
					}
					const dayData = activityMap.get(dateKey);
					if (item.status === 'done') {
						dayData.completed += item.count;
					} else if (item.status === 'in progress') {
						dayData.inProgress += item.count;
					}
				});

				// Convert map to array and sort by date
				const activityData = Array.from(activityMap.values()).sort(
					(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
				);

				return activityData;
			})
	);
