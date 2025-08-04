<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { useSidebar } from '$lib/components/ui/sidebar/index.js';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import { setActiveOrganization } from '@routes/organization.remote';

	type OrgSwitcherItem = {
		id?: string;
		slug?: string;
		name: string;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		logo: any; // icon component to render
		plan: string;
	};

	let { orgs }: { orgs: OrgSwitcherItem[] } = $props();
	const sidebar = useSidebar();
	let activeOrg = $state(orgs[0]);

	async function handleSelect(org: OrgSwitcherItem) {
		try {
			// Prefer id when available; fall back to slug
			if (org.id) {
				await setActiveOrganization({ organizationId: org.id });
			} else if (org.slug) {
				await setActiveOrganization({ organizationSlug: org.slug });
			} else {
				return;
			}
			activeOrg = org;
			// Consumers can re-fetch as needed; removed local refresh helper usage
		} catch (e) {
			// lightweight error surface; real error toasts can be added later
			console.error('Failed to set active organization', e);
		}
	}
</script>

<Sidebar.Menu>
	<Sidebar.MenuItem>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Sidebar.MenuButton
						{...props}
						size="lg"
						class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
					>
						<div
							class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
						>
							{#if activeOrg.logo}
								<activeOrg.logo class="size-4" />
							{/if}
						</div>
						<div class="grid flex-1 text-left text-sm leading-tight">
							<span class="truncate font-medium">
								{activeOrg.name}
							</span>
							<span class="truncate text-xs">{activeOrg.plan}</span>
						</div>
						<ChevronsUpDownIcon class="ml-auto" />
					</Sidebar.MenuButton>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content
				class="w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg"
				align="start"
				side={sidebar.isMobile ? 'bottom' : 'right'}
				sideOffset={4}
			>
				<DropdownMenu.Label class="text-xs text-muted-foreground">Teams</DropdownMenu.Label>
				{#each orgs as org, index (org.name)}
					<DropdownMenu.Item onSelect={() => handleSelect(org)} class="gap-2 p-2">
						<div class="flex size-6 items-center justify-center rounded-md border">
							<org.logo class="size-3.5 shrink-0" />
						</div>
						{org.name}
						<DropdownMenu.Shortcut>⌘{index + 1}</DropdownMenu.Shortcut>
					</DropdownMenu.Item>
				{/each}
				<DropdownMenu.Separator />
				<DropdownMenu.Item class="gap-2 p-2">
					<div class="flex size-6 items-center justify-center rounded-md border bg-transparent">
						<PlusIcon class="size-4" />
					</div>
					<div class="font-medium text-muted-foreground">Add Organization</div>
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</Sidebar.MenuItem>
</Sidebar.Menu>
