import { execFile } from "node:child_process";
import { promisify } from "node:util";

import type { GitSample } from "../types/tracking.js";

const execFileAsync = promisify(execFile);

export async function collectGitSample(projectRoot: string): Promise<GitSample> {
  const timestamp = new Date().toISOString();

  const isRepo = await isGitRepository(projectRoot);

  if (!isRepo) {
    return {
      timestamp,
      isGitRepository: false,
      branch: null,
      commitCount: null,
      changedFiles: null
    };
  }

  const [branch, commitCount, changedFiles] = await Promise.all([
    getCurrentBranch(projectRoot),
    getCommitCount(projectRoot),
    getChangedFileCount(projectRoot)
  ]);

  return {
    timestamp,
    isGitRepository: true,
    branch,
    commitCount,
    changedFiles
  };
}

async function isGitRepository(projectRoot: string): Promise<boolean> {
  try {
    const { stdout } = await runGit(projectRoot, ["rev-parse", "--is-inside-work-tree"]);
    return stdout.trim() === "true";
  } catch {
    return false;
  }
}

async function getCurrentBranch(projectRoot: string): Promise<string | null> {
  try {
    const { stdout } = await runGit(projectRoot, ["branch", "--show-current"]);
    const branch = stdout.trim();
    return branch.length > 0 ? branch : null;
  } catch {
    return null;
  }
}

async function getCommitCount(projectRoot: string): Promise<number | null> {
  try {
    const { stdout } = await runGit(projectRoot, ["rev-list", "--count", "HEAD"]);
    const parsed = Number.parseInt(stdout.trim(), 10);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function getChangedFileCount(projectRoot: string): Promise<number | null> {
  try {
    const { stdout } = await runGit(projectRoot, ["status", "--porcelain"]);
    const count = stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0).length;
    return count;
  } catch {
    return null;
  }
}

function runGit(projectRoot: string, args: string[]): Promise<{ stdout: string; stderr: string }> {
  return execFileAsync("git", args, { cwd: projectRoot, windowsHide: true });
}
