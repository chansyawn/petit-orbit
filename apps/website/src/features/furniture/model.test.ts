import { defaultParseSearch, defaultStringifySearch } from "@tanstack/react-router";
import { expect, test } from "vite-plus/test";
import type { FurnitureItem, FurnitureSet } from "@petit-orbit/content-schema";
import {
  createRelations,
  defaultSearch,
  filterFurniture,
  filterOptions,
  furniturePath,
  listHref,
  paginate,
  parseDetailSearch,
  parseId,
  parseReturnTo,
  parseSearch,
  setsPath,
  splitValues,
} from "./model";

const base = { image: null, description: null, quality: 0 };
const items: FurnitureItem[] = [
  {
    ...base,
    id: 1,
    name: "木制小桌",
    category: "起居",
    type: "桌子",
    size: "2x1",
    colors: " 棕色，白色，棕色， ",
    materials: "金属，木制",
    sources: null,
  },
  {
    ...base,
    id: 2,
    name: "白色小椅",
    quality: 2,
    category: "起居",
    type: "椅子",
    size: null,
    colors: "白色",
    materials: "木制",
    sources: null,
  },
  {
    ...base,
    id: 3,
    name: "装饰灯",
    quality: null,
    category: null,
    type: null,
    size: null,
    colors: null,
    materials: null,
    sources: null,
  },
];
const sets: FurnitureSet[] = [
  { ...base, id: 10, name: "没有相同名称的套组", seriesName: null, componentIds: [2, 1] },
  { ...base, id: 11, name: "木制小桌", seriesName: null, componentIds: [] },
  { ...base, id: 12, name: "空套组", seriesName: null, componentIds: null },
];

test("name and attribute filters intersect and preserve quality zero", () => {
  const search = parseSearch({
    q: " 小 ",
    category: "起居",
    type: "桌子",
    quality: "0",
    color: "白色",
    material: "金属",
  });
  expect(filterFurniture(items, search).map((item) => item.id)).toEqual([1]);
  expect(filterFurniture(items, { ...search, material: "金" })).toEqual([]);
  expect(filterFurniture(items, { ...defaultSearch, quality: "0" }).map((item) => item.id)).toEqual(
    [1],
  );
  expect(filterFurniture(items, defaultSearch)).toEqual(items);
});

test("multi-value options are trimmed, unique and individually searchable", () => {
  expect(splitValues(" 棕色，白色，棕色， ")).toEqual(["棕色", "白色"]);
  expect(splitValues(null)).toEqual([]);
  expect(filterOptions(items)).toMatchObject({
    color: ["白色", "棕色"],
    material: ["金属", "木制"],
    quality: ["0", "2"],
  });
  expect(
    filterFurniture(items, { ...defaultSearch, color: "白色" }).map((item) => item.id),
  ).toEqual([1, 2]);
});

test("membership follows component IDs in source order, never names", () => {
  const relations = createRelations({ items, sets });
  expect(relations.membersOf(sets[0]).map((item) => item.id)).toEqual([2, 1]);
  expect(relations.setsFor(1).map((set) => set.id)).toEqual([10]);
  expect(relations.setsFor(3)).toEqual([]);
  expect(relations.membersOf(sets[1])).toEqual([]);
  expect(relations.membersOf(sets[2])).toEqual([]);
});

test("shared links restore every filter and page through detail navigation", () => {
  const search = parseSearch({
    q: "白色 小桌",
    category: "起居",
    type: "桌子",
    quality: "0",
    color: "白色",
    material: "木制",
    page: "2",
  });
  const href = listHref(furniturePath, search);
  expect(parseReturnTo(href)).toEqual({ path: furniturePath, search, href });
  expect(parseDetailSearch({ returnTo: href })).toEqual({ returnTo: href });
  expect(parseReturnTo(listHref(setsPath, search))?.search).toEqual(search);
  expect(parseReturnTo("https://example.com/collection/furniture")).toBeUndefined();
  expect(parseReturnTo("//example.com/collection/furniture")).toBeUndefined();
  expect(parseReturnTo("/collection/furniture/1")).toBeUndefined();
});

test("malformed query values recover without interpreting zero as missing", () => {
  for (const page of ["0", "-1", "1.5", "no", Infinity, Number.MAX_SAFE_INTEGER + 1, [], null]) {
    expect(parseSearch({ page }).page).toBe(1);
  }
  expect(parseSearch({ q: [], quality: "5", category: {} })).toEqual(defaultSearch);
  expect(parseSearch({ quality: "0" }).quality).toBe("0");
  expect(parseSearch({ quality: 0 }).quality).toBe("0");
  expect(
    parseDetailSearch({ returnTo: "/collection/furniture?page=-5&quality=5&extra=ignored" })
      .returnTo,
  ).toBe(furniturePath);
});

test("pagination limits rendered results, clamps excess pages and handles no results", () => {
  const rows = Array.from({ length: 887 }, (_, id) => id);
  expect(paginate(rows, 1)).toMatchObject({ page: 1, pages: 37, total: 887 });
  expect(paginate(rows, 1).items).toHaveLength(24);
  expect(paginate(rows, 999)).toMatchObject({ page: 37, items: rows.slice(864) });
  expect(paginate([], 4)).toEqual({ items: [], page: 1, pages: 1, total: 0 });
});

test("detail IDs reject invalid or unsafe values", () => {
  expect(parseId("1101")).toBe(1101);
  for (const id of ["0", "-1", "1.5", "", "bad", "Infinity", "9007199254740992"])
    expect(parseId(id)).toBeUndefined();
});

test("router query parsing restores numeric names and quality zero from ordinary URLs", () => {
  const search = { ...defaultSearch, q: "123", quality: "0", page: 2 };
  expect(parseSearch(defaultParseSearch("?q=123&quality=0&page=2"))).toEqual(search);
  expect(parseSearch(defaultParseSearch(defaultStringifySearch(search)))).toEqual(search);
});
