import { form, query, command } from '$app/server';
import { eden } from '$lib/server/eden';
import { CreateTask } from '@/schemas/todo';

import { error } from '@sveltejs/kit';
import * as v from 'valibot';

// Query functions
export const getTodos = query(async () => {
	const response = await eden.api.todo.get();
	if (response.error) {
		error(500, 'Failed to fetch todos');
	}
	return response.data;
});

export const createTodo = form(async (data) => {
	const validatedTodoData = v.safeParse(CreateTask, Object.fromEntries(data.entries()));

	if (validatedTodoData.success) {
		const response = await eden.api.todo.post({
			text: validatedTodoData.output.text,
			completed: validatedTodoData.output.completed,
			priority: validatedTodoData.output.priority,
			status: validatedTodoData.output.status,
			label: validatedTodoData.output.label
		});

		if (response.error) {
			error(500, 'Failed to create todo');
		}

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

// Delete a single todo
const deleteTodoSchema = v.object({
	id: v.number('ID must be a number')
});

export const deleteTodo = command(deleteTodoSchema, async ({ id }) => {
	const response = await eden.api.todo({ id }).delete();

	if (response.error) {
		error(404, 'Todo not found');
	}

	// Note: Query will be refreshed automatically when the component re-renders

	return { success: true };
});

// Bulk update todos
const bulkUpdateTodosSchema = v.object({
	ids: v.array(v.number('ID must be a number')),
	updates: v.object({
		status: v.optional(
			v.union([
				v.literal('backlog'),
				v.literal('todo'),
				v.literal('in progress'),
				v.literal('done'),
				v.literal('canceled')
			])
		),
		priority: v.optional(v.union([v.literal('low'), v.literal('medium'), v.literal('high')])),
		label: v.optional(
			v.union([v.literal('bug'), v.literal('feature'), v.literal('documentation')])
		),
		completed: v.optional(v.boolean())
	})
});

export const bulkUpdateTodos = command(bulkUpdateTodosSchema, async ({ ids, updates }) => {
	if (ids.length === 0) {
		error(400, 'No todo IDs provided');
	}

	// Filter out undefined values from updates
	const filteredUpdates = Object.fromEntries(
		Object.entries(updates).filter(([, value]) => value !== undefined)
	);

	if (Object.keys(filteredUpdates).length === 0) {
		error(400, 'No valid updates provided');
	}

	const response = await eden.api.todo.bulk.patch({
		ids,
		updates: filteredUpdates
	});

	if (response.error) {
		error(404, 'No todos found with the provided IDs');
	}

	// Note: Query will be refreshed automatically when the component re-renders

	return { success: true, updatedCount: ids.length };
});

// Bulk delete todos
const bulkDeleteTodosSchema = v.object({
	ids: v.array(v.number('ID must be a number'))
});

export const bulkDeleteTodos = command(bulkDeleteTodosSchema, async ({ ids }) => {
	if (ids.length === 0) {
		error(400, 'No todo IDs provided');
	}

	const response = await eden.api.todo.bulk.delete({
		ids
	});

	if (response.error) {
		error(404, 'No todos found with the provided IDs');
	}

	// Note: Query will be refreshed automatically when the component re-renders

	return { success: true, deletedCount: ids.length };
});

// Update a single todo
export const updateTodo = form(async (data) => {
	const id = data.get('id');

	// Validate ID
	if (!id || typeof id !== 'string') {
		return error(400, { message: 'Todo ID is required' });
	}

	const todoId = parseInt(id, 10);
	if (isNaN(todoId)) {
		return error(400, { message: 'Invalid todo ID' });
	}

	// Create update object from form data
	const updateData = Object.fromEntries(data.entries());
	delete updateData.id; // Remove ID from update data

	const validatedUpdateData = v.safeParse(CreateTask, updateData);

	if (validatedUpdateData.success) {
		const response = await eden.api.todo({ id: todoId }).patch({
			text: validatedUpdateData.output.text,
			label: validatedUpdateData.output.label,
			status: validatedUpdateData.output.status,
			priority: validatedUpdateData.output.priority
		});

		if (response.error) {
			return error(404, { message: 'Todo not found' });
		}

		return { success: true };
	} else {
		// Convert issues to human-readable format using flatten()
		const flattenedErrors = v.flatten(validatedUpdateData.issues);

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
