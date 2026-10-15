import { expect, test } from "vite-plus/test";
import { renderToStaticMarkup } from "react-dom/server";
import { createMemoryHistory, RouterContextProvider } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { getRouter } from "@/router";
import { DishDetailPage } from "./detail-page";
import { DishListPage } from "./list-page";
import { defaultSearch } from "./model";
import { catalog } from "./test-fixtures";
function render(children: ReactNode) {
  const router = getRouter();
  router.update({ history: createMemoryHistory({ initialEntries: ["/collection/dishes"] }) });
  return renderToStaticMarkup(
    <RouterContextProvider router={router}>{children}</RouterContextProvider>,
  );
}
test("details show every dish attribute, multiline description and zero quality", () => {
  const html = render(
    <DishDetailPage
      catalog={catalog}
      record={catalog.items[0]}
      returnTo="/collection/dishes?q=茶&quality=0&page=2"
    />,
  );
  for (const value of [
    "第一行\n第二行",
    "品质 0",
    "烹饪难度",
    "简单",
    "星系风味",
    "禾夏风味",
    "厨具",
    "煮锅",
    "效果",
    "增加 30 力气",
    "暂无图片",
    "所属系列（1）",
    "饮品",
    "← 返回菜肴列表",
  ])
    expect(html).toContain(value);
  expect(html).toContain("page=2");
  expect(html).not.toContain("食材");
  expect(html).not.toContain("配方");
  expect(html).not.toContain("分类</dt>");
});
test("series links set only the series filter and do not create series image placeholders", () => {
  const html = render(
    <DishDetailPage
      catalog={catalog}
      record={catalog.items[1]}
      returnTo="/collection/dishes?difficulty=招牌&page=2"
    />,
  );
  expect(html).toContain('href="/collection/dishes?series=%2210%22"');
  expect(html).toContain('href="/collection/dishes?series=%2211%22"');
  expect(html).toContain("所属系列（2）");
  expect(html.match(/暂无图片/g)).toHaveLength(1);
  expect(html).toContain("暂无资料");
});
test("unknown fields and empty membership are explicit and unsafe return links fall back", () => {
  const html = render(
    <DishDetailPage catalog={catalog} record={catalog.items[2]} returnTo="https://example.com" />,
  );
  for (const label of ["烹饪难度", "星系风味", "厨具", "效果"])
    expect(html).toMatch(new RegExp(label + "</dt><dd[^>]*>暂无资料</dd>"));
  expect(html).toContain("暂无所属系列资料");
  expect(html).toContain('href="/collection/dishes"');
  expect(html).not.toContain("example.com");
});
test("list renders controlled filters, neutral zero quality and links preserving state", () => {
  const html = render(
    <DishListPage
      catalog={catalog}
      search={{ ...defaultSearch, quality: "0", series: "10", cookware: "煮锅" }}
      onSearch={() => {}}
    />,
  );
  expect(html.match(/role="combobox"/g)).toHaveLength(5);
  expect(html).not.toContain("<select");
  for (const value of ["饮品", "品质 0", "匹配 1 道菜肴", 'aria-label="测试茶"', "returnTo="])
    expect(html).toContain(value);
  expect(html).not.toContain('aria-label="普通茶"');
  expect(html).not.toContain("全部效果");
  expect(html).not.toContain("全部分类");
});
test.each([{ series: "999" }, { difficulty: "未知" }, { quality: "4" }])(
  "unknown valid options remain visible with empty results: %s",
  (patch) => {
    const html = render(
      <DishListPage
        catalog={catalog}
        search={{ ...defaultSearch, ...patch }}
        onSearch={() => {}}
      />,
    );
    expect(html).toContain("无匹配选项");
    expect(html).toContain("没有找到匹配的菜肴");
    for (const label of ["上一页", "下一页"])
      expect(html.match(new RegExp(`<button[^>]*aria-label="${label}"[^>]*>`))?.[0]).toMatch(
        /\sdisabled=""/,
      );
  },
);
