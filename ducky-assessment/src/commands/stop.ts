import { buildReport, writeReport } from "../report/report-builder.js";
import { isProcessAlive, terminateProcess } from "../runtime/process.js";
import { clearSession, readSession } from "../runtime/session-store.js";
import { clearTrackingState, readTrackingState } from "../runtime/tracking-store.js";

const SHUTDOWN_GRACE_MS = 2_000;
const SHUTDOWN_POLL_INTERVAL_MS = 100;

export async function runStopCommand(projectRoot: string): Promise<void> {
  const session = await readSession(projectRoot);

  if (!session) {
    console.log("No active tracking session found in this project.");
    return;
  }

  const wasAlive = isProcessAlive(session.pid);

  if (wasAlive) {
    try {
      terminateProcess(session.pid);
    } catch {
      // Ignore kill failures and continue cleanup/reporting.
    }

    await waitForExit(session.pid, SHUTDOWN_GRACE_MS);
  }

  const tracking = await readTrackingState(projectRoot);
  const report = buildReport(session, tracking, new Date(), wasAlive ? "stopped_by_user" : "already_stopped");
  const reportPath = await writeReport(projectRoot, report);

  await Promise.all([clearSession(projectRoot), clearTrackingState(projectRoot)]);

  console.log("Tracking stopped.");
  console.log(`Report written to ${reportPath}`);
  console.log(
    `Signal samples: process=${report.tracking.signals.process.samples}, files=${report.tracking.signals.files.samples}, git=${report.tracking.signals.git.samples}`
  );
  console.log(
    `Session duration: ${report.metadata.durationSeconds}s (start: ${report.metadata.sessionStartTime}, end: ${report.metadata.sessionEndTime})`
  );
  console.log(`Daemon status at stop: ${wasAlive ? "running and terminated" : "already not running"}`);
}

async function waitForExit(pid: number, timeoutMs: number): Promise<void> {
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    if (!isProcessAlive(pid)) {
      return;
    }

    await sleep(SHUTDOWN_POLL_INTERVAL_MS);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
