import { serveStatic } from "@hono/hono/deno";
import { routePath } from "@hono/hono/route";
import { SpanStatusCode, trace } from "@opentelemetry/api";
import console from "node:console";
import { ErrorPage } from "../views/ErrorPage.tsx";
import { NotFoundPage } from "../views/NotFoundPage.tsx";
import { createApp } from "./factory.ts";
import { check } from "./handlers/check.tsx";
import { home } from "./handlers/home.tsx";
import { login } from "./handlers/login.tsx";
import { logout } from "./handlers/logout.tsx";
import { oauthCallback } from "./handlers/oauthCallback.tsx";
import { oauthStart } from "./handlers/oauthStart.tsx";
import { sso } from "./handlers/sso.tsx";
import { authentication } from "./middlewares/authentication.ts";
import { ROUTES } from "./routes.ts";

export function createServer() {
  const app = createApp();

  app.use("*", async (c, next) => {
    try {
      await next();
    } catch (error) {
      throw error;
    } finally {
      const activeSpan = trace.getActiveSpan();
      if (activeSpan) {
        const route = routePath(c);
        activeSpan.setAttribute("http.route", route);
        activeSpan.updateName(`${c.req.method} ${route}`);

        if (c.error) {
          activeSpan.recordException(c.error);
          activeSpan.setStatus({
            code: SpanStatusCode.ERROR,
            message: c.error.message,
          });
        }
      }
    }
  });

  app.use(
    "/public/*",
    serveStatic({ root: "../" }),
  );

  app.use("*", async (c, next) => {
    await next();

    if (!c.req.path.startsWith("/public/")) {
      c.header("cache-control", "no-store");
    }
  });

  app.use("*", authentication);

  app.use(ROUTES.home.path, ...home);
  app.use(ROUTES.login.path, ...login);
  app.use(ROUTES.logout.path, ...logout);
  app.use(ROUTES.sso.path, ...sso);
  app.use(ROUTES.check.path, ...check);
  app.use(ROUTES.oauthStart.path, ...oauthStart);
  app.use(ROUTES.oauthCallback.path, ...oauthCallback);

  app.onError((err, c) => {
    console.error(err);
    const message = err instanceof Error
      ? err.message
      : "An unexpected error occurred";

    return c.html(
      <ErrorPage
        title="Error"
        message={message}
        returnPath="/"
        returnLabel="Back"
      />,
      500,
    );
  });

  app.notFound((c) => {
    return c.html(<NotFoundPage />, 404);
  });

  return app;
}
