import { createInitialSession, ensureDuckyDir, readSession, writeSession } from "../runtime/session-store.js";
import { isProcessAlive, terminateProcess } from "../runtime/process.js";
import { spawnDaemon } from "../runtime/daemon.js";
import { initTrackingState } from "../runtime/tracking-store.js";

const STALE_HEARTBEAT_MS = 30_000;
const SHUTDOWN_WAIT_MS = 1_000;
const SHUTDOWN_POLL_MS = 100;
export const DUCKY_ASCII_ART = [
  `
    ██████╗ ██╗   ██╗ ██████╗██╗  ██╗██╗   ██╗    
    ██╔══██╗██║   ██║██╔════╝██║ ██╔╝╚██╗ ██╔╝    
    ██║  ██║██║   ██║██║     █████╔╝  ╚████╔╝     
    ██║  ██║██║   ██║██║     ██╔═██╗   ╚██╔╝      
    ██████╔╝╚██████╔╝╚██████╗██║  ██╗   ██║       
    ╚═════╝  ╚═════╝  ╚═════╝╚═╝  ╚═╝   ╚═╝       
                                             
  `
].join("\n");

export async function runStartCommand(projectRoot: string): Promise<void> {
  await ensureDuckyDir(projectRoot);

  const existing = await readSession(projectRoot);

  if (existing) {
    const alive = isProcessAlive(existing.pid);

    if (!alive) {
      console.log(`Found stale session state (dead pid: ${existing.pid}). Recovering state...`);
    }

    if (alive) {
      const heartbeatAgeMs = Date.now() - new Date(existing.lastHeartbeatAt).getTime();
      if (heartbeatAgeMs > STALE_HEARTBEAT_MS) {
        console.log(
          `Found stale active session (pid: ${existing.pid}, heartbeat age: ${Math.round(heartbeatAgeMs / 1000)}s). Attempting recovery...`
        );

        try {
          terminateProcess(existing.pid);
          await waitForExit(existing.pid, SHUTDOWN_WAIT_MS);
        } catch {
          // If process cannot be terminated here, continue and attempt a clean restart.
        }
      } else {
        console.log(`Tracking is already active for this project (pid: ${existing.pid}).`);
        return;
      }
    }
  }

  const pid = spawnDaemon(projectRoot);
  const session = createInitialSession(projectRoot, pid);

  await initTrackingState(projectRoot, session.sessionId, session.startedAt);
  await writeSession(projectRoot, session);

  console.log("Tracking started.");
  console.log(`Project: ${projectRoot}`);
  console.log(`Daemon pid: ${pid}`);
  console.log("State files: .ducky/session.json, .ducky/tracking.json");
}

async function waitForExit(pid: number, timeoutMs: number): Promise<void> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (!isProcessAlive(pid)) {
      return;
    }

    await sleep(SHUTDOWN_POLL_MS);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
