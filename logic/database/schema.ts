import { Column, Migration, Schema } from "@dldc/zendb";
import { DbSqliteDriver } from "@dldc/zendb-db-sqlite";
import type { TOAuthProviderName } from "../oauth.ts";
import { instantDt } from "./datatypes.ts";
import { createLongToken, createShortId } from "./utils.ts";

const createSessionId = () => `SESS-${createShortId()}`;
const createOAuthSessionId = () => `OAUTH-${createShortId()}`;
const createSSOSessionId = () => `SSO-${createShortId()}`;
const createOidcCodeId = () => `OIDC-CODE-${createShortId()}`;
const createOidcKeyId = () => `OIDC-KEY-${createShortId()}`;

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
    expiresAt: Column.declare(instantDt()),
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
    sessionId: Column.text(),
    expiresAt: Column.declare(instantDt()),
  },
});

export const migration = Migration.init(
  DbSqliteDriver,
  baseSchema,
  ({ database }) => {
    return database;
  },
).step((schema) =>
  Schema.declare({
    sessions: schema.tables.sessions.definition,
    oauthSessions: schema.tables.oauthSessions.definition,
    ssoSessions: schema.tables.ssoSessions.definition,
    oidcCodes: {
      ...baseColumns(),
      id: Column.text().primary().defaultValue(createOidcCodeId),
      code: Column.text().defaultValue(createToken),
      clientId: Column.text(),
      redirectUri: Column.text(),
      username: Column.text(),
      sessionId: Column.text(),
      scope: Column.text(),
      nonce: Column.text().nullable(),
      codeChallenge: Column.text().nullable(),
      codeChallengeMethod: Column.text<"S256" | "plain">().nullable(),
      expiresAt: Column.declare(instantDt()),
    },
    oidcSigningKeys: {
      ...baseColumns(),
      id: Column.text().primary().defaultValue(createOidcKeyId),
      kid: Column.text(),
      privateKeyJwk: Column.text(),
      publicKeyJwk: Column.text(),
      status: Column.text<"active" | "retired">().defaultValue(() => "active"),
      expiresAt: Column.declare(instantDt()),
    },
  })
)(({ copyTable }) => {
  copyTable("sessions", "sessions", (r) => r);
  copyTable("oauthSessions", "oauthSessions", (r) => r);
  copyTable("ssoSessions", "ssoSessions", (r) => r);
  return Promise.resolve();
});

export const schema = migration.schema;
