import { createServerFn } from "@tanstack/react-start";
import { loadFurnitureCatalog, loadClothingCatalog } from "./content.server";

export const getFurnitureCatalog = createServerFn({ method: "GET" }).handler(() =>
  loadFurnitureCatalog(),
);

export const getClothingCatalog = createServerFn({ method: "GET" }).handler(() =>
  loadClothingCatalog(),
);
