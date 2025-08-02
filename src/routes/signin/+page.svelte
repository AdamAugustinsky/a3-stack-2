<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import {
		Card,
		CardContent,
		CardDescription,
		CardFooter,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { signin } from '../auth.remote';
	import { isHttpError } from '@sveltejs/kit';

	let errorValue = $state<string | undefined>();
	let loading = $state(false);
</script>

<div class="flex min-h-screen items-center justify-center">
	<Card class="w-full max-w-md">
		<CardHeader>
			<CardTitle>Sign In</CardTitle>
			<CardDescription>Welcome back! Sign in to your account</CardDescription>
		</CardHeader>
		<form
			{...signin.enhance(async ({ submit }) => {
				errorValue = undefined;
				loading = true;

				try {
					await submit();
					// Success - redirect will be handled automatically by SvelteKit
				} catch (error) {
					if (isHttpError(error)) {
						errorValue = error.body.message;
					} else {
						errorValue = 'An unexpected error occurred. Please try again.';
					}
				} finally {
					loading = false;
				}
			})}
		>
			<CardContent class="space-y-4">
				{#if errorValue}
					<Alert variant="destructive">
						<AlertDescription>{errorValue}</AlertDescription>
					</Alert>
				{/if}
				<div class="space-y-2">
					<Label for="email">Email</Label>
					<Input id="email" name="email" type="email" required disabled={loading} />
				</div>

				<div class="space-y-2">
					<Label for="password">Password</Label>
					<Input id="password" name="password" type="password" required disabled={loading} />
				</div>
			</CardContent>
			<CardFooter class="flex flex-col space-y-4">
				<Button type="submit" class="w-full" disabled={loading}>
					{loading ? 'Signing in...' : 'Sign In'}
				</Button>
				<p class="text-center text-sm text-muted-foreground">
					Don't have an account?
					<a href="/signup" class="ml-1 text-primary hover:underline">Sign up</a>
				</p>
			</CardFooter>
		</form>
	</Card>
</div>
