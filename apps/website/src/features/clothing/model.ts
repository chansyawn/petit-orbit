import type { ClothingAppearance, ClothingItem, ClothingSet } from "@petit-orbit/content-schema";
import { splitValues } from "@/features/catalog/model";

export type ClothingCatalog = {
  items: ClothingItem[];
  sets: ClothingSet[];
  appearances: ClothingAppearance[];
};
export type ClothingKind = keyof ClothingCatalog;
export type ClothingRecord = ClothingItem | ClothingSet | ClothingAppearance;
export const listPaths = {
  items: "/collection/clothing",
  sets: "/collection/clothing/sets",
  appearances: "/collection/clothing/appearances",
} as const;
export const detailPaths = {
  items: "/collection/clothing/$id",
  sets: "/collection/clothing/sets/$id",
  appearances: "/collection/clothing/appearances/$id",
} as const;
export const labels = { items: "服饰", sets: "套装", appearances: "外观" } as const;
export type ClothingSearch = {
  q: string;
  category: string;
  quality: string;
  color: string;
  material: string;
  style: string;
  page: number;
};
const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");
export function parseSearch(
  input: Record<string, unknown>,
  kind: ClothingKind = "items",
): ClothingSearch {
  const page =
    typeof input.page === "number" || typeof input.page === "string" ? Number(input.page) : 1;
  const quality = typeof input.quality === "number" ? String(input.quality) : text(input.quality);
  return {
    q: typeof input.q === "number" && Number.isFinite(input.q) ? String(input.q) : text(input.q),
    category: kind === "sets" ? "" : text(input.category),
    quality: /^[0-4]$/.test(quality) ? quality : "",
    color: kind === "items" ? text(input.color) : "",
    material: kind === "items" ? text(input.material) : "",
    style: kind === "items" ? text(input.style) : "",
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
  };
}
export const defaultSearch = parseSearch({});
export const filterFields = {
  items: [
    ["category", "分类"],
    ["quality", "品质"],
    ["color", "颜色"],
    ["material", "材质"],
    ["style", "风格"],
  ],
  sets: [["quality", "品质"]],
  appearances: [
    ["category", "分类"],
    ["quality", "品质"],
  ],
} as const;
export function filterClothing(records: ClothingRecord[], search: ClothingSearch) {
  return records.filter(
    (record) =>
      record.name.toLowerCase().includes(search.q.toLowerCase()) &&
      (!search.quality || String(record.quality) === search.quality) &&
      (!search.category || ("category" in record && record.category === search.category)) &&
      (!search.color ||
        ("colors" in record && splitValues(record.colors).includes(search.color))) &&
      (!search.material ||
        ("materials" in record && splitValues(record.materials).includes(search.material))) &&
      (!search.style || ("styles" in record && splitValues(record.styles).includes(search.style))),
  );
}
export function filterOptions(records: ClothingRecord[]) {
  const unique = (values: string[]) =>
    [...new Set(values)].sort((a, b) => a.localeCompare(b, "zh-CN"));
  return {
    category: unique(
      records.flatMap((record) =>
        "category" in record && record.category !== null ? [record.category] : [],
      ),
    ),
    quality: unique(
      records.flatMap((record) => (record.quality === null ? [] : [String(record.quality)])),
    ),
    color: unique(
      records.flatMap((record) => ("colors" in record ? splitValues(record.colors) : [])),
    ),
    material: unique(
      records.flatMap((record) => ("materials" in record ? splitValues(record.materials) : [])),
    ),
    style: unique(
      records.flatMap((record) => ("styles" in record ? splitValues(record.styles) : [])),
    ),
  };
}
export function createRelations(catalog: ClothingCatalog) {
  const itemsById = new Map(catalog.items.map((item) => [item.id, item]));
  const setsByItem = new Map<number, ClothingSet[]>();
  for (const set of catalog.sets)
    for (const id of set.componentIds ?? []) {
      const memberships = setsByItem.get(id) ?? [];
      memberships.push(set);
      setsByItem.set(id, memberships);
    }
  return {
    setsFor: (id: number) => setsByItem.get(id) ?? [],
    membersOf: (set: ClothingSet) =>
      (set.componentIds ?? []).flatMap((id) => {
        const item = itemsById.get(id);
        return item ? [item] : [];
      }),
  };
}
export function listHref(kind: ClothingKind, search: ClothingSearch) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(parseSearch(search, kind)))
    if (value !== "" && !(key === "page" && value === 1)) params.set(key, String(value));
  return listPaths[kind] + (params.size ? `?${params}` : "");
}
export function parseReturnTo(value: unknown) {
  if (typeof value !== "string") return undefined;
  const [path, query = ""] = value.split("?");
  const kind = (Object.keys(listPaths) as ClothingKind[]).find((kind) => listPaths[kind] === path);
  if (!kind) return undefined;
  const search = parseSearch(Object.fromEntries(new URLSearchParams(query)), kind);
  return { kind, path: listPaths[kind], search, href: listHref(kind, search) };
}
export function parseDetailSearch(input: Record<string, unknown>) {
  return { returnTo: parseReturnTo(input.returnTo)?.href };
}
