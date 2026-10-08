import { createFileRoute } from "@tanstack/react-router";

import { AppSidebar } from "@/ui/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/ui/components/breadcrumb";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/ui/components/sidebar";

export const Route = createFileRoute("/")({ component: App });

function App() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Wiki 总览</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <main className="flex flex-1 flex-col gap-6 p-4 md:p-8">
          <section className="space-y-2">
            <p className="text-sm font-medium text-primary">星布谷地 Wiki</p>
            <h1 className="text-3xl font-semibold tracking-tight">探索星布谷地</h1>
            <p className="max-w-2xl text-muted-foreground">
              这里将整理游戏中的物品、角色、地点和冒险资料。
            </p>
          </section>
          <section className="grid flex-1 gap-4 md:grid-cols-3">
            <div className="min-h-36 rounded-xl bg-muted/50" />
            <div className="min-h-36 rounded-xl bg-muted/50" />
            <div className="min-h-36 rounded-xl bg-muted/50" />
          </section>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
