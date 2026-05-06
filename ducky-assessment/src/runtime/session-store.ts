import fs from "node:fs/promises";
import { constants as fsConstants } from "node:fs";

import { getDuckyDir, getSessionFilePath } from "./paths.js";
import type { SessionState } from "../types/session.js";

const SESSION_VERSION = 1;

export async function ensureDuckyDir(projectRoot: string): Promise<void> {
  await fs.mkdir(getDuckyDir(projectRoot), { recursive: true });
}

export async function readSession(projectRoot: string): Promise<SessionState | null> {
  const sessionFile = getSessionFilePath(projectRoot);

  try {
    await fs.access(sessionFile, fsConstants.F_OK);
  } catch {
    return null;
  }

  const raw = await fs.readFile(sessionFile, "utf8");
  const data = JSON.parse(raw) as SessionState;

  if (!data || data.version !== SESSION_VERSION) {
    return null;
  }

  return data;
}

export async function writeSession(projectRoot: string, state: SessionState): Promise<void> {
  await ensureDuckyDir(projectRoot);

  const sessionFile = getSessionFilePath(projectRoot);
  await fs.writeFile(sessionFile, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

export async function clearSession(projectRoot: string): Promise<void> {
  const sessionFile = getSessionFilePath(projectRoot);

  try {
    await fs.unlink(sessionFile);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}

export function createInitialSession(projectRoot: string, pid: number, now = new Date()): SessionState {
  const timestamp = now.toISOString();

  return {
    version: SESSION_VERSION,
    projectRoot,
    pid,
    startedAt: timestamp,
    lastHeartbeatAt: timestamp
  };
}
