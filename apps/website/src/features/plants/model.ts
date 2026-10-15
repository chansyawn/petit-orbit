import type { PlantItem, PlantSeries } from "@petit-orbit/content-schema";
import { parseId } from "@/features/catalog/model";

export type PlantCatalog = { items: PlantItem[]; series: PlantSeries[] };
export const filterFields = [
  ["series", "系列"],
  ["category", "分类"],
  ["quality", "品质"],
  ["originGalaxy", "原产星系"],
  ["harvestCount", "收获次数"],
] as const;
type FilterField = (typeof filterFields)[number][0];
export type PlantSearch = Record<FilterField | "q", string> & { page: number };
const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");
function parseHarvestCount(value: unknown) {
  const input = typeof value === "number" ? String(value) : text(value);
  const count = Number(input);
  return /^\d+$/.test(input) && Number.isSafeInteger(count) ? String(count) : "";
}
export function parseSearch(input: Record<string, unknown>): PlantSearch {
  const page =
    typeof input.page === "number" || typeof input.page === "string" ? Number(input.page) : 1;
  const quality = typeof input.quality === "number" ? String(input.quality) : text(input.quality);
  const series = parseId(
    typeof input.series === "number" ? String(input.series) : text(input.series),
  );
  return {
    q: typeof input.q === "number" && Number.isFinite(input.q) ? String(input.q) : text(input.q),
    series: series === undefined ? "" : String(series),
    category: text(input.category),
    quality: /^[0-4]$/.test(quality) ? quality : "",
    originGalaxy: text(input.originGalaxy),
    harvestCount: parseHarvestCount(input.harvestCount),
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
  };
}
export const defaultSearch = parseSearch({});
export function filterPlants(catalog: PlantCatalog, search: PlantSearch) {
  const members = new Set(
    catalog.series.find((series) => String(series.id) === search.series)?.plantIds ?? [],
  );
  return catalog.items.filter(
    (item) =>
      item.name.toLowerCase().includes(search.q.toLowerCase()) &&
      (!search.series || members.has(item.id)) &&
      (!search.category || item.category === search.category) &&
      (!search.quality || String(item.quality) === search.quality) &&
      (!search.originGalaxy || item.originGalaxy === search.originGalaxy) &&
      (!search.harvestCount || String(item.harvestCount) === search.harvestCount),
  );
}
export function filterOptions(
  catalog: PlantCatalog,
): Record<FilterField, { value: string; label: string }[]> {
  const options = (values: (string | null)[]) =>
    [...new Set(values.filter((value) => value !== null))]
      .sort((a, b) => a.localeCompare(b, "zh-CN"))
      .map((value) => ({ value, label: value }));
  return {
    series: catalog.series.map((series) => ({ value: String(series.id), label: series.name })),
    category: options(catalog.items.map((item) => item.category)),
    quality: options(
      catalog.items.map((item) => (item.quality === null ? null : String(item.quality))),
    ).map((option) => ({ ...option, label: `品质 ${option.value}` })),
    originGalaxy: options(catalog.items.map((item) => item.originGalaxy)),
    harvestCount: options(
      catalog.items.map((item) => (item.harvestCount === null ? null : String(item.harvestCount))),
    ),
  };
}
export function createRelations(catalog: PlantCatalog) {
  const seriesByPlant = new Map<number, PlantSeries[]>();
  for (const series of catalog.series)
    for (const id of series.plantIds ?? []) {
      const memberships = seriesByPlant.get(id) ?? [];
      memberships.push(series);
      seriesByPlant.set(id, memberships);
    }
  return { seriesFor: (id: number) => seriesByPlant.get(id) ?? [] };
}
export function listHref(search: PlantSearch) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(parseSearch(search)))
    if (value !== "" && !(key === "page" && value === 1)) params.set(key, String(value));
  return "/collection/plants" + (params.size ? `?${params}` : "");
}
export function parseReturnTo(value: unknown) {
  if (typeof value !== "string") return undefined;
  const [path, query = ""] = value.split("?");
  if (path !== "/collection/plants") return undefined;
  const search = parseSearch(Object.fromEntries(new URLSearchParams(query)));
  return { search, href: listHref(search) };
}
export function parseDetailSearch(input: Record<string, unknown>) {
  return { returnTo: parseReturnTo(input.returnTo)?.href };
}
