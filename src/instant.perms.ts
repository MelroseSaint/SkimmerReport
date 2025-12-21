// Docs: https://www.instantdb.com/docs/permissions

import type { InstantRules } from "@instantdb/react";

const rules = {
  reports: {
    allow: {
      // Anyone can read reports
      view: "true",
      // Only authenticated users can create reports
      create: "auth.id != null",
      // Only report author or admin can update
      update: "auth.id in data.ref('author.id') || 'admin' in auth.ref('$user.role')",
      // Only admin can delete
      delete: "'admin' in auth.ref('$user.role')",
    },
  },
  $users: {
    allow: {
      // Users can view their own profile
      view: "auth.id == data.id || 'admin' in auth.ref('$user.role')",
      // No one can create users directly (handled by auth)
      create: "false",
      // Only admins can update anyone
      update: "auth.id == data.id || 'admin' in auth.ref('$user.role')",
      // Not supported for $users namespace
      delete: "false",
    },
  },
  securityEvents: {
    allow: {
      // Only admins can view security events
      view: "'admin' in auth.ref('$user.role')",
      // System can create events (no auth required for logging)
      create: "true",
      // No one can update security events (immutable audit log)
      update: "false",
      // Only admins can delete (for cleanup)
      delete: "'admin' in auth.ref('$user.role')",
    },
  },
} satisfies InstantRules;

export default rules;
