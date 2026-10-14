import { createFileRoute } from "@tanstack/react-router";
import { getClothingCatalog } from "@/features/catalog/content.functions";
import { ClothingError, ClothingLayout, ClothingNotFound } from "@/features/clothing/layout";

export const Route = createFileRoute("/collection/clothing")({
  loader: () => getClothingCatalog(),
  staleTime: Infinity,
  gcTime: Infinity,
  component: ClothingLayout,
  errorComponent: ClothingError,
  notFoundComponent: ClothingNotFound,
});
