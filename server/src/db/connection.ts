import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { openSqliteDatabase, type DatabaseAdapter } from './sqliteAdapter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default db path in <workspace_root>/data/invoices.db
const defaultDbPath = path.resolve(__dirname, '../../../data/invoices.db');

export function getDatabasePath(): string {
  if (process.env.DATABASE_PATH) {
    return process.env.DATABASE_PATH;
  }
  return defaultDbPath;
}

export function createDatabaseConnection(customPath?: string): DatabaseAdapter {
  const dbPath = customPath || getDatabasePath();

  if (dbPath !== ':memory:') {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = openSqliteDatabase(dbPath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');

  initSchema(db);

  return db;
}

export function initSchema(db: DatabaseAdapter): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT NOT NULL,
      vendor_name TEXT NOT NULL,
      amount_cents INTEGER NOT NULL,
      currency TEXT NOT NULL,
      invoice_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('processing', 'needs_review', 'approved', 'rejected')),
      duplicate_of_id INTEGER REFERENCES invoices(id) ON DELETE SET NULL,
      review_reason TEXT,
      decided_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_invoices_duplicate_lookup
      ON invoices (vendor_name, invoice_number, amount_cents);

    CREATE INDEX IF NOT EXISTS idx_invoices_status
      ON invoices (status);
  `);
}

let defaultDb: DatabaseAdapter | null = null;

export function getDb(): DatabaseAdapter {
  if (!defaultDb) {
    defaultDb = createDatabaseConnection();
  }
  return defaultDb;
}
