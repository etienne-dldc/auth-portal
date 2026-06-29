import type { Flatten } from "../utils/flatten.ts";

export type TConfigOAuth = {
  clientId: string;
  clientSecret: string;
} | null;

export interface TAppConfig {
  port: number;
  origin: string;
  otelDenoEnabled: boolean;
  configPath: string;
  databasePath: string;
  secureCookies: boolean;
  session: {
    // Cookie used to store the session token
    cookieName: string;
    // How long should the session last before expiring (will also set maxAge on the cookie)
    durationSeconds: number;
  };
  oauth: {
    // Cookie used to ensure the oauth flow is done in the same browser that started it
    cookieName: string;
    // How long does the user has to complete the oauth flow
    sessionDurationSeconds: number;
    github: TConfigOAuth;
    discord: TConfigOAuth;
    google: TConfigOAuth;
  };
  sso: {
    tokenName: string;
    sessionDurationSeconds: number;
  };
}

export type TFlatAppConfig = Flatten<{
  port: number;
  origin: string;
  otelDenoEnabled: boolean;
  configPath: string;
  databasePath: string;
  secureCookies: boolean;
  session: {
    sessionDurationSeconds: number;
    cookieName: string;
  };
  oauth: {
    cookieName: string;
    sessionDurationSeconds: number;
    github: { enabled: boolean; clientId: string; clientSecret: string };
    discord: { enabled: boolean; clientId: string; clientSecret: string };
    google: { enabled: boolean; clientId: string; clientSecret: string };
  };
  sso: {
    tokenName: string;
    sessionDurationSeconds: number;
  };
}>;
