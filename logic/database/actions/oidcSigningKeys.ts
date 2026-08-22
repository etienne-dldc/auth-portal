import { Expr } from "@dldc/zendb";
import { Db } from "../db.ts";
import { schema } from "../schema.ts";

export interface TOidcSigningKey {
  id: string;
  kid: string;
  privateKeyJwk: string;
  publicKeyJwk: string;
  status: "active" | "retired";
  expiresAt: Temporal.Instant;
}

export function findActive(): TOidcSigningKey | null {
  return Db.get().exec(
    schema.tables.oidcSigningKeys.query().andFilterEqual({ status: "active" })
      .select((
        { id, kid, privateKeyJwk, publicKeyJwk, status, expiresAt },
      ) => ({
        id,
        kid,
        privateKeyJwk,
        publicKeyJwk,
        status,
        expiresAt,
      }))
      .maybeOne(),
  );
}

export function findAllValid(): TOidcSigningKey[] {
  return Db.get().exec(
    schema.tables.oidcSigningKeys.query()
      .andWhere((row) =>
        Expr.greaterThanOrEqual(
          row.expiresAt,
          Expr.external(Temporal.Now.instant().toString()),
        )
      )
      .select((
        { id, kid, privateKeyJwk, publicKeyJwk, status, expiresAt },
      ) => ({
        id,
        kid,
        privateKeyJwk,
        publicKeyJwk,
        status,
        expiresAt,
      }))
      .all(),
  );
}

export function create(params: {
  kid: string;
  privateKeyJwk: string;
  publicKeyJwk: string;
  expiresAt: Temporal.Instant;
}): TOidcSigningKey {
  return Db.get().exec(
    schema.tables.oidcSigningKeys.insert({
      kid: params.kid,
      privateKeyJwk: params.privateKeyJwk,
      publicKeyJwk: params.publicKeyJwk,
      status: "active",
      expiresAt: params.expiresAt,
    }),
  );
}

export function retireById(id: string) {
  return Db.get().exec(
    schema.tables.oidcSigningKeys.updateEqual({ id }, { status: "retired" }),
  );
}

export function deteleExpired() {
  return Db.get().exec(
    schema.tables.oidcSigningKeys.delete((row) =>
      Expr.lowerThan(
        row.expiresAt,
        Expr.external(Temporal.Now.instant().toString()),
      )
    ),
  );
}
