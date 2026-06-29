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
      sameSite: secureCookies ? "None" : "Lax",
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
      sameSite: secureCookies ? "None" : "Lax",
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
      sameSite: secureCookies ? "None" : "Lax",
      secure: secureCookies,
    }),
  };
});
