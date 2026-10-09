import { ObbReader, decodeTextMapBucket } from "../../items/scripts/obb-reader.mjs";
import { profile, schemas } from "./config.mjs";
import { loadWork, saveWork, sourceInfo, relativeSource } from "./io.mjs";
import { rawRecord, value, locator, uniqueById } from "./raw-reader.mjs";

export function decodeRecords() {
  const source = sourceInfo(),
    reader = new ObbReader(source.file, profile);
  const index = new Map(loadWork("obb-table-index.json").map((t) => [t.field, t]));
  const tables = {};
  for (const root of [93, 318, 325, 716, 33, 186, 42, 563]) {
    const t = index.get(root);
    if (!t) throw new Error(`Missing root table ${root}`);
    const offsets = reader.rows(t);
    const slots = Math.max(...Object.keys(schemas[root]).map(Number)) + 1;
    const maxObserved = Math.max(
      slots,
      ...offsets.map((offset) => {
        const fields = reader.fields(offset);
        if (!fields) throw new Error(`Invalid root ${root} row ${offset}`);
        return fields.length;
      }),
    );
    tables[root] = offsets.map((offset) =>
      rawRecord(reader, offset, root, schemas[root], maxObserved),
    );
  }
  const main = uniqueById(tables[318], 318),
    creatures = uniqueById(tables[186], 186),
    avatars = uniqueById(tables[42], 42);
  const ids = new Set(tables[93].map((r) => value(r, 0)));
  if (ids.size !== profile.expected.entries || ids.size !== tables[93].length)
    throw new Error("Entry count/uniqueness mismatch");
  const supportIds = new Set(),
    avatarIds = new Set(),
    rewardIds = new Set();
  for (const row of tables[93]) {
    const id = value(row, 0);
    if (!main.has(id)) throw new Error(`Missing main item ${id}`);
    if (value(row, 12) != null) rewardIds.add(value(row, 12));
    if (value(row, 1) === 1 && avatars.has(id)) {
      avatarIds.add(id);
      for (const token of (value(avatars.get(id), 1) ?? "").split(";").filter(Boolean)) {
        if (!/^\d+$/.test(token)) throw new Error(`Invalid appearance card ID: ${token}`);
        const card = Number(token);
        if (!main.has(card)) throw new Error(`Missing appearance card ${card}`);
        supportIds.add(card);
      }
    }
  }
  const allIds = new Set([...ids, ...supportIds]),
    typeIds = new Set([...allIds].map((id) => value(main.get(id), 2)));
  tables[318] = tables[318].filter((r) => allIds.has(value(r, 0)));
  tables[325] = tables[325].filter((r) => allIds.has(value(r, 0)));
  const ui = uniqueById(tables[325], 325, true);
  tables[716] = tables[716].filter((r) => typeIds.has(value(r, 0)));
  tables[186] = tables[186].filter((r) => ids.has(value(r, 0)));
  tables[42] = tables[42].filter((r) => avatarIds.has(value(r, 0)));
  tables[563] = tables[563].filter((r) => rewardIds.has(value(r, 0)));
  for (const id of rewardIds)
    if (!tables[563].some((r) => value(r, 0) === id)) throw new Error(`Missing reward ${id}`);
  const typeMap = uniqueById(tables[716], 716);
  for (const id of typeIds) if (!typeMap.has(id)) throw new Error(`Missing type ${id}`);
  const hashes = new Set(
    Object.values(tables).flatMap((rows) =>
      rows.flatMap((r) =>
        r.fields.filter((f) => f.storageType === "textHash" && f.present).map((f) => f.value),
      ),
    ),
  );
  const textmap = loadWork("textmap-zh-en.json");
  const wrapper = reader.ref(reader.fields(reader.u32(0))[1]),
    dict = reader.ref(reader.fields(wrapper)[0]);
  const dictFields = reader.fields(dict),
    buckets = reader.ref(dictFields[3]),
    bucketByHash = new Map();
  for (let i = 0; i < reader.u32(buckets); i++) {
    const offset = buckets + 4 + i * 8,
      bytes = reader.b.subarray(offset, offset + 8),
      bucket = decodeTextMapBucket(bytes, profile);
    if (bucket && hashes.has(bucket.hash))
      bucketByHash.set(bucket.hash, {
        offset,
        encodedHex: bytes.toString("hex"),
        index: bucket.index,
      });
  }
  const unresolvedTextHashes = [...hashes]
    .filter((hash) => !textmap.byHash[hash])
    .map((hash) => ({
      hash,
      references: Object.values(tables).flatMap((rows) =>
        rows.flatMap((row) =>
          row.fields
            .filter((f) => f.storageType === "textHash" && f.value === hash)
            .map((f) => ({ key: row.key, field: f.index })),
        ),
      ),
    }));
  tables[1] = [...hashes]
    .filter((hash) => textmap.byHash[hash])
    .sort((a, b) => a - b)
    .map((hash) => {
      const text = textmap.byHash[hash];
      const row = rawRecord(reader, text.rowOffset, 1, schemas[1], 15);
      return { ...row, hash, bucket: bucketByHash.get(hash) };
    });
  const rewardById = new Map();
  for (const row of tables[563]) {
    const id = value(row, 0);
    if (!rewardById.has(id)) rewardById.set(id, []);
    rewardById.get(id).push(locator(row));
  }
  const entries = tables[93].map((row) => {
    const id = value(row, 0),
      m = main.get(id);
    return {
      id,
      records: {
        93: locator(row),
        318: locator(m),
        325: locator(ui.get(id)),
        716: locator(typeMap.get(value(m, 2))),
        186: locator(creatures.get(id)),
        42: locator(avatars.has(id) && avatarIds.has(id) ? avatars.get(id) : null),
      },
      uiRecords: tables[325].filter((r) => value(r, 0) === id).map(locator),
      rewardRecords: rewardById.get(value(row, 12)) ?? [],
      relatedCardIds: avatarIds.has(id)
        ? value(avatars.get(id), 1).split(";").filter(Boolean).map(Number)
        : [],
    };
  });
  saveWork("records.json", {
    schemaVersion: 1,
    gameVersion: profile.gameVersion,
    configRevision: profile.dataRevision,
    source: { file: relativeSource(source.file), size: source.size, sha256: source.sha256 },
    entries,
    supportItemIds: [...supportIds].filter((id) => !ids.has(id)),
    unresolvedTextHashes,
    tables,
  });
  console.log(
    JSON.stringify({
      entries: entries.length,
      tables: Object.fromEntries(Object.entries(tables).map(([k, v]) => [k, v.length])),
    }),
  );
}
