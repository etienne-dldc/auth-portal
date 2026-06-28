import { SSOErrorPage } from "../../views/SSOErrorPage.tsx";
import { SSORedirectCookie } from "../cookies.ts";
import * as db from "../database/actions.ts";
import { createPathHandler } from "../factory.ts";
import { ROUTES } from "../routes.ts";
import { System } from "../system.ts";

const log = (message: string, ...args: unknown[]) =>
  console.debug(`[SSO Handler] ${message}`, ...args);

export const sso = createPathHandler(ROUTES.sso.path)(
  async (c) => {
    const session = c.get("session");
    if (!session) {
      log(
        "No session found, redirecting to login with redirect query param",
      );
      const redirect = c.req.query("redirect");
      if (redirect) {
        log(
          `Found redirect query param: ${redirect}, setting cookie and redirecting to login`,
        );
        await SSORedirectCookie.get().write(c, redirect);
        return c.redirect(ROUTES.login.path);
      }
      log("No redirect query param found, rendering SSO error page");
      return c.render(<SSOErrorPage error="MissingRedirect" />);
    }
    // We have a session, get redirect from query or cookie
    const redirectQuery = c.req.query("redirect");
    const redirectCookie = await SSORedirectCookie.get().read(c);
    const redirect = redirectQuery || redirectCookie;
    if (!redirect) {
      log(
        "No redirect found in query or cookie, rendering SSO error page",
      );
      return c.render(<SSOErrorPage error="MissingRedirect" />);
    }
    // Clear the redirect cookie
    log(
      `Found redirect: ${redirect} from ${
        redirectQuery ? "query" : "cookie"
      }, clearing cookie and validating redirect`,
    );
    SSORedirectCookie.get().clear(c);
    // Validate the redirect URL
    const allowed = System.get().isAllowed(redirect, session.username);
    if (!allowed) {
      log(
        `Redirect ${redirect} is not allowed for user ${session.username}, rendering SSO error page`,
      );
      return c.render(<SSOErrorPage error="NotAllowed" />);
    }
    log(
      `Redirect ${redirect} is allowed for user ${session.username}, creating SSO session and redirecting`,
    );
    const ssoSession = db.ssoSessions.create(session.username);
    // Generate the SSO login token, thren redirect to the URL with the token as a query param
    const redirectUrl = new URL(redirect);
    redirectUrl.searchParams.set("token", ssoSession.token);
    return c.redirect(redirectUrl.toString());
  },
);
