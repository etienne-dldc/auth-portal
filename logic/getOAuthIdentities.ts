import type { Tokens } from "@cmd-johnson/oauth2-client";
import * as v from "@valibot/valibot";
import type { TIdentityOAuth } from "./identity.ts";
import type { TOAuthProviderName } from "./oauth.ts";

export interface TOAuthEmails {
  verified: string[];
  unverified: string[];
}

const GET_EMAILS_BY_PROVIDER = {
  github: getGithubIdentities,
  discord: getDiscordIdentities,
  google: getGoogleIdentities,
} as const;

export function getOAuthIdentities(
  provider: TOAuthProviderName,
  token: Tokens,
): Promise<TIdentityOAuth[]> {
  return GET_EMAILS_BY_PROVIDER[provider](token);
}

const GitHubEmailSchema = v.array(v.object({
  email: v.string(),
  primary: v.boolean(),
  verified: v.boolean(),
}));

const GitHubUserSchema = v.object({
  login: v.string(),
});

export async function getGithubIdentities(
  token: Tokens,
): Promise<TIdentityOAuth[]> {
  if (token.tokenType.toLowerCase() !== "bearer" || !token.accessToken) {
    throw new Error("Invalid token type");
  }
  const accessToken = token.accessToken;
  const userResponse = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!userResponse.ok) {
    console.error(userResponse);
    throw new Error("Failed to fetch GitHub user");
  }
  const userData = await userResponse.json();
  const user = v.parse(GitHubUserSchema, userData);
  const githubUsername = user.login;

  const emailsResponse = await fetch("https://api.github.com/user/emails", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!emailsResponse.ok) {
    console.error(emailsResponse);
    throw new Error("Failed to fetch GitHub emails");
  }
  const data = await emailsResponse.json();
  const res = v.parse(GitHubEmailSchema, data);
  return [
    { kind: "github_username", value: githubUsername },
    ...res.filter((email) => email.verified).map((email): TIdentityOAuth => ({
      kind: "github_verified_email",
      value: email.email,
    })),
  ];
}

const DiscordUserSchema = v.object({
  email: v.string(),
  verified: v.boolean(),
  username: v.string(),
});

export async function getDiscordIdentities(
  token: Tokens,
): Promise<TIdentityOAuth[]> {
  if (token.tokenType.toLowerCase() !== "bearer" || !token.accessToken) {
    throw new Error("Invalid token type");
  }
  const accessToken = token.accessToken;
  const response = await fetch("https://discord.com/api/v10/users/@me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    console.error(response);
    console.error(await response.text());
    throw new Error("Failed to fetch Discord email");
  }
  const data = await response.json();
  const res = v.parse(DiscordUserSchema, data);
  const verifiedEmailIdentities: TIdentityOAuth[] = res.verified
    ? [{ kind: "discord_verified_email", value: res.email }]
    : [];
  return [
    { kind: "discord_username", value: res.username },
    ...verifiedEmailIdentities,
  ];
}

const GoogleEmailsSchema = v.object({
  emailAddresses: v.array(v.object({
    value: v.string(),
    metadata: v.object({
      verified: v.boolean(),
    }),
  })),
});

export async function getGoogleIdentities(
  token: Tokens,
): Promise<TIdentityOAuth[]> {
  if (token.tokenType.toLowerCase() !== "bearer" || !token.accessToken) {
    throw new Error("Invalid token type");
  }
  const accessToken = token.accessToken;
  const response = await fetch(
    "https://people.googleapis.com/v1/people/me?personFields=emailAddresses",
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!response.ok) {
    console.error(response);
    console.error(await response.text());
    throw new Error("Failed to fetch Google emails");
  }
  const data = await response.json();
  const res = v.parse(GoogleEmailsSchema, data).emailAddresses;
  return res.filter((email) => email.metadata.verified).map((
    email,
  ): TIdentityOAuth => ({
    kind: "google_verified_email",
    value: email.value,
  }));
}
