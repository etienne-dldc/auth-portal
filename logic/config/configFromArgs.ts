import { parseArgs } from "@std/cli/parse-args";
import type { TFlatAppConfig } from "./type.ts";

export function configFromArgs(args: string[]): TFlatAppConfig {
  const parsed = parseArgs(args, {
    string: [
      "port",
      "origin",
      "config-path",
      "database-path",
      "auth-cookie",
      "sso-token-name",
      "oauth.discord.client-id",
      "oauth.discord.client-secret",
      "oauth.github.client-id",
      "oauth.github.client-secret",
      "oauth.google.client-id",
      "oauth.google.client-secret",
      "oauth.session-duration-seconds",
      "oauth.cookie.name",
      "oauth.cookie.max-age",
    ],
    boolean: [
      "oauth.discord.enabled",
      "oauth.github.enabled",
      "oauth.google.enabled",
    ],
    alias: {
      c: "config-path",
      p: "port",
    },
    negatable: [
      "oauth.discord.enabled",
      "oauth.github.enabled",
      "oauth.google.enabled",
    ],
    default: {
      "oauth.discord.enabled": undefined,
      "oauth.github.enabled": undefined,
      "oauth.google.enabled": undefined,
    },
  });

  return {
    port: parseNumber(parsed.port, "port"),
    origin: parsed.origin,
    configPath: parsed["config-path"],
    databasePath: parsed["database-path"],
    ssoTokenName: parsed["sso-token-name"],
    "oauth.discord.clientId": parsed.oauth?.discord?.["client-id"],
    "oauth.discord.clientSecret": parsed.oauth?.discord?.["client-secret"],
    "oauth.discord.enabled": parsed.oauth?.discord?.enabled,
    "oauth.github.clientId": parsed.oauth?.github?.["client-id"],
    "oauth.github.clientSecret": parsed.oauth?.github?.["client-secret"],
    "oauth.github.enabled": parsed.oauth?.github?.enabled,
    "oauth.google.clientId": parsed.oauth?.google?.["client-id"],
    "oauth.google.clientSecret": parsed.oauth?.google?.["client-secret"],
    "oauth.google.enabled": parsed.oauth?.google?.enabled,
    "oauth.cookie.name": parsed.oauth?.cookie?.name,
    "oauth.cookie.maxAge": parseNumber(
      parsed.oauth?.cookie?.["max-age"],
      "oauth.cookie.max-age",
    ),
    "oauth.sessionDurationSeconds": parseNumber(
      parsed.oauth?.["session-duration-seconds"],
      "oauth.session-duration-seconds",
    ),
  };
}

function parseNumber(
  value: string | undefined,
  name: string,
): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    console.error(
      `[args] Invalid number for ${name}: ${
        JSON.stringify(value)
      }, ignoring CLI value`,
    );
    return undefined;
  }
  return parsed;
}
