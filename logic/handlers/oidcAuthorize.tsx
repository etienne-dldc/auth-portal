import type { Context } from "@hono/hono";
import { OidcErrorPage } from "../../views/OidcErrorPage.tsx";
import { OidcAuthRequestCookie } from "../cookies.ts";
import * as db from "../database/actions.ts";
import { createPathHandler } from "../factory.ts";
import { ROUTES } from "../routes.ts";
import { System } from "../system.ts";
import type { TOidcAuthorizationRequest } from "../oidc/types.ts";

export const oidcAuthorize = createPathHandler(ROUTES.oidcAuthorize.path)(
  async (c) => {
    const authRequest = parseAuthorizationRequest(c);
    if (!authRequest) {
      return c.html(<OidcErrorPage error="invalid_request" />, 400);
    }

    const client = System.get().getOidcClient(authRequest.clientId);
    if (!client) {
      return c.html(<OidcErrorPage error="invalid_client" />, 400);
    }

    if (!client.redirectUris.includes(authRequest.redirectUri)) {
      return c.html(<OidcErrorPage error="invalid_redirect_uri" />, 400);
    }

    if (authRequest.responseType !== "code") {
      return c.html(<OidcErrorPage error="unsupported_response_type" />, 400);
    }

    const scopes = authRequest.scope.split(" ").filter(Boolean);
    if (!scopes.includes("openid")) {
      return c.html(<OidcErrorPage error="invalid_scope" />, 400);
    }

    const session = c.get("session");
    if (!session) {
      await OidcAuthRequestCookie.get().write(c, {
        clientId: authRequest.clientId,
        redirectUri: authRequest.redirectUri,
        responseType: authRequest.responseType,
        scope: authRequest.scope,
        state: authRequest.state,
        nonce: authRequest.nonce,
        codeChallenge: authRequest.codeChallenge,
        codeChallengeMethod: authRequest.codeChallengeMethod,
      });
      return c.redirect(ROUTES.login.path);
    }

    if (
      !System.get().isOidcClientAllowed(authRequest.clientId, session.username)
    ) {
      return c.html(<OidcErrorPage error="access_denied" />, 403);
    }

    const code = db.oidcCodes.create({
      clientId: authRequest.clientId,
      redirectUri: authRequest.redirectUri,
      username: session.username,
      sessionId: session.id,
      scope: authRequest.scope,
      nonce: authRequest.nonce,
      codeChallenge: authRequest.codeChallenge,
      codeChallengeMethod: authRequest.codeChallengeMethod,
    });

    const redirectUrl = new URL(authRequest.redirectUri);
    redirectUrl.searchParams.set("code", code.code);
    if (authRequest.state) {
      redirectUrl.searchParams.set("state", authRequest.state);
    }
    return c.redirect(redirectUrl.toString());
  },
);

function parseAuthorizationRequest(
  c: Context,
): TOidcAuthorizationRequest | null {
  const clientId = c.req.query("client_id");
  const redirectUri = c.req.query("redirect_uri");
  const responseType = c.req.query("response_type");
  const scope = c.req.query("scope");
  const state = c.req.query("state") ?? undefined;
  const nonce = c.req.query("nonce") ?? undefined;
  const codeChallenge = c.req.query("code_challenge") ?? undefined;
  const codeChallengeMethod = c.req.query("code_challenge_method") as
    | "S256"
    | "plain"
    | undefined;

  if (!clientId || !redirectUri || !responseType || !scope) {
    return null;
  }

  return {
    clientId,
    redirectUri,
    responseType,
    scope,
    state,
    nonce,
    codeChallenge,
    codeChallengeMethod,
  };
}
