import { OAuth2Client } from "@cmd-johnson/oauth2-client";
import { Config } from "./config/config.ts";
import { mountable } from "./mountable.ts";
import { ROUTES } from "./routes.ts";

export const OAUTH_PROVIDERS = ["github", "discord", "google"] as const;

export type TOAuthProviderName = (typeof OAUTH_PROVIDERS)[number];

export const OAuth = mountable(() => {
  const config = Config.get();

  const github = createGitHubOAuthConfig();
  const discord = createDiscordOAuthConfig();
  const google = createGoogleOAuthConfig();

  if (!github && !discord && !google) {
    throw new Error("No OAuth providers enabled, at least one must be enabled");
  }

  const enabledProviders: TOAuthProviderName[] = [];
  if (github) {
    enabledProviders.push("github");
  }
  if (discord) {
    enabledProviders.push("discord");
  }
  if (google) {
    enabledProviders.push("google");
  }

  return {
    value: {
      enabledProviders,
      getClient,
    },
  };

  function getClient(provider: TOAuthProviderName): OAuth2Client {
    switch (provider) {
      case "github":
        if (!github) {
          throw new Error("GitHub OAuth is not enabled");
        }
        return github;
      case "discord":
        if (!discord) {
          throw new Error("Discord OAuth is not enabled");
        }
        return discord;
      case "google":
        if (!google) {
          throw new Error("Google OAuth is not enabled");
        }
        return google;
    }
  }

  function createGitHubOAuthConfig(): OAuth2Client | null {
    if (config.oauth.github === null) {
      return null;
    }
    return new OAuth2Client({
      clientId: config.oauth.github.clientId,
      clientSecret: config.oauth.github.clientSecret,
      authorizationEndpointUri: "https://github.com/login/oauth/authorize",
      tokenUri: "https://github.com/login/oauth/access_token",
      defaults: { scope: ["user:email"] },
      redirectUri: new URL(
        ROUTES.oauthCallback.link({ providerName: "github" }),
        config.origin,
      ).toString(),
    });
  }

  function createDiscordOAuthConfig(): OAuth2Client | null {
    if (config.oauth.discord === null) {
      return null;
    }
    return new OAuth2Client({
      clientId: config.oauth.discord.clientId,
      clientSecret: config.oauth.discord.clientSecret,
      authorizationEndpointUri: "https://discord.com/oauth2/authorize",
      tokenUri: "https://discord.com/api/oauth2/token",
      defaults: { scope: ["email", "identify"] },
      redirectUri: new URL(
        ROUTES.oauthCallback.link({ providerName: "discord" }),
        config.origin,
      ).toString(),
    });
  }

  function createGoogleOAuthConfig(): OAuth2Client | null {
    if (config.oauth.google === null) {
      return null;
    }

    return new OAuth2Client({
      clientId: config.oauth.google.clientId,
      clientSecret: config.oauth.google.clientSecret,
      authorizationEndpointUri: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUri: "https://oauth2.googleapis.com/token",
      defaults: { scope: ["email", "profile"] },
      redirectUri: new URL(
        ROUTES.oauthCallback.link({ providerName: "google" }),
        config.origin,
      ).toString(),
    });
  }
});
