import { expect, test } from "vite-plus/test";
import { defaultParseSearch } from "@tanstack/react-router";
import { paginate } from "@/features/catalog/model";
import { loadDishCatalog } from "@/features/catalog/content.server";
import {
  createRelations,
  defaultSearch,
  filterDishes,
  filterOptions,
  listHref,
  parseDetailSearch,
  parseReturnTo,
  parseSearch,
} from "./model";
import { catalog } from "./test-fixtures";

test("series intersects with every dish filter and preserves source order", () => {
  expect(filterDishes(catalog, { ...defaultSearch, series: "10" }).map((item) => item.id)).toEqual([
    1, 2,
  ]);
  expect(
    filterDishes(catalog, {
      ...defaultSearch,
      q: "测试",
      series: "10",
      quality: "0",
      difficulty: "简单",
      galaxyFlavor: "禾夏风味",
      cookware: "煮锅",
    }).map((item) => item.id),
  ).toEqual([1]);
  for (const patch of [
    { series: "11", q: "测试" },
    { series: "999" },
    { difficulty: "简" },
    { galaxyFlavor: "禾夏" },
    { cookware: "锅" },
  ])
    expect(filterDishes(catalog, { ...defaultSearch, ...patch })).toEqual([]);
});
test("membership uses dishIds instead of names, with empty and multiple memberships", () => {
  const relations = createRelations(catalog);
  expect(relations.seriesFor(1).map((series) => series.id)).toEqual([10]);
  expect(relations.seriesFor(2).map((series) => series.id)).toEqual([10, 11]);
  expect(relations.seriesFor(3)).toEqual([]);
  expect(filterDishes(catalog, defaultSearch).map((item) => item.id)).toEqual([1, 2, 3]);
  for (const dishIds of [null, []]) {
    const empty = { ...catalog, series: [{ ...catalog.series[0], dishIds }] };
    expect(createRelations(empty).seriesFor(1)).toEqual([]);
    expect(filterDishes(empty, { ...defaultSearch, series: "10" })).toEqual([]);
  }
});
test("options exclude null and empty strings, deduplicate and preserve zero quality", () => {
  const options = filterOptions({
    ...catalog,
    items: [...catalog.items, catalog.items[0], { ...catalog.items[2], cookware: "" }],
  });
  expect(options.quality).toContainEqual({ value: "0", label: "品质 0" });
  expect(options.difficulty.map((option) => option.value)).toEqual(["简单", "招牌"]);
  expect(options.cookware.map((option) => option.value)).toEqual(["烤箱", "煮锅"]);
  expect(options.galaxyFlavor.map((option) => option.value)).toEqual(["禾夏风味", "塔法风味"]);
});
test("numeric URL decoding preserves zero quality and legal unknown series IDs", () => {
  expect(parseSearch(defaultParseSearch("?q=123&series=10&quality=0&page=2"))).toEqual({
    ...defaultSearch,
    q: "123",
    series: "10",
    quality: "0",
    page: 2,
  });
  expect(parseSearch({ series: "000999", difficulty: "未知" })).toEqual({
    ...defaultSearch,
    series: "999",
    difficulty: "未知",
  });
  for (const series of [0, -1, 1.5, "bad", [1], "9007199254740992"])
    expect(parseSearch({ series }).series).toBe("");
  for (const page of [0, -1, 1.5, "bad", Infinity]) expect(parseSearch({ page }).page).toBe(1);
  for (const quality of [5, -1, "bad", [0]]) expect(parseSearch({ quality }).quality).toBe("");
});
test("return links restore all filters and reject destinations outside the dish list", () => {
  const search = {
    ...defaultSearch,
    q: "茶",
    series: "10",
    quality: "0",
    difficulty: "简单",
    galaxyFlavor: "禾夏风味",
    cookware: "煮锅",
    page: 2,
  };
  expect(parseReturnTo(listHref(search))?.search).toEqual(search);
  expect(parseDetailSearch({ returnTo: listHref(search) }).returnTo).toBe(listHref(search));
  expect(
    parseReturnTo("/collection/dishes?series=999&effects=增加30力气&category=炒菜")?.href,
  ).toBe("/collection/dishes?series=999");
  for (const value of [
    "https://example.com/collection/dishes",
    "//example.com",
    "/collection/dishes/1",
    "/collection/plants",
    null,
  ])
    expect(parseReturnTo(value)).toBeUndefined();
});
test("pagination keeps the final dish and handles empty results", () => {
  const items = Array.from({ length: 121 }, (_, index) => index);
  expect(paginate(items, 999)).toEqual({ items: [120], page: 6, pages: 6, total: 121 });
  expect(paginate([], 999)).toEqual({ items: [], page: 1, pages: 1, total: 0 });
});
test("shared schema loads 121 dishes and 9 series with exact membership", () => {
  const actual = loadDishCatalog();
  expect(actual.items).toHaveLength(121);
  expect(actual.series).toHaveLength(9);
  const relations = createRelations(actual);
  for (const item of actual.items)
    expect(relations.seriesFor(item.id).map((series) => series.id)).toEqual(
      actual.series
        .filter((series) => series.dishIds?.includes(item.id))
        .map((series) => series.id),
    );
});
