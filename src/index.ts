#!/usr/bin/env node

import { program } from "commander";
import chalk from "chalk";
import { loadCredentials, isTokenExpired, getTokenExpiresIn } from "./credentials.js";
import { fetchUsage } from "./api.js";
import { displayUsage, displayJson } from "./display.js";

program
  .name("cc-usage")
  .description("Check Claude Code subscription usage")
  .version("1.0.0")
  .option("-j, --json", "Output raw JSON")
  .option("-w, --watch [seconds]", "Auto-refresh (default: 30s)", parseFloat)
  .option("-q, --quiet", "Only show usage percentages")
  .action(async (options) => {
    try {
      await run(options);
    } catch (error) {
      console.error(chalk.red("Error:"), (error as Error).message);
      process.exit(1);
    }
  });

interface Options {
  json?: boolean;
  watch?: number | boolean;
  quiet?: boolean;
}

async function run(options: Options): Promise<void> {
  // Load credentials
  const credentials = await loadCredentials();

  if (!credentials.claudeAiOauth) {
    throw new Error(
      "No OAuth credentials found.\n" +
        "Please run Claude Code and login with /login first."
    );
  }

  const oauth = credentials.claudeAiOauth;

  // Check token expiry
  if (isTokenExpired(oauth)) {
    throw new Error(
      "Your OAuth token has expired.\n" +
        "Please run /login in Claude Code to refresh your credentials."
    );
  }

  // Warn if token expires soon
  const expiresIn = getTokenExpiresIn(oauth);
  if (!options.json && !options.quiet) {
    const expiryMs = oauth.expiresAt - Date.now();
    if (expiryMs < 24 * 60 * 60 * 1000) {
      console.log(chalk.yellow(`⚠ Token expires in ${expiresIn}`));
    }
  }

  // Watch mode
  if (options.watch) {
    const interval = typeof options.watch === "number" ? options.watch : 30;
    await watchMode(oauth.accessToken, oauth, options, interval);
    return;
  }

  // Single fetch
  const usage = await fetchUsage(oauth.accessToken);

  if (options.json) {
    displayJson(usage);
  } else {
    displayUsage(usage, oauth);
  }
}

async function watchMode(
  token: string,
  oauth: { subscriptionType?: string },
  options: Options,
  intervalSeconds: number
): Promise<void> {
  const fetch = async () => {
    try {
      // Clear screen
      console.clear();

      const usage = await fetchUsage(token);

      if (options.json) {
        displayJson(usage);
      } else {
        displayUsage(usage, oauth as any);
        console.log(
          chalk.gray(`Refreshing every ${intervalSeconds}s. Press Ctrl+C to exit.`)
        );
      }
    } catch (error) {
      console.error(chalk.red("Error:"), (error as Error).message);
    }
  };

  // Initial fetch
  await fetch();

  // Set up interval
  setInterval(fetch, intervalSeconds * 1000);

  // Keep process alive
  process.stdin.resume();
}

program.parse();
