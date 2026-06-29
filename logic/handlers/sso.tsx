import { SSOErrorPage } from "../../views/SSOErrorPage.tsx";
import { Config } from "../config/config.ts";
import { SSORedirectCookie } from "../cookies.ts";
import * as db from "../database/actions.ts";
import { createPathHandler } from "../factory.ts";
import { ROUTES } from "../routes.ts";
import { System } from "../system.ts";

export const sso = createPathHandler(ROUTES.sso.path)(
  async (c) => {
    const session = c.get("session");
    if (!session) {
      const redirect = c.req.query("redirect");
      if (redirect) {
        await SSORedirectCookie.get().write(c, redirect);
        return c.redirect(ROUTES.login.path);
      }
      return c.render(<SSOErrorPage error="MissingRedirect" />);
    }
    // We have a session, get redirect from query or cookie
    const redirectQuery = c.req.query("redirect");
    const redirectCookie = await SSORedirectCookie.get().read(c);
    const redirect = redirectQuery || redirectCookie;
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
    const ssoSession = db.ssoSessions.create(session.id);
    // Generate the SSO login token, then redirect to the URL with the token as a query param
    const redirectUrl = new URL(redirect);
    const { sso } = Config.get();
    redirectUrl.searchParams.set(sso.tokenName, ssoSession.token);
    return c.redirect(redirectUrl.toString());
  },
);
