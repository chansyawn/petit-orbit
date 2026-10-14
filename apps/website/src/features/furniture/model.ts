import { splitValues } from "@/features/catalog/model";
export { paginate, splitValues, parseId, pageSize } from "@/features/catalog/model";
import type { FurnitureItem, FurnitureSet } from "@petit-orbit/content-schema";

export type FurnitureCatalog = { items: FurnitureItem[]; sets: FurnitureSet[] };
export const furniturePath = "/collection/furniture";
export const setsPath = "/collection/furniture/sets";
export type CatalogSearch = {
  q: string;
  category: string;
  type: string;
  quality: string;
  color: string;
  material: string;
  page: number;
};
const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");
export function parseSearch(input: Record<string, unknown>): CatalogSearch {
  const page =
    typeof input.page === "string" || typeof input.page === "number" ? Number(input.page) : 1;
  const quality = typeof input.quality === "number" ? String(input.quality) : text(input.quality);
  return {
    q: typeof input.q === "number" && Number.isFinite(input.q) ? String(input.q) : text(input.q),
    category: text(input.category),
    type: text(input.type),
    quality: /^[0-4]$/.test(quality) ? quality : "",
    color: text(input.color),
    material: text(input.material),
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
  };
}
export const defaultSearch = parseSearch({});
export function filterFurniture(items: FurnitureItem[], search: CatalogSearch) {
  return items.filter(
    (item) =>
      item.name.toLowerCase().includes(search.q.toLowerCase()) &&
      (!search.category || item.category === search.category) &&
      (!search.type || item.type === search.type) &&
      (!search.quality || String(item.quality) === search.quality) &&
      (!search.color || splitValues(item.colors).includes(search.color)) &&
      (!search.material || splitValues(item.materials).includes(search.material)),
  );
}
export function filterOptions(items: FurnitureItem[]) {
  const unique = (values: string[]) =>
    [...new Set(values)].sort((a, b) => a.localeCompare(b, "zh-CN"));
  return {
    category: unique(items.flatMap((item) => (item.category === null ? [] : [item.category]))),
    type: unique(items.flatMap((item) => (item.type === null ? [] : [item.type]))),
    quality: unique(items.flatMap((item) => (item.quality === null ? [] : [String(item.quality)]))),
    color: unique(items.flatMap((item) => splitValues(item.colors))),
    material: unique(items.flatMap((item) => splitValues(item.materials))),
  };
}
export function createRelations(catalog: FurnitureCatalog) {
  const itemsById = new Map(catalog.items.map((item) => [item.id, item]));
  const setsByItem = new Map<number, FurnitureSet[]>();
  for (const set of catalog.sets)
    for (const id of set.componentIds ?? []) {
      const memberships = setsByItem.get(id) ?? [];
      memberships.push(set);
      setsByItem.set(id, memberships);
    }
  return {
    setsFor: (id: number) => setsByItem.get(id) ?? [],
    membersOf: (set: FurnitureSet) =>
      (set.componentIds ?? []).flatMap((id) => {
        const item = itemsById.get(id);
        return item ? [item] : [];
      }),
  };
}
export function listHref(path: typeof furniturePath | typeof setsPath, search: CatalogSearch) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    if (value !== "" && !(key === "page" && value === 1)) params.set(key, String(value));
  }
  return path + (params.size ? `?${params}` : "");
}
export function parseReturnTo(value: unknown) {
  if (typeof value !== "string") return undefined;
  const [path, query = ""] = value.split("?");
  if (path !== furniturePath && path !== setsPath) return undefined;
  const search = parseSearch(Object.fromEntries(new URLSearchParams(query)));
  return { path, search, href: listHref(path, search) };
}
export function parseDetailSearch(input: Record<string, unknown>) {
  return { returnTo: parseReturnTo(input.returnTo)?.href };
}
