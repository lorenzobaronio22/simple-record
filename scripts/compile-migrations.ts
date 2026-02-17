import { readMigrationFiles } from "drizzle-orm/migrator";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const migrations = readMigrationFiles({ migrationsFolder: "./drizzle/" });

writeFileSync(
  join(process.cwd(), "drizzle", "migrations.json"),
  JSON.stringify(migrations),
);

console.log("Migrations compiled!");
