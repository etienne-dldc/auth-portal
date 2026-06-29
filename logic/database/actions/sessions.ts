import { Expr } from "@dldc/zendb";
import { Config } from "../../config/config.ts";
import { Db } from "../db.ts";
import { schema } from "../schema.ts";

export interface TSession {
  id: string;
  username: string;
  token: string;
  expiresAt: Temporal.Instant;
}

export function findByToken(token: string): TSession | null {
  return Db.get().exec(
    schema.tables.sessions.query()
      .andFilterEqual({ token })
      .select(({ id, username, token, expiresAt }) => ({
        id,
        username,
        token,
        expiresAt,
      }))
      .maybeOne(),
  );
}

export function findById(id: string): TSession | null {
  return Db.get().exec(
    schema.tables.sessions.query()
      .andFilterEqual({ id })
      .select(({ id, username, token, expiresAt }) => ({
        id,
        username,
        token,
        expiresAt,
      }))
      .maybeOne(),
  );
}

export function create(username: string) {
  return Db.get().exec(
    schema.tables.sessions.insert({
      username,
      expiresAt: Temporal.Now.instant().add({
        seconds: Config.get().session.durationSeconds,
      }),
    }),
  );
}

export function deleteById(id: string) {
  return Db.get().exec(schema.tables.sessions.deleteEqual({ id }));
}

export function deteleExpired() {
  return Db.get().exec(
    schema.tables.sessions.delete((session) =>
      Expr.lowerThan(
        session.expiresAt,
        Expr.external(Temporal.Now.instant().toString()),
      )
    ),
  );
}
