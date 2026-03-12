/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as clerkAdmin from "../clerkAdmin.js";
import type * as coins from "../coins.js";
import type * as lib_auth from "../lib/auth.js";
import type * as notifications from "../notifications.js";
import type * as platforms from "../platforms.js";
import type * as reminders from "../reminders.js";
import type * as seed from "../seed.js";
import type * as settings from "../settings.js";
import type * as subjects from "../subjects.js";
import type * as tasks from "../tasks.js";
import type * as telegram from "../telegram.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  clerkAdmin: typeof clerkAdmin;
  coins: typeof coins;
  "lib/auth": typeof lib_auth;
  notifications: typeof notifications;
  platforms: typeof platforms;
  reminders: typeof reminders;
  seed: typeof seed;
  settings: typeof settings;
  subjects: typeof subjects;
  tasks: typeof tasks;
  telegram: typeof telegram;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
