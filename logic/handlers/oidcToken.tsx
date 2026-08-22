import { Config } from "../config/config.ts";
import * as db from "../database/actions.ts";
import { createPathHandler } from "../factory.ts";
import { isSessionValid } from "../helpers/isValidSession.ts";
import { authenticateClient } from "../oidc/clientAuth.ts";
import { signJwt } from "../oidc/jwt.ts";
import { verifyPkce } from "../oidc/pkce.ts";
import type { TOidcErrorResponse, TOidcTokenResponse } from "../oidc/types.ts";
import { ROUTES } from "../routes.ts";
import { System } from "../system.ts";

export const oidcToken = createPathHandler(ROUTES.oidcToken.path)(
  async (c) => {
    const formData = await c.req.parseBody();
    const form = formData instanceof URLSearchParams
      ? formData
      : new URLSearchParams(formData as Record<string, string>);

    const authResult = authenticateClient(c.req.raw, form);
    if (!authResult.client) {
      return c.json(
        {
          error: "invalid_client",
          error_description: "Client authentication failed",
        } satisfies TOidcErrorResponse,
        401,
      );
    }
    const client = authResult.client;

    const grantType = form.get("grant_type");
    if (grantType !== "authorization_code") {
      return c.json(
        { error: "unsupported_grant_type" } satisfies TOidcErrorResponse,
        400,
      );
    }

    const codeValue = form.get("code");
    if (!codeValue) {
      return c.json(
        {
          error: "invalid_request",
          error_description: "Missing code",
        } satisfies TOidcErrorResponse,
        400,
      );
    }

    const code = db.oidcCodes.findByCode(codeValue);
    if (!code) {
      return c.json(
        {
          error: "invalid_grant",
          error_description: "Invalid code",
        } satisfies TOidcErrorResponse,
        400,
      );
    }

    if (!isSessionValid({ expiresAt: code.expiresAt })) {
      db.oidcCodes.removeById(code.id);
      return c.json(
        {
          error: "invalid_grant",
          error_description: "Code expired",
        } satisfies TOidcErrorResponse,
        400,
      );
    }

    if (code.clientId !== client.clientId) {
      return c.json(
        {
          error: "invalid_grant",
          error_description: "Code was issued to a different client",
        } satisfies TOidcErrorResponse,
        400,
      );
    }

    const redirectUri = form.get("redirect_uri");
    if (redirectUri && redirectUri !== code.redirectUri) {
      return c.json(
        {
          error: "invalid_grant",
          error_description: "redirect_uri mismatch",
        } satisfies TOidcErrorResponse,
        400,
      );
    }

    if (client.public) {
      const codeVerifier = form.get("code_verifier");
      if (!codeVerifier || !code.codeChallenge) {
        return c.json(
          {
            error: "invalid_grant",
            error_description: "PKCE required for public clients",
          } satisfies TOidcErrorResponse,
          400,
        );
      }
      const method = code.codeChallengeMethod ?? "plain";
      const pkceValid = await verifyPkce(
        codeVerifier,
        code.codeChallenge,
        method,
      );
      if (!pkceValid) {
        return c.json(
          {
            error: "invalid_grant",
            error_description: "PKCE verification failed",
          } satisfies TOidcErrorResponse,
          400,
        );
      }
    }

    db.oidcCodes.removeById(code.id);

    const session = db.sessions.findById(code.sessionId);
    if (!isSessionValid(session)) {
      return c.json(
        {
          error: "invalid_grant",
          error_description: "Session expired",
        } satisfies TOidcErrorResponse,
        400,
      );
    }

    const config = Config.get();
    const issuer = `${config.origin}/oidc`;
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = config.oidc.accessTokenDurationSeconds;
    const scopes = code.scope.split(" ").filter(Boolean);
    const userInfo = System.get().getUserInfo(code.username);

    const registeredClaims = {
      iss: issuer,
      sub: code.username,
      aud: client.clientId,
      exp: now + expiresIn,
      iat: now,
      nbf: now,
      jti: crypto.randomUUID(),
    };

    const { token: accessToken } = await signJwt({
      ...registeredClaims,
      scope: scopes.join(" "),
    });

    const idTokenPayload: Record<string, unknown> = { ...registeredClaims };
    if (code.nonce) {
      idTokenPayload.nonce = code.nonce;
    }
    if (scopes.includes("profile") && userInfo.name) {
      idTokenPayload.name = userInfo.name;
    }
    if (scopes.includes("email") && userInfo.email) {
      idTokenPayload.email = userInfo.email;
    }
    const { token: idToken } = await signJwt(idTokenPayload);

    const response: TOidcTokenResponse = {
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: expiresIn,
      scope: scopes.join(" "),
      id_token: idToken,
    };

    return c.json(response);
  },
);
