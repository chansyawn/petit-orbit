import { expect, test } from "vite-plus/test";
import { renderToStaticMarkup } from "react-dom/server";
import { createMemoryHistory, RouterContextProvider } from "@tanstack/react-router";
import { getRouter } from "@/router";
import { FurnitureListPage } from "./list-page";
import { defaultSearch } from "./model";
import type { CatalogSearch, FurnitureCatalog } from "./model";

const catalog: FurnitureCatalog = {
  items: [
    {
      id: 1,
      name: "测试桌",
      image: null,
      description: null,
      quality: 0,
      category: "起居",
      type: "桌子",
      size: null,
      colors: "白色，棕色",
      materials: "木制",
      sources: null,
    },
  ],
  sets: [],
};

function renderList(search: CatalogSearch) {
  const router = getRouter();
  router.update({ history: createMemoryHistory({ initialEntries: ["/collection/furniture"] }) });
  return renderToStaticMarkup(
    <RouterContextProvider router={router}>
      <FurnitureListPage catalog={catalog} search={search} onSearch={() => {}} />
    </RouterContextProvider>,
  );
}

test("SSR shows selected zero quality, labeled controls and a state-preserving detail link", () => {
  const html = renderList({ ...defaultSearch, quality: "0" });
  expect(html).toContain('role="combobox"');
  expect(html).toContain("品质 0");
  expect(html).toContain("按名称搜索</label>");
  expect(html).toContain('aria-label="测试桌"');
  expect(html).toContain("returnTo=");
  expect(html).toContain("quality");
});

test("unknown URL options remain visible alongside an explicit no-results state", () => {
  const html = renderList({ ...defaultSearch, category: "未知分类" });
  expect(html).toContain("未知分类（无匹配选项）");
  expect(html).toContain("没有找到匹配的家具");
  expect(html).toContain("试试其他关键词，或清除筛选。");
  expect(html).not.toContain('aria-label="测试桌"');
});

test("a single-page result disables both native pagination buttons", () => {
  const html = renderList(defaultSearch);
  for (const label of ["上一页", "下一页"]) {
    const button = html.match(new RegExp(`<button[^>]*aria-label="${label}"[^>]*>`))?.[0];
    expect(button).toBeDefined();
    expect(button).toMatch(/\sdisabled=""/);
  }
});
