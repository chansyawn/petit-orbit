import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";
import { createIconResolver } from "../../items/scripts/icon-resolver.mjs";
import { profile, getPaths, imageFields } from "./config.mjs";
import { loadWork, saveWork, animeExport, sha256, relativeSource, auditSources } from "./io.mjs";
import { value } from "./raw-reader.mjs";

export const assetIdentity = (a) => `${a.source}|${a.assetType}|${a.pathId}`;
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export function planAssetBatches(list, indexedAssets) {
  const names = new Map();
  for (const asset of indexedAssets)
    if (asset.Source === list[0].source && asset.Type === list[0].assetType) {
      if (!names.has(asset.Name)) names.set(asset.Name, new Set());
      names.get(asset.Name).add(asset.Container + "|" + asset.PathID);
    }
  const separate = list.filter(
    (asset) =>
      (names.get(asset.resourceName)?.size ?? 0) > 1 ||
      list.filter((a) => a.resourceName === asset.resourceName).length > 1,
  );
  return { ordinary: list.filter((a) => !separate.includes(a)), separate };
}
function clearExpected(dest, type, assets) {
  for (const a of assets) {
    if (path.basename(a.resourceName) !== a.resourceName)
      throw new Error(`Unsafe exported asset name: ${a.resourceName}`);
    fs.rmSync(path.join(dest, type, a.resourceName + ".png"), { force: true });
  }
}
export async function exportAssets() {
  const { work } = getPaths(),
    raw = loadWork("records.json");
  const textures = loadWork("textures.json"),
    sprites = loadWork("sprites.json");
  const resolve = createIconResolver(textures, sprites, {
    assetPrefix: profile.assetPrefix,
    rejectAmbiguous: true,
  });
  const references = [],
    missing = [];
  for (const [root, fields] of Object.entries(imageFields))
    for (const row of raw.tables[root])
      for (const [field, role] of Object.entries(fields)) {
        const reference = value(row, Number(field));
        const ref = {
          key: `${row.key}:${field}`,
          table: Number(root),
          rowKey: row.key,
          recordId: value(row, root === "33" ? 3 : 0),
          field: Number(field),
          role,
          reference,
        };
        if (!reference) {
          ref.status = "no_reference";
          missing.push({ ...ref, reason: "no_reference" });
        } else {
          const match = resolve(reference);
          ref.match = match;
          if (!match?.matched) {
            ref.status = "not_indexed";
            missing.push({ ...ref, reason: "config_path_not_in_asset_index" });
          } else {
            ref.status = "matched";
            ref.assetKey = assetIdentity({ ...match, source: relativeSource(match.source) });
          }
        }
        references.push(ref);
      }
  const entryIds = new Set(raw.entries.map((e) => e.id));
  for (const e of raw.entries)
    if (!e.records[325]) missing.push({ recordId: e.id, table: 325, reason: "no_ui_record" });
  const chosen = new Map(
    references.filter((r) => r.status === "matched").map((r) => [r.assetKey, r.match]),
  );
  const groups = new Map();
  for (const [key, a] of chosen) {
    const group = a.source + "|" + a.assetType;
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push({ key, ...a });
  }
  const audit = await auditSources(
    [...chosen.values()]
      .map((a) => a.source)
      .concat(path.join(getPaths().gameRoot, profile.tagBundle)),
  );
  const assets = [];
  saveWork("asset-references.json", references);
  saveWork("missing-assets.json", missing);
  let batch = 0;
  for (const list of groups.values()) {
    const source = list[0].source,
      type = list[0].assetType;
    const dest = path.join(
      work,
      "asset-batches",
      sha256(Buffer.from(relativeSource(source) + "|" + type)).slice(0, 16),
    );
    // Export each same-named object separately: a Cartesian name/container filter can
    // otherwise make AnimeStudio overwrite the desired object with another Sprite.
    const { ordinary, separate } = planAssetBatches(list, type === "Sprite" ? sprites : textures);
    if (ordinary.length) {
      clearExpected(dest, type, ordinary);
      animeExport(
        source,
        dest,
        type,
        "^(?:" + ordinary.map((a) => escapeRegex(a.resourceName)).join("|") + ")$",
        "^(?:" + [...new Set(ordinary.map((a) => a.container))].map(escapeRegex).join("|") + ")$",
      );
    }
    for (const a of list) {
      let exportDest = dest;
      if (separate.includes(a)) {
        exportDest = path.join(dest, sha256(Buffer.from(a.key)).slice(0, 16));
        clearExpected(exportDest, type, [a]);
        animeExport(
          source,
          exportDest,
          type,
          `^${escapeRegex(a.resourceName)}$`,
          `^${escapeRegex(a.container)}$`,
        );
      }
      const from = path.join(exportDest, type, a.resourceName + ".png");
      if (!fs.existsSync(from))
        throw new Error(`Selected image not exported: ${a.reference}; expected ${from}`);
      const bytes = fs.readFileSync(from),
        png = PNG.sync.read(bytes, { checkCRC: true });
      const file = "assets/" + sha256(Buffer.from(a.key)) + ".png";
      fs.mkdirSync(path.join(work, "assets"), { recursive: true });
      fs.copyFileSync(from, path.join(work, file));
      assets.push({
        key: a.key,
        source: relativeSource(source),
        sourceSha256: audit.records.find((r) => r.source === relativeSource(source)).sha256,
        assetType: type,
        pathId: a.pathId,
        container: a.container,
        resourceName: a.resourceName,
        file,
        sha256: sha256(bytes),
        width: png.width,
        height: png.height,
      });
    }
    saveWork("asset-manifest.json", assets);
    console.log(`Resource batches ${++batch}/${groups.size}; images ${assets.length}`);
  }
  for (const ref of references)
    if (ref.match)
      ref.match = {
        ...ref.match,
        source: ref.match.source ? relativeSource(ref.match.source) : null,
        sourceVariants: ref.match.sourceVariants.map((a) => ({
          ...a,
          source: relativeSource(a.source),
        })),
      };
  saveWork("asset-references.json", references);
  const primary = raw.entries
    .map((e) => {
      const refs = references.filter((r) => r.table === 325 && r.recordId === e.id);
      return (
        refs.find((r) => r.role === "iconSmall" && r.status === "matched") ??
        refs.find((r) => r.role === "iconLarge" && r.status === "matched") ??
        null
      );
    })
    .filter(Boolean);
  saveWork("asset-summary.json", {
    images: assets.length,
    references: references.length,
    matchedReferences: references.filter((r) => r.status === "matched").length,
    primaryEntries: primary.length,
    uniquePrimaryImages: new Set(primary.map((r) => r.assetKey)).size,
    noUi: missing.filter((r) => r.reason === "no_ui_record").map((r) => r.recordId),
    unmatchedPrimary: raw.entries
      .filter((e) => e.records[325] && !primary.some((r) => r.recordId === e.id))
      .map((e) => e.id),
    supportReferences: references.filter((r) => !entryIds.has(r.recordId) && r.table === 325)
      .length,
  });
}
