import { createServerFn } from "@tanstack/react-start";
import {
  loadFurnitureCatalog,
  loadClothingCatalog,
  loadCreatureCatalog,
  loadPlantCatalog,
} from "./content.server";

export const getFurnitureCatalog = createServerFn({ method: "GET" }).handler(() =>
  loadFurnitureCatalog(),
);

export const getClothingCatalog = createServerFn({ method: "GET" }).handler(() =>
  loadClothingCatalog(),
);

export const getCreatureCatalog = createServerFn({ method: "GET" }).handler(() =>
  loadCreatureCatalog(),
);

export const getPlantCatalog = createServerFn({ method: "GET" }).handler(() => loadPlantCatalog());
