import type { ClothingCatalog } from "./model";

export const catalog: ClothingCatalog = {
  items: [
    {
      id: 1,
      name: "测试靴",
      image: null,
      description: "第一行\n第二行",
      quality: 0,
      category: "鞋子",
      colors: "白色，黑色，白色",
      materials: "皮革，橡胶",
      styles: "帅气，职业",
      sources: null,
    },
    {
      id: 2,
      name: "测试衬衫",
      image: null,
      description: null,
      quality: 1,
      category: "上装",
      colors: "白色",
      materials: null,
      styles: "青春",
      sources: "商店",
    },
  ],
  sets: [
    {
      id: 10,
      name: "测试套装",
      image: null,
      description: null,
      quality: 1,
      setName: "正式名称",
      componentIds: [2, 1],
    },
  ],
  appearances: [
    { id: 3, name: "测试发型", image: null, description: null, quality: 0, category: "发型" },
  ],
};
