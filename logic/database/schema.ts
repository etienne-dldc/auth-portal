import { Column, Migration, Schema } from "@dldc/zendb";
import { DbSqliteDriver } from "@dldc/zendb-db-sqlite";
import type { TOAuthProviderName } from "../oauth.ts";
import { instantDt } from "./datatypes.ts";
import { createLongToken, createShortId } from "./utils.ts";

const createSessionId = () => `SESS-${createShortId()}`;
const createOAuthSessionId = () => `OAUTH-${createShortId()}`;
const createSSOSessionId = () => `SSO-${createShortId()}`;

export const createToken = () => createLongToken();

function baseColumns() {
  return {
    createdAt: Column.declare(instantDt()).defaultValue(() =>
      Temporal.Now.instant()
    ),
    updatedAt: Column.declare(instantDt()).defaultValue(() =>
      Temporal.Now.instant()
    ),
  } as const;
}

const baseSchema = Schema.declare({
  sessions: {
    ...baseColumns(),
    id: Column.text().primary().defaultValue(createSessionId),
    token: Column.text().defaultValue(createToken),
    username: Column.text(),
  },
  oauthSessions: {
    ...baseColumns(),
    id: Column.text().primary().defaultValue(createOAuthSessionId),
    token: Column.text(),
    codeVerifier: Column.text(),
    provider: Column.text<TOAuthProviderName>(),
    expiresAt: Column.declare(instantDt()),
  },
  ssoSessions: {
    ...baseColumns(),
    id: Column.text().primary().defaultValue(createSSOSessionId),
    token: Column.text().defaultValue(createToken),
    username: Column.text(),
    expiresAt: Column.declare(instantDt()),
  },
});

export const migration = Migration.init(
  DbSqliteDriver,
  baseSchema,
  ({ database }) => {
    return database;
  },
);

export const schema = migration.schema;
