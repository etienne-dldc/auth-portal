import { load } from "@std/dotenv";
import denoJson from "./deno.json" with { type: "json" };
import { Config } from "./logic/config/config.ts";
import { mount } from "./logic/mount.ts";
import { createServer } from "./logic/server.tsx";

await load({ envPath: "./.env.local", export: true });
await load({ envPath: "./.env", export: true });

await mount();

const config = Config.get();

console.log(`Starting Auth Portal v${denoJson.version}`);

const app = createServer();

console.log(`Auth Portal listening on :${config.port}`);
Deno.serve({ port: config.port }, app.fetch);
