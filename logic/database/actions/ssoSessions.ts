import { Config } from "../../config/config.ts";
import { Db } from "../db.ts";
import { schema } from "../schema.ts";

export function create(username: string) {
  return Db.get().exec(
    schema.tables.ssoSessions.insert({
      username,
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
