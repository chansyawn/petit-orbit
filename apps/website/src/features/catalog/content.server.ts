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
