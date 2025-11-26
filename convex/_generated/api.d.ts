/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as announcementActions from "../announcementActions.js";
import type * as announcements from "../announcements.js";
import type * as appointments from "../appointments.js";
import type * as auditLogs from "../auditLogs.js";
import type * as auth from "../auth.js";
import type * as bootstrapSuperAdmin from "../bootstrapSuperAdmin.js";
import type * as clients from "../clients.js";
import type * as debugAuditLogs from "../debugAuditLogs.js";
import type * as debugReports from "../debugReports.js";
import type * as featurePermissions from "../featurePermissions.js";
import type * as fixNoteAuthors from "../fixNoteAuthors.js";
import type * as helpers from "../helpers.js";
import type * as metrics from "../metrics.js";
import type * as notes from "../notes.js";
import type * as notifications from "../notifications.js";
import type * as organizations from "../organizations.js";
import type * as presence from "../presence.js";
import type * as referrals from "../referrals.js";
import type * as reports from "../reports.js";
import type * as roles from "../roles.js";
import type * as seed from "../seed.js";
import type * as systemAlerts from "../systemAlerts.js";
import type * as systemHealth from "../systemHealth.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  announcementActions: typeof announcementActions;
  announcements: typeof announcements;
  appointments: typeof appointments;
  auditLogs: typeof auditLogs;
  auth: typeof auth;
  bootstrapSuperAdmin: typeof bootstrapSuperAdmin;
  clients: typeof clients;
  debugAuditLogs: typeof debugAuditLogs;
  debugReports: typeof debugReports;
  featurePermissions: typeof featurePermissions;
  fixNoteAuthors: typeof fixNoteAuthors;
  helpers: typeof helpers;
  metrics: typeof metrics;
  notes: typeof notes;
  notifications: typeof notifications;
  organizations: typeof organizations;
  presence: typeof presence;
  referrals: typeof referrals;
  reports: typeof reports;
  roles: typeof roles;
  seed: typeof seed;
  systemAlerts: typeof systemAlerts;
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
