import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { profile as itemsProfile } from "../../items/scripts/config.mjs";

export const repoRoot = fileURLToPath(new URL("../../../../../", import.meta.url));
export const profile = {
  gameVersion: "0.95.2",
  dataRevision: 1379138,
  resourceRevision: 1359983,
  manifestId: "5662883",
  animeGame: "HYG_CB1",
  byteMask: 0x01350257,
  wordMask: 0x53020253,
  shortMask: 0x5555,
  assetPrefix: "assets/moleres/rel/sres/",
  tagAssetName: "633e15d6",
  tagBundle: "Persistent/AssetBundle/blocks/00/00000002.blk",
  tagSha256: "d0a37c7ca44f94615a6e19530722e275fda1c1cbb5defb1af593a8c2ac68f851",
  expected: {
    entries: 2327,
    items: 2133,
    collections: 143,
    avatarOptions: 51,
    topicCollections: 67,
    ui: 2322,
    creatures: 317,
    avatarLinks: 47,
    primaryImages: 2317,
    uniquePrimaryImages: 2247,
    categories: { 1: 317, 2: 202, 3: 121, 4: 887, 5: 590, 6: 16 },
    subcategories: {
      101: 139,
      102: 96,
      103: 82,
      301: 85,
      302: 93,
      303: 20,
      304: 4,
      401: 121,
      201: 42,
      202: 228,
      203: 130,
      204: 106,
      205: 295,
      206: 59,
      207: 62,
      208: 7,
      500: 34,
      501: 180,
      503: 51,
      504: 129,
      505: 101,
      506: 58,
      507: 71,
      601: 16,
    },
  },
};

// Only storage types established by byte and cross-table checks belong here.
// Unknown slots remain opaque, even if a trial string dereference succeeds.
export const schemas = {
  93: Object.fromEntries(
    Array.from({ length: 24 }, (_, i) => [
      i,
      i === 1
        ? "u8"
        : i === 2
          ? "opaque"
          : i === 17
            ? "f32"
            : [5, 6, 10, 21, 22].includes(i)
              ? "string"
              : "u32",
    ]),
  ),
  318: {
    0: "u32",
    1: "textHash",
    2: "u32",
    3: "u32",
    ...Object.fromEntries(
      [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 19, 20].map((i) => [i, "string"]),
    ),
  },
  325: { 0: "u32", 4: "string", 5: "string", 6: "string", 27: "textHash" },
  716: { 0: "u32", 1: "string" },
  33: {
    0: "u32",
    1: "string",
    2: "textHash",
    3: "u32",
    4: "textHash",
    5: "string",
    6: "string",
    8: "u32",
    9: "string",
    10: "string",
  },
  186: { 0: "u32", 1: "textHash", 6: "string", 11: "string" },
  42: { 0: "u32", 1: "string" },
  563: { 0: "u32", 1: "u32", 2: "u32", 4: "u32", 9: "string" },
  1: Object.fromEntries(Array.from({ length: 15 }, (_, i) => [i, "string"])),
};
export const tagDimensions = {
  category: 6,
  search: 7,
  color: 9,
  material: 11,
  style: 12,
  cooking: 15,
};
export const imageFields = {
  325: { 4: "iconSmall", 5: "iconLarge", 6: null },
  186: { 11: "creatureGallery" },
  93: { 22: "seasonImage" },
  33: { 9: "subcategoryIcon", 10: null },
};
export const topicCategories = {
  鱼套组: 1,
  赶海生物套组: 1,
  昆虫套组: 1,
  作物套组: 2,
  花套组: 2,
  烹饪套组: 3,
};

export function getOptions(args = process.argv.slice(2)) {
  const { values } = parseArgs({
    args: args[0] === "--" ? args.slice(1) : args,
    options: {
      help: { type: "boolean", short: "h" },
      step: { type: "string" },
      output: { type: "string" },
    },
  });
  const output = path.resolve(
    repoRoot,
    values.output ?? `resources/petit-planet-extraction/${profile.gameVersion}/open-content`,
  );
  const extraction = path.resolve(
    repoRoot,
    `resources/petit-planet-extraction/${profile.gameVersion}`,
  );
  // Never allow a custom output to swallow the client, shared index or existing items.
  const contains = (parent, child) => {
    const rel = path.relative(parent, child);
    return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
  };
  for (const protectedPath of [
    path.resolve(repoRoot, "resources/petit-planet-game"),
    path.join(extraction, "index"),
    path.join(extraction, "items"),
    path.resolve(repoRoot, "apps"),
  ])
    if (contains(output, protectedPath) || contains(protectedPath, output))
      throw new Error(`Unsafe output directory: ${output}`);
  return { ...values, output };
}
export function getPaths(options = getOptions()) {
  const gameRoot = path.resolve(
    repoRoot,
    `resources/petit-planet-game/${profile.gameVersion}/PetitPlanet_Data`,
  );
  return {
    out: options.output,
    work: path.join(options.output, "work"),
    gameRoot,
    animeStudio: path.resolve(repoRoot, "resources/anime-studio/AnimeStudio.CLI.exe"),
  };
}
export function verifySharedProfile() {
  for (const key of [
    "gameVersion",
    "dataRevision",
    "resourceRevision",
    "manifestId",
    "byteMask",
    "wordMask",
    "shortMask",
    "assetPrefix",
  ])
    if (profile[key] !== itemsProfile[key])
      throw new Error(`Shared input reader profile mismatch: ${key}`);
}
