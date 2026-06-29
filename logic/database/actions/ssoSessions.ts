import { Expr } from "@dldc/zendb";
import { Config } from "../../config/config.ts";
import { Db } from "../db.ts";
import { schema } from "../schema.ts";

export function create(sessionId: string) {
  return Db.get().exec(
    schema.tables.ssoSessions.insert({
      sessionId,
      expiresAt: Temporal.Now.instant().add({
        seconds: Config.get().oauth.sessionDurationSeconds,
      }),
    }),
  );
}

export function findByToken(token: string) {
  return Db.get().exec(
    schema.tables.ssoSessions.query().andFilterEqual({ token })
      .maybeOne(),
  );
}

export function removeById(id: string) {
  return Db.get().exec(
    schema.tables.ssoSessions.deleteEqual({ id }),
  );
}

export function removeBySessionId(sessionId: string) {
  return Db.get().exec(
    schema.tables.ssoSessions.deleteEqual({ sessionId }),
  );
}

export function deteleExpired() {
  return Db.get().exec(
    schema.tables.ssoSessions.delete((session) =>
      Expr.lowerThan(
        session.expiresAt,
        Expr.external(Temporal.Now.instant().toString()),
      )
    ),
  );
}
