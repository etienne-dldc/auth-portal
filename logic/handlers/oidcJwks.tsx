import { createPathHandler } from "../factory.ts";
import { ROUTES } from "../routes.ts";
import { getJwks } from "../oidc/jwt.ts";

export const oidcJwks = createPathHandler(ROUTES.oidcJwks.path)(
  (c) => {
    return c.json(getJwks());
  },
);
