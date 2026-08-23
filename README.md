# Auth Portal

> A simple web UI to authenticate. Made to be used with Caddy forward_auth

## Table of contents

- [Configuration](#configuration)
  - [Environment variables](#environment-variables)
  - [YAML config file](#yaml-config-file)
    - [Users](#users)
    - [Groups](#groups)
    - [Apps](#apps)
    - [OIDC clients](#oidc-clients)
    - [Full example](#full-example)
  - [CLI arguments](#cli-arguments)
- [OIDC Issuer](#oidc-issuer)
- [AJAX / API request handling](#ajax--api-request-handling)

---

## Configuration

Auth Portal is configured via environment variables (or a `.env` file) and a
YAML config file.

### Environment variables

| Variable                             | Default                                       | Description                                                                     |
| ------------------------------------ | --------------------------------------------- | ------------------------------------------------------------------------------- |
| `ORIGIN`                             | — (required)                                  | The public origin of the auth-portal instance (e.g. `https://auth.example.com`) |
| `CONFIG_PATH`                        | `/data/config.yaml`                           | Path to the YAML config file                                                    |
| `DATABASE_PATH`                      | `/data/db.sqlite`                             | Path to the SQLite database                                                     |
| `SECURE_COOKIES`                     | `true`                                        | Whether cookies should be `Secure` (set to `false` for local dev over HTTP)     |
| `PORT`                               | `3000`                                        | Port to listen on                                                               |
| `OTEL_DENO`                          | `false`                                       | Enable OpenTelemetry for Deno runtime                                           |
| `SESSION_COOKIE_NAME`                | `auth_portal_v1`                              | Session cookie name                                                             |
| `SESSION_SESSION_DURATION_SECONDS`   | `604800` (7 days)                             | Session lifetime                                                                |
| `OAUTH_SESSION_KEY_COOKIE_NAME`      | `auth_portal_oauth_session_key`               | OAuth flow cookie name                                                          |
| `OAUTH_SESSION_DURATION_SECONDS`     | `300` (5 min)                                 | OAuth flow timeout                                                              |
| `OAUTH_GITHUB_ENABLED`               | `false`                                       | Enable GitHub OAuth                                                             |
| `OAUTH_GITHUB_CLIENT_ID`             | —                                             | GitHub OAuth client ID                                                          |
| `OAUTH_GITHUB_CLIENT_SECRET`         | —                                             | GitHub OAuth client secret                                                      |
| `OAUTH_GITHUB_API_URL`               | `https://api.github.com`                      | GitHub API base URL (for testing)                                               |
| `OAUTH_GITHUB_AUTHORIZE_URL`         | `https://github.com/login/oauth/authorize`    | GitHub OAuth authorize URL (for testing)                                        |
| `OAUTH_GITHUB_TOKEN_URL`             | `https://github.com/login/oauth/access_token` | GitHub OAuth token URL (for testing)                                            |
| `OAUTH_GOOGLE_ENABLED`               | `false`                                       | Enable Google OAuth                                                             |
| `OAUTH_GOOGLE_CLIENT_ID`             | —                                             | Google OAuth client ID                                                          |
| `OAUTH_GOOGLE_CLIENT_SECRET`         | —                                             | Google OAuth client secret                                                      |
| `OAUTH_DISCORD_ENABLED`              | `false`                                       | Enable Discord OAuth                                                            |
| `OAUTH_DISCORD_CLIENT_ID`            | —                                             | Discord OAuth client ID                                                         |
| `OAUTH_DISCORD_CLIENT_SECRET`        | —                                             | Discord OAuth client secret                                                     |
| `SSO_TOKEN_NAME`                     | `auth-portal-sso-token`                       | Query parameter name for SSO tokens                                             |
| `SSO_SESSION_DURATION_SECONDS`       | `60` (1 min)                                  | SSO session lifetime                                                            |
| `OIDC_AUTH_REQUEST_COOKIE_NAME`      | `auth_portal_oidc_req_v1`                     | OIDC auth request cookie name                                                   |
| `OIDC_AUTH_REQUEST_DURATION_SECONDS` | `300` (5 min)                                 | How long the OIDC auth request cookie is valid                                  |
| `OIDC_CODE_DURATION_SECONDS`         | `60` (1 min)                                  | Authorization code lifetime                                                     |
| `OIDC_ACCESS_TOKEN_DURATION_SECONDS` | `3600` (1 hour)                               | Access token lifetime                                                           |
| `OIDC_KEY_ROTATION_SECONDS`          | `7776000` (90 days)                           | Signing key rotation interval                                                   |

### YAML config file

The YAML config file defines **users**, **groups**, **apps** (for forward_auth /
SSO), and **oidc_clients** (for the OIDC issuer).

#### Users

Users are defined as a map keyed by username. Usernames must be 3–32 characters,
matching `[a-zA-Z0-9_-]`.

Each user can have the following fields:

| Field                                 | Type                | Description                                                               |
| ------------------------------------- | ------------------- | ------------------------------------------------------------------------- |
| `name`                                | string (optional)   | Display name (used in OIDC `profile` claims and `/check` `X-Name` header) |
| `email`                               | string (optional)   | Email address (used in OIDC `email` claims and `/check` `X-Email` header) |
| `auth_methods`                        | object (optional)   | Nested authentication methods (preferred format)                          |
| `auth_methods.github_username`        | string (optional)   | GitHub username                                                           |
| `auth_methods.discord_username`       | string (optional)   | Discord username                                                          |
| `auth_methods.github_verified_email`  | string (optional)   | GitHub verified email                                                     |
| `auth_methods.google_verified_email`  | string (optional)   | Google verified email                                                     |
| `auth_methods.discord_verified_email` | string (optional)   | Discord verified email                                                    |
| `auth_methods.basic_auth_argon2`      | string[] (optional) | Argon2 password hashes (for HTTP Basic Auth)                              |

The following legacy flat fields are also supported (same as their
`auth_methods.*` counterparts): `github_username`, `discord_username`,
`github_verified_email`, `google_verified_email`, `discord_verified_email`,
`basic_auth_argon2`.

```yaml
users:
  alice:
    name: Alice Smith
    email: alice@example.com
    auth_methods:
      github_username: alice-smith
      github_verified_email: alice@example.com
      basic_auth_argon2:
        - "$argon2id$v=19$m=65536,t=3,p=4$..."
```

#### Groups

Groups are defined as a map keyed by group name. Each group is a list of
usernames. Group names follow the same rules as usernames. Groups cannot
reference other groups.

```yaml
groups:
  admin:
    - alice
    - bob
  developers:
    - charlie
```

#### Apps

Apps are used by the `/check` (forward_auth) and `/sso` endpoints. Each app is
identified by its origin.

| Field     | Type                | Description                                                 |
| --------- | ------------------- | ----------------------------------------------------------- |
| `origin`  | string (required)   | The origin of the app (e.g. `https://app.example.com`)      |
| `name`    | string (optional)   | Display name (shown on the home page)                       |
| `allowed` | string[] (optional) | List of usernames or group names allowed to access this app |
| `public`  | boolean (optional)  | If `true`, any authenticated user can access this app       |

Either `allowed` or `public: true` must be specified.

```yaml
apps:
  - name: "Dashboard"
    origin: "https://dashboard.example.com"
    allowed:
      - admin
  - origin: "https://wiki.example.com"
    public: true
```

#### OIDC clients

OIDC clients are registered for the [OIDC issuer](#oidc-issuer). Each client is
identified by its `client_id`.

| Field           | Type                | Description                                                                   |
| --------------- | ------------------- | ----------------------------------------------------------------------------- |
| `client_id`     | string (required)   | Unique client identifier                                                      |
| `client_secret` | string (optional)   | Client secret (required for confidential clients, omitted for public clients) |
| `redirect_uris` | string[] (required) | List of valid redirect URIs (exact match)                                     |
| `allowed`       | string[] (optional) | List of usernames or group names allowed to use this client                   |
| `public`        | boolean (optional)  | If `true`, the client is public (PKCE required, no secret)                    |
| `scopes`        | string[] (optional) | Allowed scopes (defaults to `[openid, profile, email]`)                       |

Either `allowed` or `public: true` must be specified.

```yaml
oidc_clients:
  # Confidential client (server-side app with a secret)
  - client_id: "my-confidential-app"
    client_secret: "change-me-in-production"
    redirect_uris:
      - "https://my-app.example.com/auth/callback"
    allowed:
      - admin
    scopes:
      - openid
      - profile
      - email

  # Public client (SPA / mobile app — PKCE required)
  - client_id: "my-public-spa"
    redirect_uris:
      - "http://localhost:5173/auth/callback"
    public: true
    scopes:
      - openid
      - profile
```

#### Full example

```yaml
users:
  alice:
    name: Alice Smith
    email: alice@example.com
    auth_methods:
      github_username: alice-smith
      github_verified_email: alice@example.com
      basic_auth_argon2:
        - "$argon2id$v=19$m=65536,t=3,p=4$..."
  bob:
    name: Bob Jones
    email: bob@example.com
    auth_methods:
      google_verified_email: bob@example.com

groups:
  admin:
    - alice

apps:
  - name: "Dashboard"
    origin: "https://dashboard.example.com"
    allowed:
      - admin
  - origin: "https://wiki.example.com"
    public: true

oidc_clients:
  - client_id: "my-confidential-app"
    client_secret: "change-me-in-production"
    redirect_uris:
      - "https://my-app.example.com/auth/callback"
    allowed:
      - admin
    scopes:
      - openid
      - profile
      - email
  - client_id: "my-public-spa"
    redirect_uris:
      - "http://localhost:5173/auth/callback"
    public: true
    scopes:
      - openid
      - profile
```

### CLI arguments

Most environment variables can also be set via CLI arguments using dotted keys
with kebab-case. For example:

```sh
deno run -A main.tsx --port 8080 --oidc.code-duration-seconds 120
```

---

## OIDC Issuer

Auth Portal can act as an
[OpenID Connect Provider](https://openid.net/specs/openid-connect-core-1_0.html),
serving standard OIDC endpoints on the `/oidc/` sub-path.

### Endpoints

| Endpoint      | Path                                         |
| ------------- | -------------------------------------------- |
| Discovery     | `GET /oidc/.well-known/openid-configuration` |
| JWKS          | `GET /oidc/jwks.json`                        |
| Authorization | `GET /oidc/authorize`                        |
| Token         | `POST /oidc/token`                           |
| UserInfo      | `GET /oidc/userinfo`                         |

### Supported features

- **Authorization Code flow with PKCE** (RFC 6749 + RFC 7636)
- **Client authentication methods**: `client_secret_basic`,
  `client_secret_post`, `none` (public client with PKCE)
- **JWT-based access tokens and ID tokens** signed with RS256
- **Signing key rotation** — keys are persisted to SQLite and rotated
  automatically
- **Reuse of existing sessions** — no separate OIDC login; if the user has a
  session, the authorization code is issued immediately

### Scopes and claims

| Scope               | Claims                                          |
| ------------------- | ----------------------------------------------- |
| `openid` (required) | `sub`, `iss`, `aud`, `exp`, `iat`, `nbf`, `jti` |
| `profile`           | `name`                                          |
| `email`             | `email`                                         |

If a `nonce` is provided in the authorization request, it is included in the ID
token.

### Key rotation

Signing keys are generated as 2048-bit RSA key pairs and stored in the database.
The active key is used for signing new tokens. When the rotation interval
(`OIDC_KEY_ROTATION_SECONDS`, default 90 days) elapses:

1. The active key is marked as "retired" (still available for verification)
2. A new active key is generated

Retired keys remain in the JWKS until their TTL expires (2x the rotation
interval), so in-flight tokens can still be verified during the overlap period.

### Usage example

```sh
# 1. Discovery
curl https://auth.example.com/oidc/.well-known/openid-configuration

# 2. Authorize (redirects to login if no session, then back to /oidc/authorize)
#    After login, redirects to redirect_uri with ?code=...&state=...

# 3. Token exchange
curl -X POST https://auth.example.com/oidc/token \
  -u "client_id:client_secret" \
  -d "grant_type=authorization_code" \
  -d "code=<code>" \
  -d "redirect_uri=https://app.example.com/auth/callback"

# 4. UserInfo
curl https://auth.example.com/oidc/userinfo \
  -H "Authorization: Bearer <access_token>"
```

---

## AJAX / API request handling

When a session expires, the `/check` endpoint normally responds with a `302`
redirect to the SSO login flow. This works for page navigations (the browser
follows the redirect), but breaks for `fetch()` / XHR requests because the
browser **silently follows** the redirect chain and ends up receiving the login
page HTML as a successful (200) response.

To handle this, `/check` detects API/fetch requests and returns a **`401` JSON
response** instead of a `302` redirect:

```json
{
  "error": "unauthorized",
  "loginUrl": "https://auth.example.com/sso?redirect=https%3A%2F%2Fapp.example.com"
}
```

### How requests are detected as AJAX

A request is treated as an API request if **any** of the following is true:

| Signal         | Header             | Condition                                              |
| -------------- | ------------------ | ------------------------------------------------------ |
| XHR header     | `X-Requested-With` | `XMLHttpRequest`                                       |
| Accept         | `Accept`           | Contains `application/json`                            |
| Fetch metadata | `Sec-Fetch-Mode`   | Not `navigate` (i.e. `cors`, `no-cors`, `same-origin`) |

### Overriding the behavior with a custom header

The `X-Auth-Portal-Behavior` header lets you force a specific response
**regardless** of the auto-detection above. This is useful for PWAs or SPAs
where you want to guarantee a particular behavior irrespective of how the
request is made. The value is case-insensitive; any value other than `fail` or
`redirect` is ignored.

| Value      | Response                                 |
| ---------- | ---------------------------------------- |
| `fail`     | Return `401` JSON (force API behavior)   |
| `redirect` | Return `302` redirect (force navigation) |

```ts
fetch("/api/data", {
  headers: { "X-Auth-Portal-Behavior": "fail" },
});
```

### Client-side handling

In your app, add a global `fetch` wrapper that detects the `401` and triggers a
full-page navigation (which the browser handles correctly through the normal
`forward_auth` redirect chain):

```ts
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const res = await originalFetch(...args);
  if (res.status === 401) {
    const body = await res.clone().json().catch(() => null);
    if (body?.loginUrl) {
      window.location.href = body.loginUrl;
    }
  }
  return res;
};
```
