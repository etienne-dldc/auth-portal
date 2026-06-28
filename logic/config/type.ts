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
  sessionCookie: {
    name: string;
    maxAge: number;
  };
  oauth: {
    // Cookie used to ensure the oauth flow is done in the same browser that started it
    cookie: {
      name: string;
      maxAge: number;
    };
    // How long does the user has to complete the oauth flow
    sessionDurationSeconds: number;
    github: TConfigOAuth;
    discord: TConfigOAuth;
    google: TConfigOAuth;
  };
}

export type TFlatAppConfig = Flatten<{
  port: number;
  origin: string;
  otelDenoEnabled: boolean;
  configPath: string;
  databasePath: string;
  secureCookies: boolean;
  sessionCookie: { name: string; maxAge: number };
  oauth: {
    cookie: { name: string; maxAge: number };
    sessionDurationSeconds: number;
    github: { enabled: boolean; clientId: string; clientSecret: string };
    discord: { enabled: boolean; clientId: string; clientSecret: string };
    google: { enabled: boolean; clientId: string; clientSecret: string };
  };
}>;
