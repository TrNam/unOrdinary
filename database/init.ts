const DB_NAME = 'unordinary.db';

let dbInstance: any = null;

export const initDB = async () => {
  if (dbInstance) return dbInstance;
  const SQLite = require('expo-sqlite');
  dbInstance = SQLite.openDatabaseSync(DB_NAME);

  await new Promise<void>((resolve, reject) => {
    dbInstance.transaction((tx: any) => {
      // Create collections table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS collections (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          created_at TEXT DEFAULT (datetime('now'))
        );`,
        [],
        undefined,
        (_: any, error: any) => reject(error)
      );
      // Create split_collections table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS split_collections (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          created_at TEXT DEFAULT (datetime('now'))
        );`,
        [],
        undefined,
        (_: any, error: any) => reject(error)
      );
      // Create exercises table with collection_id
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS exercises (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          collection_id INTEGER,
          FOREIGN KEY(collection_id) REFERENCES collections(id) ON DELETE SET NULL
        );`,
        [],
        () => resolve(),
        (_: any, error: any) => reject(error)
      );
    });
  });

  return dbInstance;
};