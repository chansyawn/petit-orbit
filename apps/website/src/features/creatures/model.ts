import type { CreatureItem, CreatureSeries } from "@petit-orbit/content-schema";
import { parseId, splitValues } from "@/features/catalog/model";

export type CreatureCatalog = { items: CreatureItem[]; series: CreatureSeries[] };
export const filterFields = [
  ["series", "系列"],
  ["category", "分类"],
  ["quality", "品质"],
  ["region", "地区"],
  ["habitat", "栖息地"],
  ["season", "季节"],
  ["time", "时段"],
  ["weather", "天气"],
] as const;
type FilterField = (typeof filterFields)[number][0];
export type CreatureSearch = Record<FilterField | "q", string> & { page: number };
const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");
export function parseSearch(input: Record<string, unknown>): CreatureSearch {
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
    region: text(input.region),
    habitat: text(input.habitat),
    season: text(input.season),
    time: text(input.time),
    weather: text(input.weather),
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
  };
}
export const defaultSearch = parseSearch({});
export function filterCreatures(catalog: CreatureCatalog, search: CreatureSearch) {
  const members = new Set(
    catalog.series.find((series) => String(series.id) === search.series)?.creatureIds ?? [],
  );
  return catalog.items.filter(
    (item) =>
      item.name.toLowerCase().includes(search.q.toLowerCase()) &&
      (!search.series || members.has(item.id)) &&
      (!search.category || item.category === search.category) &&
      (!search.quality || String(item.quality) === search.quality) &&
      (!search.region || item.region === search.region) &&
      (!search.habitat || item.habitat === search.habitat) &&
      (!search.season || splitValues(item.activeSeasons).includes(search.season)) &&
      (!search.time || item.activeTimes === search.time) &&
      (!search.weather || item.activeWeather === search.weather),
  );
}
export function filterOptions(
  catalog: CreatureCatalog,
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
    region: options(catalog.items.map((item) => item.region)),
    habitat: options(catalog.items.map((item) => item.habitat)),
    season: options(catalog.items.flatMap((item) => splitValues(item.activeSeasons))),
    time: options(catalog.items.map((item) => item.activeTimes)),
    weather: options(catalog.items.map((item) => item.activeWeather)),
  };
}
export function createRelations(catalog: CreatureCatalog) {
  const seriesByCreature = new Map<number, CreatureSeries[]>();
  for (const series of catalog.series)
    for (const id of series.creatureIds ?? []) {
      const memberships = seriesByCreature.get(id) ?? [];
      memberships.push(series);
      seriesByCreature.set(id, memberships);
    }
  return { seriesFor: (id: number) => seriesByCreature.get(id) ?? [] };
}
export function listHref(search: CreatureSearch) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(parseSearch(search)))
    if (value !== "" && !(key === "page" && value === 1)) params.set(key, String(value));
  return "/collection/creatures" + (params.size ? `?${params}` : "");
}
export function parseReturnTo(value: unknown) {
  if (typeof value !== "string") return undefined;
  const [path, query = ""] = value.split("?");
  if (path !== "/collection/creatures") return undefined;
  const search = parseSearch(Object.fromEntries(new URLSearchParams(query)));
  return { search, href: listHref(search) };
}
export function parseDetailSearch(input: Record<string, unknown>) {
  return { returnTo: parseReturnTo(input.returnTo)?.href };
}
