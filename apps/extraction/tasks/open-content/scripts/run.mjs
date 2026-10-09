import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { getOptions, profile } from "./config.mjs";
import { writeJson } from "./io.mjs";
import { steps } from "./steps.mjs";

async function main() {
  const options = getOptions();
  if (options.help) {
    console.log(
      `开放内容导出（${profile.gameVersion}, revision ${profile.dataRevision}）\n\nnode run.mjs [--step NAME] [--output DIR]\n默认执行全部步骤；--step 仅执行指定步骤，不补跑依赖。\n路径相对仓库根目录解析，不依赖当前工作目录。\n默认输出：resources/petit-planet-extraction/${profile.gameVersion}/open-content/\n步骤：\n${steps.join("\n")}`,
    );
    return;
  }
  if (options.step && !steps.includes(options.step))
    throw new Error(`Unknown step: ${options.step}`);
  fs.mkdirSync(path.join(options.output, "logs"), { recursive: true });
  fs.rmSync(path.join(options.output, "validation.json"), { force: true });
  const report = {
    gameVersion: profile.gameVersion,
    configRevision: profile.dataRevision,
    output: options.output,
    startedAt: new Date().toISOString(),
    status: "running",
    steps: [],
  };
  const save = () => writeJson(path.join(options.output, "run-report.json"), report);
  save();
  try {
    for (const step of options.step ? [options.step] : steps) {
      console.log(`[${step}] starting`);
      const log = path.join(options.output, "logs", step + ".log"),
        fd = fs.openSync(log, "w"),
        record = {
          name: step,
          log: path.relative(options.output, log),
          startedAt: new Date().toISOString(),
        };
      report.steps.push(record);
      save();
      try {
        record.exitCode = await new Promise((resolve, reject) => {
          const child = spawn(
            process.execPath,
            [
              fileURLToPath(new URL("./steps.mjs", import.meta.url)),
              "--step",
              step,
              "--output",
              options.output,
            ],
            { windowsHide: true, stdio: ["ignore", fd, fd] },
          );
          child.once("error", reject);
          child.once("exit", (code, signal) => resolve(code ?? `signal:${signal}`));
        });
      } finally {
        fs.closeSync(fd);
        record.finishedAt = new Date().toISOString();
        save();
      }
      if (record.exitCode !== 0) throw new Error(`${step} failed (${record.exitCode}); see ${log}`);
      console.log(`[${step}] passed`);
    }
    report.status = "passed";
  } catch (error) {
    report.status = "failed";
    report.error = error.message;
    throw error;
  } finally {
    report.finishedAt = new Date().toISOString();
    save();
  }
  console.log(`Output: ${options.output}`);
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
