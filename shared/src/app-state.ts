import crypto from "node:crypto";

import { z } from "zod";

import { bookmarkTreeSchema } from "./bookmarks";
import type { BookmarkNode } from "./bookmarks";
import { profileStore } from "./client";

const openTabsSchema = z.object({
  urls: z.array(z.string()),
  active: z.number().int().nonnegative(),
});

const devtoolsLayoutSchema = z.object({
  dock: z.enum(["bottom", "right"]),
  fraction: z.number(),
});

export type OpenTabsState = z.infer<typeof openTabsSchema>;
export type DevtoolsDock = "bottom" | "right";
export type DevtoolsLayout = z.infer<typeof devtoolsLayoutSchema>;

const cache = new Map<string, string>();

export async function loadAppState(): Promise<void> {
  const rows = await profileStore().read("SELECT key, value FROM app_state");
  cache.clear();
  for (const row of rows) cache.set(String(row.key), String(row.value));
}

function getAppState(key: string): string | null {
  return cache.get(key) ?? null;
}

function setAppState(key: string, value: string): void {
  cache.set(key, value);
  void profileStore()
    .write(
      "INSERT INTO app_state (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value",
      [key, value],
    )
    .catch(() => {});
}

export function lastUrl(): string | null {
  return getAppState("last-url");
}

export function setLastUrl(url: string): void {
  setAppState("last-url", url);
}

export function openTabs(): OpenTabsState | null {
  const raw = getAppState("tabs-open");
  if (!raw) return null;
  const parsed = openTabsSchema.safeParse(JSON.parse(raw));
  return parsed.success ? parsed.data : null;
}

export function setOpenTabs(state: OpenTabsState): void {
  setAppState("tabs-open", JSON.stringify(openTabsSchema.parse(state)));
}

export function bookmarkTree(): BookmarkNode[] {
  const raw = getAppState("bookmarks-tree");
  if (!raw) return [];
  const parsed = bookmarkTreeSchema.safeParse(JSON.parse(raw));
  return parsed.success ? parsed.data : [];
}

export function setBookmarkTree(tree: BookmarkNode[]): void {
  setAppState("bookmarks-tree", JSON.stringify(bookmarkTreeSchema.parse(tree)));
}

export function devtoolsLayout(): DevtoolsLayout | null {
  const raw = getAppState("devtools-layout");
  if (!raw) return null;
  const parsed = devtoolsLayoutSchema.safeParse(JSON.parse(raw));
  return parsed.success ? parsed.data : null;
}

export function setDevtoolsLayout(layout: DevtoolsLayout): void {
  setAppState("devtools-layout", JSON.stringify(devtoolsLayoutSchema.parse(layout)));
}

export function anonymousId(): string {
  const existing = getAppState("anonymous-id");
  if (existing) return existing;
  const id = crypto.randomUUID();
  setAppState("anonymous-id", id);
  return id;
}

export function lastSeenVersion(): string | null {
  return getAppState("last-seen-version");
}

export function setLastSeenVersion(version: string): void {
  setAppState("last-seen-version", version);
}

export function lastLaunchDay(): string | null {
  return getAppState("last-launch-day");
}

export function setLastLaunchDay(day: string): void {
  setAppState("last-launch-day", day);
}

export function lastActiveDay(): string | null {
  return getAppState("last-active-day");
}

export function setLastActiveDay(day: string): void {
  setAppState("last-active-day", day);
}

