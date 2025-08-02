import { Elysia, t } from 'elysia';

export const app = new Elysia({ prefix: '/api' })
	.get('/', () => 'hi')
	.post('/', ({ body }) => body, {
		body: t.Object({
			name: t.String()
		})
	});
