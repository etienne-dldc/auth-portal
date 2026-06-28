import type { Context } from "@hono/hono";
import { RawRedirectPage } from "../../views/RawRedirectPage.tsx";
import { Config } from "../config/config.ts";
import { SessionTokenCookie } from "../cookies.ts";
import * as db from "../database/actions.ts";
import { createPathHandler } from "../factory.ts";
import { ROUTES } from "../routes.ts";
import { System } from "../system.ts";

const log = (message: string, ...args: unknown[]) =>
  console.debug(`[Check Handler] ${message}`, ...args);

/**
 * This endpoint is expected to be called by forward_auth to check if the user is logged in or not.
 */
export const check = createPathHandler(ROUTES.check.path)(
  async (c) => {
    // DEBUG
    log(`x-forwarded-uri: ${c.req.header("x-forwarded-uri")}`);
    log(`x-forwarded-host: ${c.req.header("x-forwarded-host")}`);
    log(`x-forwarded-proto: ${c.req.header("x-forwarded-proto")}`);
    log(`host: ${c.req.header("host")}`);
    log(`c.req.url: ${c.req.url}`);

    const redirectUrl = getRedirectUrl(c);
    const ssoRedirect = new URL(ROUTES.sso.link({}), Config.get().origin);
    ssoRedirect.searchParams.set("redirect", redirectUrl);

    const session = c.get("session");
    const token = c.req.query("token");
    const authorization = c.req.header("authorization");

    const basicAuthCredentials = authorization
      ? parseBasicAuthHeader(authorization)
      : null;

    if (basicAuthCredentials) {
      log(
        `Basic auth credentials found for user ${basicAuthCredentials.username}, verifying...`,
      );
      const { username, password } = basicAuthCredentials;
      const isValid = await System.get().verifyBasicAuth(username, password);
      if (isValid) {
        log(
          `Basic auth credentials for user ${username} are valid, allowing connection`,
        );
        return allowConnection(c, username);
      }
      log(
        `Basic auth credentials for user ${username} are invalid, continuing...`,
      );
    }

    const ssoSession = token ? db.ssoSessions.findByToken(token) : null;
    if (ssoSession) {
      log(
        `SSO session found for user ${ssoSession.username}, checking expiration...`,
      );
      const ssoSessionExpired = Temporal.Now.instant().epochMilliseconds >
        ssoSession.expiresAt.epochMilliseconds;
      if (ssoSessionExpired) {
        log(
          `SSO session for user ${ssoSession.username} is expired, redirecting to SSO with redirect query param`,
        );
        // Token is expired, try again
        return c.redirect(ssoRedirect);
      }
      log(
        `SSO session for user ${ssoSession.username} is valid, allowing connection and removing SSO session`,
      );
      // Check was hit with a valid SSO token, remove the SSO session and return a redirect with session cookie set
      // Since we are returning a non-200 response, this redirect will be forwarded to the client, and the client will follow the redirect and set the session cookie
      db.ssoSessions.removeById(ssoSession.id);
      const session = db.sessions.create(ssoSession.username);
      await SessionTokenCookie.get().write(c, session.token);
      return c.redirect(redirectUrl);
    }

    if (session) {
      log(
        `Session found for user ${session.username}, allowing connection`,
      );
      // Session is valid, return 200 to allow the connection
      return allowConnection(c, session.username);
    }

    // Redirect to sso (response will be forwarded to the client)
    log(
      `No valid session or SSO token found, redirecting to SSO with redirect query param`,
    );
    return c.redirect(ssoRedirect);
  },
);

function getRedirectUrl(c: Context): string {
  const host = c.req.header("x-forwarded-host") || c.req.header("host") ||
    "localhost";
  const proto = c.req.header("x-forwarded-proto") || "http";
  const uri = c.req.header("x-forwarded-uri") || c.req.url || "/";
  return `${proto}://${host}${uri}`;
}

function parseBasicAuthHeader(
  header: string,
): { username: string; password: string } | null {
  if (!header.startsWith("Basic ")) {
    return null;
  }
  const base64Credentials = header.slice("Basic ".length);
  const credentials = atob(base64Credentials);
  const [username, password] = credentials.split(":");
  if (!username || !password) {
    return null;
  }
  return { username, password };
}

function allowConnection(c: Context, username: string) {
  // Set X-User header to the username of the session
  c.header("X-User", username);
  return c.render(
    // Return a page that will redirect the user to the home page if the user ever ends up on this page
    <RawRedirectPage
      redirectUrl={new URL(ROUTES.home.link({}), Config.get().origin)
        .toString()}
    />,
  );
}
