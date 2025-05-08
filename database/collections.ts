import { initDB } from './init';

export interface Collection {
  id: number;
  name: string;
  created_at?: string;
}

export interface SplitCollection {
  id: number;
  name: string;
  created_at?: string;
}

// Collections functions
export const addCollection = async (name: string): Promise<number | undefined> => {
  const db = await initDB();
  try {
    const result = await db.runAsync(
      'INSERT INTO collections (name, created_at) VALUES (?, datetime("now"));',
      [name]
    );
    return result.lastInsertRowId as number;
  } catch (error) {
    console.error('Insert error (collections):', error);
    throw error;
  }
};

export const getCollections = async (): Promise<Collection[]> => {
  const db = await initDB();
  try {
    return await db.getAllAsync<Collection>('SELECT * FROM collections;');
  } catch (error) {
    console.error('Error getting collections:', error);
    throw error;
  }
};

export const updateCollection = async (id: number, name: string): Promise<boolean> => {
  const db = await initDB();
  try {
    const result = await db.runAsync(
      'UPDATE collections SET name = ? WHERE id = ?;',
      [name, id]
    );
    return result.changes > 0;
  } catch (error) {
    console.error('Error updating collection:', error);
    throw error;
  }
};

export const deleteCollection = async (id: number): Promise<boolean> => {
  const db = await initDB();
  try {
    const result = await db.runAsync(
      'DELETE FROM collections WHERE id = ?;',
      [id]
    );
    return result.changes > 0;
  } catch (error) {
    console.error('Error deleting collection:', error);
    throw error;
  }
};

// Split Collections functions
export const addSplitCollection = async (name: string): Promise<number | undefined> => {
  const db = await initDB();
  try {
    const result = await db.runAsync(
      'INSERT INTO split_collections (name, created_at) VALUES (?, datetime("now"));',
      [name]
    );
    return result.lastInsertRowId as number;
  } catch (error) {
    console.error('Insert error (split_collections):', error);
    throw error;
  }
};

export const getSplitCollections = async (): Promise<SplitCollection[]> => {
  const db = await initDB();
  try {
    return await db.getAllAsync<SplitCollection>('SELECT * FROM split_collections;');
  } catch (error) {
    console.error('Error getting split collections:', error);
    throw error;
  }
};

export const updateSplitCollection = async (id: number, name: string): Promise<boolean> => {
  const db = await initDB();
  try {
    const result = await db.runAsync(
      'UPDATE split_collections SET name = ? WHERE id = ?;',
      [name, id]
    );
    return result.changes > 0;
  } catch (error) {
    console.error('Error updating split collection:', error);
    throw error;
  }
};

export const deleteSplitCollection = async (id: number): Promise<boolean> => {
  const db = await initDB();
  try {
    const result = await db.runAsync(
      'DELETE FROM split_collections WHERE id = ?;',
      [id]
    );
    return result.changes > 0;
  } catch (error) {
    console.error('Error deleting split collection:', error);
    throw error;
  }
};