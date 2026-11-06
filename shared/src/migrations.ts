import type { Migration } from "./migrate";

export const migrations: Migration[] = [
  {
    id: "0000_profile",
    statements: [
      "CREATE TABLE app_state (key VARCHAR PRIMARY KEY, value VARCHAR NOT NULL)",
      "CREATE TABLE site_permissions (origin VARCHAR NOT NULL, embedder VARCHAR NOT NULL, kind VARCHAR NOT NULL, allowed BOOLEAN NOT NULL, updated_at BIGINT NOT NULL, PRIMARY KEY (origin, embedder, kind))",
    ],
  },
];
