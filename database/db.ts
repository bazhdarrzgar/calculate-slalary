import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database', 'currency_calculator.db');

let db: Database.Database | null = null;

export function getDb() {
  if (!db) {
    db = new Database(dbPath, { verbose: console.log });
    db.pragma('journal_mode = WAL');
    // Set busy timeout to 5 seconds
    db.pragma('busy_timeout = 5000');
  }
  return db;
}

export function initDb() {
  const database = getDb();
  
  // Create calculations table
  database.exec(`
    CREATE TABLE IF NOT EXISTS calculations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      rank TEXT NOT NULL,
      salary INTEGER NOT NULL,
      breakdown TEXT NOT NULL,
      total_notes INTEGER NOT NULL,
      created_at TEXT NOT NULL
    )
  `);
  
  // Create denominations table
  database.exec(`
    CREATE TABLE IF NOT EXISTS denominations (
      value INTEGER PRIMARY KEY,
      image_name TEXT NOT NULL,
      is_available INTEGER DEFAULT 1,
      amount INTEGER DEFAULT 100
    )
  `);
  
  // Create salary_templates table
  database.exec(`
    CREATE TABLE IF NOT EXISTS salary_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      rank TEXT,
      department TEXT,
      salary INTEGER NOT NULL,
      created_at TEXT NOT NULL
    )
  `);
  
  // Check if denominations exist
  const count = database.prepare('SELECT COUNT(*) as count FROM denominations').get() as { count: number };
  
  // Insert default denominations if table is empty
  if (count.count === 0) {
    const stmt = database.prepare('INSERT INTO denominations (value, image_name) VALUES (?, ?)');
    const denominations = [
      [50000, '50000.jpg'],
      [25000, '25000.jpg'],
      [10000, '10000.jpg'],
      [5000, '5000.jpg'],
      [1000, '1000.jpg'],
      [500, '500.jpg'],
      [250, '250.jpg']
    ];
    
    const insertMany = database.transaction((denoms) => {
      for (const denom of denoms) {
        stmt.run(denom);
      }
    });
    
    insertMany(denominations);
  }
}

// Initialize database only if not in build time
if (process.env.NEXT_PHASE !== 'phase-production-build') {
  initDb();
}
