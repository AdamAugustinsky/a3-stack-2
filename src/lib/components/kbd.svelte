<script lang="ts">
	import { cn } from '$lib/utils.js';
	import type { Component } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	type Props = HTMLAttributes<HTMLElement> & {
		content?: string | Component;
		class?: string;
	};

	let { content, class: className, children, ...restProps }: Props = $props();
</script>

{#if content}
	{@const Content = content}
	<kbd
		class={cn(
			'pointer-events-none inline-flex h-5 select-none items-center justify-center gap-1 rounded border bg-background px-1 font-sans text-[0.7rem] font-medium text-muted-foreground [&_svg:not([class*="size-"])]:size-3',
			className
		)}
		{...restProps}
	>
		{#if typeof Content === 'string'}
			{Content}
		{:else}
			<Content />
		{/if}
	</kbd>
{:else}
	<kbd
		class={cn(
			'pointer-events-none inline-flex h-5 select-none items-center justify-center gap-1 rounded border bg-background px-1 font-sans text-[0.7rem] font-medium text-muted-foreground [&_svg:not([class*="size-"])]:size-3',
			className
		)}
		{...restProps}
	>
		{@render children?.()}
	</kbd>
{/if}