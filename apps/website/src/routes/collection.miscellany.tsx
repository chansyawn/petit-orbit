import { createFileRoute } from "@tanstack/react-router";
import { getMiscellanyCatalog } from "@/features/catalog/content.functions";
import {
  MiscellanyError,
  MiscellanyLayout,
  MiscellanyNotFound,
} from "@/features/miscellany/layout";

export const Route = createFileRoute("/collection/miscellany")({
  loader: () => getMiscellanyCatalog(),
  staleTime: Infinity,
  gcTime: Infinity,
  component: MiscellanyLayout,
  errorComponent: MiscellanyError,
  notFoundComponent: MiscellanyNotFound,
});
