import type { MiscellanyCatalog } from "./model";

export const catalog: MiscellanyCatalog = {
  items: [
    { id: 1, name: "测试碎木", image: null, description: "第一行\n第二行", quality: 0 },
    {
      id: 2,
      name: "测试树胶",
      image: "assets/example.png",
      description: "只在描述中的关键词",
      quality: 2,
    },
    { id: 3, name: "未知物品", image: null, description: null, quality: null },
  ],
};
