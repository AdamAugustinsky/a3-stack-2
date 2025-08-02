import { form, query } from '$app/server';
import { db } from '$lib/server/db';
import { todo } from '$lib/server/db/schema/todo';
import { CreateTask } from '@/schemas/todo';

import { error } from '@sveltejs/kit';
import * as v from 'valibot';

// Query functions
export const getTodos = query(async () => {
	return await db.select().from(todo);
});

export const createTodo = form(async (data) => {
	const validatedTodoData = v.safeParse(CreateTask, Object.fromEntries(data.entries()));

	if (validatedTodoData.success) {
		await db.insert(todo).values(validatedTodoData.output);
		return { success: true };
	} else {
		// Convert issues to human-readable format using flatten()
		const flattenedErrors = v.flatten(validatedTodoData.issues);

		console.error('Validation failed:', flattenedErrors);

		// Use SvelteKit error with custom object structure
		const nestedErrors: Record<string, string[]> = {};
		if (flattenedErrors.nested) {
			for (const [key, value] of Object.entries(flattenedErrors.nested)) {
				if (value) {
					nestedErrors[key] = value;
				}
			}
		}

		return error(400, {
			message: 'Validation failed',
			errors: {
				nested: nestedErrors
			}
		});
	}
});
