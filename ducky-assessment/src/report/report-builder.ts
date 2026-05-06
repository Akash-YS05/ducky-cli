import fs from "node:fs/promises";
import path from "node:path";

import type { SessionState } from "../types/session.js";

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
    signals: Record<string, never>;
    metrics: Record<string, never>;
  };
}

export function buildReport(
  session: SessionState,
  sessionEndTime: Date,
  stopReason: "stopped_by_user" | "already_stopped"
): DuckyReport {
  const endIso = sessionEndTime.toISOString();
  const durationMs = Math.max(0, sessionEndTime.getTime() - new Date(session.startedAt).getTime());

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
      signals: {},
      metrics: {}
    }
  };
}

export async function writeReport(projectRoot: string, report: DuckyReport): Promise<string> {
  const reportPath = path.join(projectRoot, "ducky-report.json");
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return reportPath;
}
