import { createFileRoute } from "@tanstack/react-router";
import { getFurnitureCatalog } from "@/features/catalog/content.functions";
import { FurnitureError, FurnitureLayout, FurnitureNotFound } from "@/features/furniture/layout";

export const Route = createFileRoute("/collection/furniture")({
  loader: () => getFurnitureCatalog(),
  staleTime: Infinity,
  gcTime: Infinity,
  component: FurnitureLayout,
  errorComponent: FurnitureError,
  notFoundComponent: FurnitureNotFound,
});
