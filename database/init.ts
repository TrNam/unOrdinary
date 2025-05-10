import * as SQLite from 'expo-sqlite';

const DB_NAME = 'workout.db';

let db: SQLite.SQLiteDatabase | null = null;

export async function initDB() {
  if (db) return db;

  db = await SQLite.openDatabaseAsync(DB_NAME);
  
  // Enable foreign keys
  await db.execAsync('PRAGMA foreign_keys = ON;');

  // Create tables
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS collections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS split_collections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      collection_id INTEGER,
      split_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
      FOREIGN KEY (split_id) REFERENCES splits(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS splits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      is_favorite INTEGER DEFAULT 0,
      is_default INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      order_index INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS split_days (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      split_id INTEGER,
      name TEXT NOT NULL,
      day_of_week INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (split_id) REFERENCES splits(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS split_day_exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      split_day_id INTEGER,
      exercise_id INTEGER,
      order_index INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (split_day_id) REFERENCES split_days(id) ON DELETE CASCADE,
      FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS workout_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      split_id INTEGER NOT NULL,
      day_of_week INTEGER NOT NULL,
      exercises TEXT NOT NULL,
      use_metric INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (split_id) REFERENCES splits(id) ON DELETE CASCADE
    );
  `);

  // Check if order_index column exists in splits table
  const columns = await db.getAllAsync<{ name: string }>(`
    SELECT name FROM pragma_table_info('splits');
  `);

  const hasOrderIndex = columns.some(col => col.name === 'order_index');

  // If order_index doesn't exist, add it and update existing records
  if (!hasOrderIndex) {
    await db.execAsync(`
      BEGIN TRANSACTION;
      
      -- Add order_index column
      ALTER TABLE splits ADD COLUMN order_index INTEGER DEFAULT 0;
      
      -- Update existing splits with order based on creation date
      UPDATE splits 
      SET order_index = (
        SELECT COUNT(*) 
        FROM splits s2 
        WHERE s2.created_at <= splits.created_at
      ) - 1;
      
      COMMIT;
    `);
  }

  // Check if day_of_week column exists in split_days table
  const splitDaysColumns = await db.getAllAsync<{ name: string }>(`
    SELECT name FROM pragma_table_info('split_days');
  `);

  const hasDayOfWeek = splitDaysColumns.some(col => col.name === 'day_of_week');

  // If day_of_week doesn't exist, add it
  if (!hasDayOfWeek) {
    await db.execAsync(`
      BEGIN TRANSACTION;
      
      -- Add day_of_week column
      ALTER TABLE split_days ADD COLUMN day_of_week INTEGER;
      
      COMMIT;
    `);
  }

  // Check if is_favorite column exists in splits table
  const splitsColumns = await db.getAllAsync<{ name: string }>(`
    SELECT name FROM pragma_table_info('splits');
  `);

  const hasIsFavorite = splitsColumns.some(col => col.name === 'is_favorite');
  const hasIsDefault = splitsColumns.some(col => col.name === 'is_default');

  // If is_favorite doesn't exist, add it
  if (!hasIsFavorite) {
    await db.execAsync(`
      BEGIN TRANSACTION;
      
      -- Add is_favorite column
      ALTER TABLE splits ADD COLUMN is_favorite INTEGER DEFAULT 0;
      
      COMMIT;
    `);
  }

  // If is_default doesn't exist, add it and set the first split as default
  if (!hasIsDefault) {
    await db.execAsync(`
      BEGIN TRANSACTION;
      
      -- Add is_default column
      ALTER TABLE splits ADD COLUMN is_default INTEGER DEFAULT 0;
      
      -- Set the first split as default
      UPDATE splits 
      SET is_default = 1 
      WHERE id = (SELECT id FROM splits ORDER BY created_at ASC LIMIT 1);
      
      COMMIT;
    `);
  }

  return db;
}

export async function resetDatabase() {
  if (!db) return;
  
  await db.execAsync(`
    PRAGMA foreign_keys = OFF;
    DROP TABLE IF EXISTS split_day_exercises;
    DROP TABLE IF EXISTS exercises;
    DROP TABLE IF EXISTS split_days;
    DROP TABLE IF EXISTS splits;
    DROP TABLE IF EXISTS workout_history;
    PRAGMA foreign_keys = ON;
  `);
  
  await initDB();
}

export default initDB;