import * as v from "@valibot/valibot";
import { Config } from "./config/config.ts";
import { mountable } from "./mountable.ts";
import { createTypedCookies } from "./typedCookie.ts";

export const SessionTokenCookie = mountable(() => {
  const { session, secureCookies } = Config.get();
  return {
    value: createTypedCookies(session.cookieName, v.string(), {
      maxAge: session.durationSeconds,
      httpOnly: true,
      path: "/",
      sameSite: "Lax",
      secure: secureCookies,
    }),
  };
});

export const OAuthSessionTokenCookie = mountable(() => {
  const { oauth, secureCookies } = Config.get();
  return {
    value: createTypedCookies(oauth.cookieName, v.string(), {
      maxAge: oauth.sessionDurationSeconds,
      httpOnly: true,
      path: "/",
      sameSite: "Lax",
      secure: secureCookies,
    }),
  };
});

export const SSORedirectCookie = mountable(() => {
  const { sso, secureCookies } = Config.get();
  return {
    value: createTypedCookies("auth_portal_sso_redirect_v1", v.string(), {
      maxAge: sso.sessionDurationSeconds,
      httpOnly: true,
      path: "/",
      sameSite: "Lax",
      secure: secureCookies,
    }),
  };
});

const oidcAuthRequestSchema = v.object({
  clientId: v.string(),
  redirectUri: v.string(),
  responseType: v.string(),
  scope: v.string(),
  state: v.optional(v.string()),
  nonce: v.optional(v.string()),
  codeChallenge: v.optional(v.string()),
  codeChallengeMethod: v.optional(v.string()),
});

export const OidcAuthRequestCookie = mountable(() => {
  const { oidc, secureCookies } = Config.get();
  return {
    value: createTypedCookies(
      oidc.authRequestCookieName,
      oidcAuthRequestSchema,
      {
        maxAge: oidc.authRequestDurationSeconds,
        httpOnly: true,
        path: "/",
        sameSite: "Lax",
        secure: secureCookies,
      },
    ),
  };
});
