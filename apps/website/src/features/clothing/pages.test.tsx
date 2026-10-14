import { expect, test } from "vite-plus/test";
import { renderToStaticMarkup } from "react-dom/server";
import { createMemoryHistory, RouterContextProvider } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { getRouter } from "@/router";
import { ClothingDetailPage } from "./detail-page";
import { ClothingListPage } from "./list-page";
import { defaultSearch } from "./model";
import { catalog } from "./test-fixtures";
function render(children: ReactNode) {
  const router = getRouter();
  router.update({ history: createMemoryHistory({ initialEntries: ["/collection/clothing"] }) });
  return renderToStaticMarkup(
    <RouterContextProvider router={router}>{children}</RouterContextProvider>,
  );
}
test("item details show every known attribute, multiline description, zero quality and set links", () => {
  const html = render(
    <ClothingDetailPage
      catalog={catalog}
      record={catalog.items[0]}
      kind="items"
      returnTo="/collection/clothing?quality=0&page=2"
    />,
  );
  for (const value of [
    "第一行\n第二行",
    "品质 0",
    "鞋子",
    "白色，黑色，白色",
    "皮革，橡胶",
    "帅气，职业",
    "暂无资料",
    "暂无图片",
    "所属套装",
    "测试套装",
  ])
    expect(html).toContain(value);
  expect(html).toContain("/collection/clothing/sets/10?returnTo=");
  expect(html).toContain("page=2");
});
test("set details use their own image and ordered, linked clothing members", () => {
  const withImage = {
    ...catalog,
    items: catalog.items.map((item) => ({ ...item, image: `assets/${"a".repeat(64)}.png` })),
  };
  const html = render(
    <ClothingDetailPage catalog={withImage} record={catalog.sets[0]} kind="sets" />,
  );
  expect(html).toContain("正式名称");
  expect(html).toContain("暂无图片");
  expect(html.match(/<img /g)).toHaveLength(2);
  expect(html.indexOf('aria-label="测试衬衫"')).toBeLessThan(html.indexOf('aria-label="测试靴"'));
  expect(html).toContain("/collection/clothing/2");
});
test.each([null, []])("empty set membership has an explicit state: %s", (componentIds) => {
  const record = { ...catalog.sets[0], componentIds };
  const html = render(<ClothingDetailPage catalog={catalog} record={record} kind="sets" />);
  expect(html).toContain("暂无套装成员资料");
  expect(html).not.toContain('aria-label="测试靴"');
});
test("an appearance shows its category and empty description without inventing clothing fields or membership", () => {
  const html = render(
    <ClothingDetailPage catalog={catalog} record={catalog.appearances[0]} kind="appearances" />,
  );
  expect(html).toContain("发型");
  expect(html).toContain("暂无资料");
  expect(html).toContain("← 返回外观列表");
  for (const value of ["所属套装", "颜色</dt>", "风格</dt>", "来源</dt>"])
    expect(html).not.toContain(value);
});
test("an item with no membership shows an explicit empty state", () => {
  const html = render(
    <ClothingDetailPage
      catalog={{ ...catalog, sets: [] }}
      record={catalog.items[0]}
      kind="items"
    />,
  );
  expect(html).toContain("暂无所属套装资料");
});
test("lists SSR-render zero quality, unknown URL options and links preserving filter state", () => {
  const html = render(
    <ClothingListPage
      catalog={catalog}
      kind="items"
      search={{ ...defaultSearch, quality: "0", style: "职业" }}
      onSearch={() => {}}
    />,
  );
  expect(html).toContain('role="combobox"');
  expect(html).toContain("品质 0");
  expect(html).toContain("职业");
  expect(html).toContain('aria-label="测试靴"');
  expect(html).not.toContain('aria-label="测试衬衫"');
  expect(html).toContain("returnTo=");
  const empty = render(
    <ClothingListPage
      catalog={catalog}
      kind="items"
      search={{ ...defaultSearch, category: "未知" }}
      onSearch={() => {}}
    />,
  );
  expect(empty).toContain("未知（无匹配选项）");
  expect(empty).toContain("没有找到匹配的服饰");
  for (const label of ["上一页", "下一页"])
    expect(empty.match(new RegExp(`<button[^>]*aria-label="${label}"[^>]*>`))?.[0]).toMatch(
      /\sdisabled=""/,
    );
});
test.each(["sets", "appearances"] as const)(
  "the %s list only renders its relevant filters and detail links",
  (kind) => {
    const html = render(
      <ClothingListPage catalog={catalog} kind={kind} search={defaultSearch} onSearch={() => {}} />,
    );
    expect(html).not.toContain("全部风格");
    expect(html).not.toContain("全部材质");
    expect(html).toContain(
      kind === "sets" ? "/collection/clothing/sets/10" : "/collection/clothing/appearances/3",
    );
    expect(html).toContain(kind === "sets" ? "套装列表" : "外观列表");
  },
);
