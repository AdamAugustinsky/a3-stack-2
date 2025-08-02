<script lang="ts">
	import TodoDataTable from './components/todo-data-table.svelte';
	import EditTodoDialog from './components/edit-todo-dialog.svelte';
	import CreateTodoDialog from './components/create-todo-dialog.svelte';
	import BulkOperationsDock from './components/bulk-operations-dock.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import CirclePlusIcon from '@lucide/svelte/icons/circle-plus';
	import type { Task } from '$lib/schemas/todo';
	import { getTodos, deleteTodo, bulkUpdateTodos, bulkDeleteTodos } from './todo.remote';

	let editingTodo = $state<Task>();
	let showEditDialog = $state(false);
	let showCreateDialog = $state(false);
	let selectedTodos = $state<Task[]>([]);
	let clearSelectionSignal = $state(0);
	let deletingId = $state<number | null>(null);
	let isBulkOperationPending = $state(false);

	// Use the todos from remote query function
	const todosPromise = getTodos();

	function handleOpenCreateDialog() {
		showCreateDialog = true;
	}

	async function handleDeleteTodo(id: number) {
		deletingId = id;
		try {
			await deleteTodo({ id });
			deletingId = null;
		} catch (error) {
			console.error('Failed to delete todo:', error);
			deletingId = null;
		}
	}

	function handleEditTodo(todo: Task) {
		editingTodo = { ...todo };
		showEditDialog = true;
	}

	function handleDuplicateTodo(todo: Task) {
		// Open create dialog with duplicated data
		editingTodo = {
			...todo,
			text: `${todo.text} (copy)`
		};
		showCreateDialog = true;
	}

	function handleSelectionChange(selected: Task[]) {
		selectedTodos = selected;
	}

	async function handleBulkStatusChange(status: string) {
		if (selectedTodos.length > 0) {
			isBulkOperationPending = true;
			try {
				const ids = selectedTodos.map((todo) => todo.id);
				await bulkUpdateTodos({
					ids,
					updates: { status: status as 'backlog' | 'todo' | 'in progress' | 'done' | 'canceled' }
				});
				selectedTodos = [];
				clearSelectionSignal++;
			} catch (error) {
				console.error('Failed to bulk update status:', error);
			} finally {
				isBulkOperationPending = false;
			}
		}
	}

	async function handleBulkPriorityChange(priority: string) {
		if (selectedTodos.length > 0) {
			isBulkOperationPending = true;
			try {
				const ids = selectedTodos.map((todo) => todo.id);
				await bulkUpdateTodos({
					ids,
					updates: { priority: priority as 'low' | 'medium' | 'high' }
				});
				selectedTodos = [];
				clearSelectionSignal++;
			} catch (error) {
				console.error('Failed to bulk update priority:', error);
			} finally {
				isBulkOperationPending = false;
			}
		}
	}

	async function handleBulkLabelChange(label: string) {
		if (selectedTodos.length > 0) {
			isBulkOperationPending = true;
			try {
				const ids = selectedTodos.map((todo) => todo.id);
				await bulkUpdateTodos({
					ids,
					updates: { label: label as 'bug' | 'feature' | 'documentation' }
				});
				selectedTodos = [];
				clearSelectionSignal++;
			} catch (error) {
				console.error('Failed to bulk update label:', error);
			} finally {
				isBulkOperationPending = false;
			}
		}
	}

	async function handleBulkDelete() {
		if (selectedTodos.length > 0) {
			isBulkOperationPending = true;
			try {
				const ids = selectedTodos.map((todo) => todo.id);
				await bulkDeleteTodos({ ids });
				selectedTodos = [];
				clearSelectionSignal++;
			} catch (error) {
				console.error('Failed to bulk delete todos:', error);
			} finally {
				isBulkOperationPending = false;
			}
		}
	}

	function handleClearSelection() {
		selectedTodos = [];
		clearSelectionSignal++; // Trigger table to clear selection
	}
</script>

<!-- <div class="md:hidden"> -->
<!--   <img -->
<!--     src="/img/examples/tasks-light.png" -->
<!--     alt="Tasks" -->
<!--     class="block dark:hidden" -->
<!--   /> -->
<!--   <img -->
<!--     src="/img/examples/tasks-dark.png" -->
<!--     alt="Tasks" -->
<!--     class="hidden dark:block" -->
<!--   /> -->
<!-- </div> -->
<div class="hidden h-full flex-1 flex-col gap-8 p-8 md:flex">
	<div class="flex items-center justify-between gap-2">
		<div class="flex flex-col gap-1">
			<h2 class="text-2xl font-semibold tracking-tight">Welcome back!</h2>
			<p class="text-muted-foreground">Here&apos;s a list of your tasks for this month.</p>
		</div>
		<Button onclick={handleOpenCreateDialog}>
			<CirclePlusIcon class="mr-2 h-4 w-4" />
			Add Task
		</Button>
	</div>
	{#await todosPromise}
		<div class="py-8 text-center">
			<p class="text-muted-foreground">Loading tasks...</p>
		</div>
	{:then todos}
		{#if todos.length > 0}
			<TodoDataTable
				data={todos}
				onEdit={handleEditTodo}
				onDelete={handleDeleteTodo}
				onDuplicate={handleDuplicateTodo}
				onSelectionChange={handleSelectionChange}
				{clearSelectionSignal}
			/>
		{:else}
			<div class="py-8 text-center">
				<p class="text-muted-foreground">No tasks yet. Add one above to get started!</p>
			</div>
		{/if}
	{:catch error}
		<div class="py-8 text-center">
			<p class="text-destructive">Failed to load tasks. Please try again.</p>
		</div>
	{/await}
</div>

<BulkOperationsDock
	selectedRows={selectedTodos}
	onBulkStatusChange={handleBulkStatusChange}
	onBulkPriorityChange={handleBulkPriorityChange}
	onBulkLabelChange={handleBulkLabelChange}
	onBulkDelete={handleBulkDelete}
	onClearSelection={handleClearSelection}
	isLoading={isBulkOperationPending}
/>

<CreateTodoDialog bind:open={showCreateDialog} />

<EditTodoDialog bind:open={showEditDialog} bind:todo={editingTodo} />
