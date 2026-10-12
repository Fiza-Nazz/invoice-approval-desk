import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export interface RunResult {
  changes: number;
  lastInsertRowid: number | bigint;
}

export interface StatementAdapter {
  all(...params: unknown[]): unknown[];
  get(...params: unknown[]): unknown;
  run(...params: unknown[]): RunResult;
}

export interface DatabaseAdapter {
  exec(sql: string): void;
  prepare(sql: string): StatementAdapter;
  close(): void;
}

type DatabaseConstructor = new (path: string) => DatabaseAdapter;

let ResolvedDatabase: DatabaseConstructor | null = null;

function resolveDatabaseConstructor(): DatabaseConstructor {
  if (ResolvedDatabase) {
    return ResolvedDatabase;
  }

  // 1. Try Node.js built-in node:sqlite (Node 22+)
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const sqliteModule = require('node:sqlite');
    if (sqliteModule && sqliteModule.DatabaseSync) {
      ResolvedDatabase = class BuiltinSqliteAdapter implements DatabaseAdapter {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        private instance: any;

        constructor(dbPath: string) {
          this.instance = new sqliteModule.DatabaseSync(dbPath);
        }

        exec(sql: string): void {
          this.instance.exec(sql);
        }

        prepare(sql: string): StatementAdapter {
          const stmt = this.instance.prepare(sql);
          return {
            all: (...params: unknown[]) => stmt.all(...params),
            get: (...params: unknown[]) => stmt.get(...params),
            run: (...params: unknown[]) => {
              const res = stmt.run(...params);
              return {
                changes: Number(res.changes),
                lastInsertRowid: Number(res.lastInsertRowid),
              };
            },
          };
        }

        close(): void {
          this.instance.close();
        }
      };
      return ResolvedDatabase;
    }
  } catch {
    // Continue to next option
  }

  // 2. Try better-sqlite3 (Node 20 or environments with prebuilt binaries)
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const BetterSqlite = require('better-sqlite3');
    if (BetterSqlite) {
      ResolvedDatabase = class BetterSqliteAdapter implements DatabaseAdapter {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        private instance: any;

        constructor(dbPath: string) {
          this.instance = new BetterSqlite(dbPath);
        }

        exec(sql: string): void {
          this.instance.exec(sql);
        }

        prepare(sql: string): StatementAdapter {
          const stmt = this.instance.prepare(sql);
          return {
            all: (...params: unknown[]) => stmt.all(...params),
            get: (...params: unknown[]) => stmt.get(...params),
            run: (...params: unknown[]) => {
              const res = stmt.run(...params);
              return {
                changes: Number(res.changes),
                lastInsertRowid: Number(res.lastInsertRowid),
              };
            },
          };
        }

        close(): void {
          this.instance.close();
        }
      };
      return ResolvedDatabase;
    }
  } catch {
    // Continue
  }

  throw new Error(
    'No SQLite driver found. Please use Node.js v22+ (which includes built-in node:sqlite) or install better-sqlite3.'
  );
}

export function openSqliteDatabase(path: string): DatabaseAdapter {
  const Constructor = resolveDatabaseConstructor();
  return new Constructor(path);
}
