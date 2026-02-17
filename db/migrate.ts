import type { MigrationConfig } from "drizzle-orm/migrator";
import type { PGliteDrizzleClient } from "drizzle-orm/pglite";
import migrations from "../drizzle/migrations.json";

export async function migrate(db: PGliteDrizzleClient) {
  // dialect and session will appear to not exist...but they do
  await db.dialect.migrate(migrations, db.session, {
    migrationsTable: "drizzle_migrations",
  } satisfies Omit<MigrationConfig, "migrationsFolder">);
}
