import { createFileRoute } from "@tanstack/react-router";
import { getPlantCatalog } from "@/features/catalog/content.functions";
import { PlantError, PlantLayout, PlantNotFound } from "@/features/plants/layout";

export const Route = createFileRoute("/collection/plants")({
  loader: () => getPlantCatalog(),
  staleTime: Infinity,
  gcTime: Infinity,
  component: PlantLayout,
  errorComponent: PlantError,
  notFoundComponent: PlantNotFound,
});
