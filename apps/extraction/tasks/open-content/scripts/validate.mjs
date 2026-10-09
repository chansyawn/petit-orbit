import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";
import { profile, getPaths } from "./config.mjs";
import { readJson, loadWork, writeJson, sha256, sourceInfo } from "./io.mjs";
import { value } from "./raw-reader.mjs";
import { tagDimensions } from "./config.mjs";
import { splitTags } from "./classify.mjs";

export function validate() {
  const { out } = getPaths(),
    raw = readJson(path.join(out, "raw/entries.json")),
    semantic = readJson(path.join(out, "semantic/content.json")),
    definitions = readJson(path.join(out, "semantic/definitions.json"));
  const items = semantic.items,
    expected = profile.expected;
  assert.equal(items.length, expected.entries);
  assert.equal(raw.entries.length, expected.entries);
  assert.equal(new Set(items.map((i) => i.id)).size, expected.entries);
  assert.deepEqual(
    raw.entries.map((e) => e.id).sort((a, b) => a - b),
    items.map((i) => i.id).sort((a, b) => a - b),
  );
  const roles = Object.fromEntries(
    ["item", "collection", "avatarOption"].map((role) => [
      role,
      items.filter((i) => i.role === role).length,
    ]),
  );
  assert.deepEqual(roles, {
    item: expected.items,
    collection: expected.collections,
    avatarOption: expected.avatarOptions,
  });
  const categories = Object.fromEntries(
    Object.keys(expected.categories).map((id) => [
      id,
      items.filter((i) => i.role === "item" && i.classification.categoryId === Number(id)).length,
    ]),
  );
  assert.deepEqual(categories, expected.categories);
  const subcategories = Object.fromEntries(
    Object.keys(expected.subcategories).map((id) => [
      id,
      items.filter((i) => i.classification.subcategoryIds.includes(Number(id))).length,
    ]),
  );
  assert.deepEqual(subcategories, expected.subcategories);
  assert.equal(
    items.filter((i) => i.role === "collection" && !i.classification.listedInSubcategories).length,
    expected.topicCollections,
  );
  assert(
    items.every(
      (i) =>
        i.classification.subcategoryIds.length <= 1 &&
        i.availability.open === true &&
        i.name.zh &&
        i.type.name,
    ),
  );
  assert(items.every((i) => i.sources[318]));
  assert.equal(items.filter((i) => i.sources[325]).length, expected.ui);
  assert.equal(items.filter((i) => i.creature).length, expected.creatures);
  assert.equal(items.filter((i) => i.sources[42]).length, expected.avatarLinks);
  const rewardIds = new Set(definitions.rewards.map((r) => r.id));
  assert.equal(items.filter((i) => i.rewardId != null).length, expected.collections);
  assert(items.filter((i) => i.role === "collection").every((i) => rewardIds.has(i.rewardId)));
  assert.equal(rewardIds.size, 14);
  const allItemIds = new Set([
    ...items.map((i) => i.id),
    ...definitions.supportItems.map((i) => i.id),
  ]);
  assert(items.every((i) => i.relatedCardIds.every((id) => allItemIds.has(id))));
  const config = sourceInfo(),
    bytes = fs.readFileSync(config.file);
  assert.equal(sha256(bytes), config.sha256);
  const rawRows = new Map();
  for (const name of fs.readdirSync(path.join(out, "raw/tables"))) {
    const table = readJson(path.join(out, "raw/tables", name));
    for (const row of table.rows) {
      rawRows.set(row.key, row);
      assert.equal(
        row.objectHex,
        bytes.subarray(row.rowOffset, row.rowOffset + row.objectSize).toString("hex"),
      );
      assert.equal(
        row.vtable.encodedHex,
        bytes.subarray(row.vtable.offset, row.vtable.offset + row.vtable.length).toString("hex"),
      );
      for (const field of row.fields)
        if (field.present) {
          assert.equal(
            field.encodedHex,
            bytes.subarray(field.offset, field.offset + field.storageSpan).toString("hex"),
          );
          if (field.reference)
            assert.equal(
              field.reference.encodedHex,
              bytes
                .subarray(
                  field.reference.offset,
                  field.reference.offset + 4 + field.reference.length,
                )
                .toString("hex"),
            );
          if (field.storageType === "opaque") assert(!Object.hasOwn(field, "value"));
        }
    }
  }
  for (const e of raw.entries)
    for (const loc of [...Object.values(e.records), ...e.uiRecords, ...e.rewardRecords].filter(
      Boolean,
    ))
      assert(rawRows.has(loc.key));
  const root93 = readJson(path.join(out, "raw/tables/93.json")).rows;
  assert.equal(root93.filter((r) => value(r, 1) === 1).length, 51);
  assert.equal(root93.filter((r) => value(r, 17) != null).length, 231);
  assert(
    root93
      .filter((r) => value(r, 17) != null)
      .every((r) => Math.abs(value(r, 17) - 0.8) < 0.000001),
  );
  const refs = readJson(path.join(out, "raw/asset-references.json")),
    assets = readJson(path.join(out, "raw/asset-manifest.json")),
    assetMap = new Map(assets.map((a) => [a.key, a]));
  assert.equal(assetMap.size, assets.length);
  for (const ref of refs) {
    assert(rawRows.has(ref.rowKey));
    if (ref.status === "matched") assert(assetMap.has(ref.assetKey));
  }
  const textRows = new Map(
    readJson(path.join(out, "raw/tables/1.json")).rows.map((r) => [r.hash, r]),
  );
  for (const item of items) {
    for (const image of item.images)
      if (image.file) assert.equal(assetMap.get(image.assetKey)?.file, image.file);
    const main = rawRows.get(item.sources[318].key),
      text = textRows.get(value(main, 1));
    assert.deepEqual(item.name, { zh: value(text, 1), en: value(text, 0) });
    assert.equal(item.nameHash, value(main, 1));
    const type = rawRows.get(item.sources[716].key);
    assert.deepEqual(item.type, { id: value(main, 2), name: value(type, 1) });
    for (const [name, field] of Object.entries(tagDimensions))
      assert.deepEqual(item.tags[name], splitTags(value(main, field)));
    const ui = item.sources[325] ? rawRows.get(item.sources[325].key) : null;
    const description = textRows.get(value(ui, 27));
    assert.deepEqual(
      item.description,
      description ? { zh: value(description, 1), en: value(description, 0) } : null,
    );
    if (item.creature) {
      const creature = rawRows.get(item.sources[186].key),
        name = textRows.get(value(creature, 1));
      assert.deepEqual(item.creature, {
        name: { zh: value(name, 1), en: value(name, 0) },
        description: value(creature, 6),
      });
    }
    const root = rawRows.get(item.sources[93].key);
    assert.equal(item.rewardId, value(root, 12));
    for (const loc of [
      ...Object.values(item.sources),
      ...item.uiSources,
      ...item.rewardSources,
    ].filter(Boolean))
      assert(rawRows.has(loc.key));
  }
  for (const group of ["raw", "semantic"]) {
    assert.deepEqual(readJson(path.join(out, group, "asset-manifest.json")), assets);
    assert.deepEqual(readJson(path.join(out, group, "asset-references.json")), refs);
    assert.deepEqual(
      readJson(path.join(out, group, "source-audit.json")),
      loadWork("source-audit.json"),
    );
    for (const a of assets) {
      const pngBytes = fs.readFileSync(path.join(out, group, a.file)),
        png = PNG.sync.read(pngBytes, { checkCRC: true });
      assert.equal(sha256(pngBytes), a.sha256);
      assert.equal(png.width, a.width);
      assert.equal(png.height, a.height);
    }
  }
  const summary = loadWork("asset-summary.json");
  assert.equal(summary.primaryEntries, expected.primaryImages);
  assert.equal(summary.uniquePrimaryImages, expected.uniquePrimaryImages);
  assert.deepEqual(
    [...summary.noUi].sort((a, b) => a - b),
    [95014, 95015, 95016, 95113, 95114],
  );
  assert.deepEqual(
    [...summary.unmatchedPrimary].sort((a, b) => a - b),
    [52, 53, 54, 2210, 2211],
  );
  const sourceAudit = loadWork("source-audit.json");
  assert(sourceAudit.passed && sourceAudit.records.every((r) => r.matchesManifest));
  const result = {
    passed: true,
    gameVersion: profile.gameVersion,
    configRevision: profile.dataRevision,
    entries: items.length,
    roles,
    categories,
    subcategories,
    mainJoined: items.length,
    uiJoined: expected.ui,
    creatures: expected.creatures,
    avatarLinks: expected.avatarLinks,
    rewardIds: rewardIds.size,
    ...summary,
    sourceBundles: sourceAudit.checkedBundles,
    decodedPngFiles: assets.length * 2,
    rawRecords: rawRows.size,
    unresolvedTextHashes: readJson(path.join(out, "raw/unresolved-texts.json")).length,
  };
  writeJson(path.join(out, "validation.json"), result);
  console.log(JSON.stringify(result, null, 2));
}
