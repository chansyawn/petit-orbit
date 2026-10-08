import { MenuIcon, SearchIcon } from "lucide-react";

import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { useSidebar } from "@/ui/components/sidebar";

export function SiteHeader() {
  const { toggleSidebar } = useSidebar();
  return (
    <header className="sticky top-0 z-50 flex h-(--header-height) w-full items-center border-b bg-[#352f2b]">
      <div className="flex w-full items-center px-4">
        <Button className="size-8 text-accent" variant="ghost" size="icon" onClick={toggleSidebar}>
          <span className="sr-only">切换侧栏</span>
          <MenuIcon />
        </Button>
        <div className="flex items-center">
          <img src="/logo.webp" alt="星布谷地 Wiki" className="h-12 w-auto mt-1" />
        </div>
        <form className="relative ml-auto w-full max-w-sm">
          <label htmlFor="header-search" className="sr-only">
            搜索 Wiki
          </label>
          <SearchIcon className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="header-search" placeholder="搜索 Wiki..." className="h-8 pl-8" />
        </form>
      </div>
    </header>
  );
}
