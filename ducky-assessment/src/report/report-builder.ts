import fs from "node:fs/promises";
import path from "node:path";

import type { SessionState } from "../types/session.js";
import type { TrackingState } from "../types/tracking.js";

export interface DuckyReport {
  metadata: {
    sessionStartTime: string;
    sessionEndTime: string;
    durationMs: number;
    durationSeconds: number;
    projectDirectory: string;
  };
  tracking: {
    lifecycle: {
      stopReason: "stopped_by_user" | "already_stopped";
      finalDaemonPid: number;
      lastHeartbeatAt: string;
    };
    signals: {
      process: {
        samples: number;
        uniqueAiProcessMatches: string[];
      };
      files: {
        samples: number;
        maxFilesModifiedSinceStart: number;
        trackedFileScanMax: number;
      };
      git: {
        samples: number;
        isGitRepository: boolean;
        branch: string | null;
        maxChangedFiles: number | null;
      };
    };
    metrics: {
      aiProcessHitRate: number;
      fileModificationIntensity: number;
      avgChangedFilesInWorkspace: number | null;
    };
  };
}

export function buildReport(
  session: SessionState,
  tracking: TrackingState | null,
  sessionEndTime: Date,
  stopReason: "stopped_by_user" | "already_stopped"
): DuckyReport {
  const endIso = sessionEndTime.toISOString();
  const durationMs = Math.max(0, sessionEndTime.getTime() - new Date(session.startedAt).getTime());

  const processSamples = tracking?.processSamples ?? [];
  const fileSamples = tracking?.fileSamples ?? [];
  const gitSamples = tracking?.gitSamples ?? [];

  const aiMatches = new Set<string>();
  for (const sample of processSamples) {
    for (const match of sample.aiProcessMatches) {
      aiMatches.add(match);
    }
  }

  const processHits = processSamples.filter((sample) => sample.aiProcessMatches.length > 0).length;
  const aiProcessHitRate = processSamples.length > 0 ? Number((processHits / processSamples.length).toFixed(3)) : 0;

  const maxFilesModifiedSinceStart = maxNumber(fileSamples.map((sample) => sample.filesModifiedSinceStart), 0);
  const trackedFileScanMax = maxNumber(fileSamples.map((sample) => sample.trackedFileCount), 0);
  const fileModificationIntensity =
    trackedFileScanMax > 0 ? Number((maxFilesModifiedSinceStart / trackedFileScanMax).toFixed(3)) : 0;

  const latestGit = gitSamples.length > 0 ? gitSamples[gitSamples.length - 1] : null;
  const gitChangedCounts = gitSamples
    .map((sample) => sample.changedFiles)
    .filter((count): count is number => typeof count === "number");
  const maxChangedFiles = gitChangedCounts.length > 0 ? maxNumber(gitChangedCounts, 0) : null;
  const avgChangedFilesInWorkspace =
    gitChangedCounts.length > 0
      ? Number((gitChangedCounts.reduce((sum, value) => sum + value, 0) / gitChangedCounts.length).toFixed(2))
      : null;

  return {
    metadata: {
      sessionStartTime: session.startedAt,
      sessionEndTime: endIso,
      durationMs,
      durationSeconds: Number((durationMs / 1000).toFixed(2)),
      projectDirectory: session.projectRoot
    },
    tracking: {
      lifecycle: {
        stopReason,
        finalDaemonPid: session.pid,
        lastHeartbeatAt: session.lastHeartbeatAt
      },
      signals: {
        process: {
          samples: processSamples.length,
          uniqueAiProcessMatches: Array.from(aiMatches).sort()
        },
        files: {
          samples: fileSamples.length,
          maxFilesModifiedSinceStart,
          trackedFileScanMax
        },
        git: {
          samples: gitSamples.length,
          isGitRepository: latestGit?.isGitRepository ?? false,
          branch: latestGit?.branch ?? null,
          maxChangedFiles
        }
      },
      metrics: {
        aiProcessHitRate,
        fileModificationIntensity,
        avgChangedFilesInWorkspace
      }
    }
  };
}

function maxNumber(values: number[], fallback: number): number {
  if (values.length === 0) {
    return fallback;
  }

  return values.reduce((max, value) => (value > max ? value : max), values[0] ?? fallback);
}

export async function writeReport(projectRoot: string, report: DuckyReport): Promise<string> {
  const reportPath = path.join(projectRoot, "ducky-report.json");
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return reportPath;
}
