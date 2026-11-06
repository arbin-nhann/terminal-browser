import { profileStore } from "./client";

export interface SitePermission {
  origin: string;
  embedder: string;
  kind: string;
  allowed: boolean;
}

const cache = new Map<string, boolean>();

function keyOf(origin: string, embedder: string, kind: string): string {
  return JSON.stringify([origin, embedder, kind]);
}

export async function loadSitePermissions(): Promise<void> {
  const rows = await profileStore().read("SELECT origin, embedder, kind, allowed FROM site_permissions");
  cache.clear();
  for (const row of rows) cache.set(keyOf(String(row.origin), String(row.embedder), String(row.kind)), row.allowed === true);
}

export function sitePermission(origin: string, embedder: string, kind: string): boolean | null {
  return cache.get(keyOf(origin, embedder, kind)) ?? null;
}

export function setSitePermission(permission: SitePermission): void {
  cache.set(keyOf(permission.origin, permission.embedder, permission.kind), permission.allowed);
  void profileStore()
    .write(
      "INSERT INTO site_permissions (origin, embedder, kind, allowed, updated_at) VALUES (?, ?, ?, ?, ?) " +
        "ON CONFLICT (origin, embedder, kind) DO UPDATE SET allowed = excluded.allowed, updated_at = excluded.updated_at",
      [permission.origin, permission.embedder, permission.kind, permission.allowed, Date.now()],
    )
    .catch(() => {});
}
