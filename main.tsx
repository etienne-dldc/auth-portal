import denoJson from "./deno.json" with { type: "json" };
import { configFromArgs } from "./logic/config/configFromArgs.ts";
import { configFromEnv } from "./logic/config/configFromEnv.ts";
import { DEFAULT_CONFIG } from "./logic/config/defaultConfig.ts";
import { logAppConfig } from "./logic/config/logAppConfig.ts";
import { mergeConfig } from "./logic/config/mergeConfig.ts";
import { createServer } from "./logic/server.tsx";

const config = mergeConfig(
  DEFAULT_CONFIG,
  configFromEnv(),
  configFromArgs(Deno.args),
);

console.log(`Starting Auth Portal v${denoJson.version}`);
logAppConfig(config);

const app = createServer(config);

console.log(`Auth Portal listening on :${config.port}`);
Deno.serve({ port: config.port }, app.fetch);
