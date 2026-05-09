export interface ProcessSample {
  timestamp: string;
  totalProcesses: number;
  aiProcessMatches: string[];
}
//this is a test change
export interface FileSample {
  timestamp: string;
  trackedFileCount: number;
  filesModifiedSinceStart: number;
  extensionTouchCounts: Record<string, number>;
  extensionSequence: string[];
}

export interface GitSample {
  timestamp: string;
  isGitRepository: boolean;
  branch: string | null;
  commitCount: number | null;
  changedFiles: number | null;
}

export interface TrackingState {
  version: number;
  sessionId: string;
  projectRoot: string;
  startedAt: string;
  processSamples: ProcessSample[];
  fileSamples: FileSample[];
  gitSamples: GitSample[];
}
