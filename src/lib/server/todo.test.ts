import { test, expect, afterAll } from 'bun:test';
import { createElysiaEdenTestApp } from './test.utils';

const { eden, cleanup } = await createElysiaEdenTestApp();

afterAll(cleanup);

test('should create a todo', async () => {
	const todos = await eden.api.todo.get();
	expect(todos.data).toBeInstanceOf(Array);
});
