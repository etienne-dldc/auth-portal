import * as v from "@valibot/valibot";
import { Config } from "./config/config.ts";
import { mountable } from "./mountable.ts";
import { createTypedCookies } from "./typedCookie.ts";

export const SessionTokenCookie = mountable(() => {
  const { sessionCookie, secureCookies } = Config.get();
  return {
    value: createTypedCookies(sessionCookie.name, v.string(), {
      maxAge: sessionCookie.maxAge,
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
    value: createTypedCookies(oauth.cookie.name, v.string(), {
      maxAge: oauth.cookie.maxAge,
      httpOnly: true,
      path: "/",
      sameSite: secureCookies ? "None" : "Lax",
      secure: secureCookies,
    }),
  };
});

export const SSORedirectCookie = mountable(() => {
  const { sessionCookie, secureCookies } = Config.get();
  return {
    value: createTypedCookies("auth_portal_sso_redirect_v1", v.string(), {
      maxAge: sessionCookie.maxAge,
      httpOnly: true,
      path: "/",
      sameSite: secureCookies ? "None" : "Lax",
      secure: secureCookies,
    }),
  };
});
