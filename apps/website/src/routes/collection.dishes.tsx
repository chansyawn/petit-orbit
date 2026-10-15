import { createFileRoute } from "@tanstack/react-router";
import { getDishCatalog } from "@/features/catalog/content.functions";
import { DishError, DishLayout, DishNotFound } from "@/features/dishes/layout";

export const Route = createFileRoute("/collection/dishes")({
  loader: () => getDishCatalog(),
  staleTime: Infinity,
  gcTime: Infinity,
  component: DishLayout,
  errorComponent: DishError,
  notFoundComponent: DishNotFound,
});
