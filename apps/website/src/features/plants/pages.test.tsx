import { expect, test } from "vite-plus/test";
import { renderToStaticMarkup } from "react-dom/server";
import { createMemoryHistory, RouterContextProvider } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { getRouter } from "@/router";
import { PlantDetailPage } from "./detail-page";
import { PlantListPage } from "./list-page";
import { defaultSearch } from "./model";
import { catalog } from "./test-fixtures";
function render(children: ReactNode) {
  const router = getRouter();
  router.update({ history: createMemoryHistory({ initialEntries: ["/collection/plants"] }) });
  return renderToStaticMarkup(
    <RouterContextProvider router={router}>{children}</RouterContextProvider>,
  );
}
test("details show every attribute, multiline description, zero quality and textual series links", () => {
  const html = render(
    <PlantDetailPage
      catalog={catalog}
      record={catalog.items[0]}
      returnTo="/collection/plants?q=鱼&quality=0&page=2"
    />,
  );
  for (const value of [
    "第一行\n第二行",
    "品质 0",
    "花",
    "禾夏",
    "原产星系",
    "成熟周期",
    "收获次数",
    "暂无资料",
    "暂无图片",
    "所属系列（1）",
    "花系列",
    "← 返回植物列表",
  ])
    expect(html).toContain(value);
  expect(html).toContain('href="/collection/plants?series=%2210%22"');
  expect(html).toContain("page=2");
  expect(html.match(/暂无图片/g)).toHaveLength(1);
  expect(html).not.toContain('href="/collection/plants?series=%2211%22"');
});
test("empty description and multiple memberships are visible without series image placeholders", () => {
  const html = render(<PlantDetailPage catalog={catalog} record={catalog.items[1]} />);
  expect(html).toContain("暂无资料");
  expect(html).toContain("三天");
  expect(html).toContain("所属系列（2）");
  expect(html).toContain('href="/collection/plants?series=%2211%22"');
  expect(html.match(/暂无图片/g)).toHaveLength(1);
});
test("unassigned plants show an explicit empty state", () => {
  const html = render(
    <PlantDetailPage
      catalog={{ ...catalog, series: [] }}
      record={catalog.items[0]}
      returnTo="https://example.com"
    />,
  );
  expect(html).toContain("暂无所属系列资料");
  expect(html).toContain('href="/collection/plants"');
  expect(html).not.toContain("example.com");
});
test("list uses five controlled Select filters, series names, zero quality and return links", () => {
  const html = render(
    <PlantListPage
      catalog={catalog}
      search={{ ...defaultSearch, series: "10", quality: "0", harvestCount: "0" }}
      onSearch={() => {}}
    />,
  );
  expect(html.match(/role="combobox"/g)).toHaveLength(5);
  expect(html).not.toContain("<select");
  for (const value of ["花系列", "品质 0", "匹配 1 种植物", 'aria-label="测试花"', "returnTo="])
    expect(html).toContain(value);
  expect(html).not.toContain('aria-label="普通花"');
});
test("unknown series displays an unknown option and no results with disabled pagination", () => {
  const html = render(
    <PlantListPage
      catalog={catalog}
      search={{ ...defaultSearch, series: "999" }}
      onSearch={() => {}}
    />,
  );
  expect(html).toContain("999（无匹配选项）");
  expect(html).toContain("没有找到匹配的植物");
  for (const label of ["上一页", "下一页"])
    expect(html.match(new RegExp(`<button[^>]*aria-label="${label}"[^>]*>`))?.[0]).toMatch(
      /\sdisabled=""/,
    );
});

test("all null attributes display unknown while zero harvest count remains visible", () => {
  const zero = render(<PlantDetailPage catalog={catalog} record={catalog.items[0]} />);
  expect(zero).toMatch(/收获次数<\/dt><dd[^>]*>0<\/dd>/);
  const missing = render(<PlantDetailPage catalog={catalog} record={catalog.items[2]} />);
  for (const label of ["原产星系", "成熟周期", "收获次数"])
    expect(missing).toMatch(new RegExp(label + "</dt><dd[^>]*>暂无资料</dd>"));
  expect(missing).toContain("暂无所属系列资料");
});
