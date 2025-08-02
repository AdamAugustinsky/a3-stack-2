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
	import { signup } from './auth.remote';
	import { isHttpError } from '@sveltejs/kit';

	let errorValue = $state<string | undefined>();
	let loading = $state(false);
</script>

<div class="flex min-h-screen items-center justify-center">
	<Card class="w-full max-w-md">
		<CardHeader>
			<CardTitle>Sign Up</CardTitle>
			<CardDescription>Create a new account to get started</CardDescription>
		</CardHeader>
		<form
			{...signup.enhance(async ({ submit }) => {
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
					<Label for="name">Name</Label>
					<Input id="name" name="name" type="text" required disabled={loading} />
				</div>

				<div class="space-y-2">
					<Label for="email">Email</Label>
					<Input id="email" name="email" type="email" required disabled={loading} />
				</div>

				<div class="space-y-2">
					<Label for="password">Password</Label>
					<Input id="password" name="password" type="password" required minlength={8} />
				</div>
			</CardContent>
			<CardFooter class="flex flex-col space-y-4">
				<Button type="submit" class="w-full" disabled={loading}>
					{loading ? 'Creating account...' : 'Sign Up'}
				</Button>
				<p class="text-center text-sm text-muted-foreground">
					Already have an account?
					<a href="/signin" class="ml-1 text-primary hover:underline">Sign in</a>
				</p>
			</CardFooter>
		</form>
	</Card>
</div>
