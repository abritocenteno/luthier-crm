/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions from "../actions.js";
import type * as clients from "../clients.js";
import type * as communications from "../communications.js";
import type * as contacts from "../contacts.js";
import type * as crons from "../crons.js";
import type * as dashboard from "../dashboard.js";
import type * as events from "../events.js";
import type * as files from "../files.js";
import type * as invoices from "../invoices.js";
import type * as jobTemplates from "../jobTemplates.js";
import type * as jobs from "../jobs.js";
import type * as notifications from "../notifications.js";
import type * as orders from "../orders.js";
import type * as parts from "../parts.js";
import type * as portal from "../portal.js";
import type * as reports from "../reports.js";
import type * as resend from "../resend.js";
import type * as services from "../services.js";
import type * as settings from "../settings.js";
import type * as suppliers from "../suppliers.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  actions: typeof actions;
  clients: typeof clients;
  communications: typeof communications;
  contacts: typeof contacts;
  crons: typeof crons;
  dashboard: typeof dashboard;
  events: typeof events;
  files: typeof files;
  invoices: typeof invoices;
  jobTemplates: typeof jobTemplates;
  jobs: typeof jobs;
  notifications: typeof notifications;
  orders: typeof orders;
  parts: typeof parts;
  portal: typeof portal;
  reports: typeof reports;
  resend: typeof resend;
  services: typeof services;
  settings: typeof settings;
  suppliers: typeof suppliers;
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
