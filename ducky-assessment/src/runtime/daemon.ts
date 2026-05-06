import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

import { getLogFilePath } from "./paths.js";

export function spawnDaemon(projectRoot: string): number {
  const entrypoint = path.resolve(process.argv[1]);
  const logPath = getLogFilePath(projectRoot);

  const logFd = fs.openSync(logPath, "a");

  const child = spawn(process.execPath, [entrypoint, "internal:watch", "--project-root", projectRoot], {
    cwd: projectRoot,
    detached: true,
    stdio: ["ignore", logFd, logFd]
  });

  child.unref();

  fs.closeSync(logFd);

  if (!child.pid) {
    throw new Error("Failed to start background daemon process.");
  }

  return child.pid;
}
