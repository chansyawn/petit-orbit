import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { ObbReader, decodeBytes } from "../../items/scripts/obb-reader.mjs";
import { createIconResolver } from "../../items/scripts/icon-resolver.mjs";
import { rawRecord, uniqueById } from "../scripts/raw-reader.mjs";
import { classifyEntry, expandTags } from "../scripts/classify.mjs";
import { getOptions, profile, repoRoot } from "../scripts/config.mjs";
import { assetIdentity, planAssetBatches } from "../scripts/export-assets.mjs";

const fixture = JSON.parse(fs.readFileSync(new URL("./fixtures/scalars.json", import.meta.url)));
const runner = fileURLToPath(new URL("../scripts/run.mjs", import.meta.url));
const row = (values) => ({
  fields: Array.from({ length: 24 }, (_, index) =>
    Object.hasOwn(values, index)
      ? { index, present: true, value: values[index] }
      : { index, present: false },
  ),
});
function bufferRow(offsets = [4, 8, 12]) {
  const bytes = Buffer.alloc(96),
    u32 = (p, n) => bytes.writeUInt32BE((n ^ profile.wordMask) >>> 0, p),
    u16 = (p, n) => bytes.writeUInt16BE(n ^ profile.shortMask, p);
  u16(16, 10);
  u16(18, 20);
  offsets.forEach((off, i) => u16(20 + i * 2, off));
  u32(48, 32);
  return { bytes, u32, rowOffset: 48 };
}

test("real one-byte flag and float preserve actual values", () => {
  for (const sample of fixture.samples) {
    const reader = new ObbReader(Buffer.from(sample.encodedHex, "hex"), profile);
    assert.equal(reader.scalar(0, sample.width, sample.read), sample.expected);
  }
  assert.equal(fixture.samples[0].expected, 1);
  assert(Math.abs(fixture.samples[1].expected - 0.8) < 0.000001);
});
test("raw reader keeps absent slots, explicit zero and opaque bytes distinct", () => {
  const b = bufferRow([4, 0, 12]);
  b.u32(52, 0);
  b.u32(60, 4);
  const raw = rawRecord(new ObbReader(b.bytes), 48, 99, { 0: "u32" }, 4);
  assert.equal(raw.fields[0].value, 0);
  assert.deepEqual(raw.fields[1], { index: 1, present: false });
  assert.equal(raw.fields[2].storageType, "opaque");
  assert(!Object.hasOwn(raw.fields[2], "value"));
  assert.equal(raw.fields[2].storageSpan, 8);
  assert.deepEqual(raw.fields[3], { index: 3, present: false });
});
test("a scalar that accidentally dereferences to text is not promoted to a string", () => {
  const b = bufferRow();
  b.u32(52, 20);
  b.u32(56, 4);
  b.u32(60, 3);
  decodeBytes(Buffer.from("abc")).copy(b.bytes, 64);
  const reader = new ObbReader(b.bytes),
    raw = rawRecord(reader, 48, 99, { 0: "u32", 1: "u32" });
  assert.equal(reader.string(56).text, "abc");
  assert.equal(raw.fields[1].value, 4);
  assert(!raw.fields[1].reference);
});
test("known widths cannot read through a neighboring byte field", () => {
  const b = bufferRow([4, 5, 12]);
  assert.throws(() => rawRecord(new ObbReader(b.bytes), 48, 99, { 0: "u32" }), /width mismatch/);
});
test("equivalent display duplicates retain a canonical locator; conflicting values fail", () => {
  const a = { ...row({ 0: 35, 4: "path" }), key: "325:10" },
    b = { ...row({ 0: 35, 4: "path" }), key: "325:20" };
  assert.equal(uniqueById([a, b], 325, true).get(35).key, b.key);
  assert.throws(() => uniqueById([a, b], 325), /Duplicate/);
  assert.throws(
    () => uniqueById([a, { ...row({ 0: 35, 4: "different" }) }], 325, true),
    /Duplicate/,
  );
});
test("parent tags classify items while appearances and theme collections remain included", () => {
  const nodes = {
    1: { TagId: 1, TagName: "花", ParentId: 0 },
    2: { TagId: 2, TagName: "花株", ParentId: 1 },
  };
  const subs = [{ id: 302, categoryId: 2, filterTags: ["花"] }];
  assert.deepEqual(
    classifyEntry(row({ 0: 1 }), row({ 2: 4, 6: "花株" }), subs, nodes).subcategoryIds,
    [302],
  );
  assert.equal(
    classifyEntry(row({ 0: 2, 1: 1 }), row({ 2: 20, 6: "短发" }), subs, nodes).role,
    "avatarOption",
  );
  const collection = classifyEntry(row({ 0: 3 }), row({ 2: 500, 6: "花套组" }), subs, nodes);
  assert.equal(collection.categoryId, 2);
  assert.equal(collection.role, "collection");
  assert.equal(collection.listedInSubcategories, false);
  assert.throws(() => expandTags(["花"], { 1: { TagId: 1, TagName: "花", ParentId: 1 } }), /cycle/);
  assert.throws(
    () =>
      classifyEntry(
        row({ 0: 4 }),
        row({ 2: 4, 6: "花" }),
        [...subs, { id: 9, categoryId: 2, filterTags: ["花"] }],
        nodes,
      ),
    /Multiple/,
  );
});
test("exact Sprite selection rejects same-tier ambiguity and ignores same names elsewhere", () => {
  const reference = "UISprite/Load/A/Same",
    asset = {
      Name: "Same",
      Container: profile.assetPrefix + reference.toLowerCase() + ".png",
      Source: "C:/game/Persistent/a.blk",
      PathID: "11",
    };
  const elsewhere = {
    ...asset,
    Container: profile.assetPrefix + "uisprite/load/b/same.png",
    PathID: "12",
  };
  const resolve = createIconResolver([], [asset, elsewhere], { rejectAmbiguous: true });
  assert.equal(resolve(reference).pathId, "11");
  assert.throws(
    () =>
      createIconResolver([], [asset, { ...asset, PathID: "13" }], { rejectAmbiguous: true })(
        reference,
      ),
    /Ambiguous/,
  );
  assert.notEqual(
    assetIdentity({ source: "a", assetType: "Sprite", pathId: "11" }),
    assetIdentity({ source: "a", assetType: "Sprite", pathId: "12" }),
  );
});

