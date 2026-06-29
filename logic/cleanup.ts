import * as db from "./database/actions.ts";
import { mountable } from "./mountable.ts";

export const Cleanup = mountable(() => {
  const timer = setInterval(() => {
    db.sessions.deteleExpired();
    db.oauthSessions.deteleExpired();
    db.ssoSessions.deteleExpired();
  }, 5 * 60 * 1000);

  return {
    value: undefined,
    unmount() {
      clearInterval(timer);
    },
  };
});
