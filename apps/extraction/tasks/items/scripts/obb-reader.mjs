import fs from "node:fs";
import { profile } from "./config.mjs";
const utf8 = new TextDecoder("utf-8", { fatal: true });

// This client's byte arrays are reversed and XORed with a mirrored mask.
// Scalar storage uses the same transform for its own byte width.
export function decodeBytes(bytes, masks = profile) {
  const n = bytes.length,
    out = Buffer.allocUnsafe(n),
    key = (n ^ masks.byteMask) >>> 0;
  const mask = [key & 255, (key >>> 8) & 255, (key >>> 16) & 255, key >>> 24];
  for (let i = 0; i < n; i++)
    out[n - 1 - i] = bytes[i] ^ mask[i === n - 1 - i ? 0 : Math.min(i, n - 1 - i) % 4];
  return out;
}

export function decodeTextMapBucket(bytes, masks = profile) {
  if (bytes.length !== 8) throw new Error("TextMap bucket must be 8 bytes");
  const value = decodeBytes(bytes, masks).readBigUInt64LE(0);
  const low = Number(value & 0xffffffffn);
  return low === 0xffffffff ? null : { hash: Number(value >> 32n), index: low >>> 8 };
}

export class ObbReader {
  constructor(file, masks = profile) {
    this.masks = masks;
    this.file = Buffer.isBuffer(file) ? null : file;
    this.b = Buffer.isBuffer(file) ? file : fs.readFileSync(file);
  }
  inRange(p, n = 4) {
    return Number.isSafeInteger(p) && p >= 0 && p + n <= this.b.length;
  }
  u32(p) {
    return (this.b.readUInt32BE(p) ^ this.masks.wordMask) >>> 0;
  }
  i32(p) {
    return this.u32(p) | 0;
  }
  u16(p) {
    return this.b.readUInt16BE(p) ^ this.masks.shortMask;
  }
  scalar(p, n, type) {
    if (!this.inRange(p, n)) throw new Error(`Scalar out of range: ${p}, ${n}`);
    const data = decodeBytes(this.b.subarray(p, p + n), this.masks);
    return data[type](0);
  }
  ref(p) {
    return p + this.u32(p);
  }
  fields(p) {
    if (!this.inRange(p)) return null;
    const vt = p - this.i32(p);
    if (!this.inRange(vt)) return null;
    const len = this.u16(vt),
      size = this.u16(vt + 2);
    if (
      len < 4 ||
      len % 2 ||
      len > 3000 ||
      size < 4 ||
      size > 20000 ||
      !this.inRange(vt, len) ||
      !this.inRange(p, size)
    )
      return null;
    const fields = Array.from({ length: len / 2 - 2 }, (_, i) => {
      const off = this.u16(vt + 4 + i * 2);
      return off > 0 && off < size ? p + off : null;
    });
    return fields;
  }
  bytesAtRef(p, max = 1000000) {
    if (p === null || !this.inRange(p)) return null;
    const t = this.ref(p);
    if (!this.inRange(t)) return null;
    const n = this.u32(t);
    if (n > max || !this.inRange(t + 4, n)) return null;
    return {
      offset: t + 4,
      length: n,
      bytes: decodeBytes(this.b.subarray(t + 4, t + 4 + n), this.masks),
    };
  }
  string(p, max = 20000) {
    const data = this.bytesAtRef(p, max);
    if (!data || !data.length) return null;
    try {
      const text = utf8.decode(data.bytes);
      // Descriptions permit tab/CR/LF, but other control bytes indicate a false string candidate.
      // oxlint-disable-next-line no-control-regex
      return /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text)
        ? null
        : { text, offset: data.offset, length: data.length };
    } catch {
      return null;
    }
  }
  rows(index) {
    return Array.from({ length: index.count }, (_, i) => this.ref(index.vector + 4 + i * 4));
  }
}
