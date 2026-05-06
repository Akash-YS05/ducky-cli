export interface ProcessSample {
  timestamp: string;
  totalProcesses: number;
  aiProcessMatches: string[];
}

export interface FileSample {
  timestamp: string;
  trackedFileCount: number;
  filesModifiedSinceStart: number;
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
  projectRoot: string;
  startedAt: string;
  processSamples: ProcessSample[];
  fileSamples: FileSample[];
  gitSamples: GitSample[];
}
