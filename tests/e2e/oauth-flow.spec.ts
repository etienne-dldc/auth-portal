import { expect, test, type Page } from "@playwright/test";

const AUTH_URL = "http://auth.localhost";
const MOCK_GITHUB_API = "http://localhost:9876";

interface MockGithubConfig {
  user?: { login: string };
  emails?: { email: string; primary: boolean; verified: boolean }[];
  accessToken?: string;
  tokenStatus?: number;
  userStatus?: number;
  emailsStatus?: number;
}

/** Update the mock GitHub server's response configuration */
async function setMockGithubConfig(config: MockGithubConfig) {
  const res = await fetch(`${MOCK_GITHUB_API}/__config`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
  if (!res.ok) {
    throw new Error(`Failed to set mock config: ${res.status}`);
  }
}

/** Reset the mock GitHub server to default responses */
async function resetMockGithub() {
  await fetch(`${MOCK_GITHUB_API}/__reset`, { method: "POST" });
}

/**
 * Intercept the browser navigation to the mock GitHub authorize endpoint and
 * redirect directly to the auth-portal callback with a mock authorization code.
 *
 * The server-side token exchange and user/emails API calls go to the mock
 * server via OAUTH_GITHUB_*_URL env vars configured in docker-compose.yml.
 */
async function interceptGithubAuthorize(page: Page) {
  await page.route("**/login/oauth/authorize**", (route) => {
    const url = new URL(route.request().url());
    const redirectUri = url.searchParams.get("redirect_uri");
    const state = url.searchParams.get("state");
    const callbackUrl = new URL(redirectUri!);
    callbackUrl.searchParams.set("code", "mock-auth-code");
    if (state) {
      callbackUrl.searchParams.set("state", state);
    }
    return route.fulfill({
      status: 302,
      headers: { Location: callbackUrl.toString() },
    });
  });
}

/** Perform a full GitHub OAuth login flow */
async function githubLogin(page: Page) {
  await interceptGithubAuthorize(page);
  await page.goto(`${AUTH_URL}/login`);
  await page.getByRole("link", { name: /Login with GitHub/i }).click();
  await page.waitForURL(`${AUTH_URL}/`);
}

test.describe("GitHub OAuth login", () => {
  test.beforeEach(async () => {
    await resetMockGithub();
  });

  test("successful login redirects to home page", async ({ page }) => {
    await githubLogin(page);
    await expect(page.getByRole("heading", { name: "Welcome, testuser" }))
      .toBeVisible();
  });

  test("session persists across navigation", async ({ page }) => {
    await githubLogin(page);
    await page.reload();
    await expect(page.getByRole("heading", { name: "Welcome, testuser" }))
      .toBeVisible();
  });

  test("logout clears the session", async ({ page }) => {
    await githubLogin(page);
    await page.getByRole("button", { name: /Logout/i }).click();
    await page.waitForURL(`${AUTH_URL}/login`);
  });

  test("can access protected app after OAuth login", async ({ page }) => {
    await githubLogin(page);
    await page.goto("http://app.localhost/");
    await expect(page.getByRole("heading", {
      name: "Protected Content",
    })).toBeVisible();
  });

  test("unverified email is not used as identity", async ({ page }) => {
    await setMockGithubConfig({
      user: { login: "testuser" },
      emails: [{ email: "test@example.com", primary: true, verified: false }],
    });

    await interceptGithubAuthorize(page);
    await page.goto(`${AUTH_URL}/login`);
    await page.getByRole("link", { name: /Login with GitHub/i }).click();

    // User should still match on github_username
    await page.waitForURL(`${AUTH_URL}/`);
    await expect(page.getByRole("heading", { name: "Welcome, testuser" }))
      .toBeVisible();
  });

  test("unknown GitHub username shows error page", async ({ page }) => {
    await setMockGithubConfig({
      user: { login: "unknown-user" },
      emails: [{ email: "nobody@example.com", primary: true, verified: true }],
    });

    await interceptGithubAuthorize(page);
    await page.goto(`${AUTH_URL}/login`);
    await page.getByRole("link", { name: /Login with GitHub/i }).click();

    await expect(page.getByRole("heading", {
      name: "IdentitiesDidNotMatch",
    })).toBeVisible();
  });

  test("token exchange failure shows error page", async ({ page }) => {
    await setMockGithubConfig({ tokenStatus: 401 });

    await interceptGithubAuthorize(page);
    await page.goto(`${AUTH_URL}/login`);
    await page.getByRole("link", { name: /Login with GitHub/i }).click();

    await expect(page.getByRole("heading", {
      name: "UnexpectedOAuthError",
    })).toBeVisible();
  });
});
