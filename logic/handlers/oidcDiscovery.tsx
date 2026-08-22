import { createPathHandler } from "../factory.ts";
import { ROUTES } from "../routes.ts";
import { buildDiscoveryDocument } from "../oidc/discovery.ts";

export const oidcDiscovery = createPathHandler(ROUTES.oidcDiscovery.path)(
  (c) => {
    return c.json(buildDiscoveryDocument());
  },
);
