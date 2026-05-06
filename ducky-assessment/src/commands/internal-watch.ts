import { collectAllSignals } from "../collectors/index.js";
import { readSession, writeSession } from "../runtime/session-store.js";
import { readTrackingState, writeTrackingState } from "../runtime/tracking-store.js";

const HEARTBEAT_INTERVAL_MS = 5_000;
const STARTUP_GRACE_MS = 3_000;

export async function runInternalWatchCommand(projectRoot: string): Promise<void> {
  const startedAt = Date.now();

  const tick = async (): Promise<void> => {
    const session = await readSession(projectRoot);

    if (!session || session.pid !== process.pid) {
      if (Date.now() - startedAt < STARTUP_GRACE_MS) {
        return;
      }

      process.exit(0);
      return;
    }

    session.lastHeartbeatAt = new Date().toISOString();
    await writeSession(projectRoot, session);

    const tracking = await readTrackingState(projectRoot);
    if (!tracking) {
      if (Date.now() - startedAt < STARTUP_GRACE_MS) {
        return;
      }

      process.exit(0);
      return;
    }

    if (tracking.sessionId !== session.sessionId) {
      process.exit(0);
      return;
    }

    const updated = await collectAllSignals(tracking);
    await writeTrackingState(projectRoot, updated);
  };

  await safeTick(tick);

  setInterval(() => {
    void safeTick(tick);
  }, HEARTBEAT_INTERVAL_MS);

  process.on("SIGTERM", () => {
    const uptimeMs = Date.now() - startedAt;
    console.log(`ducky daemon exiting (uptimeMs=${uptimeMs})`);
    process.exit(0);
  });
}

async function safeTick(tick: () => Promise<void>): Promise<void> {
  try {
    await tick();
  } catch {
    // Ignore collector errors to keep daemon passive and resilient.
  }
}
