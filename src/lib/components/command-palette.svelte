<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import * as Command from '$lib/components/ui/command/index.js';
	import {
		LayoutDashboard,
		CheckSquare,
		User,
		Building,
		CreditCard,
		Plus,
		Search,
		Tag,
		Flag,
		LogOut,
		RefreshCw,
		Copy,
		Keyboard,
		Filter
	} from '@lucide/svelte';
	import { getTodos } from '@routes/(protected)/todos/todo.remote';
	import CreateTodoDialog from '@routes/(protected)/todos/components/create-todo-dialog.svelte';
	import type { Task } from '$lib/schemas/todo';

	let open = $state(false);
	let search = $state('');
	let showCreateTodoDialog = $state(false);
	let searchedTodos = $state<Task[]>([]);

	type CommandItem = {
		id: string;
		label: string;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		icon: any;
		shortcut?: string;
		action: () => void | Promise<void>;
		keywords?: string[];
	};

	const navigationCommands: CommandItem[] = [
		{
			id: 'nav-dashboard',
			label: 'Dashboard',
			icon: LayoutDashboard,
			shortcut: '⌘D',
			action: () => navigateTo('/dashboard'),
			keywords: ['home', 'overview', 'stats']
		},
		{
			id: 'nav-todos',
			label: 'Todos',
			icon: CheckSquare,
			shortcut: '⌘T',
			action: () => navigateTo('/todos'),
			keywords: ['tasks', 'list']
		},
		{
			id: 'nav-account',
			label: 'Account',
			icon: User,
			shortcut: '⌘U',
			action: () => navigateTo('/account'),
			keywords: ['profile', 'settings', 'user']
		},
		{
			id: 'nav-organization',
			label: 'Organization',
			icon: Building,
			action: () => navigateTo('/organization'),
			keywords: ['company', 'team']
		},
		{
			id: 'nav-billing',
			label: 'Billing',
			icon: CreditCard,
			action: () => navigateTo('/organization/billing'),
			keywords: ['payment', 'subscription', 'invoice']
		}
	];

	const todoCommands: CommandItem[] = [
		{
			id: 'todo-create',
			label: 'Create New Todo',
			icon: Plus,
			shortcut: 'C',
			action: () => openCreateTodoDialog(),
			keywords: ['add', 'new', 'task']
		},
		{
			id: 'todo-search',
			label: 'Search Todos',
			icon: Search,
			action: () => searchTodos(),
			keywords: ['find', 'filter']
		},
		{
			id: 'todo-filter-backlog',
			label: 'Filter: Backlog',
			icon: Filter,
			action: () => filterTodosByStatus('backlog'),
			keywords: ['status']
		},
		{
			id: 'todo-filter-todo',
			label: 'Filter: Todo',
			icon: Filter,
			action: () => filterTodosByStatus('todo'),
			keywords: ['status']
		},
		{
			id: 'todo-filter-progress',
			label: 'Filter: In Progress',
			icon: Filter,
			action: () => filterTodosByStatus('in progress'),
			keywords: ['status', 'active']
		},
		{
			id: 'todo-filter-done',
			label: 'Filter: Done',
			icon: Filter,
			action: () => filterTodosByStatus('done'),
			keywords: ['status', 'complete', 'finished']
		},
		{
			id: 'todo-priority-high',
			label: 'Filter: High Priority',
			icon: Flag,
			action: () => filterTodosByPriority('high'),
			keywords: ['urgent', 'important']
		},
		{
			id: 'todo-priority-medium',
			label: 'Filter: Medium Priority',
			icon: Flag,
			action: () => filterTodosByPriority('medium'),
			keywords: ['normal']
		},
		{
			id: 'todo-priority-low',
			label: 'Filter: Low Priority',
			icon: Flag,
			action: () => filterTodosByPriority('low'),
			keywords: ['minor']
		},
		{
			id: 'todo-label-bug',
			label: 'Filter: Bugs',
			icon: Tag,
			action: () => filterTodosByLabel('bug'),
			keywords: ['issue', 'problem']
		},
		{
			id: 'todo-label-feature',
			label: 'Filter: Features',
			icon: Tag,
			action: () => filterTodosByLabel('feature'),
			keywords: ['enhancement', 'new']
		},
		{
			id: 'todo-label-documentation',
			label: 'Filter: Documentation',
			icon: Tag,
			action: () => filterTodosByLabel('documentation'),
			keywords: ['docs', 'readme']
		}
	];

	const quickActions: CommandItem[] = [
		{
			id: 'action-signout',
			label: 'Sign Out',
			icon: LogOut,
			action: () => signOut(),
			keywords: ['logout', 'exit']
		},
		{
			id: 'action-refresh',
			label: 'Refresh Data',
			icon: RefreshCw,
			shortcut: '⌘R',
			action: () => refreshData(),
			keywords: ['reload', 'update']
		},
		{
			id: 'action-copy-id',
			label: 'Copy User ID',
			icon: Copy,
			action: () => copyUserId(),
			keywords: ['clipboard']
		},
		{
			id: 'action-shortcuts',
			label: 'Keyboard Shortcuts',
			icon: Keyboard,
			shortcut: '?',
			action: () => showKeyboardShortcuts(),
			keywords: ['help', 'hotkeys']
		}
	];

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			open = !open;
			if (open) {
				search = '';
				searchedTodos = [];
			}
		}

		if (open) {
			// Navigation shortcuts for command palette
			if (e.key === 'n' && e.ctrlKey) {
				e.preventDefault();
				// Navigate down in command palette (handled by Command component)
				return;
			}
			if (e.key === 'p' && e.ctrlKey) {
				e.preventDefault();
				// Navigate up in command palette (handled by Command component)
				return;
			}
			
			// Command shortcuts
			if (e.key === 'd' && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				executeCommand('nav-dashboard');
			}
			if (e.key === 't' && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				executeCommand('nav-todos');
			}
			if (e.key === 'u' && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				executeCommand('nav-account');
			}
			if (e.key === 'r' && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				executeCommand('action-refresh');
			}
		}
	}

	function executeCommand(commandId: string) {
		const allCommands = [...navigationCommands, ...todoCommands, ...quickActions];
		const command = allCommands.find((cmd) => cmd.id === commandId);
		if (command) {
			command.action();
			open = false;
		}
	}

	function navigateTo(path: string) {
		goto(path);
	}

	function openCreateTodoDialog() {
		showCreateTodoDialog = true;
	}

	async function searchTodos() {
		navigateTo('/todos');
	}

	function filterTodosByStatus(status: string) {
		navigateTo(`/todos?status=${status}`);
	}

	function filterTodosByPriority(priority: string) {
		navigateTo(`/todos?priority=${priority}`);
	}

	function filterTodosByLabel(label: string) {
		navigateTo(`/todos?label=${label}`);
	}

	async function signOut() {
		try {
			const response = await fetch('/api/auth/sign-out', { method: 'POST' });
			if (response.ok) {
				goto('/sign-in');
			}
		} catch (error) {
			console.error('Failed to sign out:', error);
		}
	}

	function refreshData() {
		window.location.reload();
	}

	async function copyUserId() {
		try {
			const response = await fetch('/api/auth/session');
			const session = await response.json();
			if (session?.user?.id) {
				await navigator.clipboard.writeText(session.user.id);
			}
		} catch (error) {
			console.error('Failed to copy user ID:', error);
		}
	}

	function showKeyboardShortcuts() {
		alert(`Keyboard Shortcuts:

⌘K - Open Command Palette

On Todos page:
C - Create New Todo (when not typing)

When Command Palette is open:
Ctrl+N - Navigate down
Ctrl+P - Navigate up
⌘D - Go to Dashboard
⌘T - Go to Todos
⌘U - Go to Account
⌘R - Refresh Data
? - Show this help`);
	}

	async function searchTodosLive(query: string) {
		if (query.length < 2) {
			searchedTodos = [];
			return;
		}

		try {
			const todos = await getTodos();
			if (todos.length) {
				searchedTodos = todos
					.filter((todo) => todo.text.toLowerCase().includes(query.toLowerCase()))
					.slice(0, 5);
			}
		} catch (error) {
			console.error('Failed to search todos:', error);
			searchedTodos = [];
		}
	}

	let searchTimeout: NodeJS.Timeout;
	$effect(() => {
		if (search && search.length > 1) {
			clearTimeout(searchTimeout);
			searchTimeout = setTimeout(() => {
				searchTodosLive(search);
			}, 300);
		} else {
			searchedTodos = [];
		}
	});

	function filterCommands(commands: CommandItem[], query: string) {
		if (!query) return commands;
		const lowerQuery = query.toLowerCase();
		return commands.filter(
			(cmd) =>
				cmd.label.toLowerCase().includes(lowerQuery) ||
				cmd.keywords?.some((keyword) => keyword.toLowerCase().includes(lowerQuery))
		);
	}
