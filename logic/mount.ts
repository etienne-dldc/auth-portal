import { Cleanup } from "./cleanup.ts";
import { Config } from "./config/config.ts";
import {
  OAuthSessionTokenCookie,
  OidcAuthRequestCookie,
  SessionTokenCookie,
  SSORedirectCookie,
} from "./cookies.ts";
import { Db } from "./database/db.ts";
import type { Unmount } from "./mountable.ts";
import { OAuth } from "./oauth.ts";
import { Oidc } from "./oidc.ts";
import { System } from "./system.ts";

export async function mount(): Promise<Unmount> {
  const unmountConfig = await Config.mount();
  const unmountSessionCookies = await SessionTokenCookie.mount();
  const unmountOAuthSessionCookies = await OAuthSessionTokenCookie.mount();
  const unmountSSORedirectCookie = await SSORedirectCookie.mount();
  const unmountOidcAuthRequestCookie = await OidcAuthRequestCookie.mount();
  const unmountDatabase = await Db.mount();
  const unmountOAuth = await OAuth.mount();
  const unmountSystem = await System.mount();
  const unmountOidc = await Oidc.mount();
  const unmountCleanup = await Cleanup.mount();

  return async function unmount() {
    await unmountCleanup();
    await unmountOidc();
    await unmountSystem();
    await unmountOAuth();
    await unmountDatabase();
    await unmountOidcAuthRequestCookie();
    await unmountSSORedirectCookie();
    await unmountOAuthSessionCookies();
    await unmountSessionCookies();
    await unmountConfig();
  };
}
