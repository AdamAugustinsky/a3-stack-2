import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './db';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { organization } from 'better-auth/plugins';
import { stripe } from '@better-auth/stripe';
import Stripe from 'stripe';

if (!Bun.env.STRIPE_SECRET_KEY) {
	throw new Error('STRIPE_SECRET_KEY is not defined');
}

if (!Bun.env.STRIPE_WEBHOOK_SECRET) {
	throw new Error('STRIPE_WEBHOOK_SECRET is not defined');
}

const stripeClient = new Stripe(Bun.env.STRIPE_SECRET_KEY, {
	apiVersion: '2025-07-30.basil'
});

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: 'pg'
	}),
	emailAndPassword: {
		enabled: true
	},
	plugins: [
		sveltekitCookies(getRequestEvent),
		organization(),
		stripe({
			stripeClient,
			stripeWebhookSecret: Bun.env.STRIPE_WEBHOOK_SECRET,
			createCustomerOnSignUp: true
		})
	]
});
