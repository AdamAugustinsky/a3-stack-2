<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
	import UserIcon from '@tabler/icons-svelte/icons/user';
	import MailIcon from '@tabler/icons-svelte/icons/mail';
	import CalendarIcon from '@tabler/icons-svelte/icons/calendar';
	import ShieldIcon from '@tabler/icons-svelte/icons/shield';
	import { updateProfile } from './profile.remote';
	import { invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	// Form state
	let name = $state(data.user.name);
	let isEditing = $state(false);
	let isLoading = $state(false);

	// Generate initials from user name
	const initials = data.user.name
		.split(' ')
		.map((word) => word[0])
		.join('')
		.toUpperCase()
		.slice(0, 2);

	// Format date
	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	};

	async function handleSave() {
		isLoading = true;
		try {
			const result = await updateProfile({ name });

			if (result.success) {
				await invalidateAll(); // Refresh the page data
				isEditing = false;
			}
		} catch (error) {
			console.error('Failed to save profile:', error);
		} finally {
			isLoading = false;
		}
	}

	function handleCancel() {
		// Reset form to original values
		name = data.user.name;
		isEditing = false;
	}
</script>

<svelte:head>
	<title>Account - Profile Settings</title>
</svelte:head>

<div class="container mx-auto max-w-4xl p-6">
	<div class="space-y-6">
		<!-- Page Header -->
		<div class="space-y-2">
			<h1 class="text-3xl font-bold tracking-tight">Account Settings</h1>
			<p class="text-muted-foreground">Manage your account settings and profile information.</p>
		</div>

		<Separator />

		<!-- Profile Section -->
		<Card>
			<CardHeader>
				<div class="flex items-center space-x-4">
					<Avatar class="size-20">
						<AvatarImage src={data.user.image} alt={data.user.name} />
						<AvatarFallback class="text-lg">{initials}</AvatarFallback>
					</Avatar>
					<div class="space-y-1">
						<CardTitle class="text-2xl">{data.user.name}</CardTitle>
						<CardDescription class="text-base">{data.user.email}</CardDescription>
					</div>
				</div>
			</CardHeader>
			<CardContent class="space-y-6">
				<!-- Profile Information Form -->
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<h3 class="text-lg font-medium">Profile Information</h3>
						{#if !isEditing}
							<Button variant="outline" onclick={() => (isEditing = true)}>
								<UserIcon class="mr-2 size-4" />
								Edit Profile
							</Button>
						{/if}
					</div>

					<div class="grid gap-4">
						<!-- Name Field -->
						<div class="grid gap-2">
							<Label for="name">Full Name</Label>
							{#if isEditing}
								<Input
									id="name"
									bind:value={name}
									placeholder="Enter your full name"
									disabled={isLoading}
								/>
							{:else}
								<div class="flex items-center space-x-2 py-2">
									<UserIcon class="size-4 text-muted-foreground" />
									<span class="text-sm">{data.user.name}</span>
								</div>
							{/if}
						</div>

						<!-- Email Field -->
						<div class="grid gap-2">
							<Label for="email">Email Address</Label>
							<div class="flex items-center space-x-2 py-2">
								<MailIcon class="size-4 text-muted-foreground" />
								<span class="text-sm">{data.user.email}</span>
								<span class="text-xs text-muted-foreground">(Email cannot be changed)</span>
							</div>
						</div>

						<!-- Action Buttons (only show when editing) -->
						{#if isEditing}
							<div class="flex space-x-2 pt-4">
								<Button onclick={handleSave} disabled={isLoading}>
									{isLoading ? 'Saving...' : 'Save Changes'}
								</Button>
								<Button variant="outline" onclick={handleCancel} disabled={isLoading}>
									Cancel
								</Button>
							</div>
						{/if}
					</div>
				</div>
			</CardContent>
		</Card>

		<!-- Account Information -->
		<Card>
			<CardHeader>
				<CardTitle>Account Information</CardTitle>
				<CardDescription>View your account details and security information.</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4">
				<!-- Account Created -->
				<div class="flex items-center justify-between py-2">
					<div class="flex items-center space-x-2">
						<CalendarIcon class="size-4 text-muted-foreground" />
						<span class="text-sm font-medium">Account Created</span>
					</div>
					<span class="text-sm text-muted-foreground">
						{formatDate(data.user.createdAt.toString())}
					</span>
				</div>

				<!-- User ID -->
				<div class="flex items-center justify-between py-2">
					<div class="flex items-center space-x-2">
						<ShieldIcon class="size-4 text-muted-foreground" />
						<span class="text-sm font-medium">User ID</span>
					</div>
					<span class="font-mono text-sm text-muted-foreground">
						{data.user.id}
					</span>
				</div>

				<!-- Email Verified Status -->
				<div class="flex items-center justify-between py-2">
					<div class="flex items-center space-x-2">
						<MailIcon class="size-4 text-muted-foreground" />
						<span class="text-sm font-medium">Email Verified</span>
					</div>
					<span class="text-sm">
						{#if data.user.emailVerified}
							<span class="font-medium text-green-600">✓ Verified</span>
						{:else}
							<span class="font-medium text-orange-600">⚠ Not Verified</span>
						{/if}
					</span>
				</div>
			</CardContent>
		</Card>

		<!-- Security Section -->
		<Card>
			<CardHeader>
				<CardTitle>Security</CardTitle>
				<CardDescription>Manage your password and security settings.</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<div class="space-y-1">
							<p class="text-sm font-medium">Password</p>
							<p class="text-sm text-muted-foreground">
								Last updated: {formatDate(data.user.updatedAt.toString())}
							</p>
						</div>
						<Button
							variant="outline"
							onclick={() => alert('Change password functionality coming soon!')}
						>
							Change Password
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>

		<!-- Danger Zone -->
		<Card class="border-destructive">
			<CardHeader>
				<CardTitle class="text-destructive">Danger Zone</CardTitle>
				<CardDescription>Irreversible and destructive actions.</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<div class="space-y-1">
							<p class="text-sm font-medium">Delete Account</p>
							<p class="text-sm text-muted-foreground">
								Permanently delete your account and all associated data.
							</p>
						</div>
						<Button
							variant="destructive"
							onclick={() => {
								alert('Account deletion is not implemented yet.');
							}}
						>
							Delete Account
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	</div>
</div>
