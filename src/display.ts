import chalk from "chalk";
import type { UsageResponse, UsageBucket } from "./api.js";
import type { OAuth } from "./credentials.js";

function progressBar(percent: number, width: number = 20): string {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;

  // Color based on usage level
  let color: (s: string) => string;
  if (percent < 50) {
    color = chalk.green;
  } else if (percent < 80) {
    color = chalk.yellow;
  } else {
    color = chalk.red;
  }

  const bar = color("█".repeat(filled)) + chalk.gray("░".repeat(empty));
  return bar;
}

function formatTimeUntil(isoDate: string): string {
  const resetTime = new Date(isoDate).getTime();
  const now = Date.now();
  const diff = resetTime - now;

  if (diff <= 0) return "now";

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  return `${minutes}m`;
}

function formatBucket(
  label: string,
  bucket: UsageBucket,
  labelWidth: number = 16
): string | null {
  if (!bucket) return null;

  const paddedLabel = label.padEnd(labelWidth);
  const bar = progressBar(bucket.utilization);
  const percent = `${Math.round(bucket.utilization)}%`.padStart(4);
  const resetIn = formatTimeUntil(bucket.resets_at);

  return `${chalk.cyan(paddedLabel)} ${bar} ${percent}  ${chalk.gray(`resets in ${resetIn}`)}`;
}

export function displayUsage(usage: UsageResponse, oauth?: OAuth): void {
  // Header
  const planType = oauth?.subscriptionType || "unknown";
  console.log();
  console.log(
    chalk.bold(`Claude Code Usage`) +
      chalk.gray(` (${planType} plan)`)
  );
  console.log(chalk.gray("━".repeat(50)));

  // Main usage buckets
  const buckets: [string, UsageBucket][] = [
    ["5-Hour Quota", usage.five_hour],
    ["7-Day Overall", usage.seven_day],
    ["7-Day Sonnet", usage.seven_day_sonnet],
    ["7-Day Opus", usage.seven_day_opus],
    ["7-Day OAuth Apps", usage.seven_day_oauth_apps],
    ["7-Day Cowork", usage.seven_day_cowork],
  ];

  for (const [label, bucket] of buckets) {
    const line = formatBucket(label, bucket);
    if (line) console.log(line);
  }

  // Extra usage (if enabled)
  if (usage.extra_usage.is_enabled) {
    console.log();
    console.log(chalk.bold("Extra Usage"));
    console.log(chalk.gray("─".repeat(50)));

    const { monthly_limit, used_credits, utilization } = usage.extra_usage;
    if (utilization !== null) {
      const bar = progressBar(utilization);
      console.log(
        `${chalk.cyan("Monthly".padEnd(16))} ${bar} ${Math.round(utilization)}%`
      );
    }
    if (monthly_limit !== null && used_credits !== null) {
      console.log(
        chalk.gray(`  Used: $${(used_credits / 100).toFixed(2)} / $${(monthly_limit / 100).toFixed(2)}`)
      );
    }
  }

  console.log();
}

export function displayJson(usage: UsageResponse): void {
  console.log(JSON.stringify(usage, null, 2));
}
