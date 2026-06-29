import { SessionTokenCookie } from "../cookies.ts";
import * as db from "../database/actions.ts";
import { createMiddleware } from "../factory.ts";
import { isSessionValid } from "../helpers/isValidSession.ts";

export const authentication = createMiddleware(
  async (c, next) => {
    const sessionToken = await SessionTokenCookie.get().read(c);
    if (!sessionToken) {
      c.set("session", null);
      return next();
    }
    const session = db.sessions.findByToken(sessionToken);
    if (!isSessionValid(session)) {
      await SessionTokenCookie.get().write(c, null);
      c.set("session", null);
      return next();
    }
    c.set("session", session);
    return next();
  },
);
