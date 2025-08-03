import { form } from '$app/server';
import { auth } from '@/server/auth';
import { error, redirect } from '@sveltejs/kit';

export const signin = form(async (data) => {
	const email = data.get('email');
	const password = data.get('password');

	// Validate inputs
	if (typeof email !== 'string' || typeof password !== 'string') {
		error(400, 'Email and password are required');
	}

	if (!email || !password) {
		error(400, 'Email and password are required');
	}

	const response = await auth.api.signInEmail({
		body: {
			email,
			password,
			callbackURL: '/dashboard'
		},
		asResponse: true
	});

	switch (response.status) {
		case 200:
			return redirect(303, '/');
		case 401:
			return error(401, 'Invalid email or password');
		case 404:
			return error(404, 'No account found with this email');
		case 429:
			return error(429, 'Too many login attempts. Please try again later');
		case 400:
			return error(400, 'Invalid input provided');
		case 500:
			return error(500, 'Server error. Please try again later');
		default:
			return error(400, 'Failed to sign in');
	}
});

export const signup = form(async (data) => {
	const email = data.get('email');
	const password = data.get('password');
	const name = data.get('name');

	// Validate inputs
	if (typeof email !== 'string' || typeof password !== 'string' || typeof name !== 'string') {
		error(400, 'Name, email and password are required');
	}

	if (!email || !password || !name) {
		error(400, 'Name, email and password are required');
	}

	// Validate password length
	if (password.length < 8) {
		error(400, 'Password must be at least 8 characters');
	}

	const response = await auth.api.signUpEmail({
		body: {
			email,
			password,
			name,
			callbackURL: '/dashboard'
		},
		asResponse: true
	});

	switch (response.status) {
		case 200:
			return redirect(303, '/dashboard');
		case 409:
			return error(409, 'An account with this email already exists');
		case 400:
			return error(400, 'Invalid input provided');
		case 500:
			return error(500, 'Server error. Please try again later');
		default:
			return error(400, 'Failed to create account');
	}
});
