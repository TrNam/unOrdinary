import * as SQLite from 'expo-sqlite';

const DB_NAME = 'workout.db';

export const initDB = async () => {
  console.log('Initializing database...');
  const db = SQLite.openDatabaseSync(DB_NAME);
  
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
      sets INTEGER DEFAULT 3,
      reps INTEGER DEFAULT 10,
      order_index INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (split_day_id) REFERENCES split_days(id) ON DELETE CASCADE,
      FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
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

  console.log('Database initialized successfully');
  return db;
};

export const resetDatabase = async () => {
  console.log('Resetting database...');
  const db = SQLite.openDatabaseSync(DB_NAME);
  
  await db.execAsync(`
    PRAGMA foreign_keys = OFF;
    BEGIN TRANSACTION;
    
    DROP TABLE IF EXISTS split_day_exercises;
    DROP TABLE IF EXISTS split_days;
    DROP TABLE IF EXISTS splits;
    DROP TABLE IF EXISTS exercises;
    DROP TABLE IF EXISTS split_collections;
    DROP TABLE IF EXISTS collections;
    
    COMMIT;
    PRAGMA foreign_keys = ON;
  `);

  console.log('Database reset complete');
};