import type { AppConfig } from "./type.ts";

export const DEFAULT_CONFIG: AppConfig = {
  port: 3000,
  otelDenoEnabled: false,
  configPath: "/data/config.json",
};
