<script lang="ts">
  import LayoutDashboard from "@lucide/svelte/icons/layout-dashboard";
  import Database from "@lucide/svelte/icons/database";
  import FileText from "@lucide/svelte/icons/file-text";
  import HelpCircle from "@lucide/svelte/icons/help-circle";
  import Circle from "@lucide/svelte/icons/circle";
  import List from "@lucide/svelte/icons/list";
  import FileBarChart from "@lucide/svelte/icons/file-bar-chart";
  import Search from "@lucide/svelte/icons/search";
  import Settings from "@lucide/svelte/icons/settings";
  import NavMain from "./nav-main.svelte";
  import NavSecondary from "./nav-secondary.svelte";
  import NavUser from "./nav-user.svelte";
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import type { ComponentProps, ComponentType } from "svelte";
import type { SvelteComponent } from "svelte";
  import type { User } from "better-auth";

  let {
    user,
    ...restProps
  }: ComponentProps<typeof Sidebar.Root> & { user: User } = $props();

  const data = {
    navMain: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard as unknown as ComponentType<SvelteComponent>,
      },
      {
        title: "Todos",
        url: "/todos",
        icon: List as unknown as ComponentType<SvelteComponent>,
      },
    ],
    navSecondary: [
      {
        title: "Settings",
        url: "#",
        icon: Settings as unknown as ComponentType<SvelteComponent>,
      },
      {
        title: "Get Help",
        url: "#",
        icon: HelpCircle as unknown as ComponentType<SvelteComponent>,
      },
      {
        title: "Search",
        url: "#",
        icon: Search as unknown as ComponentType<SvelteComponent>,
      },
    ],
    documents: [
      {
        name: "Data Library",
        url: "#",
        icon: Database as unknown as ComponentType<SvelteComponent>,
      },
      {
        name: "Reports",
        url: "#",
        icon: FileBarChart as unknown as ComponentType<SvelteComponent>,
      },
      {
        name: "Word Assistant",
        url: "#",
        icon: FileText as unknown as ComponentType<SvelteComponent>,
      },
    ],
  };
</script>

<Sidebar.Root collapsible="offcanvas" {...restProps}>
  <Sidebar.Header>
    <Sidebar.Menu>
      <Sidebar.MenuItem>
        <Sidebar.MenuButton class="data-[slot=sidebar-menu-button]:!p-1.5">
          {#snippet child({ props })}
            <a href="##" {...props}>
              <Circle class="!size-5" />
              <span class="text-base font-semibold">Acme Inc.</span>
            </a>
          {/snippet}
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Header>
  <Sidebar.Content>
    <NavMain items={data.navMain} />
    <!-- <NavDocuments items={data.documents} /> -->
    <NavSecondary items={data.navSecondary} class="mt-auto" />
  </Sidebar.Content>
  <Sidebar.Footer>
    <NavUser {user} />
  </Sidebar.Footer>
</Sidebar.Root>
