import { readFile } from "fs/promises";
import { homedir } from "os";
import { join } from "path";
import { z } from "zod";

const OAuthSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresAt: z.number(),
  scopes: z.array(z.string()),
  subscriptionType: z.string().optional(),
  rateLimitTier: z.string().optional(),
});

const CredentialsSchema = z.object({
  claudeAiOauth: OAuthSchema.optional(),
});

export type Credentials = z.infer<typeof CredentialsSchema>;
export type OAuth = z.infer<typeof OAuthSchema>;

export async function getCredentialsPath(): Promise<string> {
  return join(homedir(), ".claude", ".credentials.json");
}

export async function loadCredentials(): Promise<Credentials> {
  const path = await getCredentialsPath();

  try {
    const content = await readFile(path, "utf-8");
    const data = JSON.parse(content);
    return CredentialsSchema.parse(data);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(
        `Credentials file not found at ${path}\n` +
          "Please run Claude Code and login with /login first."
      );
    }
    throw error;
  }
}

export function isTokenExpired(oauth: OAuth): boolean {
  return Date.now() > oauth.expiresAt;
}

export function getTokenExpiresIn(oauth: OAuth): string {
  const diff = oauth.expiresAt - Date.now();
  if (diff <= 0) return "expired";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
}
