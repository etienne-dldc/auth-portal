import { SSOErrorPage } from "../../views/SSOErrorPage.tsx";
import { SSORedirectCookie } from "../cookies.ts";
import * as db from "../database/actions.ts";
import { createPathHandler } from "../factory.ts";
import { ROUTES } from "../routes.ts";
import { System } from "../system.ts";

export const sso = createPathHandler(ROUTES.sso.path)(
  async (c) => {
    const session = c.get("session");
    if (!session) {
      const redirect = c.req.param("redirect");
      if (redirect) {
        await SSORedirectCookie.get().write(c, redirect);
        return c.redirect(ROUTES.login.path);
      }
      return c.render(<SSOErrorPage error="MissingRedirect" />);
    }
    // We have a session, get redirect from param or cookie
    const redirect = c.req.param("redirect") ||
      await SSORedirectCookie.get().read(c);
    if (!redirect) {
      return c.render(<SSOErrorPage error="MissingRedirect" />);
    }
    // Clear the redirect cookie
    SSORedirectCookie.get().clear(c);
    // Validate the redirect URL
    const allowed = System.get().isAllowed(redirect, session.username);
    if (!allowed) {
      return c.render(<SSOErrorPage error="NotAllowed" />);
    }
    const ssoSession = db.ssoSessions.create(session.username);
    // Generate the SSO login token, thren redirect to the URL with the token as a query param
    const redirectUrl = new URL(redirect);
    redirectUrl.searchParams.set("token", ssoSession.token);
    return c.redirect(redirectUrl.toString());
  },
);
