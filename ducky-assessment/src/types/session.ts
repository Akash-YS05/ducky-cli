export interface SessionState {
  version: number;
  sessionId: string;
  projectRoot: string;
  pid: number;
  startedAt: string;
  lastHeartbeatAt: string;
}
