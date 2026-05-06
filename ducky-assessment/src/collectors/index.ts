import { collectFileSample } from "./file-collector.js";
import { collectGitSample } from "./git-collector.js";
import { collectProcessSample } from "./process-collector.js";
import type { TrackingState } from "../types/tracking.js";

export async function collectAllSignals(state: TrackingState): Promise<TrackingState> {
  const [processSample, fileSample, gitSample] = await Promise.all([
    collectProcessSample(),
    collectFileSample(state.projectRoot, state.startedAt),
    collectGitSample(state.projectRoot)
  ]);

  return {
    ...state,
    processSamples: [...state.processSamples, processSample],
    fileSamples: [...state.fileSamples, fileSample],
    gitSamples: [...state.gitSamples, gitSample]
  };
}