test("batch filters isolate names duplicated by unselected objects in the same package", () => {
  const selected = [
    { source: "bundle", assetType: "Sprite", resourceName: "Same", container: "a", pathId: "1" },
    { source: "bundle", assetType: "Sprite", resourceName: "Other", container: "b", pathId: "2" },
  ];
  const index = [
    { Source: "bundle", Type: "Sprite", Name: "Same", Container: "a", PathID: "1" },
    { Source: "bundle", Type: "Sprite", Name: "Same", Container: "b", PathID: "3" },
    { Source: "bundle", Type: "Sprite", Name: "Other", Container: "b", PathID: "2" },
  ];
  const { ordinary, separate } = planAssetBatches(selected, index);
  assert.deepEqual(separate, [selected[0]]);
  assert.deepEqual(ordinary, [selected[1]]);
});
test("CLI help is independent of cwd; protected outputs and missing prerequisites fail", () => {
  const help = spawnSync(process.execPath, [runner, "--help"], {
    cwd: os.tmpdir(),
    encoding: "utf8",
    windowsHide: true,
  });
  assert.equal(help.status, 0);
  assert.match(help.stdout, /prepare-inputs/);
  assert.equal(
    getOptions(["--output", "resources/temp/test-open-content"]).output,
    path.join(repoRoot, "resources/temp/test-open-content"),
  );
  assert.throws(
    () => getOptions(["--output", "resources/petit-planet-extraction/0.95.2/index"]),
    /Unsafe/,
  );
  assert.throws(() => getOptions(["--output", "apps"]), /Unsafe/);
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "open-content-test-"));
  try {
    const failed = spawnSync(
      process.execPath,
      [runner, "--step", "decode-records", "--output", temp],
      { cwd: os.tmpdir(), encoding: "utf8", windowsHide: true },
    );
    assert.notEqual(failed.status, 0);
    assert.match(
      fs.readFileSync(path.join(temp, "logs/decode-records.log"), "utf8"),
      /Missing prerequisite/,
    );
    const report = JSON.parse(fs.readFileSync(path.join(temp, "run-report.json")));
    assert.equal(report.status, "failed");
    assert.equal(report.steps.length, 1);
  } finally {
    assert(path.resolve(temp).startsWith(path.resolve(os.tmpdir()) + path.sep));
    fs.rmSync(temp, { recursive: true, force: true });
  }
});
