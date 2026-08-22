import { createPathHandler } from "../factory.ts";
import { verifyJwt } from "../oidc/jwt.ts";
import type { TOidcErrorResponse, TOidcUserInfo } from "../oidc/types.ts";
import { ROUTES } from "../routes.ts";
import { System } from "../system.ts";

export const oidcUserinfo = createPathHandler(ROUTES.oidcUserinfo.path)(
  async (c) => {
    const authHeader = c.req.header("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json(
        {
          error: "invalid_token",
          error_description: "Missing bearer token",
        } satisfies TOidcErrorResponse,
        401,
      );
    }
    const accessToken = authHeader.slice("Bearer ".length);

    let payload: { sub: string; scope?: string };
    try {
      payload = await verifyJwt<{ sub: string; scope?: string }>(accessToken);
    } catch {
      return c.json(
        {
          error: "invalid_token",
          error_description: "Token verification failed",
        } satisfies TOidcErrorResponse,
        401,
      );
    }

    const username = payload.sub;
    const userInfo = System.get().getUserInfo(username);
    const scopes = payload.scope?.split(" ") ?? [];

    const response: TOidcUserInfo = { sub: username };
    if (scopes.includes("profile") && userInfo.name) {
      response.name = userInfo.name;
    }
    if (scopes.includes("email") && userInfo.email) {
      response.email = userInfo.email;
    }

    return c.json(response);
  },
);
