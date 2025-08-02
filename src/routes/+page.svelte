<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import CreateTodoDialog from './(protected)/todos/components/create-todo-dialog.svelte';
	const session = authClient.useSession();
</script>

<div>
	{#if $session.data}
		<div>
			<p>
				{$session?.data?.user.name}
			</p>
			<button
				on:click={async () => {
					await authClient.signOut();
				}}
			>
				Sign Out
			</button>
		</div>
	{:else}
		<button
			on:click={async () => {
				await authClient.signIn.social({
					provider: 'github'
				});
			}}
		>
			Continue with GitHub
		</button>
	{/if}
</div>

<CreateTodoDialog open={true} />
