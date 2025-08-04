import { test, expect } from 'bun:test';
import { eden } from './eden';

test('should create a todo', async () => {
	const todos = await eden.api.todo.get();

	expect(todos.data).toBeInstanceOf(Object);
});
