<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import CameraIcon from '@tabler/icons-svelte/icons/camera';
	import CreditCardIcon from '@tabler/icons-svelte/icons/credit-card';
	import DashboardIcon from '@tabler/icons-svelte/icons/dashboard';
	import DatabaseIcon from '@tabler/icons-svelte/icons/database';
	import FileAiIcon from '@tabler/icons-svelte/icons/file-ai';
	import FileDescriptionIcon from '@tabler/icons-svelte/icons/file-description';
	import FileWordIcon from '@tabler/icons-svelte/icons/file-word';
	import HelpIcon from '@tabler/icons-svelte/icons/help';
	import ListDetailsIcon from '@tabler/icons-svelte/icons/list-details';
	import ReportIcon from '@tabler/icons-svelte/icons/report';
	import SearchIcon from '@tabler/icons-svelte/icons/search';
	import SettingsIcon from '@tabler/icons-svelte/icons/settings';
	import type { User } from 'better-auth';
	import type { ComponentProps } from 'svelte';
	import NavMain from './nav-main.svelte';
	import NavSecondary from './nav-secondary.svelte';
	import NavUser from './nav-user.svelte';
	import OrgSwitcher from './org-switcher.svelte';
	import CreateOrganizationDialog from './create-organization-dialog.svelte';
	import { authClient } from '$lib/auth-client';

	type Props = ComponentProps<typeof Sidebar.Root> & {
		user: User;
	};

	let { user, ...restProps }: Props = $props();

	type Organization = {
		id: string;
		name: string;
		slug?: string;
		logo?: string | null;
		metadata?: Record<string, unknown> | null;
	};

	// Organization state
	let organizations = $state<Organization[]>([]);
	let loadingOrgs = $state(true);
	let orgsError = $state<string | null>(null);

	// Use Better Auth's client-side active organization hook
	const activeOrganization = authClient.useActiveOrganization();

	// Dialog state
	let showCreateOrgDialog = $state(false);

	async function loadOrganizations() {
		try {
			loadingOrgs = true;
			orgsError = null;

			// Get organizations list
			const orgsResponse = await authClient.organization.list();
			organizations = orgsResponse.data || [];

			// If no active organization and we have organizations, set the first one as active
			if (!$activeOrganization.data && organizations.length > 0) {
				await authClient.organization.setActive({
					organizationId: organizations[0].id
				});
			}

			// Show create dialog if no organizations
			if (organizations.length === 0) {
				showCreateOrgDialog = true;
			}
		} catch (error) {
			orgsError = 'Failed to load organizations';
			console.error('Failed to load organizations:', error);
		} finally {
			loadingOrgs = false;
		}
	}
	loadOrganizations();

	const data = {
		navMain: [
			{
				title: 'Dashboard',
				url: '/dashboard',
				icon: DashboardIcon
			},
			{
				title: 'Todos',
				url: '/todos',
				icon: ListDetailsIcon
			},
			{
				title: 'Billing',
				url: '/organization/billing',
				icon: CreditCardIcon
			}
		],
		navClouds: [
			{
				title: 'Capture',
				icon: CameraIcon,
				isActive: true,
				url: '#',
				items: [
					{
						title: 'Active Proposals',
						url: '#'
					},
					{
						title: 'Archived',
						url: '#'
					}
				]
			},
			{
				title: 'Proposal',
				icon: FileDescriptionIcon,
				url: '#',
				items: [
					{
						title: 'Active Proposals',
						url: '#'
					},
					{
						title: 'Archived',
						url: '#'
					}
				]
			},
			{
				title: 'Prompts',
				icon: FileAiIcon,
				url: '#',
				items: [
					{
						title: 'Active Proposals',
						url: '#'
					},
					{
						title: 'Archived',
						url: '#'
					}
				]
			}
		],
		navSecondary: [
			{
				title: 'Settings',
				url: '#',
				icon: SettingsIcon
			},
			{
				title: 'Get Help',
				url: '#',
				icon: HelpIcon
			},
			{
				title: 'Search',
				url: '#',
				icon: SearchIcon
			}
		],
		documents: [
			{
				name: 'Data Library',
				url: '#',
				icon: DatabaseIcon
			},
			{
				name: 'Reports',
				url: '#',
				icon: ReportIcon
			},
			{
				name: 'Word Assistant',
				url: '#',
				icon: FileWordIcon
			}
		]
	};
</script>

<Sidebar.Root collapsible="offcanvas" {...restProps}>
	<Sidebar.Header>
		{#if loadingOrgs}
			<div class="px-2 py-1.5 text-sm text-muted-foreground">Loading organizations…</div>
		{:else if orgsError}
			<div class="px-2 py-1.5 text-sm text-destructive">{orgsError}</div>
		{:else if organizations.length === 0}
			<div class="px-2 py-1.5 text-sm text-muted-foreground">No organizations yet</div>
		{:else}
			{#key organizations.length + '-' + ($activeOrganization.data?.id ?? 'none')}
				<OrgSwitcher
					orgs={organizations}
					activeOrganization={$activeOrganization.data}
					onOrganizationChange={loadOrganizations}
				/>
			{/key}
		{/if}
	</Sidebar.Header>
	<Sidebar.Content>
		<NavMain items={data.navMain} />
		<NavSecondary items={data.navSecondary} class="mt-auto" />
	</Sidebar.Content>
	<Sidebar.Footer>
		<NavUser {user} />
	</Sidebar.Footer>
</Sidebar.Root>

<CreateOrganizationDialog bind:open={showCreateOrgDialog} onSuccess={loadOrganizations} />
