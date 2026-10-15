import { expect, test } from "vite-plus/test";
import { defaultParseSearch } from "@tanstack/react-router";
import { loadMiscellanyCatalog } from "@/features/catalog/content.server";
import { paginate } from "@/features/catalog/model";
import {
  defaultSearch,
  filterMiscellany,
  filterOptions,
  listHref,
  parseDetailSearch,
  parseReturnTo,
  parseSearch,
} from "./model";
import { catalog } from "./test-fixtures";

test("name and quality intersect, preserve source order and search names only", () => {
  expect(filterMiscellany(catalog, { ...defaultSearch, q: "测试" }).map((item) => item.id)).toEqual(
    [1, 2],
  );
  expect(
    filterMiscellany(catalog, { ...defaultSearch, q: "测试", quality: "0" }).map((item) => item.id),
  ).toEqual([1]);
  expect(filterMiscellany(catalog, { ...defaultSearch, q: "关键词" })).toEqual([]);
  expect(filterMiscellany(catalog, { ...defaultSearch, quality: "4" })).toEqual([]);
  expect(
    filterMiscellany(
      { items: [{ ...catalog.items[0], name: "Test" }] },
      { ...defaultSearch, q: "TEST" },
    ),
  ).toHaveLength(1);
});
test("quality options deduplicate and exclude null without losing zero", () => {
  expect(filterOptions({ items: [...catalog.items, catalog.items[0]] }).quality).toEqual([
    { value: "0", label: "品质 0" },
    { value: "2", label: "品质 2" },
  ]);
});
test("URL decoding preserves numeric search and zero quality, rejects invalid parameters", () => {
  expect(parseSearch(defaultParseSearch("?q=123&quality=0&page=2"))).toEqual({
    q: "123",
    quality: "0",
    page: 2,
  });
  expect(parseSearch({ quality: "4" }).quality).toBe("4");
  for (const quality of [5, -1, "bad", [0], null])
    expect(parseSearch({ quality }).quality).toBe("");
  for (const page of [0, -1, 1.5, "bad", Infinity, Number.MAX_SAFE_INTEGER + 1])
    expect(parseSearch({ page }).page).toBe(1);
});
test("return links restore valid list state and restrict destinations and parameters", () => {
  const search = { q: "碎木", quality: "0", page: 2 };
  expect(parseReturnTo(listHref(search))?.search).toEqual(search);
  expect(parseDetailSearch({ returnTo: listHref(search) }).returnTo).toBe(listHref(search));
  expect(parseReturnTo("/collection/miscellany?quality=0&category=木材&page=-1")?.href).toBe(
    "/collection/miscellany?quality=0",
  );
  for (const value of [
    "https://example.com/collection/miscellany",
    "//example.com",
    "/collection/miscellany/1",
    "/collection/dishes",
    null,
  ])
    expect(parseReturnTo(value)).toBeUndefined();
});
test("pagination retains single-page controls, clamps overflow and preserves final items", () => {
  const items = Array.from({ length: 25 }, (_, index) => index);
  expect(paginate(items, 999)).toEqual({ items: [24], page: 2, pages: 2, total: 25 });
  expect(paginate([], 999)).toEqual({ items: [], page: 1, pages: 1, total: 0 });
  const actual = loadMiscellanyCatalog();
  expect(actual.items).toHaveLength(16);
  expect(paginate(actual.items, 999)).toEqual({
    items: actual.items,
    page: 1,
    pages: 1,
    total: 16,
  });
});
