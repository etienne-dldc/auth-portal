import { SessionTokenCookie } from "../cookies.ts";
import * as db from "../database/actions.ts";
import { createPathHandler } from "../factory.ts";
import { ROUTES } from "../routes.ts";

export const logout = createPathHandler(ROUTES.logout.path)(
  async (c) => {
    const session = c.get("session");
    if (!session) {
      return c.redirect(ROUTES.login.path);
    }
    db.sessions.create(session.id);
    await SessionTokenCookie.get().write(c, null);
    return c.redirect(ROUTES.login.path);
  },
);
