import { expect, test } from "vite-plus/test";
import { renderToStaticMarkup } from "react-dom/server";
import { createMemoryHistory, RouterContextProvider } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { getRouter } from "@/router";
import { CreatureDetailPage } from "./detail-page";
import { CreatureListPage } from "./list-page";
import { defaultSearch } from "./model";
import { catalog } from "./test-fixtures";
function render(children: ReactNode) {
  const router = getRouter();
  router.update({ history: createMemoryHistory({ initialEntries: ["/collection/creatures"] }) });
  return renderToStaticMarkup(
    <RouterContextProvider router={router}>{children}</RouterContextProvider>,
  );
}
test("details show every attribute, multiline description, zero quality and textual series links", () => {
  const html = render(
    <CreatureDetailPage
      catalog={catalog}
      record={catalog.items[0]}
      returnTo="/collection/creatures?q=鱼&quality=0&page=2"
    />,
  );
  for (const value of [
    "第一行\n第二行",
    "品质 0",
    "水生生物",
    "禾夏",
    "河流",
    "春季， 夏季，春季",
    "白天",
    "雨天",
    "尺寸范围",
    "暂无资料",
    "暂无图片",
    "所属系列（1）",
    "河流系列",
    "← 返回生物列表",
  ])
    expect(html).toContain(value);
  expect(html).toContain('href="/collection/creatures?series=%2210%22"');
  expect(html).toContain("page=2");
  expect(html.match(/暂无图片/g)).toHaveLength(1);
  expect(html).not.toContain('href="/collection/creatures?series=%2211%22"');
});
test("empty description and multiple memberships are visible without series image placeholders", () => {
  const html = render(<CreatureDetailPage catalog={catalog} record={catalog.items[1]} />);
  expect(html).toContain("暂无资料");
  expect(html).toContain("小型");
  expect(html).toContain("所属系列（2）");
  expect(html).toContain('href="/collection/creatures?series=%2211%22"');
  expect(html.match(/暂无图片/g)).toHaveLength(1);
});
test("unassigned creatures show an explicit empty state", () => {
  const html = render(
    <CreatureDetailPage
      catalog={{ ...catalog, series: [] }}
      record={catalog.items[0]}
      returnTo="https://example.com"
    />,
  );
  expect(html).toContain("暂无所属系列资料");
  expect(html).toContain('href="/collection/creatures"');
  expect(html).not.toContain("example.com");
});
test("list uses eight controlled Select filters, series names, zero quality and return links", () => {
  const html = render(
    <CreatureListPage
      catalog={catalog}
      search={{ ...defaultSearch, series: "10", quality: "0" }}
      onSearch={() => {}}
    />,
  );
  expect(html.match(/role="combobox"/g)).toHaveLength(8);
  expect(html).not.toContain("<select");
  for (const value of ["河流系列", "品质 0", "匹配 1 种生物", 'aria-label="测试鱼"', "returnTo="])
    expect(html).toContain(value);
  expect(html).not.toContain('aria-label="全年鱼"');
});
test("unknown series displays an unknown option and no results with disabled pagination", () => {
  const html = render(
    <CreatureListPage
      catalog={catalog}
      search={{ ...defaultSearch, series: "999" }}
      onSearch={() => {}}
    />,
  );
  expect(html).toContain("999（无匹配选项）");
  expect(html).toContain("没有找到匹配的生物");
  for (const label of ["上一页", "下一页"])
    expect(html.match(new RegExp(`<button[^>]*aria-label="${label}"[^>]*>`))?.[0]).toMatch(
      /\sdisabled=""/,
    );
});
