/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as appointments from "../appointments.js";
import type * as auditLogs from "../auditLogs.js";
import type * as auth from "../auth.js";
import type * as helpers from "../helpers.js";
import type * as organizations from "../organizations.js";
import type * as reports from "../reports.js";
import type * as roles from "../roles.js";
import type * as seed from "../seed.js";
import type * as systemHealth from "../systemHealth.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  appointments: typeof appointments;
  auditLogs: typeof auditLogs;
  auth: typeof auth;
  helpers: typeof helpers;
  organizations: typeof organizations;
  reports: typeof reports;
  roles: typeof roles;
  seed: typeof seed;
  systemHealth: typeof systemHealth;
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
