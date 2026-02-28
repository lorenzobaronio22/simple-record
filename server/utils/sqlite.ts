/**
 * SQLite helper – opens (and migrates) the database used to store
 * one Automerge doc blob per userId.
 *
 * The file path is controlled by `runtimeConfig.sqlitePath` and defaults
 * to `/data/simple-record.sqlite` (intended for a Docker volume mount).
 */
import Database from 'better-sqlite3'
import type BetterSqlite3 from 'better-sqlite3'

let _db: BetterSqlite3.Database | null = null

export function getDB(): BetterSqlite3.Database {
  if (_db) return _db

  const config = useRuntimeConfig()
  const dbPath = config.sqlitePath || '/data/simple-record.sqlite'

  _db = new Database(dbPath as string)

  // WAL mode for better concurrent read/write
  _db.pragma('journal_mode = WAL')

  // Run migrations
  _db.exec(`
    CREATE TABLE IF NOT EXISTS docs (
      userId    TEXT PRIMARY KEY,
      doc       BLOB NOT NULL,
      updatedAt INTEGER NOT NULL
    );
  `)

  return _db
}
