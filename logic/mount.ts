import { Config } from "./config/config.ts";
import {
  OAuthSessionTokenCookie,
  SessionTokenCookie,
  SSORedirectCookie,
} from "./cookies.ts";
import { Db } from "./database/db.ts";
import type { Unmount } from "./mountable.ts";
import { OAuth } from "./oauth.ts";
import { System } from "./system.ts";

export async function mount(): Promise<Unmount> {
  const unmountConfig = await Config.mount();
  const unmountSessionCookies = await SessionTokenCookie.mount();
  const unmountOAuthSessionCookies = await OAuthSessionTokenCookie.mount();
  const unmountSSORedirectCookie = await SSORedirectCookie.mount();
  const unmountDatabase = await Db.mount();
  const unmountOAuth = await OAuth.mount();
  const unmountSystem = await System.mount();

  return async function unmount() {
    await unmountSystem();
    await unmountOAuth();
    await unmountDatabase();
    await unmountSSORedirectCookie();
    await unmountOAuthSessionCookies();
    await unmountSessionCookies();
    await unmountConfig();
  };
}
