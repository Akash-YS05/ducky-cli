import fs from "node:fs/promises";
import { constants as fsConstants } from "node:fs";

import { ensureDuckyDir } from "./session-store.js";
import { getTrackingFilePath } from "./paths.js";
import type { TrackingState } from "../types/tracking.js";

const TRACKING_VERSION = 1;

export async function initTrackingState(projectRoot: string, startedAt: string): Promise<TrackingState> {
  const initial: TrackingState = {
    version: TRACKING_VERSION,
    projectRoot,
    startedAt,
    processSamples: [],
    fileSamples: [],
    gitSamples: []
  };

  await writeTrackingState(projectRoot, initial);
  return initial;
}

export async function readTrackingState(projectRoot: string): Promise<TrackingState | null> {
  const file = getTrackingFilePath(projectRoot);

  try {
    await fs.access(file, fsConstants.F_OK);
  } catch {
    return null;
  }

  const raw = await fs.readFile(file, "utf8");
  const data = JSON.parse(raw) as TrackingState;

  if (!data || data.version !== TRACKING_VERSION) {
    return null;
  }

  return data;
}

export async function writeTrackingState(projectRoot: string, state: TrackingState): Promise<void> {
  await ensureDuckyDir(projectRoot);
  const file = getTrackingFilePath(projectRoot);
  await fs.writeFile(file, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}
