export interface TOidcAuthorizationRequest {
  clientId: string;
  redirectUri: string;
  responseType: string;
  scope: string;
  state?: string;
  nonce?: string;
  codeChallenge?: string;
  codeChallengeMethod?: "S256" | "plain";
}

export interface TOidcTokenRequest {
  grantType: string;
  code?: string;
  redirectUri?: string;
  codeVerifier?: string;
  clientId?: string;
  clientSecret?: string;
}

export interface TOidcTokenResponse {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  scope?: string;
  id_token: string;
}

export interface TOidcUserInfo {
  sub: string;
  name?: string;
  email?: string;
  [claim: string]: unknown;
}

export type TOidcErrorCode =
  | "invalid_request"
  | "invalid_client"
  | "invalid_grant"
  | "unsupported_grant_type"
  | "invalid_scope"
  | "access_denied"
  | "invalid_token"
  | "server_error"
  | "temporarily_unavailable";

export interface TOidcErrorResponse {
  error: TOidcErrorCode;
  error_description?: string;
}
