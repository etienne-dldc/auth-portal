import { verify } from "@felix/argon2";
import { parse } from "@std/yaml";
import * as v from "@valibot/valibot";
import { Config } from "./config/config.ts";
import {
  identityToString,
  type TIdentity,
  type TIdentityOAuth,
} from "./identity.ts";
import { mountable, type TMountResult } from "./mountable.ts";

const usernameSchema = v.pipe(
  v.string(),
  v.minLength(3),
  v.maxLength(32),
  v.regex(/^[a-zA-Z0-9_-]+$/),
);

const userSchema = v.object({
  github_username: v.optional(v.string()),
  discord_username: v.optional(v.string()),
  github_verified_email: v.optional(v.string()),
  google_verified_email: v.optional(v.string()),
  basic_auth_argon2: v.optional(v.array(v.string())),
});

const usersSchema = v.record(
  usernameSchema,
  userSchema,
);

const groupsSchema = v.record(usernameSchema, v.array(usernameSchema));

const originSchema = v.pipe(
  v.string(),
  v.regex(/^http(s)?:\/\/[a-zA-Z0-9.-]+(:[0-9]+)?$/),
);

const appsSchema = v.array(v.object({
  origin: originSchema,
  name: v.optional(v.string()),
  allowed: v.optional(v.array(usernameSchema)),
  public: v.optional(v.boolean()),
}));

const systemSchema = v.object({
  users: usersSchema,
  groups: v.optional(groupsSchema),
  apps: appsSchema,
});

export type TSystemData = v.InferOutput<typeof systemSchema>;

export interface TSystemApp {
  origin: string;
  name?: string;
}

export interface TSystem {
  /**
   * Given a list of identities, resolve the corresponding username.
   * @param identities
   */
  resolveOAuthIdentity(identities: TIdentityOAuth[]): string | null;

  /** */
  isAllowed(redirectUrl: string, username: string): boolean;

  verifyBasicAuth(username: string, password: string): Promise<boolean>;

  getAppsForUser(username: string): TSystemApp[];
}

