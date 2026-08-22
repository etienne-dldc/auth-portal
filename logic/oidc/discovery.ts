import { Config } from "../config/config.ts";

export function buildDiscoveryDocument(): Record<
  string,
  string | string[] | undefined
> {
  const config = Config.get();
  const issuer = `${config.origin}/oidc`;

  return {
    issuer,
    authorization_endpoint: `${config.origin}/oidc/authorize`,
    token_endpoint: `${config.origin}/oidc/token`,
    userinfo_endpoint: `${config.origin}/oidc/userinfo`,
    jwks_uri: `${config.origin}/oidc/jwks.json`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code"],
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["RS256"],
    scopes_supported: ["openid", "profile", "email"],
    token_endpoint_auth_methods_supported: [
      "client_secret_basic",
      "client_secret_post",
      "none",
    ],
    claims_supported: [
      "sub",
      "aud",
      "iss",
      "exp",
      "iat",
      "nbf",
      "nonce",
      "name",
      "email",
    ],
    code_challenge_methods_supported: ["S256", "plain"],
  };
}
