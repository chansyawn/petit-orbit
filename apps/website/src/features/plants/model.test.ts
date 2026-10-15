import { expect, test } from "vite-plus/test";
import { defaultParseSearch } from "@tanstack/react-router";
import { paginate } from "@/features/catalog/model";
import { loadPlantCatalog } from "@/features/catalog/content.server";
import {
  createRelations,
  defaultSearch,
  filterPlants,
  filterOptions,
  listHref,
  parseDetailSearch,
  parseReturnTo,
  parseSearch,
} from "./model";
import { catalog } from "./test-fixtures";

test("series intersects with every plant filter and preserves source order", () => {
  expect(filterPlants(catalog, { ...defaultSearch, series: "10" }).map((item) => item.id)).toEqual([
    1, 2,
  ]);
  expect(
    filterPlants(catalog, {
      ...defaultSearch,
      q: "测试",
      series: "10",
      category: "花",
      quality: "0",
      originGalaxy: "禾夏",
      harvestCount: "0",
    }).map((item) => item.id),
  ).toEqual([1]);
  for (const patch of [
    { series: "11", q: "测试" },
    { series: "999" },
    { originGalaxy: "未知" },
    { harvestCount: "999" },
  ])
    expect(filterPlants(catalog, { ...defaultSearch, ...patch })).toEqual([]);
});
test("unassigned plants are visible by default and membership is based only on plantIds", () => {
  const relations = createRelations(catalog);
  expect(filterPlants(catalog, defaultSearch).map((item) => item.id)).toEqual([1, 2, 3]);
  expect(relations.seriesFor(1).map((series) => series.id)).toEqual([10]);
  expect(relations.seriesFor(2).map((series) => series.id)).toEqual([10, 11]);
  expect(relations.seriesFor(3)).toEqual([]);
  for (const plantIds of [null, []]) {
    const empty = { ...catalog, series: [{ ...catalog.series[0], plantIds }] };
    expect(createRelations(empty).seriesFor(1)).toEqual([]);
    expect(filterPlants(empty, { ...defaultSearch, series: "10" })).toEqual([]);
  }
});
test("filter options exclude null, deduplicate values and preserve zero", () => {
  const options = filterOptions(catalog);
  expect(options.category.map((option) => option.value)).toEqual(["花", "环境植物"]);
  expect(options.harvestCount.map((option) => option.value)).toEqual(["0", "3"]);
  expect(options.originGalaxy.map((option) => option.value)).toEqual(["禾夏", "塔法"]);
  expect(options.quality).toContainEqual({ value: "0", label: "品质 0" });
  expect(
    filterPlants(catalog, { ...defaultSearch, harvestCount: "0" }).map((item) => item.id),
  ).toEqual([1]);
});
test("numeric URL decoding preserves zero and normalizes legal unknown IDs and counts", () => {
  expect(
    parseSearch(defaultParseSearch("?q=123&series=10&quality=0&harvestCount=0&page=2")),
  ).toEqual({ ...defaultSearch, q: "123", series: "10", quality: "0", harvestCount: "0", page: 2 });
  expect(parseSearch({ series: "000999", harvestCount: "0008", category: "未知" })).toEqual({
    ...defaultSearch,
    series: "999",
    harvestCount: "8",
    category: "未知",
  });
  for (const value of [-1, 1.5, "abc", [0], "9007199254740992", Infinity])
    expect(parseSearch({ harvestCount: value }).harvestCount).toBe("");
  for (const series of [0, -1, 1.5, "bad", [1], "9007199254740992"])
    expect(parseSearch({ series }).series).toBe("");
  for (const page of [0, -1, 1.5, "bad", Infinity]) expect(parseSearch({ page }).page).toBe(1);
  for (const quality of [5, -1, "bad", [0]]) expect(parseSearch({ quality }).quality).toBe("");
});
test("return links restore all validated filters and reject other destinations", () => {
  const search = {
    ...defaultSearch,
    q: "花",
    series: "10",
    category: "花",
    quality: "0",
    originGalaxy: "禾夏",
    harvestCount: "0",
    page: 2,
  };
  expect(parseReturnTo(listHref(search))?.search).toEqual(search);
  expect(parseDetailSearch({ returnTo: listHref(search) }).returnTo).toBe(listHref(search));
  expect(parseReturnTo("/collection/plants?harvestCount=999&extra=1")?.href).toBe(
    "/collection/plants?harvestCount=999",
  );
  for (const value of [
    "https://example.com/collection/plants",
    "//example.com",
    "/collection/plants/1",
    "/collection/creatures",
    null,
  ])
    expect(parseReturnTo(value)).toBeUndefined();
});
test("pagination preserves the final ten plants and handles empty results", () => {
  const items = Array.from({ length: 202 }, (_, index) => index);
  expect(paginate(items, 999)).toEqual({ items: items.slice(192), page: 9, pages: 9, total: 202 });
  expect(paginate([], 999)).toEqual({ items: [], page: 1, pages: 1, total: 0 });
});
test("shared schema loads 202 plants and 31 series including 24 unassigned plants", () => {
  const actual = loadPlantCatalog();
  expect(actual.items).toHaveLength(202);
  expect(actual.series).toHaveLength(31);
  const relations = createRelations(actual);
  expect(filterPlants(actual, defaultSearch)).toHaveLength(202);
  expect(actual.items.filter((item) => relations.seriesFor(item.id).length === 0)).toHaveLength(24);
  for (const item of actual.items)
    expect(relations.seriesFor(item.id).map((series) => series.id)).toEqual(
      actual.series
        .filter((series) => series.plantIds?.includes(item.id))
        .map((series) => series.id),
    );
});
