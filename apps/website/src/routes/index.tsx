import { createFileRoute } from "@tanstack/react-router";

import { WikiLayout } from "@/features/layout/wiki-layout";
import { WikiPage } from "@/features/layout/wiki-page";

export const Route = createFileRoute("/")({ component: App });

function App() {
  return (
    <WikiLayout>
      <WikiPage
        eyebrow="星布谷地 Wiki"
        title="探索星布谷地"
        description="这里将整理游戏中的物品、角色、地点和冒险资料。"
      />
    </WikiLayout>
  );
}
