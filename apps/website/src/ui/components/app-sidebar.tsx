import * as React from "react";
import { CheckIcon, ChevronsUpDownIcon, SearchIcon, SparklesIcon } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/ui/components/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/ui/components/sidebar";

const versions = ["资料库", "开发中"];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [selectedVersion, setSelectedVersion] = React.useState(versions[0] ?? "");

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
                  />
                }
              >
                <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <SparklesIcon className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">星布谷地</span>
                  <span className="text-xs text-muted-foreground">{selectedVersion}</span>
                </div>
                <ChevronsUpDownIcon className="ml-auto size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {versions.map((version) => (
                  <DropdownMenuItem key={version} onSelect={() => setSelectedVersion(version)}>
                    {version}
                    {version === selectedVersion && <CheckIcon className="ml-auto size-4" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
        <form>
          <SidebarGroup className="py-0">
            <SidebarGroupContent className="relative">
              <label htmlFor="wiki-search" className="sr-only">
                搜索
              </label>
              <SidebarInput id="wiki-search" placeholder="搜索 Wiki..." className="pl-8" />
              <SearchIcon className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 opacity-50" />
            </SidebarGroupContent>
          </SidebarGroup>
        </form>
      </SidebarHeader>
      <SidebarContent />
      <SidebarRail />
    </Sidebar>
  );
}