export const System = mountable(async (): Promise<TMountResult<TSystem>> => {
  const config = Config.get();

  const fileContent = await Deno.readTextFile(config.configPath);
  const content = parse(fileContent, { allowDuplicateKeys: false });

  const systemParsed = v.safeParse(systemSchema, content);

  if (!systemParsed.success) {
    const errors = v.flatten(systemParsed.issues);
    throw new Error(`Invalid config file`, { cause: errors });
  }

  const system = systemParsed.output;

  // Validate that groups name don't conflict with usernames
  const usernames = Object.keys(system.users);
  const usernamesSet = new Set(usernames);
  const groups = Object.entries(system.groups ?? {}).map(([name, users]) => ({
    name,
    users,
  }));
  const groupNamesSet = new Set(groups.map((group) => group.name));
  groups.forEach((group) => {
    if (usernamesSet.has(group.name)) {
      throw new Error(
        `Invalid config file: group name "${group.name}" conflicts with a username`,
      );
    }
  });

  // Validate that each identity value is unique across all users
  const identityValues = new Set<string>();
  Object.entries(system.users).forEach(([username, user]) => {
    getIdentityValues(user).forEach((identity) => {
      const identityValue = identityToString(identity);
      if (identityValues.has(identityValue)) {
        throw new Error(
          `Invalid config file: duplicate identity value "${identityValue}" for user "${username}"`,
        );
      }
      identityValues.add(identityValue);
    });
  });

  // Validate that groups only contain valid usernames
  groups.forEach((group) => {
    group.users.forEach((username) => {
      if (!usernamesSet.has(username)) {
        if (groupNamesSet.has(username)) {
          throw new Error(
            `Invalid config file: group "${group.name}" contains another group "${username}"`,
          );
        }
        throw new Error(
          `Invalid config file: group "${group.name}" contains invalid username "${username}"`,
        );
      }
    });
  });

  // Validate that apps hostnames are unique
  const appOrigins = new Set<string>();
  system.apps.forEach((app) => {
    if (appOrigins.has(app.origin)) {
      throw new Error(
        `Invalid config file: duplicate app origin "${app.origin}"`,
      );
    }
    appOrigins.add(app.origin);
  });

  // Validate that apps have either allowed users or are public
  system.apps.forEach((app) => {
    if (!app.allowed && !app.public) {
      throw new Error(
        `Invalid config file: app "${app.origin}" must have either allowed users or be public`,
      );
    }
  });

  // Validate that apps allowed users are valid usernames or group names
  const allEntities = new Set([
    ...Object.keys(system.users),
    ...Object.keys(system.groups ?? {}),
  ]);
  system.apps.forEach((app) => {
    if (app.allowed) {
      app.allowed.forEach((allowedUser) => {
        if (!allEntities.has(allowedUser)) {
          throw new Error(
            `Invalid config file: app "${app.origin}" has an allowed user "${allowedUser}" that does not correspond to a valid username or group name`,
          );
        }
      });
    }
  });

  const identitiesResolved = {
    // github username -> username
    github_username: new Map<string, string>(),
    // discord username -> username
    discord_username: new Map<string, string>(),
    // discord verified email -> username
    discord_verified_email: new Map<string, string>(),
    // google verified email -> username
    google_verified_email: new Map<string, string>(),
    // github verified email -> username
    github_verified_email: new Map<string, string>(),
    // username -> set of argon2 hashes
    basic_auth_argon2: new Map<string, Set<string>>(),
  };
  Object.entries(system.users).forEach(([username, user]) => {
    getIdentityValues(user).forEach((identityValue) => {
      if (identityValue.kind === "github_username") {
        identitiesResolved.github_username.set(identityValue.value, username);
        return;
      }
      if (identityValue.kind === "discord_username") {
        identitiesResolved.discord_username.set(identityValue.value, username);
        return;
      }
      if (identityValue.kind === "discord_verified_email") {
        identitiesResolved.discord_verified_email.set(
          identityValue.value,
          username,
        );
        return;
      }
      if (identityValue.kind === "google_verified_email") {
        identitiesResolved.google_verified_email.set(
          identityValue.value,
          username,
        );
        return;
      }
      if (identityValue.kind === "github_verified_email") {
        identitiesResolved.github_verified_email.set(
          identityValue.value,
          username,
        );
        return;
      }
      if (identityValue.kind === "basic_auth_argon2") {
        let hashesSet = identitiesResolved.basic_auth_argon2.get(username);
        if (!hashesSet) {
          hashesSet = new Set<string>();
          identitiesResolved.basic_auth_argon2.set(username, hashesSet);
        }
        hashesSet.add(identityValue.value);
        return;
      }
      identityValue satisfies never;
    });
  });

  const resolvedGroups = new Map<string, Set<string>>();
  Object.entries(system.groups ?? {}).forEach(([groupName, groupMembers]) => {
    const resolvedMembers = new Set<string>();
    groupMembers.forEach((member) => {
      if (system.groups?.[member]) {
        throw new Error(
          `Invalid config file: group "${groupName}" contains another group "${member}"`,
        );
      }
      resolvedMembers.add(member);
    });
    resolvedGroups.set(groupName, resolvedMembers);
  });

  const allowedUsersByApp = new Map<string, Set<string>>();
  system.apps.forEach((app) => {
    const allowedUsers = new Set<string>();
    if (app.allowed) {
      app.allowed.forEach((allowedUser) => {
        if (resolvedGroups.has(allowedUser)) {
          resolvedGroups.get(allowedUser)?.forEach((groupMember) => {
            allowedUsers.add(groupMember);
          });
        } else {
          allowedUsers.add(allowedUser);
        }
      });
    }
    allowedUsersByApp.set(app.origin, allowedUsers);
  });

  const systemInstance: TSystem = {
    resolveOAuthIdentity(
      identities: TIdentityOAuth[],
    ): string | null {
      const resolvedUsernamesSet = new Set<string>();
      identities.forEach((identity) => {
        if (identity.kind === "github_username") {
          const username = identitiesResolved.github_username.get(
            identity.value,
          );
          if (username) {
            resolvedUsernamesSet.add(username);
          }
          return;
        }
        if (identity.kind === "discord_username") {
          const username = identitiesResolved.discord_username.get(
            identity.value,
          );
          if (username) {
            resolvedUsernamesSet.add(username);
          }
          return;
        }
        if (identity.kind === "google_verified_email") {
          const username = identitiesResolved.google_verified_email.get(
            identity.value,
          );
          if (username) {
            resolvedUsernamesSet.add(username);
          }
          return;
        }
        if (identity.kind === "github_verified_email") {
          const username = identitiesResolved.github_verified_email
            .get(identity.value);
          if (username) {
            resolvedUsernamesSet.add(username);
          }
          return;
        }
        if (identity.kind === "discord_verified_email") {
          const username = identitiesResolved.discord_verified_email
            .get(identity.value);
          if (username) {
            resolvedUsernamesSet.add(username);
          }
          return;
        }
        identity satisfies never;
      });
      const resolvedUsernames = Array.from(resolvedUsernamesSet);
      if (resolvedUsernames.length === 0) {
        return null;
      }
      if (resolvedUsernames.length === 1) {
        return resolvedUsernames[0];
      }
      // Multiple match, return first one in users order
      resolvedUsernames.sort((a, b) => {
        return usernames.indexOf(a) - usernames.indexOf(b);
      });
      return resolvedUsernames[0];
    },
    isAllowed(redirectUrl: string, username: string): boolean {
      const url = new URL(redirectUrl);
      const app = system.apps.find((app) => app.origin === url.origin);
      if (!app) {
        return false;
      }
      if (app.public) {
        return true;
      }
      if (!app.allowed) {
        return false;
      }
      const allowedUsers = allowedUsersByApp.get(app.origin);
      if (!allowedUsers) {
        return false;
      }
      return allowedUsers.has(username);
    },
    async verifyBasicAuth(
      username: string,
      password: string,
    ): Promise<boolean> {
      const hashesSet = identitiesResolved.basic_auth_argon2.get(username);
      if (!hashesSet) {
        return (false);
      }
      for (const hash of hashesSet) {
        const isValid = await verify(hash, password);
        if (isValid) {
          return true;
        }
      }
      return false;
    },
    getAppsForUser(username: string): TSystemApp[] {
      return system.apps.filter((app) => {
        if (app.public) {
          return true;
        }
        const allowedUsers = allowedUsersByApp.get(app.origin);
        if (!allowedUsers) {
          return false;
        }
        return allowedUsers.has(username);
      }).map(({ origin, name }) => ({ origin, name }));
    },
  };

  return {
    value: systemInstance,
  };
});

function getIdentityValues(
  user: v.InferOutput<typeof userSchema>,
): TIdentity[] {
  const identities: TIdentity[] = [];
  if (user.github_username) {
    identities.push({ kind: "github_username", value: user.github_username });
  }
  if (user.discord_username) {
    identities.push({ kind: "discord_username", value: user.discord_username });
  }
  if (user.github_verified_email) {
    identities.push({
      kind: "github_verified_email",
      value: user.github_verified_email,
    });
  }
  if (user.google_verified_email) {
    identities.push({
      kind: "google_verified_email",
      value: user.google_verified_email,
    });
  }
  if (user.basic_auth_argon2) {
    for (const hash of user.basic_auth_argon2) {
      identities.push({
        kind: "basic_auth_argon2",
        value: hash,
      });
    }
  }
  return identities;
}
