import { schemas } from "./config.mjs";

// A gap includes padding. It is a storage span, never an inferred scalar width.
export function rawRecord(
  reader,
  rowOffset,
  rootField,
  schema = schemas[rootField] ?? {},
  minimumSlots = 0,
) {
  const positions = reader.fields(rowOffset);
  if (!positions) throw new Error(`Invalid table ${rootField} row at ${rowOffset}`);
  const vt = rowOffset - reader.i32(rowOffset),
    vtSize = reader.u16(vt),
    objectSize = reader.u16(vt + 2);
  const end = rowOffset + objectSize;
  const hex = (p, n) => reader.b.subarray(p, p + n).toString("hex");
  const fields = Array.from({ length: Math.max(positions.length, minimumSlots) }, (_, index) => {
    const p = positions[index];
    if (p == null) return { index, present: false };
    const next = Math.min(end, ...positions.filter((q) => q != null && q > p));
    const storageType = schema[index] ?? "opaque";
    const field = {
      index,
      present: true,
      offset: p,
      storageSpan: next - p,
      encodedHex: hex(p, next - p),
      storageType,
    };
    if (storageType === "opaque") return field;
    const width = storageType === "u8" ? 1 : 4;
    if (next - p < width) throw new Error(`Field width mismatch: ${rootField}.${index} at ${p}`);
    if (storageType === "string") {
      const target = reader.ref(p);
      if (!reader.inRange(target)) throw new Error(`Invalid string target: ${rootField}.${index}`);
      const n = reader.u32(target);
      if (n > 1000000 || !reader.inRange(target + 4, n))
        throw new Error(`Invalid string length: ${rootField}.${index}`);
      const data = reader.bytesAtRef(p),
        text = new TextDecoder("utf-8", { fatal: true }).decode(data.bytes);
      // oxlint-disable-next-line no-control-regex
      if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text))
        throw new Error(`Invalid string contents: ${rootField}.${index}`);
      field.value = text;
      field.reference = { offset: target, length: n, encodedHex: hex(target, 4 + n) };
    } else {
      field.value =
        storageType === "u8"
          ? reader.scalar(p, 1, "readUInt8")
          : storageType === "f32"
            ? reader.scalar(p, 4, "readFloatLE")
            : reader.u32(p);
      if (!Number.isFinite(field.value))
        throw new Error(`Non-finite scalar: ${rootField}.${index}`);
    }
    return field;
  });
  return {
    key: `${rootField}:${rowOffset}`,
    rootField,
    rowOffset,
    objectSize,
    objectHex: hex(rowOffset, objectSize),
    vtable: { offset: vt, length: vtSize, encodedHex: hex(vt, vtSize) },
    fields,
  };
}
export const value = (row, index) => row?.fields[index]?.value ?? null;
export const locator = (row) =>
  row ? { table: row.rootField, key: row.key, rowOffset: row.rowOffset } : null;
export function uniqueById(rows, table, allowEquivalent = false) {
  const map = new Map();
  const signature = (row) =>
    JSON.stringify(
      row.fields.map((f) => ({
        index: f.index,
        present: f.present,
        storageType: f.storageType,
        value: f.value,
        opaque: f.storageType === "opaque" ? f.encodedHex : undefined,
      })),
    );
  for (const row of rows) {
    const id = value(row, 0);
    if (map.has(id) && (!allowEquivalent || signature(map.get(id)) !== signature(row)))
      throw new Error(`Duplicate key ${id} in table ${table}`);
    map.set(id, row);
  }
  return map;
}
