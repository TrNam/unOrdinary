import * as SQLite from 'expo-sqlite';
const DB_NAME = 'unordinary.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export const initDB = async () => {
  if (dbInstance) return dbInstance;
  
  try {
    dbInstance = SQLite.openDatabaseSync(DB_NAME);
    
    // Execute all table creation queries in sequence
    await dbInstance.execAsync(`
      CREATE TABLE IF NOT EXISTS collections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      );
      
      CREATE TABLE IF NOT EXISTS split_collections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      );
      
      CREATE TABLE IF NOT EXISTS exercises (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        collection_id INTEGER,
        FOREIGN KEY(collection_id) REFERENCES collections(id) ON DELETE SET NULL
      );
    `);
    
    return dbInstance;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};