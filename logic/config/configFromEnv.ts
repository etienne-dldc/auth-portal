import type { TFlatAppConfig } from "./type.ts";

export function configFromEnv(): TFlatAppConfig {
  return {
    port: parseIntEnv("PORT"),
    origin: Deno.env.get("ORIGIN"),
    configPath: Deno.env.get("CONFIG_PATH"),
    databasePath: Deno.env.get("DATABASE_PATH"),
    secureCookies: parseFlag("SECURE_COOKIES"),
    otelDenoEnabled: parseFlag("OTEL_DENO"),
    "session.cookieName": Deno.env.get("SESSION_COOKIE_NAME"),
    "session.sessionDurationSeconds": parseIntEnv(
      "SESSION_SESSION_DURATION_SECONDS",
    ),
    "oauth.discord.clientId": Deno.env.get("OAUTH_DISCORD_CLIENT_ID"),
    "oauth.discord.clientSecret": Deno.env.get("OAUTH_DISCORD_CLIENT_SECRET"),
    "oauth.discord.enabled": parseFlag("OAUTH_DISCORD_ENABLED"),
    "oauth.github.clientId": Deno.env.get("OAUTH_GITHUB_CLIENT_ID"),
    "oauth.github.clientSecret": Deno.env.get("OAUTH_GITHUB_CLIENT_SECRET"),
    "oauth.github.enabled": parseFlag("OAUTH_GITHUB_ENABLED"),
    "oauth.google.clientId": Deno.env.get("OAUTH_GOOGLE_CLIENT_ID"),
    "oauth.google.clientSecret": Deno.env.get("OAUTH_GOOGLE_CLIENT_SECRET"),
    "oauth.google.enabled": parseFlag("OAUTH_GOOGLE_ENABLED"),
    "oauth.cookieName": Deno.env.get("OAUTH_SESSION_KEY_COOKIE_NAME"),
    "oauth.sessionDurationSeconds": parseIntEnv(
      "OAUTH_SESSION_DURATION_SECONDS",
    ),
    "sso.tokenName": Deno.env.get("SSO_TOKEN_NAME"),
    "sso.sessionDurationSeconds": parseIntEnv("SSO_SESSION_DURATION_SECONDS"),
  };
}

function parseFlag(name: string): boolean | undefined {
  const raw = Deno.env.get(name);
  if (!raw) {
    return undefined;
  }
  const normalized = raw.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }
  console.error(
    `[env] Invalid ${name}=${JSON.stringify(raw)}, ignoring CLI value`,
  );
  return undefined;
}

function parseIntEnv(name: string): number | undefined {
  const raw = Deno.env.get(name);
  if (!raw) {
    return undefined;
  }
  const parsed = parseInt(raw, 10);
  if (isNaN(parsed)) {
    console.error(
      `[env] Invalid ${name}=${JSON.stringify(raw)}, ignoring CLI value`,
    );
    return undefined;
  }
  return parsed;
}
