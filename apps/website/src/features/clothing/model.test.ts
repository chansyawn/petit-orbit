import { expect, test } from "vite-plus/test";
import { defaultParseSearch as parseRouterSearch } from "@tanstack/react-router";
import { loadClothingCatalog } from "@/features/catalog/content.server";
import { paginate, parseId, splitValues } from "@/features/catalog/model";
import {
  createRelations,
  defaultSearch,
  filterClothing,
  filterOptions,
  listHref,
  parseDetailSearch,
  parseReturnTo,
  parseSearch,
} from "./model";
import { catalog } from "./test-fixtures";

test("clothing filters intersect name, category, zero quality and exact multi-value attributes", () => {
  const search = {
    ...defaultSearch,
    q: "测试",
    category: "鞋子",
    quality: "0",
    color: "黑色",
    material: "橡胶",
    style: "职业",
  };
  expect(filterClothing(catalog.items, search).map((r) => r.id)).toEqual([1]);
  expect(filterClothing(catalog.items, { ...search, style: "青春" })).toEqual([]);
  expect(filterClothing(catalog.items, { ...defaultSearch, material: "皮" })).toEqual([]);
});
test("color, material and style options are trimmed and deduplicated independent values", () => {
  expect(splitValues(" 白色，黑色，，白色 ")).toEqual(["白色", "黑色"]);
  expect(splitValues(null)).toEqual([]);
  const options = filterOptions(catalog.items);
  expect(options.color).toEqual(expect.arrayContaining(["白色", "黑色"]));
  expect(options.color).toHaveLength(2);
  expect(options.material).toEqual(expect.arrayContaining(["皮革", "橡胶"]));
  expect(options.style).toEqual(expect.arrayContaining(["帅气", "职业", "青春"]));
  expect(options.quality).toEqual(["0", "1"]);
});
test("set and appearance queries accept only their supported filters", () => {
  expect(
    parseSearch({ q: "测试", quality: 0, category: "鞋子", color: "黑色", style: "职业" }, "sets"),
  ).toEqual({ ...defaultSearch, q: "测试", quality: "0" });
  expect(parseSearch({ category: "发型", quality: 0, material: "皮革" }, "appearances")).toEqual({
    ...defaultSearch,
    category: "发型",
    quality: "0",
  });
  expect(
    filterClothing(
      catalog.appearances,
      parseSearch({ category: "发型", quality: 0 }, "appearances"),
    ),
  ).toEqual(catalog.appearances);
});
test("relations use item IDs, preserve component order and do not use names or appearances", () => {
  const relations = createRelations(catalog);
  expect(relations.membersOf(catalog.sets[0]).map((r) => r.id)).toEqual([2, 1]);
  expect(relations.setsFor(1).map((r) => r.id)).toEqual([10]);
  expect(relations.setsFor(3)).toEqual([]);
  expect(relations.membersOf({ ...catalog.sets[0], componentIds: [3] })).toEqual([]);
  expect(relations.membersOf({ ...catalog.sets[0], componentIds: null })).toEqual([]);
  expect(relations.membersOf({ ...catalog.sets[0], componentIds: [] })).toEqual([]);
});
test("shared content loader exposes the three validated clothing groups", () => {
  const loaded = loadClothingCatalog();
  expect(loaded.items).toHaveLength(590);
  expect(loaded.sets).toHaveLength(34);
  expect(loaded.appearances).toHaveLength(51);
  const relations = createRelations(loaded);
  for (const set of loaded.sets)
    expect(relations.membersOf(set).map((r) => r.id)).toEqual(set.componentIds);
});
test("URL parsing preserves numeric names, quality zero and unknown text while normalizing pages", () => {
  expect(parseSearch(parseRouterSearch("?q=123&quality=0&category=未知&page=2"))).toEqual({
    ...defaultSearch,
    q: "123",
    quality: "0",
    category: "未知",
    page: 2,
  });
  for (const page of [-1, 0, "x", 1.5, Infinity]) expect(parseSearch({ page }).page).toBe(1);
  expect(parseSearch({ quality: "9", q: [], style: {} })).toEqual(defaultSearch);
});
test("return links restore queries and whitelist the three clothing lists", () => {
  const search = { ...defaultSearch, q: "测试靴", quality: "0", style: "职业", page: 2 };
  const href = listHref("items", search);
  expect(parseReturnTo(href)?.search).toEqual(search);
  expect(parseDetailSearch({ returnTo: href })).toEqual({ returnTo: href });
  expect(parseReturnTo("/collection/clothing/sets?quality=0&style=职业")?.search).toEqual({
    ...defaultSearch,
    quality: "0",
  });
  expect(
    parseReturnTo("/collection/clothing/appearances?category=发型&color=白色")?.search,
  ).toEqual({ ...defaultSearch, category: "发型" });
  for (const value of [
    "https://example.com",
    "//example.com",
    "/collection/furniture",
    "/collection/clothing/1",
    "/collection/clothing/../items",
    null,
  ])
    expect(parseReturnTo(value)).toBeUndefined();
});
test("pagination uses 24 entries with first, last, out-of-range and empty states", () => {
  const records = Array.from({ length: 590 }, (_, id) => id);
  expect(paginate(records, 1).items).toEqual(records.slice(0, 24));
  expect(paginate(records, 99)).toMatchObject({
    page: 25,
    pages: 25,
    total: 590,
    items: records.slice(576),
  });
  expect(paginate([], 3)).toEqual({ page: 1, pages: 1, total: 0, items: [] });
  expect(parseId("60270")).toBe(60270);
  for (const value of ["0", "-1", "x", "1.5", "9007199254740992"])
    expect(parseId(value)).toBeUndefined();
});
