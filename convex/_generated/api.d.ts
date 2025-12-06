/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activities from "../activities.js";
import type * as announcementActions from "../announcementActions.js";
import type * as announcements from "../announcements.js";
import type * as appointments from "../appointments.js";
import type * as assessments from "../assessments.js";
import type * as auditLogs from "../auditLogs.js";
import type * as auth from "../auth.js";
import type * as bootstrapSuperAdmin from "../bootstrapSuperAdmin.js";
import type * as categories from "../categories.js";
import type * as clients from "../clients.js";
import type * as conversations from "../conversations.js";
import type * as crisis from "../crisis.js";
import type * as debugAuditLogs from "../debugAuditLogs.js";
import type * as debugReports from "../debugReports.js";
import type * as email from "../email.js";
import type * as featurePermissions from "../featurePermissions.js";
import type * as files from "../files.js";
import type * as fixNoteAuthors from "../fixNoteAuthors.js";
import type * as hello from "../hello.js";
import type * as help from "../help.js";
import type * as helpers from "../helpers.js";
import type * as journal from "../journal.js";
import type * as messages from "../messages.js";
import type * as metrics from "../metrics.js";
import type * as migrateReports from "../migrateReports.js";
import type * as moods from "../moods.js";
import type * as notes from "../notes.js";
import type * as notifications from "../notifications.js";
import type * as organizations from "../organizations.js";
import type * as posts from "../posts.js";
import type * as presence from "../presence.js";
import type * as profiles from "../profiles.js";
import type * as referrals from "../referrals.js";
import type * as reports from "../reports.js";
import type * as resources from "../resources.js";
import type * as roles from "../roles.js";
import type * as seed from "../seed.js";
import type * as settings from "../settings.js";
import type * as storage from "../storage.js";
import type * as supportWorkers from "../supportWorkers.js";
import type * as systemAlerts from "../systemAlerts.js";
import type * as systemHealth from "../systemHealth.js";
import type * as users from "../users.js";
import type * as videoCallSessions from "../videoCallSessions.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activities: typeof activities;
  announcementActions: typeof announcementActions;
  announcements: typeof announcements;
  appointments: typeof appointments;
  assessments: typeof assessments;
  auditLogs: typeof auditLogs;
  auth: typeof auth;
  bootstrapSuperAdmin: typeof bootstrapSuperAdmin;
  categories: typeof categories;
  clients: typeof clients;
  conversations: typeof conversations;
  crisis: typeof crisis;
  debugAuditLogs: typeof debugAuditLogs;
  debugReports: typeof debugReports;
  email: typeof email;
  featurePermissions: typeof featurePermissions;
  files: typeof files;
  fixNoteAuthors: typeof fixNoteAuthors;
  hello: typeof hello;
  help: typeof help;
  helpers: typeof helpers;
  journal: typeof journal;
  messages: typeof messages;
  metrics: typeof metrics;
  migrateReports: typeof migrateReports;
  moods: typeof moods;
  notes: typeof notes;
  notifications: typeof notifications;
  organizations: typeof organizations;
  posts: typeof posts;
  presence: typeof presence;
  profiles: typeof profiles;
  referrals: typeof referrals;
  reports: typeof reports;
  resources: typeof resources;
  roles: typeof roles;
  seed: typeof seed;
  settings: typeof settings;
  storage: typeof storage;
  supportWorkers: typeof supportWorkers;
  systemAlerts: typeof systemAlerts;
  systemHealth: typeof systemHealth;
  users: typeof users;
  videoCallSessions: typeof videoCallSessions;
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
