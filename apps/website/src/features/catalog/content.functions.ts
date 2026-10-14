import { createServerFn } from "@tanstack/react-start";
import { loadFurnitureCatalog } from "./content.server";

export const getFurnitureCatalog = createServerFn({ method: "GET" }).handler(() =>
  loadFurnitureCatalog(),
);
