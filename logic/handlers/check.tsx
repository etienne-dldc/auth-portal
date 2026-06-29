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
      const isValid = await System.get().verifyBasicAuth(username, password);
      if (isValid) {
        return allowConnection(c, username);
      }
    }

    if (token) {
      const ssoSession = db.ssoSessions.findByToken(token);
      if (!isSessionValid(ssoSession)) {
        // Token is expired, try again
        return c.redirect(ssoRedirect);
      }
      const linkedSession = db.sessions.findById(ssoSession.sessionId);
      if (!isSessionValid(linkedSession)) {
        // Linked session is invalid, try again
        return c.redirect(ssoRedirect);
      }
      // Check was hit with a valid SSO token, remove the SSO session and return a redirect with session cookie set
      // Since we are returning a non-200 response, this redirect will be forwarded to the client, and the client will follow the redirect and set the session cookie
      db.ssoSessions.removeById(ssoSession.id);
      await SessionTokenCookie.get().write(c, linkedSession.token);
      return c.redirect(successtUrl);
    }

    // Session come from the authentication middleware, so no need to check if it's valid, just check if it exists
    if (session) {
      // Session is valid, return 200 to allow the connection
      return allowConnection(c, session.username);
    }

    // Redirect to sso (response will be forwarded to the client)
    return c.redirect(ssoRedirect);
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
  return c.render(
    // Return a page that will redirect the user to the home page if the user ever ends up on this page
    <RawRedirectPage
      redirectUrl={new URL(ROUTES.home.link({}), Config.get().origin)
        .toString()}
    />,
  );
}
