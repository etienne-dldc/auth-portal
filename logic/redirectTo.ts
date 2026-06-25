import type { Context } from "@hono/hono";

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

  if (isHtmx) {
    // HTMX redirect: return 204 with HX-Redirect header
    // Use c.header + c.newResponse so Hono merges the Set-Cookie header
    c.header("HX-Redirect", path);
    return c.newResponse(null, 204);
  }

  return c.redirect(path, 303);
}
