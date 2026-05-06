import { readSession, writeSession } from "../runtime/session-store.js";

const HEARTBEAT_INTERVAL_MS = 5_000;

export async function runInternalWatchCommand(projectRoot: string): Promise<void> {
  const tick = async (): Promise<void> => {
    const session = await readSession(projectRoot);

    if (!session || session.pid !== process.pid) {
      process.exit(0);
      return;
    }

    session.lastHeartbeatAt = new Date().toISOString();
    await writeSession(projectRoot, session);
  };

  await tick();

  setInterval(() => {
    void tick();
  }, HEARTBEAT_INTERVAL_MS);
}
