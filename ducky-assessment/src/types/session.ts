export interface SessionState {
  version: number;
  projectRoot: string;
  pid: number;
  startedAt: string;
  lastHeartbeatAt: string;
}
