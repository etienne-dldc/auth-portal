import type { AppConfig } from "./type.ts";

export function configFromEnv(): Partial<AppConfig> {
  return {
    port: parsePort(Deno.env.get("PORT")),
    configPath: Deno.env.get("CONFIG_PATH"),
    otelDenoEnabled: parseFlag(Deno.env.get("OTEL_DENO")),
  };
}

function parseFlag(raw: string | undefined): boolean {
  if (!raw) {
    return false;
  }

  const normalized = raw.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" ||
    normalized === "on";
}

function parsePort(raw: string | undefined): number | undefined {
  if (!raw) {
    return undefined;
  }

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    console.error(`[env] Invalid PORT=${JSON.stringify(raw)}`);
    return undefined;
  }

  return parsed;
}
