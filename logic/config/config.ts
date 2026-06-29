import { mountable, type TMountResult } from "../mountable.ts";
import { configFromArgs } from "./configFromArgs.ts";
import { configFromEnv } from "./configFromEnv.ts";
import { DEFAULT_CONFIG } from "./defaultConfig.ts";
import { mergeConfig } from "./mergeConfig.ts";
import type { TAppConfig, TConfigOAuth } from "./type.ts";

export const Config = mountable(
  (configOverride: Partial<TAppConfig> = {}): TMountResult<TAppConfig> => {
    const flatConfig = mergeConfig(
      DEFAULT_CONFIG,
      configFromEnv(),
      configFromArgs(Deno.args),
      configOverride,
    );

    const discord: TConfigOAuth =
      flatConfig["oauth.discord.enabled"] !== false &&
        (flatConfig["oauth.discord.clientId"] &&
          flatConfig["oauth.discord.clientSecret"])
        ? {
          clientId: definedOrFail(flatConfig, "oauth.discord.clientId"),
          clientSecret: definedOrFail(flatConfig, "oauth.discord.clientSecret"),
        }
        : null;

    const github: TConfigOAuth = flatConfig["oauth.github.enabled"] !== false &&
        (flatConfig["oauth.github.clientId"] &&
          flatConfig["oauth.github.clientSecret"])
      ? {
        clientId: definedOrFail(flatConfig, "oauth.github.clientId"),
        clientSecret: definedOrFail(flatConfig, "oauth.github.clientSecret"),
      }
      : null;

    const google: TConfigOAuth = flatConfig["oauth.google.enabled"] !== false &&
        (flatConfig["oauth.google.clientId"] &&
          flatConfig["oauth.google.clientSecret"])
      ? {
        clientId: definedOrFail(flatConfig, "oauth.google.clientId"),
        clientSecret: definedOrFail(flatConfig, "oauth.google.clientSecret"),
      }
      : null;

    const config: TAppConfig = {
      port: definedOrFail(flatConfig, "port"),
      origin: definedOrFail(flatConfig, "origin"),
      otelDenoEnabled: definedOrFail(flatConfig, "otelDenoEnabled"),
      configPath: definedOrFail(flatConfig, "configPath"),
      databasePath: definedOrFail(flatConfig, "databasePath"),
      secureCookies: definedOrFail(flatConfig, "secureCookies"),
      session: {
        cookieName: definedOrFail(flatConfig, "session.cookieName"),
        durationSeconds: definedOrFail(
          flatConfig,
          "session.sessionDurationSeconds",
        ),
      },
      oauth: {
        cookieName: definedOrFail(flatConfig, "oauth.cookieName"),
        sessionDurationSeconds: definedOrFail(
          flatConfig,
          "oauth.sessionDurationSeconds",
        ),
        github,
        discord,
        google,
      },
      sso: {
        tokenName: definedOrFail(flatConfig, "sso.tokenName"),
        sessionDurationSeconds: definedOrFail(
          flatConfig,
          "sso.sessionDurationSeconds",
        ),
      },
    };

    return {
      value: config,
    };
  },
);

function definedOrFail<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  key: K,
): NonNullable<T[K]> {
  const value = obj[key as K];
  if (value === undefined || value === null) {
    throw new Error(`Missing required config value: ${key as string}`);
  }
  return value;
}
