import fs from "node:fs";
import path from "node:path";

import { DuckDBInstance } from "@duckdb/node-api";
import type { DuckDBConnection, DuckDBValue } from "@duckdb/node-api";

import { migrate } from "./migrate";
import { migrations } from "./migrations";
import { DB_FILE, ensureDataDir } from "./paths";

export type Row = Record<string, DuckDBValue>;

export interface ProfileStore {
  read(sql: string, params?: DuckDBValue[]): Promise<Row[]>;
  write(sql: string, params?: DuckDBValue[]): Promise<void>;
}

let opened: Promise<ProfileStore> | null = null;
let current: ProfileStore | null = null;

export function openProfile(file: string = DB_FILE): Promise<ProfileStore> {
  opened ??= connect(file).then((store) => {
    current = store;
    return store;
  });
  return opened;
}

async function connect(file: string): Promise<ProfileStore> {
  if (file === DB_FILE) ensureDataDir();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const instance = await DuckDBInstance.create(file);
  const connection = await instance.connect();
  await migrate(connection, migrations);
  return queuedStore(connection);
}

function queuedStore(connection: DuckDBConnection): ProfileStore {
  let queue: Promise<unknown> = Promise.resolve();
  return {
    async read(sql, params = []) {
      const result = await connection.runAndReadAll(sql, params);
      return result.getRowObjects();
    },
    write(sql, params = []) {
      const next = queue.then(() => connection.run(sql, params)).then(() => undefined);
      queue = next.catch(() => {});
      return next;
    },
  };
}

export function profileStore(): ProfileStore {
  if (!current) throw new Error("profile database is not open");
  return current;
}
