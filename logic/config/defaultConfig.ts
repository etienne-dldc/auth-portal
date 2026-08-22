import type { TFlatAppConfig } from "./type.ts";

export const DEFAULT_CONFIG: TFlatAppConfig = {
  port: 3000,
  otelDenoEnabled: false,
  configPath: "/data/config.yaml",
  databasePath: "/data/db.sqlite",
  secureCookies: true,
  "sso.tokenName": "auth-portal-sso-token",
  "sso.sessionDurationSeconds": 60, // 1 minute
  "oidc.authRequestCookieName": "auth_portal_oidc_req_v1",
  "oidc.authRequestDurationSeconds": 300, // 5 minutes
  "oidc.codeDurationSeconds": 60, // 1 minute
  "oidc.accessTokenDurationSeconds": 3600, // 1 hour
  "oidc.keyRotationSeconds": 60 * 60 * 24 * 90, // 90 days
  "oauth.discord.enabled": false,
  "oauth.github.enabled": false,
  "oauth.google.enabled": false,
  "session.cookieName": "auth_portal_v1",
  "session.sessionDurationSeconds": 60 * 60 * 24 * 7, // 7 days
  "oauth.sessionDurationSeconds": 5 * 60, // 5 minutes
  "oauth.cookieName": "auth_portal_oauth_session_key",
};
