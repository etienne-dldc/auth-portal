import type { AppConfig } from "./type.ts";

export function mergeConfig(
  base: AppConfig,
  ...overrides: Partial<AppConfig>[]
): AppConfig {
  const result: AppConfig = { ...base };

  for (const override of overrides) {
    Object.entries(override).forEach(([key, value]) => {
      if (value !== undefined) {
        // deno-lint-ignore no-explicit-any
        (result as any)[key] = value;
      }
    });
  }
  return result;
}
