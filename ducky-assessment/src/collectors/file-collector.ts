import fs from "node:fs/promises";
import path from "node:path";
import type { Dirent } from "node:fs";

import type { FileSample } from "../types/tracking.js";

const MAX_TRACKED_FILES = 2_000;
const IGNORE_DIRS = new Set([".git", "node_modules", ".ducky", "dist"]);

export async function collectFileSample(projectRoot: string, startedAt: string): Promise<FileSample> {
  const startedAtMs = new Date(startedAt).getTime();
  let scanned = 0;
  let modifiedSinceStart = 0;

  const queue: string[] = [projectRoot];

  while (queue.length > 0 && scanned < MAX_TRACKED_FILES) {
    const current = queue.shift();
    if (!current) {
      continue;
    }

    let entries: Dirent[] = [];
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!IGNORE_DIRS.has(entry.name)) {
          queue.push(path.join(current, entry.name));
        }
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      const filePath = path.join(current, entry.name);
      scanned += 1;

      try {
        const stat = await fs.stat(filePath);
        if (stat.mtimeMs >= startedAtMs) {
          modifiedSinceStart += 1;
        }
      } catch {
        // Ignore files that disappear during scan.
      }

      if (scanned >= MAX_TRACKED_FILES) {
        break;
      }
    }
  }

  return {
    timestamp: new Date().toISOString(),
    trackedFileCount: scanned,
    filesModifiedSinceStart: modifiedSinceStart
  };
}
