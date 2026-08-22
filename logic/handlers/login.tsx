import { LoginPage } from "../../views/LoginPage.tsx";
import { OidcAuthRequestCookie, SSORedirectCookie } from "../cookies.ts";
import { createPathHandler } from "../factory.ts";
import { ROUTES } from "../routes.ts";

export const login = createPathHandler(ROUTES.login.path)(
  async (c) => {
    const session = c.get("session");
    if (session) {
      const oidcAuthRequest = await OidcAuthRequestCookie.get().read(c);
      if (oidcAuthRequest) {
        OidcAuthRequestCookie.get().clear(c);
        return c.redirect(ROUTES.oidcAuthorize.path);
      }
      const ssoRedirect = await SSORedirectCookie.get().read(c);
      if (ssoRedirect) {
        return c.redirect(ROUTES.sso.link({}));
      }
      return c.redirect(ROUTES.home.path);
    }
    return c.html(<LoginPage />);
  },
);
