import { Expr } from "@dldc/zendb";
import { Config } from "../../config/config.ts";
import type { TOAuthProviderName } from "../../oauth.ts";
import { Db } from "../db.ts";
import { schema } from "../schema.ts";

export function create(
  provider: TOAuthProviderName,
  codeVerifier: string,
  token: string,
) {
  return Db.get().exec(
    schema.tables.oauthSessions.insert({
      provider,
      codeVerifier,
      token,
      expiresAt: Temporal.Now.instant().add({
        seconds: Config.get().oauth.sessionDurationSeconds,
      }),
    }),
  );
}

export function findByToken(token: string) {
  return Db.get().exec(
    schema.tables.oauthSessions.query().andFilterEqual({ token })
      .maybeOne(),
  );
}

export function removeById(id: string) {
  return Db.get().exec(
    schema.tables.oauthSessions.deleteEqual({ id }),
  );
}

export function deteleExpired() {
  return Db.get().exec(
    schema.tables.oauthSessions.delete((session) =>
      Expr.lowerThan(
        session.expiresAt,
        Expr.external(Temporal.Now.instant().toString()),
      )
    ),
  );
}
