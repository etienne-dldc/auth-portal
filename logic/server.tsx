import { Hono } from "@hono/hono";
import { serveStatic } from "@hono/hono/deno";
import { routePath } from "@hono/hono/route";
import { SpanStatusCode, trace } from "@opentelemetry/api";
import console from "node:console";
import { ErrorPage } from "../views/ErrorPage.tsx";
import { NotFoundPage } from "../views/NotFoundPage.tsx";
import type { AppConfig } from "./config/type.ts";

export function createServer(config: AppConfig) {
  const app = new Hono();
  console.log(config);

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
