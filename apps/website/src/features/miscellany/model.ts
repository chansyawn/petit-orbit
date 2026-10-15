import type { MiscellaneousItem } from "@petit-orbit/content-schema";

export type MiscellanyCatalog = { items: MiscellaneousItem[] };
export const filterFields = [["quality", "品质"]] as const;
export type MiscellanySearch = { q: string; quality: string; page: number };
const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");
export function parseSearch(input: Record<string, unknown>): MiscellanySearch {
  const page =
    typeof input.page === "number" || typeof input.page === "string" ? Number(input.page) : 1;
  const quality = typeof input.quality === "number" ? String(input.quality) : text(input.quality);
  return {
    q: typeof input.q === "number" && Number.isFinite(input.q) ? String(input.q) : text(input.q),
    quality: /^[0-4]$/.test(quality) ? quality : "",
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
  };
}
export const defaultSearch = parseSearch({});
export function filterMiscellany(catalog: MiscellanyCatalog, search: MiscellanySearch) {
  return catalog.items.filter(
    (item) =>
      item.name.toLowerCase().includes(search.q.toLowerCase()) &&
      (!search.quality || String(item.quality) === search.quality),
  );
}
export function filterOptions(catalog: MiscellanyCatalog) {
  return {
    quality: [
      ...new Set(
        catalog.items.flatMap((item) => (item.quality === null ? [] : [String(item.quality)])),
      ),
    ]
      .sort()
      .map((value) => ({ value, label: `品质 ${value}` })),
  };
}
export function listHref(search: MiscellanySearch) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(parseSearch(search)))
    if (value !== "" && !(key === "page" && value === 1)) params.set(key, String(value));
  return "/collection/miscellany" + (params.size ? `?${params}` : "");
}
export function parseReturnTo(value: unknown) {
  if (typeof value !== "string") return undefined;
  const [path, query = ""] = value.split("?");
  if (path !== "/collection/miscellany") return undefined;
  const search = parseSearch(Object.fromEntries(new URLSearchParams(query)));
  return { search, href: listHref(search) };
}
export function parseDetailSearch(input: Record<string, unknown>) {
  return { returnTo: parseReturnTo(input.returnTo)?.href };
}
