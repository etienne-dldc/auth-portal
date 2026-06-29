import { HTTPException } from "@hono/hono/http-exception";
import { RedirectPage } from "../../views/RedirectPage.tsx";
import { OAuthSessionTokenCookie } from "../cookies.ts";
import * as db from "../database/actions.ts";
import { createToken } from "../database/schema.ts";
import { createPathHandler } from "../factory.ts";
import { OAuth, OAUTH_PROVIDERS, type TOAuthProviderName } from "../oauth.ts";
import { ROUTES } from "../routes.ts";

export const oauthStart = createPathHandler(ROUTES.oauthStart.path)(
  async (c) => {
    const providerName = c.req.param("providerName");
    if (!OAUTH_PROVIDERS.includes(providerName as any)) {
      throw new HTTPException(400, {
        message: `OAuth provider ${providerName} is not enabled`,
      });
    }
    const provider = providerName as TOAuthProviderName;
    if (
      !OAuth.get().enabledProviders.includes(provider)
    ) {
      throw new HTTPException(400, {
        message: `OAuth provider ${providerName} is not enabled`,
      });
    }
    const client = OAuth.get().getClient(provider);
    const sessionToken = createToken();
    const oauth = await client.code.getAuthorizationUri();
    const { codeVerifier, uri: loginUrl } = oauth;
    const loginSession = db.oauthSessions.create(
      provider,
      codeVerifier,
      sessionToken,
    );
    // Save sessionToken to cookie to identify the redirection from OAuth provider
    await OAuthSessionTokenCookie.get().write(c, loginSession.token);
    // Can't return redirect directly because we need to set the cookie first, so we return a page that will redirect the user to the OAuth provider
    return c.render(<RedirectPage redirectUrl={loginUrl.toString()} />);
  },
);
