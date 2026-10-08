import { createFileRoute } from "@tanstack/react-router";
import { WikiLayout } from "@/features/layout/wiki-layout";
import { WikiPage } from "@/features/layout/wiki-page";

export const Route = createFileRoute("/items")({ component: ItemsPage });
function ItemsPage() {
  return (
    <WikiLayout>
      <WikiPage eyebrow="资料分类" title="物品" description="浏览星布谷地中的道具与收藏品。" />
    </WikiLayout>
  );
}
