import { createInitialSession, ensureDuckyDir, readSession, writeSession } from "../runtime/session-store.js";
import { isProcessAlive } from "../runtime/process.js";
import { spawnDaemon } from "../runtime/daemon.js";

export async function runStartCommand(projectRoot: string): Promise<void> {
  await ensureDuckyDir(projectRoot);

  const existing = await readSession(projectRoot);

  if (existing && isProcessAlive(existing.pid)) {
    console.log(`Tracking is already active for this project (pid: ${existing.pid}).`);
    return;
  }

  const pid = spawnDaemon(projectRoot);
  const session = createInitialSession(projectRoot, pid);

  await writeSession(projectRoot, session);

  console.log(`Tracking started for ${projectRoot}`);
  console.log(`Background daemon pid: ${pid}`);
  console.log("Session data is stored in .ducky/session.json");
}
