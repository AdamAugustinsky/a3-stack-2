<script lang="ts">
  import CreditCard from "@lucide/svelte/icons/credit-card";
  import EllipsisVertical from "@lucide/svelte/icons/ellipsis-vertical";
  import LogOut from "@lucide/svelte/icons/log-out";
  import Bell from "@lucide/svelte/icons/bell";
  import UserCircle from "@lucide/svelte/icons/user-circle";
  import * as Avatar from "$lib/components/ui/avatar/index.js";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import type { User } from "better-auth";
  import { authClient } from "$lib/auth-client";
  import { goto } from "$app/navigation";

  let { user }: { user: User } = $props();

  const sidebar = Sidebar.useSidebar();

  async function handleSignOut() {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          goto("/");
        },
        onError: (error) => {
          console.error("Sign out failed:", error);
        },
      },
    });
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
            <Avatar.Root class="size-8 rounded-lg grayscale">
              <Avatar.Image src={user.image} alt={user.name} />
              <Avatar.Fallback class="rounded-lg"
                >{user.name
                  .split(" ")
                  .map((s) => s[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}</Avatar.Fallback
              >
            </Avatar.Root>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-medium">{user.name}</span>
              <span class="text-muted-foreground truncate text-xs">
                {user.email}
              </span>
            </div>
            <EllipsisVertical class="ml-auto size-4" />
          </Sidebar.MenuButton>
        {/snippet}
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        class="w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg"
        side={sidebar.isMobile ? "bottom" : "right"}
        align="end"
        sideOffset={4}
      >
        <DropdownMenu.Label class="p-0 font-normal">
          <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar.Root class="size-8 rounded-lg">
              <Avatar.Image src={user.image} alt={user.name} />
              <Avatar.Fallback class="rounded-lg">CN</Avatar.Fallback>
            </Avatar.Root>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-medium">{user.name}</span>
              <span class="text-muted-foreground truncate text-xs">
                {user.email}
              </span>
            </div>
          </div>
        </DropdownMenu.Label>
        <DropdownMenu.Separator />
        <DropdownMenu.Group>
          <DropdownMenu.Item>
            <UserCircle />
            Account
          </DropdownMenu.Item>
          <!-- <DropdownMenu.Item> -->
          <!--   <CreditCardIcon /> -->
          <!--   Billing -->
          <!-- </DropdownMenu.Item> -->
          <!-- <DropdownMenu.Item> -->
          <!--   <NotificationIcon /> -->
          <!--   Notifications -->
          <!-- </DropdownMenu.Item> -->
        </DropdownMenu.Group>
        <DropdownMenu.Separator />
        <DropdownMenu.Item onclick={handleSignOut}>
          <LogOut />
          Log out
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  </Sidebar.MenuItem>
</Sidebar.Menu>
