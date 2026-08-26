import path from 'path';

export interface User {
  id: number;
  email: string;
  password?: string;
  tag: string;
  name: string;
  is_private: number;
  created_at: string;
}

export interface Book {
  id: number;
  user_id: number;
  title: string;
  authors: string | null;
  cover_url: string | null;
  google_search_url: string;
  google_books_id: string | null;
  status: 'currently_reading' | 'read' | 'unfinished';
  start_date: string | null;
  finish_date: string | null;
  year: number | null;
  review: string | null;
  is_hidden: number;
  created_at: string;
  updated_at: string;
}

let tursoClient: any = null;
let betterDb: any = null;

async function getClient() {
  if (process.env.TURSO_DATABASE_URL) {
    if (!tursoClient) {
      const { createClient } = await import('@libsql/client');
      tursoClient = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN
      });
    }
    return { type: 'turso', client: tursoClient };
  } else {
    if (!betterDb) {
      const Database = (await import('better-sqlite3')).default;
      const dbPath = path.join(process.cwd(), 'readlist.db');
      betterDb = new Database(dbPath);
      betterDb.pragma('journal_mode = WAL');
    }
    return { type: 'sqlite', client: betterDb };
  }
}

// Auto-initialize tables
let schemaInitialized = false;
async function ensureSchema() {
  if (schemaInitialized) return;
  const { type, client } = await getClient();

  const schemaSql = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      tag TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      is_private INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      authors TEXT,
      cover_url TEXT,
      google_search_url TEXT NOT NULL,
      google_books_id TEXT,
      status TEXT NOT NULL CHECK(status IN ('currently_reading', 'read', 'unfinished')),
      start_date TEXT,
      finish_date TEXT,
      year INTEGER,
      review TEXT,
      is_hidden INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_tag ON users(tag);
    CREATE INDEX IF NOT EXISTS idx_books_user_status ON books(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_books_user_year ON books(user_id, year);
  `;

  if (type === 'turso') {
    await client.executeMultiple(schemaSql);
    try {
      await client.execute('ALTER TABLE books ADD COLUMN is_hidden INTEGER DEFAULT 0');
    } catch (e) {
      // Column already exists
    }
  } else {
    client.exec(schemaSql);
    try {
      client.exec('ALTER TABLE books ADD COLUMN is_hidden INTEGER DEFAULT 0');
    } catch (e) {
      // Column already exists
    }
  }

  schemaInitialized = true;
}

export const db = {
  async get<T = any>(sql: string, args: any[] = []): Promise<T | undefined> {
    await ensureSchema();
    const { type, client } = await getClient();

    if (type === 'turso') {
      const res = await client.execute({ sql, args });
      return (res.rows[0] as unknown as T) || undefined;
    } else {
      const stmt = client.prepare(sql);
      return stmt.get(...args) as T | undefined;
    }
  },

  async all<T = any>(sql: string, args: any[] = []): Promise<T[]> {
    await ensureSchema();
    const { type, client } = await getClient();

    if (type === 'turso') {
      const res = await client.execute({ sql, args });
      return res.rows as unknown as T[];
    } else {
      const stmt = client.prepare(sql);
      return stmt.all(...args) as T[];
    }
  },

  async run(sql: string, args: any[] = []): Promise<{ lastInsertRowid: number | bigint; rowsAffected: number }> {
    await ensureSchema();
    const { type, client } = await getClient();

    if (type === 'turso') {
      const res = await client.execute({ sql, args });
      return {
        lastInsertRowid: res.lastInsertRowid ?? 0,
        rowsAffected: res.rowsAffected
      };
    } else {
      const stmt = client.prepare(sql);
      const res = stmt.run(...args);
      return {
        lastInsertRowid: res.lastInsertRowid,
        rowsAffected: res.changes
      };
    }
  }
};

export default db;
