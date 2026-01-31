import { z } from "zod";

const UsageBucketSchema = z
  .object({
    utilization: z.number(),
    resets_at: z.string(),
  })
  .nullable();

const ExtraUsageSchema = z.object({
  is_enabled: z.boolean(),
  monthly_limit: z.number().nullable(),
  used_credits: z.number().nullable(),
  utilization: z.number().nullable(),
});

export const UsageResponseSchema = z.object({
  five_hour: UsageBucketSchema,
  seven_day: UsageBucketSchema,
  seven_day_oauth_apps: UsageBucketSchema,
  seven_day_opus: UsageBucketSchema,
  seven_day_sonnet: UsageBucketSchema,
  seven_day_cowork: UsageBucketSchema,
  iguana_necktie: UsageBucketSchema,
  extra_usage: ExtraUsageSchema,
});

export type UsageResponse = z.infer<typeof UsageResponseSchema>;
export type UsageBucket = z.infer<typeof UsageBucketSchema>;

const API_BASE = "https://api.anthropic.com";
const USAGE_ENDPOINT = "/api/oauth/usage";

export async function fetchUsage(accessToken: string): Promise<UsageResponse> {
  const response = await fetch(`${API_BASE}${USAGE_ENDPOINT}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "anthropic-beta": "oauth-2025-04-20",
      "Content-Type": "application/json",
      "User-Agent": "cc-sub-usage/1.0.0",
      Accept: "application/json, text/plain, */*",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    if (response.status === 401) {
      throw new Error(
        "Authentication failed. Your token may be expired.\n" +
          "Run /login in Claude Code to refresh your credentials."
      );
    }
    throw new Error(`API request failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  return UsageResponseSchema.parse(data);
}
