import { Expr } from "@dldc/zendb";
import { Config } from "../../config/config.ts";
import { Db } from "../db.ts";
import { schema } from "../schema.ts";

export interface TOidcCode {
  id: string;
  code: string;
  clientId: string;
  redirectUri: string;
  username: string;
  sessionId: string;
  scope: string;
  nonce: string | null;
  codeChallenge: string | null;
  codeChallengeMethod: "S256" | "plain" | null;
  expiresAt: Temporal.Instant;
}

export function create(params: {
  clientId: string;
  redirectUri: string;
  username: string;
  sessionId: string;
  scope: string;
  nonce?: string;
  codeChallenge?: string;
  codeChallengeMethod?: "S256" | "plain";
}): TOidcCode {
  return Db.get().exec(
    schema.tables.oidcCodes.insert({
      clientId: params.clientId,
      redirectUri: params.redirectUri,
      username: params.username,
      sessionId: params.sessionId,
      scope: params.scope,
      nonce: params.nonce ?? null,
      codeChallenge: params.codeChallenge ?? null,
      codeChallengeMethod: params.codeChallengeMethod ?? null,
      expiresAt: Temporal.Now.instant().add({
        seconds: Config.get().oidc.codeDurationSeconds,
      }),
    }),
  );
}

export function findByCode(code: string): TOidcCode | null {
  return Db.get().exec(
    schema.tables.oidcCodes.query().andFilterEqual({ code })
      .maybeOne(),
  );
}

export function removeById(id: string) {
  return Db.get().exec(schema.tables.oidcCodes.deleteEqual({ id }));
}

export function deteleExpired() {
  return Db.get().exec(
    schema.tables.oidcCodes.delete((row) =>
      Expr.lowerThan(
        row.expiresAt,
        Expr.external(Temporal.Now.instant().toString()),
      )
    ),
  );
}
