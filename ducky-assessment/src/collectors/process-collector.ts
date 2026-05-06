import { execFile } from "node:child_process";
import { promisify } from "node:util";

import type { ProcessSample } from "../types/tracking.js";

const execFileAsync = promisify(execFile);

const AI_PROCESS_HINTS = [
  "code",
  "cursor",
  "copilot",
  "claude",
  "chatgpt",
  "windsurf",
  "aider",
  "tabnine",
  "continue"
];

export async function collectProcessSample(): Promise<ProcessSample> {
  const processNames = await listProcessNames();
  const lowerNames = processNames.map((name) => name.toLowerCase());

  const matches = lowerNames.filter((name) => AI_PROCESS_HINTS.some((hint) => name.includes(hint)));
  const uniqueMatches = Array.from(new Set(matches)).sort();

  return {
    timestamp: new Date().toISOString(),
    totalProcesses: processNames.length,
    aiProcessMatches: uniqueMatches
  };
}

async function listProcessNames(): Promise<string[]> {
  if (process.platform === "win32") {
    const { stdout } = await execFileAsync("tasklist", ["/FO", "CSV", "/NH"]);
    return parseWindowsTasklist(stdout);
  }

  const { stdout } = await execFileAsync("ps", ["-A", "-o", "comm="]);
  return stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function parseWindowsTasklist(output: string): string[] {
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      if (!line.startsWith("\"")) {
        return line;
      }

      const endQuote = line.indexOf("\"", 1);
      if (endQuote === -1) {
        return line;
      }

      return line.slice(1, endQuote);
    });
}
