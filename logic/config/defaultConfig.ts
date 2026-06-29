import type { TFlatAppConfig } from "./type.ts";

export const DEFAULT_CONFIG: TFlatAppConfig = {
  port: 3000,
  otelDenoEnabled: false,
  configPath: "/data/config.yaml",
  databasePath: "/data/db.sqlite",
  secureCookies: true,
  "sso.tokenName": "auth-portal-sso-token",
  "sso.sessionDurationSeconds": 60, // 1 minute
  "oauth.discord.enabled": false,
  "oauth.github.enabled": false,
  "oauth.google.enabled": false,
  "session.cookieName": "auth_portal_v1",
  "session.sessionDurationSeconds": 60 * 60 * 24 * 7, // 7 days
  "oauth.sessionDurationSeconds": 5 * 60, // 5 minutes
  "oauth.cookieName": "auth_portal_oauth_session_key",
};
