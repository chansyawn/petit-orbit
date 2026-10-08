import { createFileRoute } from "@tanstack/react-router";
import { WikiLayout } from "@/features/layout/wiki-layout";
import { WikiPage } from "@/features/layout/wiki-page";

export const Route = createFileRoute("/locations")({ component: LocationsPage });
function LocationsPage() {
  return (
    <WikiLayout>
      <WikiPage eyebrow="资料分类" title="地点" description="探索星布谷地中的区域与地点。" />
    </WikiLayout>
  );
}
