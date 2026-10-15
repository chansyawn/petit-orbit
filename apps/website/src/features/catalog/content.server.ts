import { groupAt, parseContent } from "@petit-orbit/content-schema";
import rawContent from "../../../public/resources/content.json";

// The resource is bundled on the server, so production does not depend on the working directory.
let content: ReturnType<typeof parseContent> | undefined;
export function loadContent() {
  content ??= parseContent(rawContent);
  return content;
}

export function loadFurnitureCatalog() {
  const content = loadContent();
  return { items: groupAt(content, "furniture.items"), sets: groupAt(content, "furniture.sets") };
}

export function loadClothingCatalog() {
  const content = loadContent();
  return {
    items: groupAt(content, "clothing.items"),
    sets: groupAt(content, "clothing.sets"),
    appearances: groupAt(content, "clothing.appearances"),
  };
}

export function loadCreatureCatalog() {
  const content = loadContent();
  return {
    items: groupAt(content, "creatures.items"),
    series: groupAt(content, "creatures.series"),
  };
}

export function loadPlantCatalog() {
  const content = loadContent();
  return { items: groupAt(content, "plants.items"), series: groupAt(content, "plants.series") };
}

export function loadDishCatalog() {
  const content = loadContent();
  return { items: groupAt(content, "dishes.items"), series: groupAt(content, "dishes.series") };
}

export function loadMiscellanyCatalog() {
  const content = loadContent();
  return { items: groupAt(content, "miscellaneous") };
}
