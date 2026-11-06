import { openProfile } from "./client";
import { loadAppState } from "./app-state";
import { loadSitePermissions } from "./site-permissions";

export async function openProfileAndLoad(): Promise<void> {
  await openProfile();
  await loadAppState();
  await loadSitePermissions();
}
