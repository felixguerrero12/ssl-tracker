import { Database } from 'sqlite3'
import { open } from 'sqlite'

// This will create/open a SQLite database file in the project root
export async function getDb() {
  const db = await open({
    filename: './websites.db',
    driver: Database
  })

  // Drop the existing table if it exists and create a new one
  await db.exec(`
    DROP TABLE IF EXISTS websites;
    CREATE TABLE websites (
      url TEXT PRIMARY KEY,
      issuer TEXT,
      validFrom TEXT,
      validTo TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  return db
} 