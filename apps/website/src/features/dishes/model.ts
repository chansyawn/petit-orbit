import type { DishItem, DishSeries } from "@petit-orbit/content-schema";
import { parseId } from "@/features/catalog/model";

export type DishCatalog = { items: DishItem[]; series: DishSeries[] };
export const filterFields = [
  ["series", "系列"],
  ["quality", "品质"],
  ["difficulty", "烹饪难度"],
  ["galaxyFlavor", "星系风味"],
  ["cookware", "厨具"],
] as const;
type FilterField = (typeof filterFields)[number][0];
export type DishSearch = Record<FilterField | "q", string> & { page: number };
const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");
export function parseSearch(input: Record<string, unknown>): DishSearch {
  const page =
    typeof input.page === "number" || typeof input.page === "string" ? Number(input.page) : 1;
  const quality = typeof input.quality === "number" ? String(input.quality) : text(input.quality);
  const series = parseId(
    typeof input.series === "number" ? String(input.series) : text(input.series),
  );
  return {
    q: typeof input.q === "number" && Number.isFinite(input.q) ? String(input.q) : text(input.q),
    series: series === undefined ? "" : String(series),
    quality: /^[0-4]$/.test(quality) ? quality : "",
    difficulty: text(input.difficulty),
    galaxyFlavor: text(input.galaxyFlavor),
    cookware: text(input.cookware),
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
  };
}
export const defaultSearch = parseSearch({});
export function filterDishes(catalog: DishCatalog, search: DishSearch) {
  const members = new Set(
    catalog.series.find((series) => String(series.id) === search.series)?.dishIds ?? [],
  );
  return catalog.items.filter(
    (item) =>
      item.name.toLowerCase().includes(search.q.toLowerCase()) &&
      (!search.series || members.has(item.id)) &&
      (!search.quality || String(item.quality) === search.quality) &&
      (!search.difficulty || item.difficulty === search.difficulty) &&
      (!search.galaxyFlavor || item.galaxyFlavor === search.galaxyFlavor) &&
      (!search.cookware || item.cookware === search.cookware),
  );
}
export function filterOptions(
  catalog: DishCatalog,
): Record<FilterField, { value: string; label: string }[]> {
  const options = (values: (string | null)[]) =>
    [...new Set(values.filter((value): value is string => value !== null && value !== ""))]
      .sort((a, b) => a.localeCompare(b, "zh-CN"))
      .map((value) => ({ value, label: value }));
  return {
    series: catalog.series.map((series) => ({ value: String(series.id), label: series.name })),
    quality: options(
      catalog.items.map((item) => (item.quality === null ? null : String(item.quality))),
    ).map((option) => ({ ...option, label: `品质 ${option.value}` })),
    difficulty: options(catalog.items.map((item) => item.difficulty)),
    galaxyFlavor: options(catalog.items.map((item) => item.galaxyFlavor)),
    cookware: options(catalog.items.map((item) => item.cookware)),
  };
}
export function createRelations(catalog: DishCatalog) {
  const seriesByDish = new Map<number, DishSeries[]>();
  for (const series of catalog.series)
    for (const id of series.dishIds ?? []) {
      const memberships = seriesByDish.get(id) ?? [];
      memberships.push(series);
      seriesByDish.set(id, memberships);
    }
  return { seriesFor: (id: number) => seriesByDish.get(id) ?? [] };
}
export function listHref(search: DishSearch) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(parseSearch(search)))
    if (value !== "" && !(key === "page" && value === 1)) params.set(key, String(value));
  return "/collection/dishes" + (params.size ? `?${params}` : "");
}
export function parseReturnTo(value: unknown) {
  if (typeof value !== "string") return undefined;
  const [path, query = ""] = value.split("?");
  if (path !== "/collection/dishes") return undefined;
  const search = parseSearch(Object.fromEntries(new URLSearchParams(query)));
  return { search, href: listHref(search) };
}
export function parseDetailSearch(input: Record<string, unknown>) {
  return { returnTo: parseReturnTo(input.returnTo)?.href };
}
