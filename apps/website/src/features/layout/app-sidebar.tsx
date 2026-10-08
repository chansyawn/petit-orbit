import * as React from "react";
import { BookOpenIcon, MapIcon, PackageIcon, UsersIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/ui/components/sidebar";

const navItems = [
  { title: "Wiki 总览", to: "/", icon: BookOpenIcon },
  { title: "物品", to: "/items", icon: PackageIcon },
  { title: "角色", to: "/characters", icon: UsersIcon },
  { title: "地点", to: "/locations", icon: MapIcon },
] as const;

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar className="top-(--header-height) h-[calc(100svh-var(--header-height))]!" {...props}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>探索</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    render={<Link to={item.to} activeProps={{ "data-active": true }} />}
                  >
                    <Icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
