import { parseArgs } from "@std/cli/parse-args";
import type { TFlatAppConfig } from "./type.ts";

export function configFromArgs(args: string[]): TFlatAppConfig {
  const parsed = parseArgs(args, {
    string: [
      "port",
      "origin",
      "config-path",
      "database-path",
      "session.cookie-name",
      "session.session-duration-seconds",
      "sso.token-name",
      "sso.session-duration-seconds",
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
    alias: {
      c: "config-path",
      p: "port",
    },
    boolean: [
      "oauth.discord.enabled",
      "oauth.github.enabled",
      "oauth.google.enabled",
    ],
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
    "sso.tokenName": parsed.sso?.["token-name"],
    "sso.sessionDurationSeconds": parseNumber(
      parsed.sso?.["session-duration-seconds"],
      "sso.session-duration-seconds",
    ),
    "oauth.discord.clientId": parsed.oauth?.discord?.["client-id"],
    "oauth.discord.clientSecret": parsed.oauth?.discord?.["client-secret"],
    "oauth.discord.enabled": parsed.oauth?.discord?.enabled,
    "oauth.github.clientId": parsed.oauth?.github?.["client-id"],
    "oauth.github.clientSecret": parsed.oauth?.github?.["client-secret"],
    "oauth.github.enabled": parsed.oauth?.github?.enabled,
    "oauth.google.clientId": parsed.oauth?.google?.["client-id"],
    "oauth.google.clientSecret": parsed.oauth?.google?.["client-secret"],
    "oauth.google.enabled": parsed.oauth?.google?.enabled,
    "session.cookieName": parsed.session?.["cookie-name"],
    "session.sessionDurationSeconds": parseNumber(
      parsed.session?.["session-duration-seconds"],
      "session.session-duration-seconds",
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
