import type { TFlatAppConfig } from "./type.ts";

export const DEFAULT_CONFIG: TFlatAppConfig = {
  port: 3000,
  otelDenoEnabled: false,
  configPath: "/data/config.yaml",
  databasePath: "/data/db.sqlite",
  secureCookies: true,
  "oauth.discord.enabled": false,
  "oauth.github.enabled": false,
  "oauth.google.enabled": false,
  "sessionCookie.name": "auth_portal_v1",
  "sessionCookie.maxAge": 60 * 60 * 24 * 7, // 7 days
  "oauth.sessionDurationSeconds": 60 * 10, // 10 minutes
  "oauth.cookie.name": "auth_portal_oauth_session_key",
  "oauth.cookie.maxAge": 60 * 10, // 10 minutes
};
