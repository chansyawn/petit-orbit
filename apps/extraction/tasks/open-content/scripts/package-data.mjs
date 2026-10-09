import fs from "node:fs";
import path from "node:path";
import { getPaths, profile } from "./config.mjs";
import { loadWork, writeJson } from "./io.mjs";

export function packageData() {
  const { out, work } = getPaths(),
    raw = loadWork("records.json"),
    classified = loadWork("classified.json");
  const assets = loadWork("asset-manifest.json"),
    refs = loadWork("asset-references.json"),
    missing = loadWork("missing-assets.json"),
    audit = loadWork("source-audit.json");
  const assetMap = new Map(assets.map((a) => [a.key, a]));
  const metadata = {
    schemaVersion: 1,
    gameVersion: profile.gameVersion,
    configRevision: profile.dataRevision,
    resourceRevision: profile.resourceRevision,
    manifestId: profile.manifestId,
    scope: {
      entryTable: 93,
      entryCount: 2327,
      basis: "user_confirmed_root93_scope",
      supportRecordsAreNotEntries: true,
    },
    configSource: raw.source,
  };
  const imagesFor = (id, sources) =>
    refs
      .filter(
        (r) =>
          r.table !== 33 &&
          r.recordId === id &&
          Object.values(sources).some((s) => s?.key === r.rowKey),
      )
      .map((r) => ({
        reference: r.reference,
        role: r.role,
        status: r.status,
        assetKey: r.assetKey ?? null,
        file: assetMap.get(r.assetKey)?.file ?? null,
        source: { table: r.table, key: r.rowKey, field: r.field },
      }));
  const items = classified.items.map((item) => {
    const images = imagesFor(item.id, item.sources),
      primary =
        images.find((r) => r.role === "iconSmall" && r.file) ??
        images.find((r) => r.role === "iconLarge" && r.file) ??
        null;
    return { ...item, images, primaryImage: primary?.file ?? null };
  });
  const definitions = {
    ...classified.definitions,
    supportItems: classified.definitions.supportItems.map((i) => ({
      ...i,
      images: imagesFor(i.id, i.sources),
    })),
    subcategories: classified.definitions.subcategories.map((s) => ({
      ...s,
      images: refs
        .filter((r) => r.table === 33 && r.rowKey === s.source.key)
        .map((r) => ({
          reference: r.reference,
          role: r.role,
          status: r.status,
          assetKey: r.assetKey ?? null,
          file: assetMap.get(r.assetKey)?.file ?? null,
          source: { table: 33, key: r.rowKey, field: r.field },
        })),
    })),
  };
  for (const group of ["raw", "semantic"]) {
    const dest = path.join(out, group);
    // Remove only obsolete assets listed by a previous export, never arbitrary files.
    const previous = path.join(dest, "asset-manifest.json");
    if (fs.existsSync(previous))
      for (const asset of JSON.parse(fs.readFileSync(previous))) {
        if (!/^assets\/[a-f0-9]{64}\.png$/.test(asset.file))
          throw new Error("Invalid previous asset filename");
        if (!assets.some((a) => a.file === asset.file))
          fs.rmSync(path.join(dest, asset.file), { force: true });
      }
    for (const a of assets) {
      fs.mkdirSync(path.join(dest, "assets"), { recursive: true });
      fs.copyFileSync(path.join(work, a.file), path.join(dest, a.file));
    }
    writeJson(path.join(dest, "metadata.json"), metadata);
    writeJson(path.join(dest, "asset-manifest.json"), assets);
    writeJson(path.join(dest, "asset-references.json"), refs);
    writeJson(path.join(dest, "missing-assets.json"), missing);
    writeJson(path.join(dest, "source-audit.json"), audit);
    writeJson(path.join(dest, "unresolved-texts.json"), raw.unresolvedTextHashes);
  }
  writeJson(path.join(out, "raw", "entries.json"), {
    ...metadata,
    entries: raw.entries,
    supportItemIds: raw.supportItemIds,
  });
  for (const [root, rows] of Object.entries(raw.tables))
    writeJson(path.join(out, "raw", "tables", root + ".json"), {
      rootField: Number(root),
      source: raw.source,
      rows,
    });
  writeJson(path.join(out, "raw", "gameplay-tags.json"), {
    source: definitions.tagSource,
    nodes: definitions.tags,
  });
  writeJson(path.join(out, "semantic", "content.json"), {
    ...metadata,
    fieldMappings: {
      ...classified.fieldMappings,
      images: "source table/field in each image; asset-references.json",
      primaryImage: "matched 325.4, otherwise matched 325.5",
    },
    items,
  });
  writeJson(path.join(out, "semantic", "definitions.json"), definitions);
  console.log(`Packaged ${items.length} entries, ${assets.length} PNGs in each group`);
}
