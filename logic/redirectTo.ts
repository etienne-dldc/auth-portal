import type { Context } from "hono";
import { setCookie } from "hono/cookie";
import { FLASH_COOKIE_NAME, serializeFlash } from "./flash.ts";

export function redirectTo(path: string): Response {
  return new Response(null, {
    status: 303,
    headers: {
      location: path,
    },
  });
}

export function redirect(c: Context, path: string): Response {
  const isHtmx = c.req.header("HX-Request") === "true";

  // Persist flash cookie for both HTMX and standard redirects
  const flash = c.get("flash");
  if (flash) {
    setCookie(c, FLASH_COOKIE_NAME, serializeFlash(flash), {
      path: "/",
      sameSite: "Lax",
      maxAge: 3600,
    });
  }

  if (isHtmx) {
    // HTMX redirect: return 204 with HX-Redirect header
    // Use c.header + c.newResponse so Hono merges the Set-Cookie header
    c.header("HX-Redirect", path);
    return c.newResponse(null, 204);
  }

  return c.redirect(path, 303);
}
