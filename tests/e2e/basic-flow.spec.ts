import { expect, test } from "@playwright/test";

const APP_URL = "http://app.localhost";
const AUTH_URL = "http://auth.localhost";
const AUTH_DIRECT_URL = "http://localhost:3000";

const VALID_CREDENTIALS = {
  username: "testuser",
  password: "test-password",
};

const WRONG_PASSWORD_CREDENTIALS = {
  username: "testuser",
  password: "wrong-password",
};

const UNAUTHORIZED_CREDENTIALS = {
  username: "unauthuser",
  password: "test-password",
};

function basicAuthHeader(username: string, password: string): string {
  return "Basic " + Buffer.from(`${username}:${password}`).toString("base64");
}

function credentialsContext(
  browser: import("@playwright/test").Browser,
  creds: { username: string; password: string },
) {
  return browser.newContext({
    extraHTTPHeaders: {
      Authorization: basicAuthHeader(creds.username, creds.password),
    },
  });
}

const FORWARD_HEADERS = {
  "X-Forwarded-Host": "app.localhost",
  "X-Forwarded-Proto": "http",
  "X-Forwarded-Uri": "/",
};

// ---------------------------------------------------------------------------
// Unauthenticated flow
// ---------------------------------------------------------------------------

test.describe("Unauthenticated flow", () => {
  test("visiting protected service redirects to login page", async ({ page }) => {
    await page.goto(`${APP_URL}/`);

    expect(page.url()).toBe(`${AUTH_URL}/login`);
    await expect(page.getByText("Login with GitHub")).toBeVisible();
  });

  test("visiting auth-portal root redirects to login", async ({ page }) => {
    await page.goto(`${AUTH_URL}/`);

    expect(page.url()).toBe(`${AUTH_URL}/login`);
  });

  test("login page shows GitHub login button", async ({ page }) => {
    await page.goto(`${AUTH_URL}/login`);

    const githubLink = page.getByRole("link", {
      name: /Login with GitHub/i,
    });
    await expect(githubLink).toBeVisible();
    await expect(githubLink).toHaveAttribute(
      "href",
      "/oauth2/github/start",
    );
  });
});

// ---------------------------------------------------------------------------
// Basic auth flow (via Caddy forward_auth)
// ---------------------------------------------------------------------------

test.describe("Basic auth via forward_auth", () => {
  test("valid credentials allow access to protected service", async ({ browser }) => {
    const context = await credentialsContext(browser, VALID_CREDENTIALS);
    const page = await context.newPage();

    await page.goto(`${APP_URL}/`);
    await expect(page.getByRole("heading", {
      name: "Protected Content",
    })).toBeVisible();

    await context.close();
  });

  test("wrong password redirects to login page", async ({ browser }) => {
    const context = await credentialsContext(
      browser,
      WRONG_PASSWORD_CREDENTIALS,
    );
    const page = await context.newPage();

    await page.goto(`${APP_URL}/`);

    expect(page.url()).toBe(`${AUTH_URL}/login`);

    await context.close();
  });

  test("unauthorized user gets 403 Forbidden", async ({ browser }) => {
    const context = await credentialsContext(
      browser,
      UNAUTHORIZED_CREDENTIALS,
    );
    const page = await context.newPage();

    const response = await page.goto(`${APP_URL}/`);
    expect(response?.status()).toBe(403);

    await context.close();
  });
});

// ---------------------------------------------------------------------------
// /check endpoint (direct API tests)
// ---------------------------------------------------------------------------

test.describe("/check endpoint", () => {
  test("valid basic auth returns 200 with user headers", async ({ request }) => {
    const response = await request.get(`${AUTH_DIRECT_URL}/check`, {
      headers: {
        ...FORWARD_HEADERS,
        Authorization: basicAuthHeader("testuser", "test-password"),
      },
      maxRedirects: 0,
    });

    expect(response.status()).toBe(200);
    expect(response.headers()["x-user"]).toBe("testuser");
    expect(response.headers()["x-name"]).toBe("Test User");
    expect(response.headers()["x-email"]).toBe("test@example.com");
  });

  test("no credentials returns 302 redirect to SSO", async ({ request }) => {
    const response = await request.get(`${AUTH_DIRECT_URL}/check`, {
      headers: FORWARD_HEADERS,
      maxRedirects: 0,
    });

    expect(response.status()).toBe(302);
    const location = response.headers()["location"];
    expect(location).toContain("/sso");
    expect(location).toContain("redirect=http");
    expect(location).toContain("app.localhost");
  });

  test("unauthorized user returns 403", async ({ request }) => {
    const response = await request.get(`${AUTH_DIRECT_URL}/check`, {
      headers: {
        ...FORWARD_HEADERS,
        Authorization: basicAuthHeader("unauthuser", "test-password"),
      },
      maxRedirects: 0,
    });

    expect(response.status()).toBe(403);
  });

  test("wrong password falls through to redirect", async ({ request }) => {
    const response = await request.get(`${AUTH_DIRECT_URL}/check`, {
      headers: {
        ...FORWARD_HEADERS,
        Authorization: basicAuthHeader("testuser", "wrong-password"),
      },
      maxRedirects: 0,
    });

    expect(response.status()).toBe(302);
    expect(response.headers()["location"]).toContain("/sso");
  });

  test("AJAX request returns 401 JSON", async ({ request }) => {
    const response = await request.get(`${AUTH_DIRECT_URL}/check`, {
      headers: {
        ...FORWARD_HEADERS,
        Accept: "application/json",
      },
      maxRedirects: 0,
    });

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("unauthorized");
    expect(body.loginUrl).toContain("/sso");
  });

  test("X-Auth-Portal-Behavior: fail returns 401 JSON", async ({ request }) => {
    const response = await request.get(`${AUTH_DIRECT_URL}/check`, {
      headers: {
        ...FORWARD_HEADERS,
        "X-Auth-Portal-Behavior": "fail",
      },
      maxRedirects: 0,
    });

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("unauthorized");
  });

  test("X-Auth-Portal-Behavior: redirect returns 302", async ({ request }) => {
    const response = await request.get(`${AUTH_DIRECT_URL}/check`, {
      headers: {
        ...FORWARD_HEADERS,
        Accept: "application/json",
        "X-Auth-Portal-Behavior": "redirect",
      },
      maxRedirects: 0,
    });

    expect(response.status()).toBe(302);
    expect(response.headers()["location"]).toContain("/sso");
  });
});
