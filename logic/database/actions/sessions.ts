import { Db } from "../db.ts";
import { schema } from "../schema.ts";

export interface TSession {
  id: string;
  username: string;
}

export function findByToken(token: string): TSession | null {
  return Db.get().exec(
    schema.tables.sessions.query()
      .andFilterEqual({ token })
      .select(({ id, username }) => ({ id, username }))
      .maybeOne(),
  );
}

export function create(username: string) {
  return Db.get().exec(schema.tables.sessions.insert({ username }));
}

export function deleteById(id: string) {
  return Db.get().exec(schema.tables.sessions.deleteEqual({ id }));
}
