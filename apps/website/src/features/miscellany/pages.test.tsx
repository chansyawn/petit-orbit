import { expect, test } from "vite-plus/test";
import { renderToStaticMarkup } from "react-dom/server";
import { createMemoryHistory, RouterContextProvider } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { getRouter } from "@/router";
import { MiscellanyDetailPage } from "./detail-page";
import { MiscellanyListPage } from "./list-page";
import { defaultSearch } from "./model";
import { catalog } from "./test-fixtures";
function render(children: ReactNode) {
  const router = getRouter();
  router.update({ history: createMemoryHistory({ initialEntries: ["/collection/miscellany"] }) });
  return renderToStaticMarkup(
    <RouterContextProvider router={router}>{children}</RouterContextProvider>,
  );
}
function paginationButton(html: string, label: string) {
  return html.match(new RegExp(`<button[^>]*aria-label="${label}"[^>]*>`))?.[0];
}
test("detail shows every known field, multiline description, zero quality and safe return state", () => {
  const html = render(
    <MiscellanyDetailPage
      record={catalog.items[0]}
      returnTo="/collection/miscellany?q=碎木&quality=0&page=2"
    />,
  );
  for (const value of [
    "测试碎木",
    "第一行\n第二行",
    "品质 0",
    "ID</dt>",
    ">1</dd>",
    "品质</dt>",
    ">0</dd>",
    "暂无图片",
    "← 返回杂物列表",
    "page=2",
  ])
    expect(html).toContain(value);
  for (const field of ["来源", "用途", "分类", "所属系列"]) expect(html).not.toContain(field);
});
test("null fields and unsafe return addresses fall back; images use resource URLs", () => {
  const html = render(
    <MiscellanyDetailPage record={catalog.items[2]} returnTo="https://example.com" />,
  );
  expect(html).toContain("暂无资料");
  expect(html).toContain('href="/collection/miscellany"');
  expect(html).not.toContain("example.com");
  expect(render(<MiscellanyDetailPage record={catalog.items[1]} />)).toContain(
    'src="/resources/assets/example.png"',
  );
});
test("list has a controlled shadcn quality filter, lazy images and single-page disabled pagination", () => {
  const html = render(
    <MiscellanyListPage catalog={catalog} search={defaultSearch} onSearch={() => {}} />,
  );
  expect(html.match(/role="combobox"/g)).toHaveLength(1);
  expect(html).not.toContain("<select");
  for (const value of [
    "匹配 3 件杂物",
    "品质 0",
    "清除筛选",
    'loading="lazy"',
    "returnTo=",
    "第 1 / 1 页",
  ])
    expect(html).toContain(value);
  for (const label of ["上一页", "下一页"])
    expect(paginationButton(html, label)).toMatch(/\sdisabled=""/);
});
test("zero quality is selected and unknown valid qualities show a visible empty state", () => {
  const zero = render(
    <MiscellanyListPage
      catalog={catalog}
      search={{ ...defaultSearch, quality: "0" }}
      onSearch={() => {}}
    />,
  );
  expect(zero).toContain("匹配 1 件杂物");
  expect(zero).toContain('aria-label="测试碎木"');
  expect(zero).not.toContain('aria-label="测试树胶"');
  const empty = render(
    <MiscellanyListPage
      catalog={catalog}
      search={{ ...defaultSearch, quality: "4" }}
      onSearch={() => {}}
    />,
  );
  for (const value of ["无匹配选项", "没有找到匹配的杂物", "匹配 0 件杂物"])
    expect(empty).toContain(value);
  for (const label of ["上一页", "下一页"])
    expect(paginationButton(empty, label)).toMatch(/\sdisabled=""/);
});
test("larger lists render only 24 cards and enable only the available page direction", () => {
  const many = {
    items: Array.from({ length: 25 }, (_, index) => ({
      ...catalog.items[0],
      id: index + 1,
      name: `物品${index + 1}`,
    })),
  };
  const first = render(
    <MiscellanyListPage catalog={many} search={defaultSearch} onSearch={() => {}} />,
  );
  expect(first.match(/aria-label="物品\d+"/g)).toHaveLength(24);
  expect(paginationButton(first, "上一页")).toMatch(/\sdisabled=""/);
  expect(paginationButton(first, "下一页")).not.toMatch(/\sdisabled=""/);
  const last = render(
    <MiscellanyListPage
      catalog={many}
      search={{ ...defaultSearch, page: 2 }}
      onSearch={() => {}}
    />,
  );
  expect(last).toContain('aria-label="物品25"');
  expect(paginationButton(last, "上一页")).not.toMatch(/\sdisabled=""/);
  expect(paginationButton(last, "下一页")).toMatch(/\sdisabled=""/);
});
