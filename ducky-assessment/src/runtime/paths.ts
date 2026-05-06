import path from "node:path";

export const DUCKY_DIR_NAME = ".ducky";
export const SESSION_FILE_NAME = "session.json";
export const LOG_FILE_NAME = "daemon.log";

export function getDuckyDir(projectRoot: string): string {
  return path.join(projectRoot, DUCKY_DIR_NAME);
}

export function getSessionFilePath(projectRoot: string): string {
  return path.join(getDuckyDir(projectRoot), SESSION_FILE_NAME);
}

export function getLogFilePath(projectRoot: string): string {
  return path.join(getDuckyDir(projectRoot), LOG_FILE_NAME);
}
