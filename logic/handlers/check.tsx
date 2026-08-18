import type { Context } from "@hono/hono";
import { RawRedirectPage } from "../../views/RawRedirectPage.tsx";
import { Config } from "../config/config.ts";
import { SessionTokenCookie } from "../cookies.ts";
import * as db from "../database/actions.ts";
import { createPathHandler } from "../factory.ts";
import { isSessionValid } from "../helpers/isValidSession.ts";
import { ROUTES } from "../routes.ts";
import { System } from "../system.ts";

/**
 * This endpoint is expected to be called by forward_auth to check if the user is logged in or not.
 */
export const check = createPathHandler(ROUTES.check.path)(
  async (c) => {
    const successtUrl = getSuccessUrl(c);
    const ssoRedirect = new URL(ROUTES.sso.link({}), Config.get().origin);
    ssoRedirect.searchParams.set("redirect", successtUrl);

    const session = c.get("session");
    const { sso } = Config.get();
    const token = c.req.query(sso.tokenName);
    const authorization = c.req.header("authorization");

    const basicAuthCredentials = authorization
      ? parseBasicAuthHeader(authorization)
      : null;

    if (basicAuthCredentials) {
      const { username, password } = basicAuthCredentials;
      if (!System.get().isAllowed(successtUrl, username)) {
        return c.text("Forbidden", 403);
      }
      const isValid = await System.get().verifyBasicAuth(username, password);
      if (isValid) {
        return allowConnection(c, username);
      }
    }

    if (token) {
      const ssoSession = db.ssoSessions.findByToken(token);
      if (!isSessionValid(ssoSession)) {
        // Token is expired, try again
        return authRedirect(c, ssoRedirect);
      }
      const linkedSession = db.sessions.findById(ssoSession.sessionId);
      if (!isSessionValid(linkedSession)) {
        // Linked session is invalid, try again
        return authRedirect(c, ssoRedirect);
      }
      // Check was hit with a valid SSO token, remove the SSO session and return a redirect with session cookie set
      // Since we are returning a non-200 response, this redirect will be forwarded to the client, and the client will follow the redirect and set the session cookie
      db.ssoSessions.removeById(ssoSession.id);
      if (!System.get().isAllowed(successtUrl, linkedSession.username)) {
        return authRedirect(c, ssoRedirect);
      }
      await SessionTokenCookie.get().write(c, linkedSession.token);
      return c.redirect(successtUrl);
    }

    // Session come from the authentication middleware, so no need to check if it's valid, just check if it exists
    if (session) {
      if (!System.get().isAllowed(successtUrl, session.username)) {
        return authRedirect(c, ssoRedirect);
      }
      // Session is valid, return 200 to allow the connection
      return allowConnection(c, session.username);
    }

    // Redirect to sso (response will be forwarded to the client)
    return authRedirect(c, ssoRedirect);
  },
);

/**
 * URL request by the user but without the SSO token.
 * @param c
 * @returns
 */
function getSuccessUrl(c: Context): string {
  const { sso } = Config.get();
  const host = c.req.header("x-forwarded-host") || c.req.header("host") ||
    "localhost";
  const proto = c.req.header("x-forwarded-proto") || "http";
  const uri = c.req.header("x-forwarded-uri") || c.req.url || "/";
  const url = new URL(uri, `${proto}://${host}`);
  url.searchParams.delete(sso.tokenName);
  return url.toString();
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
  const userInfo = System.get().getUserInfo(username);
  if (userInfo.name) {
    c.header("X-Name", userInfo.name);
  }
  if (userInfo.email) {
    c.header("X-Email", userInfo.email);
  }
  return c.render(
    // Return a page that will redirect the user to the home page if the user ever ends up on this page
    <RawRedirectPage
      redirectUrl={new URL(ROUTES.home.link({}), Config.get().origin)
        .toString()}
    />,
  );
}

const BEHAVIOR_HEADER = "x-auth-portal-behavior";

function isAjaxRequest(c: Context): boolean {
  // Standard XHR header (jQuery, axios, etc.)
  if (c.req.header("x-requested-with") === "XMLHttpRequest") {
    return true;
  }
  // Accept header indicates JSON
  const accept = c.req.header("accept");
  if (accept?.includes("application/json")) {
    return true;
  }
  // Fetch Metadata: navigations send "navigate", API calls send "cors" / "no-cors" / "same-origin"
  const fetchMode = c.req.header("sec-fetch-mode");
  if (fetchMode && fetchMode !== "navigate") {
    return true;
  }
  return false;
}

function authRedirect(c: Context, ssoRedirect: URL): Response {
  // Custom header can override the behavior in either direction (see README)
  const behavior = c.req.header(BEHAVIOR_HEADER)?.toLowerCase();
  if (behavior === "fail") {
    return c.json(
      { error: "unauthorized", loginUrl: ssoRedirect.toString() },
      401,
    );
  }
  if (behavior === "redirect") {
    return c.redirect(ssoRedirect);
  }
  // No override: auto-detect AJAX requests
  if (isAjaxRequest(c)) {
    return c.json(
      { error: "unauthorized", loginUrl: ssoRedirect.toString() },
      401,
    );
  }
  return c.redirect(ssoRedirect);
}
