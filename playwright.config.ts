import { defineConfig, devices } from "@playwright/test";

const DOCKER_COMPOSE_FILE = "tests/e2e/docker/docker-compose.yml";
const BASE_URL = "http://auth.localhost";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
	webServer: {
		command: `docker compose -f ${DOCKER_COMPOSE_FILE} up --build`,
    url: `${BASE_URL}/login`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
});
