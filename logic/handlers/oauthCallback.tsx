import { HTTPException } from "@hono/hono/http-exception";
import { OAuthErrorPage } from "../../views/OAuthErrorPage.tsx";
import { OAuthSessionTokenCookie, SessionTokenCookie } from "../cookies.ts";
import * as db from "../database/actions.ts";
import { createPathHandler } from "../factory.ts";
import { getOAuthIdentities } from "../getOAuthIdentities.ts";
import { OAuth, OAUTH_PROVIDERS } from "../oauth.ts";
import { ROUTES } from "../routes.ts";
import { System } from "../system.ts";

export const oauthCallback = createPathHandler(ROUTES.oauthCallback.path)(
  async (c) => {
    const providerName = c.req.param("providerName");
    if (!OAUTH_PROVIDERS.includes(providerName as any)) {
      throw new HTTPException(400, {
        message: `OAuth provider ${providerName} is not enabled`,
      });
    }
    // Read cookie
    const sessionToken = await OAuthSessionTokenCookie.get().read(c);
    if (!sessionToken) {
      throw new HTTPException(400, { message: "Missing session token cookie" });
    }
    const oauthSession = db.oauthSessions.findByToken(sessionToken);
    if (!oauthSession || oauthSession.provider !== providerName) {
      throw new HTTPException(400, { message: "Could not find session" });
    }
    // Now we have an oauthsession that we can update so we should never throw here
    await OAuthSessionTokenCookie.get().write(c, null);
    try {
      // Check if authsession is expired
      if (
        Temporal.Now.instant().epochMilliseconds >
          oauthSession.expiresAt.epochMilliseconds
      ) {
        return c.render(<OAuthErrorPage errorKey="SessionExpired" />);
      }
      // Get the token
      const client = OAuth.get().getClient(providerName);
      const token = await client.code.getToken(c.req.url, {
        codeVerifier: oauthSession.codeVerifier,
      });
      const system = System.get();
      const oauthIdentities = await getOAuthIdentities(providerName, token);
      // Found user
      const username = system.resolveOAuthIdentity(oauthIdentities);
      if (!username) {
        return c.render(<OAuthErrorPage errorKey="IdentitiesDidNotMatch" />);
      }
      const session = db.sessions.create(username);
      await SessionTokenCookie.get().write(c, session.token);
      return c.redirect(ROUTES.home.link({}));
    } catch (err) {
      console.error(err);
      return c.render(<OAuthErrorPage errorKey="UnexpectedOAuthError" />);
    }
  },
);
