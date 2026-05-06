#!/usr/bin/env node

import { Command } from "commander";

import { runStartCommand } from "./commands/start.js";
import { runStopCommand } from "./commands/stop.js";
import { runInternalWatchCommand } from "./commands/internal-watch.js";

const program = new Command();

const currentDirectory = process.cwd();

program
  .name("ducky")
  .description("AI usage tracker CLI")
  .version("1.0.0");

program
  .command("start")
  .description("Begin tracking AI usage in the current project")
  .action(async () => {
    await runStartCommand(currentDirectory);
  });

program
  .command("stop")
  .description("Stop active tracking and generate a report")
  .action(async () => {
    await runStopCommand(currentDirectory);
  });

program
  .command("internal:watch")
  .description("Internal daemon command")
  .option("--project-root <projectRoot>", "Project root path")
  .action(async (options: { projectRoot?: string }) => {
    if (!options.projectRoot) {
      throw new Error("Missing --project-root for internal watch command.");
    }

    await runInternalWatchCommand(options.projectRoot);
  });

program.parseAsync().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unexpected error";
  console.error(`ducky failed: ${message}`);
  process.exitCode = 1;
});
