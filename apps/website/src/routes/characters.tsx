import { createFileRoute } from "@tanstack/react-router";
import { WikiLayout } from "@/features/layout/wiki-layout";
import { WikiPage } from "@/features/layout/wiki-page";

export const Route = createFileRoute("/characters")({ component: CharactersPage });
function CharactersPage() {
  return (
    <WikiLayout>
      <WikiPage eyebrow="资料分类" title="角色" description="认识在星布谷地中登场的角色。" />
    </WikiLayout>
  );
}
