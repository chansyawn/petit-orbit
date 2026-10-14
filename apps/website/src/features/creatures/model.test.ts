import { expect, test } from "vite-plus/test";
import { defaultParseSearch } from "@tanstack/react-router";
import { paginate } from "@/features/catalog/model";
import { loadCreatureCatalog } from "@/features/catalog/content.server";
import {
  createRelations,
  defaultSearch,
  filterCreatures,
  filterOptions,
  listHref,
  parseDetailSearch,
  parseReturnTo,
  parseSearch,
} from "./model";
import { catalog } from "./test-fixtures";

test("series IDs intersect with every filter and preserve source order", () => {
  expect(
    filterCreatures(catalog, { ...defaultSearch, series: "10" }).map((item) => item.id),
  ).toEqual([1, 2]);
  expect(
    filterCreatures(catalog, {
      ...defaultSearch,
      q: "测试",
      series: "10",
      category: "水生生物",
      quality: "0",
      region: "禾夏",
      habitat: "河流",
      season: "春季",
      time: "白天",
      weather: "雨天",
    }).map((item) => item.id),
  ).toEqual([1]);
  expect(filterCreatures(catalog, { ...defaultSearch, series: "11", q: "测试" })).toEqual([]);
  expect(filterCreatures(catalog, { ...defaultSearch, series: "999" })).toEqual([]);
  expect(
    filterCreatures(
      { ...catalog, series: [{ ...catalog.series[0], creatureIds: null }] },
      { ...defaultSearch, series: "10" },
    ),
  ).toEqual([]);
});
test("seasons are trimmed and deduplicated while activity filters match exactly", () => {
  expect(filterOptions(catalog).season.map((option) => option.value)).toEqual([
    "春季",
    "全年",
    "夏季",
  ]);
  for (const patch of [{ season: "春季" }, { time: "白天" }, { weather: "雨天" }])
    expect(filterCreatures(catalog, { ...defaultSearch, ...patch }).map((item) => item.id)).toEqual(
      [1],
    );
  expect(filterCreatures(catalog, { ...defaultSearch, season: "秋季" })).toEqual([]);
});
test("membership uses creatureIds, including zero and multiple series", () => {
  const relations = createRelations(catalog);
  expect(relations.seriesFor(1).map((series) => series.id)).toEqual([10]);
  expect(relations.seriesFor(2).map((series) => series.id)).toEqual([10, 11]);
  expect(relations.seriesFor(999)).toEqual([]);
  expect(
    createRelations({ ...catalog, series: [{ ...catalog.series[0], creatureIds: [] }] }).seriesFor(
      1,
    ),
  ).toEqual([]);
});
test("URL search handles numeric decoding, zero quality, unknown series and invalid values", () => {
  expect(parseSearch(defaultParseSearch("?q=123&quality=0&series=10&page=2"))).toEqual({
    ...defaultSearch,
    q: "123",
    quality: "0",
    series: "10",
    page: 2,
  });
  expect(parseSearch({ series: "000999", category: "未知", page: 999 })).toEqual({
    ...defaultSearch,
    series: "999",
    category: "未知",
    page: 999,
  });
  for (const series of [0, -1, 1.5, "abc", [10], "9007199254740992"])
    expect(parseSearch({ series }).series).toBe("");
  for (const page of [0, -1, 1.5, "bad", Infinity]) expect(parseSearch({ page }).page).toBe(1);
  for (const quality of [5, -1, "bad", [0]]) expect(parseSearch({ quality }).quality).toBe("");
});
test("return addresses only accept the creature list and restore validated query state", () => {
  const search = { ...defaultSearch, q: "鱼", series: "10", quality: "0", season: "春季", page: 2 };
  expect(parseReturnTo(listHref(search))?.search).toEqual(search);
  expect(parseDetailSearch({ returnTo: listHref(search) }).returnTo).toBe(listHref(search));
  expect(parseReturnTo("/collection/creatures?series=999&extra=1")?.href).toBe(
    "/collection/creatures?series=999",
  );
  for (const address of [
    "https://example.com/collection/creatures",
    "//example.com",
    "/collection/creatures/1",
    "/collection/clothing",
    null,
  ])
    expect(parseReturnTo(address)).toBeUndefined();
});
test("pagination clamps pages without dropping the final records", () => {
  const items = Array.from({ length: 317 }, (_, index) => index);
  expect(paginate(items, 999)).toEqual({
    items: [312, 313, 314, 315, 316],
    page: 14,
    pages: 14,
    total: 317,
  });
  expect(paginate([], 999)).toEqual({ items: [], page: 1, pages: 1, total: 0 });
});
test("shared schema loads all actual creatures and series with exact membership", () => {
  const actual = loadCreatureCatalog();
  expect(actual.items).toHaveLength(317);
  expect(actual.series).toHaveLength(27);
  const relations = createRelations(actual);
  for (const item of actual.items)
    expect(relations.seriesFor(item.id).map((series) => series.id)).toEqual(
      actual.series
        .filter((series) => series.creatureIds?.includes(item.id))
        .map((series) => series.id),
    );
});
