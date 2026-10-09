import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { getPaths, profile } from "./config.mjs";

export const sha256 = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");
export const relativeSource = (source) =>
  path.relative(getPaths().gameRoot, source).replaceAll("\\", "/");
export const writeJson = (file, data) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
};
export function readJson(file) {
  if (!fs.existsSync(file))
    throw new Error(`Missing prerequisite: ${file}; run the preceding step first`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}
export const loadWork = (name) => readJson(path.join(getPaths().work, name));
export const saveWork = (name, value) => writeJson(path.join(getPaths().work, name), value);
export function sourceInfo() {
  const selected = loadWork("active-config-source.json");
  if (
    selected.dataRevision !== profile.dataRevision ||
    !selected.files.every((f) => f.matchesManifest)
  )
    throw new Error("Selected config does not match task profile");
  return selected.files.find((f) => f.file.endsWith("ed.obb"));
}
export function animeExport(source, dest, type, names, containers) {
  const args = [source, dest, "--game", profile.animeGame, "--types", type, "--names", names];
  if (containers) args.push("--containers", containers);
  const result = spawnSync(getPaths().animeStudio, args, {
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 64 * 1024 * 1024,
  });
  const key = sha256(Buffer.from(source + "|" + type + "|" + names)).slice(0, 16);
  const log = path.join(getPaths().out, "logs", `anime-${key}.log`);
  fs.mkdirSync(path.dirname(log), { recursive: true });
  fs.writeFileSync(
    log,
    (result.stdout ?? "") + (result.stderr ?? "") + (result.error?.message ?? ""),
  );
  if (result.error || result.status !== 0)
    throw new Error(`AnimeStudio failed (${result.status}); see ${log}`);
}
export async function auditSources(sources) {
  const { gameRoot } = getPaths();
  const manifest = (file) =>
    new Map(
      fs
        .readFileSync(file, "utf8")
        .trim()
        .split(/\r?\n/)
        .slice(1)
        .map((line) => {
          const [name, md5, size] = line.split(",");
          return [name, { md5, size: Number(size) }];
        }),
    );
  const base = manifest(path.join(gameRoot, "StreamingAssets/res_versions.json"));
  const data = manifest(
    path.join(gameRoot, `Persistent/versions/${profile.manifestId}/data_versions.json`),
  );
  const patch = manifest(
    path.join(gameRoot, `Persistent/versions/${profile.manifestId}/res_versions.json`),
  );
  const records = [];
  for (const source of new Set(sources)) {
    const relative = relativeSource(source),
      match = relative.match(/^(Persistent|StreamingAssets)\/(.*)$/);
    if (!match) throw new Error(`Unrecognized resource source: ${source}`);
    const expected =
      match[1] === "Persistent" ? (data.get(match[2]) ?? patch.get(match[2])) : base.get(match[2]);
    const md5 = crypto.createHash("md5"),
      sha = crypto.createHash("sha256");
    for await (const chunk of fs.createReadStream(source)) {
      md5.update(chunk);
      sha.update(chunk);
    }
    const record = {
      source: relative,
      size: fs.statSync(source).size,
      md5: md5.digest("hex"),
      sha256: sha.digest("hex"),
      expected: expected ?? null,
    };
    record.matchesManifest =
      !!expected && record.md5 === expected.md5 && record.size === expected.size;
    records.push(record);
    if (!record.matchesManifest) {
      saveWork("source-audit.json", { passed: false, records });
      throw new Error(`Source checksum mismatch: ${relative}`);
    }
  }
  const audit = { passed: true, checkedBundles: records.length, records };
  saveWork("source-audit.json", audit);
  return audit;
}