</script>

<svelte:document onkeydown={handleKeydown} />

<Command.Dialog bind:open>
	<Command.Input placeholder="Type a command or search..." bind:value={search} />
	<Command.List>
		<Command.Empty>No results found.</Command.Empty>

		{#if searchedTodos.length > 0}
			<Command.Group heading="Todo Search Results">
				{#each searchedTodos as todo (todo.id)}
					<Command.Item onSelect={() => navigateTo(`/todos?highlight=${todo.id}`)}>
						<CheckSquare class="mr-2 h-4 w-4" />
						<span class="truncate">{todo.text}</span>
						<span class="ml-auto text-xs text-muted-foreground">{todo.status}</span>
					</Command.Item>
				{/each}
			</Command.Group>
			<Command.Separator />
		{/if}

		{@const filteredNavCommands = search
			? filterCommands(navigationCommands, search)
			: navigationCommands}
		{@const filteredTodoCommands = search ? filterCommands(todoCommands, search) : todoCommands}
		{@const filteredQuickActions = search ? filterCommands(quickActions, search) : quickActions}
		{@const isOnTodosPage = page.url.pathname === '/todos'}

		{#if isOnTodosPage}
			{#if filteredTodoCommands.length > 0}
				<Command.Group heading="Todo Actions">
					{#each filteredTodoCommands as command (command.id)}
						<Command.Item onSelect={() => executeCommand(command.id)}>
							{@const Icon = command.icon}
							<Icon class="mr-2 h-4 w-4" />
							<span>{command.label}</span>
							{#if command.shortcut}
								<Command.Shortcut>{command.shortcut}</Command.Shortcut>
							{/if}
						</Command.Item>
					{/each}
				</Command.Group>
			{/if}

			{#if filteredQuickActions.length > 0}
				<Command.Separator />
				<Command.Group heading="Quick Actions">
					{#each filteredQuickActions as command (command.id)}
						<Command.Item onSelect={() => executeCommand(command.id)}>
							{@const Icon = command.icon}
							<Icon class="mr-2 h-4 w-4" />
							<span>{command.label}</span>
							{#if command.shortcut}
								<Command.Shortcut>{command.shortcut}</Command.Shortcut>
							{/if}
						</Command.Item>
					{/each}
				</Command.Group>
			{/if}

			{#if filteredNavCommands.length > 0}
				<Command.Separator />
				<Command.Group heading="Navigation">
					{#each filteredNavCommands as command (command.id)}
						<Command.Item onSelect={() => executeCommand(command.id)}>
							{@const Icon = command.icon}
							<Icon class="mr-2 h-4 w-4" />
							<span>{command.label}</span>
							{#if command.shortcut}
								<Command.Shortcut>{command.shortcut}</Command.Shortcut>
							{/if}
						</Command.Item>
					{/each}
				</Command.Group>
			{/if}
		{:else}
			{#if filteredNavCommands.length > 0}
				<Command.Group heading="Navigation">
					{#each filteredNavCommands as command (command.id)}
						<Command.Item onSelect={() => executeCommand(command.id)}>
							{@const Icon = command.icon}
							<Icon class="mr-2 h-4 w-4" />
							<span>{command.label}</span>
							{#if command.shortcut}
								<Command.Shortcut>{command.shortcut}</Command.Shortcut>
							{/if}
						</Command.Item>
					{/each}
				</Command.Group>
			{/if}

			{#if filteredTodoCommands.length > 0}
				<Command.Separator />
				<Command.Group heading="Todo Actions">
					{#each filteredTodoCommands as command (command.id)}
						<Command.Item onSelect={() => executeCommand(command.id)}>
							{@const Icon = command.icon}
							<Icon class="mr-2 h-4 w-4" />
							<span>{command.label}</span>
							{#if command.shortcut}
								<Command.Shortcut>{command.shortcut}</Command.Shortcut>
							{/if}
						</Command.Item>
					{/each}
				</Command.Group>
			{/if}

			{#if filteredQuickActions.length > 0}
				<Command.Separator />
				<Command.Group heading="Quick Actions">
					{#each filteredQuickActions as command (command.id)}
						<Command.Item onSelect={() => executeCommand(command.id)}>
							{@const Icon = command.icon}
							<Icon class="mr-2 h-4 w-4" />
							<span>{command.label}</span>
							{#if command.shortcut}
								<Command.Shortcut>{command.shortcut}</Command.Shortcut>
							{/if}
						</Command.Item>
					{/each}
				</Command.Group>
			{/if}
		{/if}
	</Command.List>
</Command.Dialog>

<CreateTodoDialog bind:open={showCreateTodoDialog} />
