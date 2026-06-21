import type { AppConfig } from "./type.ts";

export function logAppConfig(env: AppConfig): void {
  console.log(`[config] ${JSON.stringify(env)}`);
}
