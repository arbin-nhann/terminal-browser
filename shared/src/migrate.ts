import type { DuckDBConnection } from "@duckdb/node-api";

export interface Migration {
  id: string;
  statements: string[];
}

export async function migrate(connection: DuckDBConnection, migrations: Migration[]): Promise<void> {
  await connection.run(
    "CREATE TABLE IF NOT EXISTS migration (id VARCHAR PRIMARY KEY, time_completed BIGINT NOT NULL)",
  );
  const applied = new Set(
    (await connection.runAndReadAll("SELECT id FROM migration")).getRowObjects().map((row) => String(row.id)),
  );
  const known = new Set(migrations.map((migration) => migration.id));
  const unknown = [...applied].filter((id) => !known.has(id));
  if (unknown.length > 0) {
    throw new Error(
      `database was migrated by a newer version of the app (unknown migrations: ${unknown.join(", ")}); refusing to open it`,
    );
  }
  for (const migration of migrations) {
    if (applied.has(migration.id)) continue;
    await connection.run("BEGIN TRANSACTION");
    try {
      for (const statement of migration.statements) await connection.run(statement);
      await connection.run("INSERT INTO migration (id, time_completed) VALUES (?, ?)", [migration.id, Date.now()]);
      await connection.run("COMMIT");
    } catch (error) {
      await connection.run("ROLLBACK");
      throw error;
    }
  }
}
