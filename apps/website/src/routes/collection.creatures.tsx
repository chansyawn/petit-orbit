import { createFileRoute } from "@tanstack/react-router";
import { getCreatureCatalog } from "@/features/catalog/content.functions";
import { CreatureError, CreatureLayout, CreatureNotFound } from "@/features/creatures/layout";

export const Route = createFileRoute("/collection/creatures")({
  loader: () => getCreatureCatalog(),
  staleTime: Infinity,
  gcTime: Infinity,
  component: CreatureLayout,
  errorComponent: CreatureError,
  notFoundComponent: CreatureNotFound,
});
