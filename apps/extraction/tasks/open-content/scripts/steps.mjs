import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import { getOptions, getPaths, verifySharedProfile } from "./config.mjs";
import { decodeRecords } from "./decode-records.mjs";
import { classify } from "./classify.mjs";
import { exportAssets } from "./export-assets.mjs";
import { packageData } from "./package-data.mjs";
import { validate } from "./validate.mjs";
import { loadWork } from "./io.mjs";

function sharedStep(name) {
  verifySharedProfile();
  const result = spawnSync(
    process.execPath,
    [
      fileURLToPath(new URL(`../../items/scripts/${name}.mjs`, import.meta.url)),
      "--output",
      getPaths().work,
    ],
    { stdio: "inherit", windowsHide: true },
  );
  if (result.error || result.status !== 0)
    throw new Error(`Input step ${name} failed: ${result.error?.message ?? result.status}`);
}
export const steps = [
  "prepare-inputs",
  "read-indexes",
  "decode-records",
  "classify",
  "export-assets",
  "package",
  "validate",
];
async function main() {
  const { step } = getOptions();
  if (!steps.includes(step)) throw new Error(`Unknown step: ${step}`);
  fs.mkdirSync(getPaths().work, { recursive: true });
  switch (step) {
    case "prepare-inputs":
      sharedStep("select-config-source");
      break;
    case "read-indexes":
      loadWork("active-config-source.json");
      for (const name of ["inspect-resources", "probe-tables", "decode-textmap", "decode-cs-index"])
        sharedStep(name);
      break;
    case "decode-records":
      decodeRecords();
      break;
    case "classify":
      classify();
      break;
    case "export-assets":
      await exportAssets();
      break;
    case "package":
      packageData();
      break;
    case "validate":
      validate();
      break;
  }
}
// Importing this module for --help must not execute a step.
if (process.argv[1] === fileURLToPath(import.meta.url))
  main().catch((error) => {
    console.error(error.stack);
    process.exitCode = 1;
  });
