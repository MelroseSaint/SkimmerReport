// Docs: https://www.instantdb.com/docs/modeling-data

import { i } from "@instantdb/react";

const _schema = i.schema({
  entities: {
    $files: i.entity({
      path: i.string().unique().indexed(),
      url: i.string().optional(),
    }),
    $users: i.entity({
      email: i.string().unique().indexed().optional(),
      passwordHash: i.string().optional(),
      imageURL: i.string().optional(),
      type: i.string().optional(), // 'user', 'moderator', 'admin'
      role: i.string().indexed().optional(),
      createdAt: i.number().indexed().optional(),
      isLocked: i.boolean().optional(),
      failedLoginAttempts: i.number().optional(),
    }),
    reports: i.entity({
      report_id: i.string().unique().indexed(),
      latitude: i.number().indexed(),
      longitude: i.number().indexed(),
      merchant: i.string(),
      category: i.string().indexed(), // 'ATM', 'Gas pump', 'Store POS'
      observationType: i.string().indexed(),
      description: i.string().optional(),
      timestamp: i.number().indexed(),
      confidenceScore: i.number().optional(),
      status: i.string().indexed().optional(), // 'Under Review', 'Community Supported', 'Rejected', 'Error'
      statusReason: i.string().optional(),
      reason: i.string().optional(),
      confirmationReason: i.string().optional(),
      lastEvaluatedAt: i.number().optional(),
    }),
    securityEvents: i.entity({
      timestamp: i.number().indexed(),
      event_type: i.string().indexed(),
      severity: i.string().indexed(),
      ip_address: i.string().indexed().optional(),
      user_agent: i.string().optional(),
      endpoint: i.string().optional(),
      method: i.string().optional(),
      status_code: i.number().optional(),
      details: i.json(),
    }),
  },
  links: {
    $usersLinkedPrimaryUser: {
      forward: {
        on: "$users",
        has: "one",
        label: "linkedPrimaryUser",
        onDelete: "cascade",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "linkedGuestUsers",
      },
    },
    userReports: {
      forward: {
        on: "reports",
        has: "one",
        label: "author",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "reports",
      },
    },
  },
  rooms: {},
});

// This helps Typescript display nicer intellisense
type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema { }
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
