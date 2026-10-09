import fs from "node:fs";
import path from "node:path";
import { profile, getPaths, tagDimensions, topicCategories } from "./config.mjs";
import { loadWork, saveWork, animeExport, sha256, relativeSource } from "./io.mjs";
import { value, locator, uniqueById } from "./raw-reader.mjs";

export const splitTags = (text) => (text ?? "").split(",").filter(Boolean);
export function expandTags(names, nodes) {
  const byName = new Map();
  for (const node of Object.values(nodes)) {
    if (!byName.has(node.TagName)) byName.set(node.TagName, []);
    byName.get(node.TagName).push(node);
  }
  const expanded = new Set(names),
    used = new Set();
  for (const name of names)
    for (const start of byName.get(name) ?? []) {
      let node = start;
      const visited = new Set();
      while (node) {
        if (visited.has(node.TagId)) throw new Error(`GameplayTag parent cycle: ${node.TagId}`);
        visited.add(node.TagId);
        used.add(node.TagId);
        expanded.add(node.TagName);
        node = nodes[node.ParentId];
      }
    }
  return { names: expanded, nodeIds: used };
}
export function classifyEntry(row, main, subcategories, nodes) {
  const flag = value(row, 1),
    type = value(main, 2);
  if (flag != null && flag !== 1) throw new Error(`Unexpected table 93 flag ${flag}`);
  const role = flag === 1 ? "avatarOption" : [500, 501].includes(type) ? "collection" : "item";
  const tags = expandTags([...splitTags(value(main, 6)), ...splitTags(value(main, 15))], nodes);
  const matches =
    flag === 1 ? [] : subcategories.filter((s) => s.filterTags.some((t) => tags.names.has(t)));
  if (matches.length > 1) throw new Error(`Multiple subcategories: ${value(row, 0)}`);
  let categoryId = matches[0]?.categoryId ?? null;
  let basis = "table33_filter_with_parent_tags";
  if (flag === 1) {
    categoryId = 5;
    basis = "user_confirmed_avatar_options";
  }
  if (categoryId == null && role === "collection") {
    const categories = new Set(
      splitTags(value(main, 6))
        .map((t) => topicCategories[t])
        .filter(Boolean),
    );
    if (categories.size !== 1) throw new Error(`Unclassified theme collection: ${value(row, 0)}`);
    categoryId = [...categories][0];
    basis = "category_tag_and_user_confirmed_topic_collection";
  }
  if (categoryId == null) throw new Error(`Unclassified entry: ${value(row, 0)}`);
  return {
    role,
    categoryId,
    subcategoryIds: matches.map((s) => s.id),
    listedInSubcategories: matches.length > 0,
    basis,
    tagNodeIds: [...tags.nodeIds],
  };
}
export function classify() {
  const { gameRoot, work } = getPaths();
  const source = path.join(gameRoot, profile.tagBundle),
    dest = path.join(work, "tags");
  const tagFile = path.join(dest, "MiHoYoBinData", profile.tagAssetName + ".json");
  fs.rmSync(tagFile, { force: true });
  animeExport(source, dest, "MiHoYoBinData", `^${profile.tagAssetName}$`);
  if (!fs.existsSync(tagFile)) throw new Error("GameplayTag export did not produce expected file");
  const bytes = fs.readFileSync(tagFile),
    tree = JSON.parse(bytes);
  if (sha256(bytes) !== profile.tagSha256 || Object.keys(tree.AllNodes).length !== 948)
    throw new Error("GameplayTag snapshot mismatch; revalidate classification");
  const raw = loadWork("records.json"),
    tables = raw.tables;
  const byHash = new Map(tables[1].map((row) => [row.hash, row]));
  const text = (hash, required = true) => {
    const r = byHash.get(hash);
    if (!r) {
      if (required) throw new Error(`Missing text ${hash}`);
      return null;
    }
    return { zh: value(r, 1), en: value(r, 0) };
  };
  const categories = new Map();
  const subcategories = tables[33].map((row) => {
    const categoryId = value(row, 0),
      name = text(value(row, 2));
    if (!categories.has(categoryId))
      categories.set(categoryId, {
        id: categoryId,
        name,
        internalName: value(row, 1),
        source: locator(row),
        nameHash: value(row, 2),
      });
    return {
      id: value(row, 3),
      categoryId,
      name: text(value(row, 4)),
      nameHash: value(row, 4),
      filterTags: splitTags(value(row, 5)),
      source: locator(row),
    };
  });
  const main = uniqueById(tables[318], 318),
    ui = uniqueById(tables[325], 325, true),
    types = uniqueById(tables[716], 716),
    creatures = uniqueById(tables[186], 186);
  const rewards = [...new Set(tables[563].map((r) => value(r, 0)))].map((id) => ({
    id,
    lines: tables[563]
      .filter((r) => value(r, 0) === id)
      .map((r) => ({
        targetCode: value(r, 2),
        quantity: value(r, 4),
        annotation: value(r, 9),
        source: locator(r),
      })),
  }));
  // A target code is not assumed to be a main-item ID. Only this currency label is confirmed.
  for (const reward of rewards)
    for (const line of reward.lines)
      if (line.targetCode === 200010) line.targetName = { zh: "露芽", en: null };
  const usedNodes = new Set();
  const items = tables[93].map((row) => {
    const id = value(row, 0),
      m = main.get(id),
      u = ui.get(id),
      c = creatures.get(id),
      t = types.get(value(m, 2)),
      entry = raw.entries.find((e) => e.id === id);
    const classified = classifyEntry(row, m, subcategories, tree.AllNodes);
    classified.tagNodeIds.forEach((n) => usedNodes.add(n));
    const tags = Object.fromEntries(
      Object.entries(tagDimensions).map(([name, field]) => [name, splitTags(value(m, field))]),
    );
    for (const names of Object.values(tags))
      expandTags(names, tree.AllNodes).nodeIds.forEach((n) => usedNodes.add(n));
    return {
      id,
      name: text(value(m, 1)),
      nameHash: value(m, 1),
      description: u && value(u, 27) != null ? text(value(u, 27), false) : null,
      type: { id: value(t, 0), name: value(t, 1) },
      tags,
      role: classified.role,
      availability: {
        open: true,
        basis: "user_confirmed_root93_scope",
        gameVersion: profile.gameVersion,
        configRevision: profile.dataRevision,
      },
      classification: {
        categoryId: classified.categoryId,
        subcategoryIds: classified.subcategoryIds,
        listedInSubcategories: classified.listedInSubcategories,
        basis: classified.basis,
      },
      creature: c ? { name: text(value(c, 1)), description: value(c, 6) } : null,
      rewardId: value(row, 12),
      relatedCardIds: entry.relatedCardIds,
      sources: entry.records,
      uiSources: entry.uiRecords,
      rewardSources: entry.rewardRecords,
    };
  });
  for (const s of subcategories)
    expandTags(s.filterTags, tree.AllNodes).nodeIds.forEach((n) => usedNodes.add(n));
  const supportItems = raw.supportItemIds.map((id) => {
    const m = main.get(id),
      u = ui.get(id);
    return {
      id,
      name: text(value(m, 1)),
      nameHash: value(m, 1),
      typeId: value(m, 2),
      description: u && value(u, 27) != null ? text(value(u, 27), false) : null,
      sources: { 318: locator(m), 325: locator(u) },
    };
  });
  const definitions = {
    fieldMappings: {
      categories: {
        id: "33.0",
        internalName: "33.1",
        nameHash: "33.2",
        name: "33.2 -> TextMap",
        source: "raw 33 locator",
      },
      subcategories: {
        id: "33.3",
        categoryId: "33.0",
        nameHash: "33.4",
        name: "33.4 -> TextMap",
        filterTags: "33.5",
        source: "raw 33 locator",
        images: "33.9/10",
      },
      types: { id: "716.0", name: "716.1", source: "raw 716 locator" },
      rewards: {
        id: "563.0",
        lines: "all matching 563 rows",
        targetCode: "563.2",
        quantity: "563.4",
        annotation: "563.9",
        targetName: "200010 label confirmed by 563.9 annotations",
        source: "raw 563 locator",
      },
      supportItems: {
        id: "318.0; referenced by 42.1",
        nameHash: "318.1",
        name: "318.1 -> TextMap",
        typeId: "318.2",
        description: "325.27 -> TextMap",
        images: "325.4/5/6",
        sources: "raw locators",
      },
      tags: "GameplayTag JSON AllNodes: original node properties and ParentId closure",
      tagSource: "exported MiHoYoBinData source and SHA256",
    },
    categories: [...categories.values()],
    subcategories,
    types: tables[716].map((r) => ({ id: value(r, 0), name: value(r, 1), source: locator(r) })),
    rewards,
    supportItems,
    tags: [...usedNodes].map((id) => tree.AllNodes[id]),
    tagSource: {
      file: relativeSource(source),
      assetName: profile.tagAssetName,
      sha256: sha256(bytes),
      nodeCount: Object.keys(tree.AllNodes).length,
    },
  };
  const fieldMappings = {
    id: "93.0",
    name: "318.1 -> TextMap 1 (zh=1,en=0)",
    nameHash: "318.1",
    description: "325.27 -> TextMap 1",
    type: "318.2 -> 716.0/1",
    tags: tagDimensions,
    role: "93.1 byte flag; 318.2 type 500/501; user confirmation",
    availability: "user confirmation for versioned root 93",
    classification: "33.0/3/5 + 318.6/15 + GameplayTag ParentId; topic/appearance rules",
    creature: "186.1 -> TextMap; 186.6 string",
    rewardId: "93.12 -> 563.0",
    rewardLines: "563.2 targetCode; 563.4 quantity; 563.9 annotation",
    rewardTargetName: "200010 label confirmed by 563.9 annotations",
    relatedCardIds: "42.1 semicolon-separated IDs -> 318.0",
    supportItems: "42.1 -> 318/325",
    sources:
      "raw row locators; uiSources retains equivalent display rows; rewardSources retains all reward rows",
  };
  saveWork("classified.json", {
    schemaVersion: 1,
    gameVersion: profile.gameVersion,
    configRevision: profile.dataRevision,
    fieldMappings,
    items,
    definitions,
  });
  console.log(
    JSON.stringify({
      entries: items.length,
      roles: Object.fromEntries(
        ["item", "collection", "avatarOption"].map((role) => [
          role,
          items.filter((i) => i.role === role).length,
        ]),
      ),
    }),
  );
}
