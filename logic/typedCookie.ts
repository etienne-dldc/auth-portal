import type { Context } from "@hono/hono";
import {
  deleteCookie,
  getCookie,
  getSignedCookie,
  setCookie,
  setSignedCookie,
} from "@hono/hono/cookie";
import type { CookieOptions } from "@hono/hono/utils/cookie";
import * as v from "@valibot/valibot";

export interface TypedCookies<T> {
  readonly name: string;
  read(ctx: Context): Promise<T | null>;
  write(ctx: Context, value: T | null): Promise<void>;
  clear(ctx: Context): void;
}

export function createTypedCookies<T>(
  name: string,
  schema: v.BaseSchema<any, T, any>,
  options: CookieOptions & { signed?: boolean; secret?: string } = {},
): TypedCookies<T> {
  const { signed = false, secret, ...cookieOptions } = options;

  let getCookieFn = (
    ctx: Context,
    name: string,
  ): Promise<string | false | undefined> =>
    Promise.resolve(getCookie(ctx, name));
  let setCookieFn = (ctx: Context, name: string, value: string) =>
    Promise.resolve(setCookie(ctx, name, value, cookieOptions));
  const deleteCookieFn = (ctx: Context, name: string) =>
    deleteCookie(ctx, name, cookieOptions);

  if (signed) {
    if (!secret) {
      throw new Error(
        "Secret must be provided for signed cookies",
      );
    }
    getCookieFn = (ctx, name) => getSignedCookie(ctx, name, secret);
    setCookieFn = (ctx, name, value) =>
      setSignedCookie(ctx, name, value, secret, cookieOptions);
  }

  return {
    name,
    async read(ctx: Context) {
      const value = await getCookieFn(ctx, name);
      if (value === null) {
        return null;
      }
      const parsed = v.safeParse(schema, value);
      if (parsed.success) {
        return parsed.output;
      }
      return null;
    },
    write: async (ctx: Context, value: T | null) => {
      if (value === null) {
        deleteCookieFn(ctx, name);
      } else {
        await setCookieFn(ctx, name, String(value));
      }
    },
    clear: (ctx: Context) => {
      deleteCookieFn(ctx, name);
    },
  };
}
