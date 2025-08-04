<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import CameraIcon from '@tabler/icons-svelte/icons/camera';
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
	import { getActiveOrganization, listOrganizations } from '@routes/organization.remote';

	type Props = ComponentProps<typeof Sidebar.Root> & {
		user: User;
	};

	let { user, ...restProps }: Props = $props();

	// Remote queries for organizations
	const orgsQuery = listOrganizations();

	$effect(() => {
		console.log('orgsQuery:', orgsQuery.current);
	});
	const activeOrgQuery = getActiveOrganization();

	// Dialog state
	let showCreateOrgDialog = $state(false);

	// Check if we need to show create org dialog
	$effect(() => {
		if (!orgsQuery.loading && !orgsQuery.error && orgsQuery.current?.length === 0) {
			showCreateOrgDialog = true;
		}
	});

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
		{#if orgsQuery.loading || activeOrgQuery.loading}
			<div class="px-2 py-1.5 text-sm text-muted-foreground">Loading organizations…</div>
		{:else if orgsQuery.error}
			<div class="px-2 py-1.5 text-sm text-destructive">Failed to load organizations</div>
		{:else if !orgsQuery.current || orgsQuery.current?.length === 0}
			<div class="px-2 py-1.5 text-sm text-muted-foreground">No organizations yet</div>
		{:else}
			{#key (orgsQuery.current?.length ?? 0) + '-' + (activeOrgQuery.current?.id ?? 'none')}
				<OrgSwitcher orgs={orgsQuery.current ?? []} />
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

<CreateOrganizationDialog bind:open={showCreateOrgDialog} />
