import { AppSidebar } from "@/features/layout/app-sidebar";
import { SiteHeader } from "@/features/layout/site-header";
import { SidebarInset, SidebarProvider } from "@/ui/components/sidebar";

export function WikiLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="[--header-height:calc(--spacing(14))]">
      <SidebarProvider className="flex flex-col">
        <SiteHeader />
        <div className="flex flex-1">
          <AppSidebar />
          <SidebarInset>{children}</SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
