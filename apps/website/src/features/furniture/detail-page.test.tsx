import { expect, test } from "vite-plus/test";
import { renderToStaticMarkup } from "react-dom/server";
import { createMemoryHistory, RouterContextProvider } from "@tanstack/react-router";
import type { FurnitureItem, FurnitureSet } from "@petit-orbit/content-schema";
import { getRouter } from "@/router";
import { FurnitureDetailPage } from "./detail-page";

const item: FurnitureItem = {
  id: 1,
  name: "测试桌",
  image: null,
  description: "第一行\n第二行",
  quality: 0,
  category: "起居",
  type: "桌子",
  size: null,
  colors: "棕色，白色",
  materials: "木制",
  sources: null,
};
const set: FurnitureSet = {
  id: 10,
  name: "测试套组",
  image: null,
  description: null,
  quality: null,
  seriesName: null,
  componentIds: [1],
};
function renderDetail(
  record: FurnitureItem | FurnitureSet,
  sets: FurnitureSet[],
  members: FurnitureItem[] = [item],
) {
  const router = getRouter();
  router.update({ history: createMemoryHistory({ initialEntries: ["/collection/furniture"] }) });
  return renderToStaticMarkup(
    <RouterContextProvider router={router}>
      <FurnitureDetailPage
        catalog={{ items: members, sets }}
        record={record}
        returnTo="/collection/furniture?quality=0&page=2"
      />
    </RouterContextProvider>,
  );
}

test("item detail renders known attributes, zero quality, multiline text and membership links", () => {
  const html = renderDetail(item, [set]);
  expect(html).toContain("品质 0");
  expect(html).toContain("第一行\n第二行");
  expect(html).toContain("尺寸</dt>");
  expect(html).toContain("暂无资料");
  expect(html).toContain("暂无图片");
  expect(html).toContain('aria-label="测试套组"');
  expect(html).toContain("/collection/furniture/sets/10?returnTo=");
  expect(html).toContain("page=2");
});

test("a set without an image does not borrow its member image", () => {
  const memberWithImage = { ...item, image: `assets/${"a".repeat(64)}.png` };
  const html = renderDetail(set, [set], [memberWithImage]);
  expect(html.match(/<img /g)).toHaveLength(1);
  expect(html).toContain(`/resources/${memberWithImage.image}`);
  expect(html).toContain("暂无图片");
  expect(html).toContain("品质暂无资料");
  expect(html).toContain('aria-label="测试桌"');
  expect(html).toContain("/collection/furniture/1?returnTo=");
});

test.each([{ componentIds: null }, { componentIds: [] }])(
  "empty set membership displays an explicit empty state: %s",
  ({ componentIds }) => {
    const emptySet = { ...set, componentIds };
    const html = renderDetail(emptySet, [emptySet]);
    expect(html).toContain("暂无套组成员资料");
    expect(html).not.toContain('aria-label="测试桌"');
  },
);
