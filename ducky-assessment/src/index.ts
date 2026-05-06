#!/usr/bin/env node

import { Command } from "commander";

const program = new Command();

program
  .name("ducky")
  .description("AI usage tracker CLI")
  .version("1.0.0");

program
  .command("start")
  .description("Begin tracking AI usage in the current project")
  .action(() => {
    console.log("Tracking bootstrap is ready. Start command wiring will be implemented next.");
  });

program
  .command("stop")
  .description("Stop active tracking and generate a report")
  .action(() => {
    console.log("Tracking bootstrap is ready. Stop command wiring will be implemented next.");
  });

program.parse();
