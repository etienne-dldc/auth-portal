import {
  exportJWK,
  generateKeyPair,
  importJWK,
  type JWK,
  jwtVerify,
  SignJWT,
} from "@panva/jose";
import { Config } from "../config/config.ts";
import * as db from "../database/actions.ts";

export interface SignedToken {
  token: string;
  kid: string;
}

async function getActiveKey(): Promise<
  { kid: string; privateKey: JWK; publicKey: JWK }
> {
  const active = db.oidcSigningKeys.findActive();
  if (active) {
    return {
      kid: active.kid,
      privateKey: JSON.parse(active.privateKeyJwk),
      publicKey: JSON.parse(active.publicKeyJwk),
    };
  }
  return await generateAndStoreKey();
}

async function generateAndStoreKey(): Promise<
  { kid: string; privateKey: JWK; publicKey: JWK }
> {
  const { publicKey, privateKey } = await generateKeyPair("RS256", {
    modulusLength: 2048,
    extractable: true,
  });
  const privateJwk = await exportJWK(privateKey);
  const publicJwk = await exportJWK(publicKey);
  const kid = crypto.randomUUID();
  privateJwk.kid = kid;
  privateJwk.alg = "RS256";
  publicJwk.kid = kid;
  publicJwk.alg = "RS256";

  const keyRotationMs = Config.get().oidc.keyRotationSeconds * 1000;
  const expiresAt = Temporal.Now.instant().add({
    milliseconds: keyRotationMs * 2,
  });

  db.oidcSigningKeys.create({
    kid,
    privateKeyJwk: JSON.stringify(privateJwk),
    publicKeyJwk: JSON.stringify(publicJwk),
    expiresAt,
  });

  return { kid, privateKey: privateJwk, publicKey: publicJwk };
}

export async function signJwt(
  payload: Record<string, unknown>,
): Promise<SignedToken> {
  const { kid, privateKey } = await getActiveKey();
  const key = await importJWK(privateKey, "RS256");
  const token = await new SignJWT(payload)
    .setProtectedHeader({ typ: "JWT", alg: "RS256", kid })
    .sign(key);
  return { token, kid };
}

export async function verifyJwt<T = Record<string, unknown>>(
  token: string,
): Promise<T> {
  const [headerB64] = token.split(".");
  const header = JSON.parse(atob(headerB64));
  const kid = header.kid;
  if (!kid) throw new Error("JWT header missing kid");

  const keys = db.oidcSigningKeys.findAllValid();
  const keyRecord = keys.find((k) => k.kid === kid);
  if (!keyRecord) throw new Error("No matching key found for kid");

  const publicKey = JSON.parse(keyRecord.publicKeyJwk);
  const { payload } = await jwtVerify(token, publicKey, {
    algorithms: ["RS256"],
  });
  return payload as T;
}

export function getJwks(): { keys: JWK[] } {
  const keys = db.oidcSigningKeys.findAllValid();
  return {
    keys: keys.map((k) => {
      const jwk = JSON.parse(k.publicKeyJwk);
      return { ...jwk, use: "sig", alg: "RS256" };
    }),
  };
}

export async function checkAndRotateKeys(): Promise<void> {
  const active = db.oidcSigningKeys.findActive();
  if (!active) {
    await generateAndStoreKey();
    return;
  }

  const now = Temporal.Now.instant();
  const keyRotationMs = Config.get().oidc.keyRotationSeconds * 1000;
  const rotationInstant = active.expiresAt.subtract({
    milliseconds: keyRotationMs,
  });
  if (Temporal.Instant.compare(now, rotationInstant) >= 0) {
    db.oidcSigningKeys.retireById(active.id);
    await generateAndStoreKey();
  }
}
