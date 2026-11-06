import fs from "node:fs";
import path from "node:path";

import { INSTANCES_DIR } from "./paths";

export interface InstanceRow {
  key: string;
  pid: number;
  tty: string | null;
  socket: string;
  cdpPort: number | null;
  url: string;
  title: string;
  favicon: string | null;
  loading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  findMatches: { active: number; total: number } | null;
  zoom: number;
  tabs: unknown;
  viewport: { width: number; height: number } | null;
  splitDir: "right" | "left" | "down" | "up" | null;
  parentTty: string | null;
  startedAt: number;
}

export type NewInstanceRow = InstanceRow;

function instanceFile(key: string): string {
  return path.join(INSTANCES_DIR, `${key.replace(/[^\w-]/g, "_")}.json`);
}

export async function upsertInstance(row: NewInstanceRow): Promise<void> {
  fs.mkdirSync(INSTANCES_DIR, { recursive: true });
  fs.writeFileSync(instanceFile(row.key), `${JSON.stringify(row)}\n`);
}

export async function removeInstance(key: string): Promise<void> {
  fs.rmSync(instanceFile(key), { force: true });
}

function alive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function readInstance(file: string): InstanceRow | null {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as InstanceRow;
  } catch {
    return null;
  }
}

export async function listInstances(): Promise<InstanceRow[]> {
  let names: string[];
  try {
    names = fs.readdirSync(INSTANCES_DIR);
  } catch {
    return [];
  }
  const live: InstanceRow[] = [];
  for (const name of names) {
    if (!name.endsWith(".json")) continue;
    const file = path.join(INSTANCES_DIR, name);
    const row = readInstance(file);
    if (!row) continue;
    if (alive(row.pid)) {
      live.push(row);
      continue;
    }
    fs.rmSync(file, { force: true });
    fs.rmSync(row.socket, { force: true });
  }
  return live.sort((a, b) => a.startedAt - b.startedAt);
}
