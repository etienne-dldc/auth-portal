export type TIdentityOAuth =
  | { kind: "github_username"; value: string }
  | { kind: "discord_username"; value: string }
  | { kind: "discord_verified_email"; value: string }
  | { kind: "google_verified_email"; value: string }
  | { kind: "github_verified_email"; value: string };

export type TIdentityToken = { kind: "basic_auth_argon2"; value: string };

export type TIdentity = TIdentityOAuth | TIdentityToken;

export function identityToString(identity: TIdentity): string {
  return `${identity.kind}:${identity.value}`;
}
